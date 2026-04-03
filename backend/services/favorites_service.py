from sqlmodel import Session
from repositories import favorites_repo
from schemas.favorite import FavoriteCreate, FavoriteResponse, FavoritesListResponse
from models.favorite import Favorite


def _to_response(fav: Favorite) -> FavoriteResponse:
    return FavoriteResponse(
        photo_id=fav.photo_id,
        photo_name=fav.photo_name,
        folder_id=fav.folder_id,
        favorited_at=fav.favorited_at,
        thumbnail_url=f"/drive/file/{fav.photo_id}/thumbnail?s=600",
        preview_url=f"/drive/file/{fav.photo_id}/preview?w=1600",
    )


def list_favorites(session: Session) -> FavoritesListResponse:
    favs = favorites_repo.get_all(session)
    return FavoritesListResponse(
        favorites=[_to_response(f) for f in favs],
        total=len(favs),
    )


def add_favorite(session: Session, body: FavoriteCreate) -> FavoriteResponse:
    existing = favorites_repo.get_by_photo_id(session, body.photo_id)
    if existing:
        return _to_response(existing)
    fav = favorites_repo.add(session, body.photo_id, body.photo_name, body.folder_id)
    return _to_response(fav)


def remove_favorite(session: Session, photo_id: str) -> bool:
    return favorites_repo.remove(session, photo_id)
