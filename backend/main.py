from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google_drive_client import fetch_photos_from_folder
from dotenv import load_dotenv
import os
import sys
from typing import List, Dict, Optional
from pydantic import BaseModel
from datetime import datetime

# Add the langchain_toold directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'langchain_toold'))

try:
    from ai_processor import AIProcessor
    ai_processor = AIProcessor()
except ImportError:
    print("Warning: AI processor not available. AI features will be disabled.")
    ai_processor = None

load_dotenv()

app = FastAPI(title="Our Frame API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # frontend dev server (Next.js)
        "http://localhost:5173",  # frontend dev server (Vite)
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API responses
class Photo(BaseModel):
    id: str
    name: str
    mimeType: str
    webViewLink: str
    thumbnailLink: str
    createdTime: Optional[str] = None
    modifiedTime: Optional[str] = None
    size: Optional[str] = None

class Album(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    theme: Optional[str] = None
    photoCount: int
    coverPhoto: Optional[str] = None
    createdTime: str

class AIAnalysis(BaseModel):
    photoId: str
    tags: List[str]
    caption: Optional[str] = None
    description: Optional[str] = None
    confidence: float

class BabyJournalEntry(BaseModel):
    id: str
    title: str
    date: str
    photoId: Optional[str] = None
    voiceRecording: Optional[str] = None
    aiCaption: Optional[str] = None
    milestone: Optional[str] = None
    entry: Optional[str] = None
    tags: Optional[List[str]] = None

@app.get("/")
def read_root():
    return {"message": "Our Frame API", "version": "1.0.0"}

@app.get("/photos/sync")
def sync_photos():
    """Fetch all photos from Google Drive folder"""
    folder_id = os.getenv("GOOGLE_DRIVE_FOLDER_ID")
    if not folder_id:
        raise HTTPException(status_code=500, detail="GOOGLE_DRIVE_FOLDER_ID not configured")
    
    files = fetch_photos_from_folder(folder_id)
    return files

@app.get("/photos/albums")
def get_albums():
    """Get available photo albums/themes"""
    # TODO: Implement album detection and organization
    albums = [
        {
            "id": "artistic",
            "name": "Artistic Photography",
            "description": "Creative and artistic shots",
            "theme": "artistic",
            "photoCount": 0,
            "coverPhoto": None,
            "createdTime": datetime.now().isoformat()
        },
        {
            "id": "travel",
            "name": "Travel Memories",
            "description": "Travel and adventure photos",
            "theme": "travel",
            "photoCount": 0,
            "coverPhoto": None,
            "createdTime": datetime.now().isoformat()
        },
        {
            "id": "family",
            "name": "Family Moments",
            "description": "Family and personal moments",
            "theme": "family",
            "photoCount": 0,
            "coverPhoto": None,
            "createdTime": datetime.now().isoformat()
        }
    ]
    return albums

@app.get("/photos/albums/{album_id}")
def get_album_photos(album_id: str):
    """Get photos for a specific album"""
    # TODO: Implement album filtering logic
    folder_id = os.getenv("GOOGLE_DRIVE_FOLDER_ID")
    if not folder_id:
        raise HTTPException(status_code=500, detail="GOOGLE_DRIVE_FOLDER_ID not configured")
    
    files = fetch_photos_from_folder(folder_id)
    # For now, return all photos. Later we'll implement filtering
    return {"album_id": album_id, "photos": files}

@app.post("/ai/analyze")
def analyze_photo(photo_id: str, photo_name: str):
    """Analyze a photo with AI for tags and captions"""
    if not ai_processor:
        raise HTTPException(status_code=503, detail="AI processor not available")
    
    try:
        analysis = ai_processor.analyze_photo(photo_name)
        analysis["photoId"] = photo_id
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

@app.post("/ai/baby-journal")
def generate_baby_journal_entry(photo_name: str, milestone: str = None):
    """Generate a baby journal entry based on a photo"""
    if not ai_processor:
        raise HTTPException(status_code=503, detail="AI processor not available")
    
    try:
        entry = ai_processor.generate_baby_journal_entry(photo_name, milestone)
        return entry
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Baby journal generation failed: {str(e)}")

@app.post("/ai/story")
def generate_story_from_photos(photo_names: List[str]):
    """Generate a story from a sequence of photos"""
    if not ai_processor:
        raise HTTPException(status_code=503, detail="AI processor not available")
    
    try:
        story = ai_processor.generate_story_from_photos(photo_names)
        return story
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Story generation failed: {str(e)}")

@app.get("/baby-journal/entries")
def get_baby_journal_entries():
    """Get baby journal entries"""
    # TODO: Implement baby journal functionality with database
    entries = [
        {
            "id": "1",
            "title": "First Smile",
            "date": "2024-01-15",
            "photoId": None,
            "voiceRecording": None,
            "aiCaption": "Baby's first genuine smile captured",
            "milestone": "First Smile",
            "entry": "Today was a magical day when we saw our baby's first real smile!",
            "tags": ["baby", "smile", "milestone", "first"]
        },
        {
            "id": "2",
            "title": "First Steps",
            "date": "2024-02-20",
            "photoId": None,
            "voiceRecording": None,
            "aiCaption": "Baby taking first independent steps",
            "milestone": "First Steps",
            "entry": "Our little one took their first steps today! Pure joy and excitement.",
            "tags": ["baby", "walking", "milestone", "first-steps"]
        }
    ]
    return entries

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "ai_available": ai_processor is not None
    }