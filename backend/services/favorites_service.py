from sqlmodel import Session
from repositories import favorites_repo, photo_repo
from schemas.favorite import FavoriteCreate, FavoriteResponse, FavoritesListResponse
from models.favorite import Favorite
from services.media_response_service import media_response_fields


def _to_response(
    session: Session,
    fav: Favorite,
    mime_type: str = "image/jpeg",
    workspace_id: int | None = None,
) -> FavoriteResponse:
    media_fields = media_response_fields(
        session,
        drive_file_id=fav.photo_id,
        mime_type=mime_type,
        workspace_id=workspace_id,
    )
    return FavoriteResponse(
        photo_id=fav.photo_id,
        photo_name=fav.photo_name,
        folder_id=fav.folder_id,
        favorited_at=fav.favorited_at,
        mime_type=mime_type,
        **media_fields,
    )


def list_favorites(session: Session, workspace_id: int | None = None) -> FavoritesListResponse:
    favs = favorites_repo.get_all(session, workspace_id)
    responses = []
    for fav in favs:
        photo = photo_repo.get_by_id(session, fav.photo_id, workspace_id)
        mime = photo.mime_type if photo and photo.mime_type else "image/jpeg"
        responses.append(_to_response(session, fav, mime, workspace_id))
    return FavoritesListResponse(
        favorites=responses,
        total=len(responses),
    )


def add_favorite(
    session: Session,
    body: FavoriteCreate,
    workspace_id: int | None = None,
) -> FavoriteResponse:
    existing = favorites_repo.get_by_photo_id(session, body.photo_id, workspace_id)
    photo = photo_repo.get_by_id(session, body.photo_id, workspace_id)
    mime = photo.mime_type if photo and photo.mime_type else "image/jpeg"
    if existing:
        return _to_response(session, existing, mime, workspace_id)
    fav = favorites_repo.add(
        session,
        body.photo_id,
        body.photo_name,
        body.folder_id,
        workspace_id,
    )
    return _to_response(session, fav, mime, workspace_id)


def remove_favorite(
    session: Session,
    photo_id: str,
    workspace_id: int | None = None,
) -> bool:
    return favorites_repo.remove(session, photo_id, workspace_id)
