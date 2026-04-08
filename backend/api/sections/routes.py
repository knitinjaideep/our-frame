from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import Literal

from api.deps import get_db, get_fav_ids
from services import sections_service
from schemas.sections import SectionsResponse, VideoFilesResponse

router = APIRouter(prefix="/sections", tags=["Sections"])


@router.get("", response_model=SectionsResponse)
def get_sections(session: Session = Depends(get_db)):
    return sections_service.get_sections(session)


@router.get("/videos/{section_key}", response_model=VideoFilesResponse)
def get_video_files(
    section_key: Literal["arjun_videos", "family_travel_videos"],
    session: Session = Depends(get_db),
    fav_ids: set[str] = Depends(get_fav_ids),
):
    """Return the actual video files for a named video section."""
    return sections_service.get_video_files(session, section_key, fav_ids)
