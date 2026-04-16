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

# Phase 1 — platform foundation routers
from api.auth.routes import router as auth_v2_router
from api.workspaces.routes import router as workspaces_router
from api.drive.routes import router as drive_connect_router
from api.admin.routes import router as admin_router

logger = logging.getLogger(__name__)


def _run_schema_migrations():
    """
    Lightweight column-level migrations for SQLite.
    SQLModel's create_all() only creates missing tables, not missing columns.
    We add columns manually here when they don't exist yet.
    """
    from core.database import engine
    import sqlalchemy as sa

    with engine.connect() as conn:
        inspector = sa.inspect(engine)

        # workspaces: drive_connect_deferred (added in phase-1 onboarding fix)
        ws_cols = {c["name"] for c in inspector.get_columns("workspaces")}
        if "drive_connect_deferred" not in ws_cols:
            conn.execute(sa.text(
                "ALTER TABLE workspaces ADD COLUMN drive_connect_deferred BOOLEAN NOT NULL DEFAULT 0"
            ))
            conn.commit()
            logger.info("Migration: added workspaces.drive_connect_deferred")


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

# ── Phase 1 — Platform foundation ────────────────────────────────────────────
app.include_router(auth_v2_router)       # /api/auth/...
app.include_router(workspaces_router)    # /api/workspaces/...
app.include_router(drive_connect_router) # /api/drive/...
app.include_router(admin_router)         # /api/admin/...


@app.get("/health", tags=["Health"])
def health():
    return {"ok": True, "version": "2.0"}
