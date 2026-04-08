from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List

from api.deps import get_db
from schemas.home_feed import HomeFeedResponse
from schemas.photo import PhotoResponse
from services import home_feed_service, slideshow_service

router = APIRouter(prefix="/home", tags=["Home"])


@router.get("/feed", response_model=HomeFeedResponse)
def home_feed(session: Session = Depends(get_db)):
    return home_feed_service.get_home_feed(session)


@router.get("/slideshow", response_model=List[PhotoResponse])
def slideshow(session: Session = Depends(get_db)):
    """
    Returns photos for the hero slideshow.
    If favorites exist, returns favorited images only.
    Falls back to top-scored recent photos if no favorites.
    """
    return slideshow_service.get_slideshow_photos(session)
