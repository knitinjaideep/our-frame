from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class PhotoResponse(BaseModel):
    id: str
    name: str
    mime_type: str
    media_type: str = "image"
    created_time: Optional[datetime]
    thumbnail_url: Optional[str]
    poster_url: Optional[str] = None
    playback_url: Optional[str] = None
    preview_url: str
    processing_status: Optional[str] = None
    is_favorite: bool = False
    width: Optional[int] = None
    height: Optional[int] = None
