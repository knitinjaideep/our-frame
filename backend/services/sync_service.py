"""
Sync service: synchronises Google Drive folder structure into the DB.

Strategy
--------
- Drive is the upstream source of truth.
- DB is the operational read layer.
- On app startup: run a lightweight sync if root was not synced in the last
  SYNC_STALE_SECONDS seconds.  This keeps data reasonably fresh without hitting
  Drive on every request.
- Manual sync: POST /sync/drive triggers a full rescan immediately.
- Album-detail syncs: when a user opens a specific album we do a shallow sync of
  just that one folder so photos stay up to date.

The sync does NOT touch excluded albums further than marking them (exclusion is
a UI layer concern — the folder stays in DB but is filtered at query time).
"""
from __future__ import annotations

import logging
import time
from datetime import datetime, timezone, timedelta
from sqlmodel import Session

from core.config import settings
from core.exceptions import ReauthRequired, DriveError
from models.album import DriveAlbum
from models.section_mapping import SectionMapping
from repositories import album_repo, photo_repo
from services.drive_service import list_children, get_drive_client
from services.media_service import upsert_drive_media_item

logger = logging.getLogger(__name__)

# How old a root sync can be before we re-sync on startup
SYNC_STALE_SECONDS = 3600  # 1 hour

# Wall-clock budget for a single sync_root() call. Kept comfortably under
# Vercel's 60s function timeout so there is headroom for request/response
# overhead; when the budget is exceeded mid-crawl, sync_root() returns a
# `remaining_queue` the caller can pass back in as `resume_queue` to continue.
SYNC_TIME_BUDGET_SECONDS = 25.0


# ── helpers ───────────────────────────────────────────────────────────────────

def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


def _is_stale(last_synced: datetime | None, threshold_seconds: int = SYNC_STALE_SECONDS) -> bool:
    if last_synced is None:
        return True
    # normalise to UTC
    if last_synced.tzinfo is None:
        last_synced = last_synced.replace(tzinfo=timezone.utc)
    return (_utcnow() - last_synced).total_seconds() > threshold_seconds


def _upsert_album_from_drive(
    session: Session,
    folder_id: str,
    name: str,
    parent_id: str | None,
    workspace_id: int | None = None,
    drive_modified_time: datetime | None = None,
) -> DriveAlbum:
    existing = album_repo.get_by_id(session, folder_id)
    now = _utcnow()

    if existing:
        # Only update fields that Drive owns; preserve app-controlled fields
        # (excluded, section) unless they haven't been set.
        if existing.workspace_id is None:
            existing.workspace_id = workspace_id
        existing.name = name
        existing.parent_id = parent_id
        if drive_modified_time:
            existing.drive_modified_time = drive_modified_time
        existing.last_synced = now
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing

    album = DriveAlbum(
        id=folder_id,
        workspace_id=workspace_id,
        name=name,
        parent_id=parent_id,
        drive_modified_time=drive_modified_time,
        last_synced=now,
    )
    session.add(album)
    session.commit()
    session.refresh(album)
    return album


def _apply_section_mapping(session: Session, album: DriveAlbum) -> None:
    """If a SectionMapping row exists for this folder, stamp album.section."""
    from sqlmodel import select
    stmt = select(SectionMapping).where(SectionMapping.folder_id == album.id)
    mapping = session.exec(stmt).first()
    if mapping and album.section != mapping.section_key:
        album.section = mapping.section_key
        session.add(album)
        session.commit()


def _parse_drive_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return None


