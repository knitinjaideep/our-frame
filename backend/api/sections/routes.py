from fastapi import APIRouter, Depends
from sqlmodel import Session

from api.deps import get_db
from services import sections_service
from schemas.sections import SectionsResponse

router = APIRouter(prefix="/sections", tags=["Sections"])


@router.get("", response_model=SectionsResponse)
def get_sections(session: Session = Depends(get_db)):
    return sections_service.get_sections(session)
