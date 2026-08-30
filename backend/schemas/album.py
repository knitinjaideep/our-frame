from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from .photo import PhotoResponse


class AlbumSummary(BaseModel):
    id: str
    name: str
    cover_photo_id: Optional[str]
    photo_count: Optional[int]
    child_count: Optional[int]
    thumbnail_url: Optional[str]
    # True only when an owner has *manually* chosen a cover. `cover_photo_id`
    # above may hold a deterministically auto-resolved id instead, so the UI
    # can't use it to decide whether "Reset album cover" is meaningful.
    has_custom_cover: bool = False
    # PR 7 (redesign-v2) metadata — all optional, omitted/null when unset.
    description: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class AlbumDetail(BaseModel):
    album: AlbumSummary
    photos: list[PhotoResponse]
    subfolders: list[AlbumSummary]


class AlbumsListResponse(BaseModel):
    albums: list[AlbumSummary]
    total: int
