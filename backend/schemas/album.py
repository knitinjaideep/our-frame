from typing import Optional
from pydantic import BaseModel
from .photo import PhotoResponse


class AlbumSummary(BaseModel):
    id: str
    name: str
    cover_photo_id: Optional[str]
    photo_count: Optional[int]
    thumbnail_url: Optional[str]


class AlbumDetail(BaseModel):
    album: AlbumSummary
    photos: list[PhotoResponse]
    subfolders: list[AlbumSummary]


class AlbumsListResponse(BaseModel):
    albums: list[AlbumSummary]
    total: int
