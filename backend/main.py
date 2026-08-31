import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pillow_heif import register_heif_opener

# Core
from core.config import settings
from core.database import create_db_and_tables

# Import all models so metadata is populated before create_all()
import models  # noqa: F401

# Legacy routers (kept for backward compatibility during migration)
from auth.routes import router as legacy_auth_router
from drive.routes import router as legacy_drive_router

# v2 routers (existing)
from api.albums.routes import router as albums_router
from api.favorites.routes import router as favorites_router
from api.home.routes import router as home_router
from api.sections.routes import router as sections_router
from api.sync.routes import router as sync_router
from api.settings.routes import router as settings_router
from api.media.routes import router as media_router

# Phase 1 — platform foundation routers
from api.auth.routes import router as auth_v2_router
from api.workspaces.routes import router as workspaces_router
from api.drive.routes import router as drive_connect_router
from api.admin.routes import router as admin_router

logger = logging.getLogger(__name__)


def _run_schema_migrations():
    """
    Lightweight column-level migrations.
    SQLModel's create_all() only creates missing tables, not missing columns.
    We add columns manually here when they don't exist yet.
    """
    from core.database import engine
    import sqlalchemy as sa

    with engine.connect() as conn:
        inspector = sa.inspect(engine)
        is_postgres = engine.dialect.name == "postgresql"

        # workspaces: drive_connect_deferred (added in phase-1 onboarding fix)
        ws_cols = {c["name"] for c in inspector.get_columns("workspaces")}
        if "drive_connect_deferred" not in ws_cols:
            conn.execute(sa.text(
                "ALTER TABLE workspaces ADD COLUMN drive_connect_deferred BOOLEAN NOT NULL DEFAULT 0"
            ))
            conn.commit()
            logger.info("Migration: added workspaces.drive_connect_deferred")

        workspace_rows = conn.execute(sa.text("SELECT id FROM workspaces ORDER BY id")).fetchall()
        single_workspace_id = workspace_rows[0][0] if len(workspace_rows) == 1 else None
        has_media_items = inspector.has_table("media_items")

        def backfill_single_workspace(table_name: str) -> None:
            if single_workspace_id is None:
                return
            conn.execute(
                sa.text(f"UPDATE {table_name} SET workspace_id = :workspace_id WHERE workspace_id IS NULL"),
                {"workspace_id": single_workspace_id},
            )

        # albums: description/location/start_date/end_date (redesign-v2 PR 7
        # metadata fields). All nullable and additive — existing rows are
        # unaffected, no backfill needed. `cover_photo_id` already existed
        # as a column before this PR, so it needs no migration.
        album_cols = {c["name"] for c in inspector.get_columns("albums")}
        if "workspace_id" not in album_cols:
            conn.execute(sa.text("ALTER TABLE albums ADD COLUMN workspace_id INTEGER REFERENCES workspaces(id)"))
            conn.commit()
            album_cols.add("workspace_id")
            logger.info("Migration: added albums.workspace_id")
        if "workspace_id" in album_cols and has_media_items:
            if is_postgres:
                conn.execute(sa.text("""
                    UPDATE albums
                    SET workspace_id = mi.workspace_id
                    FROM media_items mi
                    WHERE albums.workspace_id IS NULL
                      AND mi.workspace_id IS NOT NULL
                      AND albums.id = mi.folder_id
                """))
            else:
                conn.execute(sa.text("""
                    UPDATE albums
                    SET workspace_id = (
                        SELECT mi.workspace_id
                        FROM media_items mi
                        WHERE mi.workspace_id IS NOT NULL
                          AND mi.folder_id = albums.id
                        LIMIT 1
                    )
                    WHERE workspace_id IS NULL
                      AND EXISTS (
                        SELECT 1
                        FROM media_items mi
                        WHERE mi.workspace_id IS NOT NULL
                          AND mi.folder_id = albums.id
                      )
                """))
            backfill_single_workspace("albums")
            conn.commit()

        datetime_type = "TIMESTAMP" if engine.dialect.name == "postgresql" else "DATETIME"
        album_migrations = {
            "description": "ALTER TABLE albums ADD COLUMN description TEXT",
            "location": "ALTER TABLE albums ADD COLUMN location TEXT",
            "start_date": f"ALTER TABLE albums ADD COLUMN start_date {datetime_type}",
            "end_date": f"ALTER TABLE albums ADD COLUMN end_date {datetime_type}",
        }
        for col, ddl in album_migrations.items():
            if col not in album_cols:
                conn.execute(sa.text(ddl))
                conn.commit()
                album_cols.add(col)
                logger.info("Migration: added albums.%s", col)

        photo_cols = {c["name"] for c in inspector.get_columns("photos")}
        if "workspace_id" not in photo_cols:
            conn.execute(sa.text("ALTER TABLE photos ADD COLUMN workspace_id INTEGER REFERENCES workspaces(id)"))
            conn.commit()
            photo_cols.add("workspace_id")
            logger.info("Migration: added photos.workspace_id")
        if "workspace_id" in photo_cols:
            if has_media_items:
                if is_postgres:
                    conn.execute(sa.text("""
                        UPDATE photos
                        SET workspace_id = mi.workspace_id
                        FROM media_items mi
                        WHERE photos.workspace_id IS NULL
                          AND mi.workspace_id IS NOT NULL
                          AND photos.id = mi.drive_file_id
                    """))
                else:
                    conn.execute(sa.text("""
                        UPDATE photos
                        SET workspace_id = (
                            SELECT mi.workspace_id
                            FROM media_items mi
                            WHERE mi.workspace_id IS NOT NULL
                              AND mi.drive_file_id = photos.id
                            LIMIT 1
                        )
                        WHERE workspace_id IS NULL
                          AND EXISTS (
                            SELECT 1
                            FROM media_items mi
                            WHERE mi.workspace_id IS NOT NULL
                              AND mi.drive_file_id = photos.id
                          )
                    """))
            if "workspace_id" in album_cols:
                if is_postgres:
                    conn.execute(sa.text("""
                        UPDATE photos
                        SET workspace_id = albums.workspace_id
                        FROM albums
                        WHERE photos.workspace_id IS NULL
                          AND albums.workspace_id IS NOT NULL
                          AND photos.parent_folder_id = albums.id
                    """))
                else:
                    conn.execute(sa.text("""
                        UPDATE photos
                        SET workspace_id = (
                            SELECT albums.workspace_id
                            FROM albums
                            WHERE albums.workspace_id IS NOT NULL
                              AND albums.id = photos.parent_folder_id
                            LIMIT 1
                        )
                        WHERE workspace_id IS NULL
                          AND EXISTS (
                            SELECT 1
                            FROM albums
                            WHERE albums.workspace_id IS NOT NULL
                              AND albums.id = photos.parent_folder_id
                          )
                    """))
            backfill_single_workspace("photos")
            conn.commit()

        favorite_cols = {c["name"] for c in inspector.get_columns("favorites")}
        if "workspace_id" not in favorite_cols:
            conn.execute(sa.text("ALTER TABLE favorites ADD COLUMN workspace_id INTEGER REFERENCES workspaces(id)"))
            conn.commit()
            favorite_cols.add("workspace_id")
            logger.info("Migration: added favorites.workspace_id")
        if "workspace_id" in favorite_cols:
            if "workspace_id" in photo_cols:
                if is_postgres:
                    conn.execute(sa.text("""
                        UPDATE favorites
                        SET workspace_id = photos.workspace_id
                        FROM photos
                        WHERE favorites.workspace_id IS NULL
                          AND photos.workspace_id IS NOT NULL
                          AND favorites.photo_id = photos.id
                    """))
                else:
                    conn.execute(sa.text("""
                        UPDATE favorites
                        SET workspace_id = (
                            SELECT photos.workspace_id
                            FROM photos
                            WHERE photos.workspace_id IS NOT NULL
                              AND photos.id = favorites.photo_id
                            LIMIT 1
                        )
                        WHERE workspace_id IS NULL
                          AND EXISTS (
                            SELECT 1
                            FROM photos
                            WHERE photos.workspace_id IS NOT NULL
                              AND photos.id = favorites.photo_id
                          )
                    """))
            backfill_single_workspace("favorites")
            conn.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    register_heif_opener()
    create_db_and_tables()
    try:
        _run_schema_migrations()
    except Exception as exc:
        logger.warning("Schema migration warning (non-fatal): %s", exc)

    # Run a startup sync if data is stale (non-blocking best-effort)
    # Legacy single-user sync — kept running during migration
    try:
        from services.sync_service import maybe_sync_on_startup
        from core.database import engine
        from sqlmodel import Session as _Session
        with _Session(engine) as session:
            maybe_sync_on_startup(session)
    except Exception as exc:
        logger.warning("Startup sync skipped: %s", exc)

    yield


app = FastAPI(title="Our Frame API", version="2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_root,
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Legacy routes (unchanged — backward compat) ───────────────────────────────
app.include_router(legacy_auth_router, prefix="/auth", tags=["Auth Legacy"])
app.include_router(legacy_drive_router, prefix="/drive", tags=["Drive Legacy"])

# ── Existing v2 routes ────────────────────────────────────────────────────────
app.include_router(albums_router)
app.include_router(favorites_router)
app.include_router(home_router)
app.include_router(sections_router)
app.include_router(sync_router)
app.include_router(settings_router)
app.include_router(media_router)

# ── Phase 1 — Platform foundation ────────────────────────────────────────────
app.include_router(auth_v2_router)       # /api/auth/...
app.include_router(workspaces_router)    # /api/workspaces/...
app.include_router(drive_connect_router) # /api/drive/...
app.include_router(admin_router)         # /api/admin/...


@app.get("/health", tags=["Health"])
def health():
    return {"ok": True, "version": "2.0"}
