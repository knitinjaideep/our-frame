from pydantic import BaseModel
from .album import AlbumSummary
from .photo import PhotoResponse


class SectionsResponse(BaseModel):
    featured_child: list[AlbumSummary]
    travel: list[AlbumSummary]
    milestones: list[AlbumSummary]
    life: list[AlbumSummary]
    arjun_videos: list[AlbumSummary]
    family_travel_videos: list[AlbumSummary]


class VideoFilesResponse(BaseModel):
    videos: list[PhotoResponse]
    total: int
