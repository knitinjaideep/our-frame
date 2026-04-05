from typing import Optional
from pydantic import BaseModel
from .photo import PhotoResponse


class MemoryStats(BaseModel):
    total_photos: int
    total_albums: int
    total_favorites: int
    oldest_year: Optional[int]
    newest_year: Optional[int]


class ThrowbackGroup(BaseModel):
    year: int
    label: str                  # e.g. "3 years ago"
    photos: list[PhotoResponse]


class HomeFeedResponse(BaseModel):
    hero_photos: list[PhotoResponse]
    throwbacks: list[ThrowbackGroup]
    stats: MemoryStats
