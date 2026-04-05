from pydantic import BaseModel
from .album import AlbumSummary


class SectionsResponse(BaseModel):
    featured_child: list[AlbumSummary]
    travel: list[AlbumSummary]
    photography: list[AlbumSummary]
