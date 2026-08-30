from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from api.deps import get_current_user, get_db, get_fav_ids
from models.user import User
from schemas.album import AlbumsListResponse, AlbumDetail, AlbumSummary
from services import album_service
from repositories import album_repo

router = APIRouter(prefix="/albums", tags=["Albums"])


@router.get("", response_model=AlbumsListResponse)
def list_albums(session: Session = Depends(get_db)):
    return album_service.get_root_albums(session)


@router.get("/buckets", response_model=AlbumsListResponse)
def list_root_buckets(session: Session = Depends(get_db)):
    """
    Returns the actual top-level Drive folders as navigation buckets.
    These are the source of truth for the /photos page and homepage.
    Each bucket gets its own cover resolved recursively from its contents.
    """
    return album_service.get_root_buckets(session)


@router.get("/{album_id}", response_model=AlbumDetail)
def get_album(
    album_id: str,
    session: Session = Depends(get_db),
    fav_ids: set[str] = Depends(get_fav_ids),
):
    return album_service.get_album_detail(session, album_id, fav_ids)


class ExcludeIn(BaseModel):
    excluded: bool = True


@router.post("/{album_id}/exclude")
def set_album_excluded(
    album_id: str,
    body: ExcludeIn,
    session: Session = Depends(get_db),
):
    """Exclude or un-exclude a folder/album from appearing in the app."""
    album = album_repo.set_excluded(session, album_id, body.excluded)
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    return {"id": album.id, "name": album.name, "excluded": album.excluded}


class SetCoverIn(BaseModel):
    # `None` resets to the automatic/deterministic fallback cover.
    photo_id: Optional[str] = None


@router.post("/{album_id}/cover", response_model=AlbumSummary)
def set_album_cover(
    album_id: str,
    body: SetCoverIn,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Set (or, with `photo_id: null`, reset) an album's manually-selected
    cover photo (docs/redesign-v2 PR 7 / `docs/OUR-FRAME-DESIGN-SYSTEM.md`
    §13). Idempotent — setting the same cover twice succeeds both times.

    Auth scope decision: the legacy `/albums` router (this file) is not
    workspace-scoped — it predates the Phase 1 multi-user workspace model
    and serves a single shared family library. This was re-verified in PR 7's
    review: `models/album.py` (`albums`) and `models/photo.py` (`photos`)
    have no `workspace_id` column at all, so there is no per-workspace owner
    role to check here the way `api.deps.require_workspace_owner` does for
    workspace-scoped routes, and no cross-workspace escalation is reachable
    through this endpoint. It therefore requires an authenticated app user
    (`get_current_user`, 401 if not); the entire frontend sits behind
    `AuthGate`, whose only public paths are `/`, `/login`, `/auth/callback`.
    A per-workspace owner check must be added if/when this legacy album path
    becomes workspace-scoped.

    Scoping within the library is enforced in the service layer: the photo
    must exist *and* live in this album's own folder tree (400 otherwise),
    so an album's cover can't be pointed at an unrelated — or deliberately
    excluded/hidden — folder's photo.
    """
    try:
        return album_service.set_album_cover(session, album_id, body.photo_id)
    except album_service.AlbumNotFoundError:
        raise HTTPException(status_code=404, detail="Album not found")
    except album_service.PhotoNotFoundError:
        raise HTTPException(status_code=404, detail="Photo not found")
    except album_service.PhotoNotInAlbumError:
        raise HTTPException(
            status_code=400, detail="Photo does not belong to this album"
        )


class AlbumMetadataIn(BaseModel):
    """
    All fields optional/omittable so a caller can update just one field.
    `exclude_unset=True` semantics are used in the route so an omitted
    field is left untouched, while an explicit `null` clears it.
    """
    description: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


@router.patch("/{album_id}/metadata", response_model=AlbumSummary)
def update_album_metadata(
    album_id: str,
    body: AlbumMetadataIn,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Partial update of the optional description/location/start_date/end_date
    fields (PR 7). No frontend edit UI consumes this yet — see
    `docs/redesign-v2/STATE.md` for the scope decision (the brief only
    requires storing + displaying real fields, not shipping a CMS).
    Requires an authenticated session, same as `/cover` above.
    """
    fields = body.model_dump(exclude_unset=True)
    try:
        return album_service.update_album_metadata(session, album_id, **fields)
    except album_service.AlbumNotFoundError:
        raise HTTPException(status_code=404, detail="Album not found")
