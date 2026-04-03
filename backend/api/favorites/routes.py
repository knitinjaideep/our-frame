from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from api.deps import get_db
from schemas.favorite import FavoriteCreate, FavoriteResponse, FavoritesListResponse
from services import favorites_service

router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.get("", response_model=FavoritesListResponse)
def list_favorites(session: Session = Depends(get_db)):
    return favorites_service.list_favorites(session)


@router.post("", response_model=FavoriteResponse, status_code=201)
def add_favorite(body: FavoriteCreate, session: Session = Depends(get_db)):
    return favorites_service.add_favorite(session, body)


@router.delete("/{photo_id}", status_code=204)
def remove_favorite(photo_id: str, session: Session = Depends(get_db)):
    removed = favorites_service.remove_favorite(session, photo_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Favorite not found")
