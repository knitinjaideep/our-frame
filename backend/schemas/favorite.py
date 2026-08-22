from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class FavoriteCreate(BaseModel):
    photo_id: str
    photo_name: str
    folder_id: Optional[str] = None


class FavoriteResponse(BaseModel):
    photo_id: str
    photo_name: str
    folder_id: Optional[str]
    favorited_at: datetime
    media_type: str = "image"
    thumbnail_url: Optional[str]
    poster_url: Optional[str] = None
    playback_url: Optional[str] = None
    preview_url: str
    processing_status: Optional[str] = None
    mime_type: str = "image/jpeg"


class FavoritesListResponse(BaseModel):
    favorites: list[FavoriteResponse]
    total: int
