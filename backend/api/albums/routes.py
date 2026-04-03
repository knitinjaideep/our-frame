from fastapi import APIRouter, Depends
from sqlmodel import Session

from api.deps import get_db, get_fav_ids
from schemas.album import AlbumsListResponse, AlbumDetail
from services import album_service

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
