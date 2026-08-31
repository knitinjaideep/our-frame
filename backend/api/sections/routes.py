from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import Literal

from api.deps import get_active_workspace, get_db
from models.workspace import Workspace
from repositories.favorites_repo import get_all_photo_ids
from services import sections_service
from schemas.sections import SectionsResponse, VideoFilesResponse

router = APIRouter(prefix="/sections", tags=["Sections"])


@router.get("", response_model=SectionsResponse)
def get_sections(
    session: Session = Depends(get_db),
    workspace: Workspace = Depends(get_active_workspace),
):
    return sections_service.get_sections(session, workspace.id)


@router.get("/videos/{section_key}", response_model=VideoFilesResponse)
def get_video_files(
    section_key: Literal["arjun_videos", "family_travel_videos"],
    session: Session = Depends(get_db),
    workspace: Workspace = Depends(get_active_workspace),
):
    """Return the actual video files for a named video section."""
    fav_ids = get_all_photo_ids(session, workspace.id)
    return sections_service.get_video_files(session, section_key, fav_ids, workspace.id)
