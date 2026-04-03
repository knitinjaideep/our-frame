from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class AIResult(SQLModel, table=True):
    __tablename__ = "ai_results"

    id: Optional[int] = Field(default=None, primary_key=True)
    photo_id: str = Field(index=True)
    tool_name: str                              # "caption", "tag", "story"
    model: str
    input_hash: str                             # hash of input for dedup
    output: str                                 # JSON string of validated output
    confidence: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
