from fastapi import APIRouter, Depends
from sqlmodel import Session

from api.deps import get_db
from schemas.home_feed import HomeFeedResponse
from services import home_feed_service

router = APIRouter(prefix="/home", tags=["Home"])


@router.get("/feed", response_model=HomeFeedResponse)
def home_feed(session: Session = Depends(get_db)):
    return home_feed_service.get_home_feed(session)
