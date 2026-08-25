from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from sqlmodel import select

from api.deps import get_current_user, get_db
from models.media import MediaItem
from models.user import User
from models.workspace import Workspace, WorkspaceMember
from services.media_derivative_service import (
    VIDEO_PLAYBACK_KIND,
    VIDEO_POSTER_KIND,
    build_derivative_response,
    get_or_create_photo_derivative_for_media,
    get_or_create_video_playback_for_media,
    get_or_create_video_poster_for_media,
)

router = APIRouter(prefix="/media", tags=["Media Cache"])


def _is_workspace_member(session: Session, user: User, media: MediaItem) -> bool:
    if media.workspace_id is None:
        return True

    workspace = session.get(Workspace, media.workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if workspace.owner_user_id == user.id:
        return True

    membership = session.exec(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == media.workspace_id,
            WorkspaceMember.user_id == user.id,
        )
    ).first()
    return membership is not None


def _authorize_media_item(session: Session, user: User, drive_file_id: str) -> MediaItem:
    media_items = list(
        session.exec(select(MediaItem).where(MediaItem.drive_file_id == drive_file_id)).all()
    )
    if not media_items:
        raise HTTPException(status_code=404, detail="Media item not found. Run Drive sync first.")

    legacy_media: MediaItem | None = None
    saw_workspace_media = False
    for media in media_items:
        if media.workspace_id is None:
            legacy_media = media
            continue
        saw_workspace_media = True
        if _is_workspace_member(session, user, media):
            return media

    if legacy_media is not None:
        # Legacy global media remains accessible only to authenticated users.
        return legacy_media

    if saw_workspace_media:
        raise HTTPException(status_code=403, detail="Access denied")

    raise HTTPException(status_code=404, detail="Media item not found. Run Drive sync first.")


@router.get("/file/{drive_file_id}/{kind}")
def photo_derivative(
    drive_file_id: str,
    kind: str,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Serve a cached photo derivative, generating it on first request.

    Supported kinds: thumbnail, grid, preview for photos; poster and playback for videos.
    """
    media = _authorize_media_item(session, user, drive_file_id)
    if kind == VIDEO_PLAYBACK_KIND:
        derivative = get_or_create_video_playback_for_media(session, media)
    elif kind == VIDEO_POSTER_KIND:
        derivative = get_or_create_video_poster_for_media(session, media)
    else:
        derivative = get_or_create_photo_derivative_for_media(session, media, kind)
    return build_derivative_response(derivative)