def _validate_queue_item(
    session: Session,
    item,
    workspace_id: int | None = None,
) -> tuple[str | None, int]:
    """
    Validate one BFS queue entry.

    `resume_queue` comes back over the wire from the client, so entries are
    untrusted: they must be well-formed and must name a folder we already
    discovered ourselves by crawling down from the configured root. That keeps
    a resumed sync scoped to the same folder tree a fresh sync would cover, and
    turns malformed input into a skipped item instead of a 500.

    Returns (folder_id, depth); folder_id is None when the item should be
    skipped.
    """
    if not isinstance(item, dict):
        logger.warning("sync_root: ignoring malformed queue item")
        return None, 1

    folder_id = item.get("folder_id")
    if not isinstance(folder_id, str) or not folder_id:
        logger.warning("sync_root: ignoring queue item without a folder id")
        return None, 1

    depth = item.get("depth", 1)
    if not isinstance(depth, int) or isinstance(depth, bool) or depth < 1:
        depth = 1

    if album_repo.get_by_id(session, folder_id, workspace_id) is None:
        # Every legitimate queue entry is seeded from a folder we just upserted
        # as an album, so an unknown id means a stale or hand-crafted queue.
        logger.warning("sync_root: ignoring queue item for unknown folder %s", folder_id)
        return None, depth

    return folder_id, depth


def _parse_int(value) -> int | None:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


# ── core sync routines ────────────────────────────────────────────────────────

def sync_folder_shallow(
    session: Session,
    folder_id: str,
    workspace_id: int | None = None,
    drive_service=None,
) -> dict:
    """
    Sync ONE folder's immediate children from Drive into the DB.
    Updates sub-folder records and photo records.
    Returns summary dict.
    """
    now = _utcnow()
    data = list_children(folder_id, drive_service=drive_service)

    # Upsert sub-folders
    for f in data["folders"]:
        modified = None
        if f.get("modifiedTime"):
            try:
                modified = datetime.fromisoformat(f["modifiedTime"].replace("Z", "+00:00"))
            except Exception:
                pass
        _upsert_album_from_drive(session, f["id"], f["name"], folder_id, workspace_id, modified)

    # Update child_count on the parent album
    parent = album_repo.get_by_id(session, folder_id, workspace_id)
    if parent:
        parent.child_count = len(data["folders"])

    # Upsert photos
    cover_photo_id: str | None = None
    for idx, p in enumerate(data["files"]):
        created = _parse_drive_datetime(p.get("createdTime"))
        modified = _parse_drive_datetime(p.get("modifiedTime"))
        size = _parse_int(p.get("size"))
        width = _parse_int(p.get("width"))
        height = _parse_int(p.get("height"))
        duration_ms = _parse_int(p.get("durationMillis"))

        from models.photo import DrivePhoto
        photo = DrivePhoto(
            id=p["id"],
            workspace_id=workspace_id,
            name=p["name"],
            mime_type=p["mimeType"],
            parent_folder_id=folder_id,
            created_time=created,
            modified_time=modified,
            size=size,
            width=width,
            height=height,
            web_view_link=p.get("webViewLink"),
        )
        # commit=False: these two upserts each flush (so any generated PKs are
        # assigned) but do not round-trip to the DB. The whole folder — every
        # photo/media-item row plus the parent album update below — is
        # committed together in a single network round trip after the loop,
        # instead of 2+ round trips per photo. This is the main fix for Drive
        # sync timing out on Vercel: cross-region DB latency dominated a
        # per-row-commit sync loop far more than Drive API latency did.
        photo_repo.upsert(session, photo, commit=False)
        upsert_drive_media_item(
            session,
            drive_file_id=p["id"],
            name=p["name"],
            mime_type=p["mimeType"],
            workspace_id=workspace_id,
            folder_id=folder_id,
            created_time=created,
            modified_time=modified,
            size=size,
            width=width,
            height=height,
            duration_ms=duration_ms,
            drive_thumbnail_url=p.get("thumbnailLink"),
            web_view_link=p.get("webViewLink"),
            commit=False,
        )
        if idx == 0:
            cover_photo_id = p["id"]

    # Update the album record we just synced, and commit it together with the
    # batch of photo/media-item writes above. If the commit fails, the whole
    # folder's rows roll back together (no half-written folder); sync_root's
    # existing per-folder try/except (ReauthRequired, DriveError) still lets
    # the crawl skip a failing folder and retry it on a later pass.
    if parent:
        if cover_photo_id and not parent.cover_photo_id:
            parent.cover_photo_id = cover_photo_id
        parent.photo_count = len(data["files"])
        parent.last_synced = now
        session.add(parent)

    if parent or data["files"]:
        session.commit()

    return {
        "folder_id": folder_id,
        "folders_synced": len(data["folders"]),
        "photos_synced": len(data["files"]),
        "media_items_synced": len(data["files"]),
    }


