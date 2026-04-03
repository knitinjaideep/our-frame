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
    thumbnail_url: str
    preview_url: str


class FavoritesListResponse(BaseModel):
    favorites: list[FavoriteResponse]
    total: int
