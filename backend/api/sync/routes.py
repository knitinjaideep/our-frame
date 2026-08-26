"""
Sync endpoints: trigger Google Drive → DB synchronisation.
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from api.deps import check_workspace_access, get_current_user_optional, get_db
from models.user import User
from services.media_service import media_counts_by_type_and_status
from services.sync_service import sync_root

router = APIRouter(prefix="/sync", tags=["Sync"])


class SyncDriveBody(BaseModel):
    resume_queue: list[dict] | None = None


@router.post("/drive")
def trigger_sync(
    session: Session = Depends(get_db),
    workspace_id: int | None = None,
    body: SyncDriveBody | None = None,
    user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Manually trigger a full Google Drive sync.
    Returns a summary of what was synced.

    Optional workspace_id query param scopes the sync to that workspace's
    own DriveConnection; omitting it preserves the legacy global sync.

    Workspace-scoped syncs use that workspace's stored Drive credentials, so
    they require an authenticated member of the workspace. The legacy global
    sync keeps its previous (unauthenticated) local-development behavior.

    Optional JSON body: {"resume_queue": [...]}. A sync that could not finish
    within its time budget returns {"complete": false, "remaining_queue": [...]}
    — pass that queue back as `resume_queue` to continue the crawl. Omitting
    the body entirely (or posting an empty body) starts a fresh sync, exactly
    as before this resumable behavior was added.
    """
    if workspace_id is not None:
        if user is None:
            raise HTTPException(401, "Not authenticated")
        check_workspace_access(session, user, workspace_id)

    resume_queue = body.resume_queue if body else None
    result = sync_root(session, workspace_id=workspace_id, resume_queue=resume_queue)
    return result


@router.get("/media/status")
def media_status(session: Session = Depends(get_db)):
    """
    Read-only media-cache status summary for local development/debugging.
    """
    return {"counts": media_counts_by_type_and_status(session)}