def sync_root(
    session: Session,
    workspace_id: int | None = None,
    resume_queue: list[dict] | None = None,
    time_budget_seconds: float | None = SYNC_TIME_BUDGET_SECONDS,
) -> dict:
    """
    Full sync of root → child albums, processed as a time-bounded, resumable
    breadth-first crawl.

    - On a fresh sync (resume_queue=None): upserts all root-level folders,
      applies section mappings, then seeds a BFS queue of root folders at
      depth=1.
    - On a resumed sync (resume_queue given): skips root re-listing/re-upsert
      entirely and continues processing the given queue.
    - Either way, the queue is then drained breadth-first (root → album →
      sub-album → sub-sub-album, matching the previous fixed 3-level depth)
      up to `time_budget_seconds` of wall-clock time. If the budget is
      exceeded, processing stops immediately and the unprocessed queue is
      returned as `remaining_queue` so the caller can resume in a later
      request — this keeps any single request well under Vercel's 60s
      function timeout even for a large Drive library.
    - `time_budget_seconds=None` disables the budget entirely and drains the
      whole crawl in one call. In-process callers that are not bound by an
      HTTP timeout (startup sync, post-login sync) use this so their behavior
      is identical to the pre-resumable implementation.

    When workspace_id is provided, the workspace's own DriveConnection is used
    for Drive credentials and for the root folder to sync, and resulting
    MediaItem rows are scoped to that workspace. When workspace_id is None
    (the default), behavior is unchanged: the legacy global token.json-backed
    credentials and settings.effective_root_folder are used.
    """
    drive_service = None

    if workspace_id is not None:
        from services import drive_connect_service, workspace_service

        drive_conn = workspace_service.get_drive_connection(session, workspace_id)
        if not drive_conn or drive_conn.connection_status != "active":
            logger.warning(
                "sync_root: no active drive connection for workspace=%s, skipping",
                workspace_id,
            )
            return {"skipped": True, "reason": "no active drive connection for workspace"}

        root_id = drive_conn.root_folder_id
        if not root_id:
            logger.warning(
                "sync_root: no root folder configured for workspace=%s, skipping",
                workspace_id,
            )
            return {"skipped": True, "reason": "no root folder configured for workspace"}

        try:
            drive_service = drive_connect_service.get_drive_service_for_workspace(session, workspace_id)
        except ValueError as e:
            logger.warning("sync_root: could not build drive service for workspace=%s: %s", workspace_id, e)
            return {"skipped": True, "reason": str(e)}
    else:
        root_id = settings.effective_root_folder
        if not root_id:
            logger.warning("sync_root: no root folder configured, skipping")
            return {"skipped": True, "reason": "no root folder configured"}

    now = _utcnow()
    total_folders = 0
    total_photos = 0
    root_folders_count: int | None = None

    if resume_queue is None:
        logger.info("sync_root: starting full Drive sync from root=%s", root_id)

        try:
            root_data = list_children(root_id, drive_service=drive_service)
        except ReauthRequired:
            logger.warning("sync_root: not authenticated, serving stale cache")
            return {"skipped": True, "reason": "not authenticated"}
        except DriveError as e:
            logger.error("sync_root: Drive error: %s", e)
            return {"skipped": True, "reason": str(e)}

        # Upsert top-level album folders
        root_folders = root_data["folders"]
        for f in root_folders:
            modified = None
            if f.get("modifiedTime"):
                try:
                    modified = datetime.fromisoformat(f["modifiedTime"].replace("Z", "+00:00"))
                except Exception:
                    pass
            album = _upsert_album_from_drive(session, f["id"], f["name"], None, workspace_id, modified)
            _apply_section_mapping(session, album)
            total_folders += 1

        root_folders_count = len(root_folders)
        queue: list[dict] = [{"folder_id": f["id"], "depth": 1} for f in root_folders]
    else:
        logger.info(
            "sync_root: resuming Drive sync for workspace=%s with %d queued folder(s)",
            workspace_id,
            len(resume_queue),
        )
        queue = list(resume_queue)

    # ── Breadth-first, time-bounded drain of the queue ────────────────────────
    start_time = time.monotonic()
    while queue:
        if (
            time_budget_seconds is not None
            and time.monotonic() - start_time > time_budget_seconds
        ):
            logger.info(
                "sync_root: time budget of %.1fs exceeded, pausing with %d folder(s) remaining",
                time_budget_seconds,
                len(queue),
            )
            return {
                "complete": False,
                "remaining_queue": queue,
                "total_folders": total_folders,
                "total_photos": total_photos,
            }

        item = queue.pop(0)
        folder_id, depth = _validate_queue_item(session, item, workspace_id)
        if folder_id is None:
            continue

        try:
            result = sync_folder_shallow(
                session, folder_id, workspace_id=workspace_id, drive_service=drive_service
            )
            total_photos += result["photos_synced"]
            total_folders += result["folders_synced"]
            if depth < 3:
                children = album_repo.get_by_parent(session, folder_id, workspace_id)
                for c in children:
                    queue.append({"folder_id": c.id, "depth": depth + 1})
        except (ReauthRequired, DriveError) as e:
            logger.warning("sync_root: skipping folder %s: %s", folder_id, e)

    logger.info(
        "sync_root: done — %d folders, %d photos synced",
        total_folders,
        total_photos,
    )
    result = {
        "complete": True,
        "synced_at": now.isoformat(),
        "total_folders": total_folders,
        "total_photos": total_photos,
    }
    if root_folders_count is not None:
        result["root_folders"] = root_folders_count
    return result


