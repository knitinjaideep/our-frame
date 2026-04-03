from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class PhotoResponse(BaseModel):
    id: str
    name: str
    mime_type: str
    created_time: Optional[datetime]
    thumbnail_url: str
    preview_url: str
    is_favorite: bool = False
    width: Optional[int] = None
    height: Optional[int] = None
