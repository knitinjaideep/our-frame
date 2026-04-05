from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from api.deps import get_db, get_fav_ids
from schemas.album import AlbumsListResponse, AlbumDetail
from services import album_service
from repositories import album_repo

router = APIRouter(prefix="/albums", tags=["Albums"])


@router.get("", response_model=AlbumsListResponse)
def list_albums(session: Session = Depends(get_db)):
    return album_service.get_root_albums(session)


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
