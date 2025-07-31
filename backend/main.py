from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from google_drive_client import fetch_photos_from_folder
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

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

@app.get("/photos/sync")
def sync_photos():
    folder_id = os.getenv("GOOGLE_DRIVE_FOLDER_ID")
    files = fetch_photos_from_folder(folder_id)
    return files