def sync_for_user(session: Session, user_id: int) -> dict:
    """
    Best-effort sync entry point for a just-authenticated user.

    Picks the user's first workspace whose Drive connection is actually usable
    (active + root folder set) so the sync targets the same workspace the app
    bootstraps into, rather than an abandoned onboarding workspace.

    If no workspace sync is possible (no workspace, no connection, reauth
    needed), falls back to the legacy global sync so pre-workspace behavior —
    which local development still relies on — is preserved.
    """
    from services import workspace_service

    workspaces = workspace_service.list_user_workspaces(session, user_id)

    workspace_id: int | None = None
    for workspace in workspaces:
        conn = workspace_service.get_drive_connection(session, workspace.id)
        if conn and conn.connection_status == "active" and conn.root_folder_id:
            workspace_id = workspace.id
            break
    if workspace_id is None and workspaces:
        workspace_id = workspaces[0].id

    if workspace_id is not None:
        # No HTTP timeout applies to this in-process caller, so drain the whole
        # crawl in one pass exactly as before the resumable budget was added.
        result = sync_root(session, workspace_id=workspace_id, time_budget_seconds=None)
        if not result.get("skipped"):
            return result
        logger.info(
            "sync_for_user: workspace=%s sync skipped (%s), falling back to legacy sync",
            workspace_id,
            result.get("reason"),
        )

    return sync_root(session, time_budget_seconds=None)


def maybe_sync_on_startup(session: Session) -> None:
    """
    Called at app startup. Runs a full sync only if:
    - There are no root albums in DB (first run), OR
    - The most recently synced root album is older than SYNC_STALE_SECONDS.

    This avoids expensive Drive reads on every restart while keeping data fresh.
    """
    root_albums = album_repo.get_root_albums(session)

    if not root_albums:
        logger.info("maybe_sync_on_startup: no albums in DB, running initial sync")
        # Startup is not bound by an HTTP timeout: drain the full crawl so a
        # large library still syncs completely, as it did before sync_root()
        # gained a per-request time budget.
        sync_root(session, time_budget_seconds=None)
        return

    most_recent_sync = max(
        (a.last_synced for a in root_albums if a.last_synced),
        default=None,
    )

    if _is_stale(most_recent_sync):
        logger.info(
            "maybe_sync_on_startup: last sync=%s is stale, re-syncing",
            most_recent_sync,
        )
        sync_root(session, time_budget_seconds=None)
    else:
        logger.info(
            "maybe_sync_on_startup: last sync=%s is fresh, skipping",
            most_recent_sync,
        )
