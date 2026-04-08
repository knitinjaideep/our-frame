from sqlmodel import Session
from repositories import favorites_repo, photo_repo
from schemas.favorite import FavoriteCreate, FavoriteResponse, FavoritesListResponse
from models.favorite import Favorite


def _to_response(fav: Favorite, mime_type: str = "image/jpeg") -> FavoriteResponse:
    is_video = mime_type.startswith("video/")
    return FavoriteResponse(
        photo_id=fav.photo_id,
        photo_name=fav.photo_name,
        folder_id=fav.folder_id,
        favorited_at=fav.favorited_at,
        thumbnail_url=None if is_video else f"/drive/file/{fav.photo_id}/thumbnail?s=600",
        preview_url=f"/drive/file/{fav.photo_id}/preview?w=1600",
        mime_type=mime_type,
    )


def list_favorites(session: Session) -> FavoritesListResponse:
    favs = favorites_repo.get_all(session)
    responses = []
    for fav in favs:
        photo = photo_repo.get_by_id(session, fav.photo_id)
        mime = photo.mime_type if photo and photo.mime_type else "image/jpeg"
        responses.append(_to_response(fav, mime))
    return FavoritesListResponse(
        favorites=responses,
        total=len(responses),
    )


def add_favorite(session: Session, body: FavoriteCreate) -> FavoriteResponse:
    existing = favorites_repo.get_by_photo_id(session, body.photo_id)
    if existing:
        return _to_response(existing)
    fav = favorites_repo.add(session, body.photo_id, body.photo_name, body.folder_id)
    return _to_response(fav)


def remove_favorite(session: Session, photo_id: str) -> bool:
    return favorites_repo.remove(session, photo_id)
