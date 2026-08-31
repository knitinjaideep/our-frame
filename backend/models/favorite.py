from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Favorite(SQLModel, table=True):
    __tablename__ = "favorites"

    id: Optional[int] = Field(default=None, primary_key=True)
    workspace_id: Optional[int] = Field(default=None, foreign_key="workspaces.id", index=True)
    photo_id: str = Field(index=True)
    photo_name: str = ""
    folder_id: Optional[str] = Field(default=None, index=True)
    favorited_at: datetime = Field(default_factory=datetime.utcnow)
    note: Optional[str] = None
