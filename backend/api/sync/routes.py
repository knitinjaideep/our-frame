"""
Sync endpoints: trigger Google Drive → DB synchronisation.
"""
from fastapi import APIRouter, Depends
from sqlmodel import Session

from api.deps import get_db
from services.media_service import media_counts_by_type_and_status
from services.sync_service import sync_root

router = APIRouter(prefix="/sync", tags=["Sync"])


@router.post("/drive")
def trigger_sync(session: Session = Depends(get_db)):
    """
    Manually trigger a full Google Drive sync.
    Returns a summary of what was synced.
    """
    result = sync_root(session)
    return result


@router.get("/media/status")
def media_status(session: Session = Depends(get_db)):
    """
    Read-only media-cache status summary for local development/debugging.
    """
    return {"counts": media_counts_by_type_and_status(session)}
