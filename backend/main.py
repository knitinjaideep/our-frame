import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pillow_heif import register_heif_opener
# Make sure .env is loaded (GOOGLE_DRIVE_ROOT_FOLDER, ROOT_FOLDER_ID, etc.)
load_dotenv()
register_heif_opener()
# Import routers from your packages
from auth.routes import router as auth_router
from drive.routes import router as drive_router


# Create FastAPI app
app = FastAPI(title="Our Frame API")

# CORS for your React frontend (adjust ports if needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(drive_router, prefix="/drive", tags=["Drive"])


@app.get("/")
def root():
  """
  Simple health check.
  """
  return {"ok": True, "service": "our-frame"}

@app.get("/debug/env")
def debug_env():
    return {
        "GOOGLE_CLIENT_ID": os.getenv("GOOGLE_CLIENT_ID"),
        "GOOGLE_CLIENT_SECRET_exists": bool(os.getenv("GOOGLE_CLIENT_SECRET")),
        "GOOGLE_OAUTH_REDIRECT": os.getenv("GOOGLE_OAUTH_REDIRECT"),
        "ROOT_FOLDER_ID": os.getenv("ROOT_FOLDER_ID"),
        "GOOGLE_DRIVE_ROOT_FOLDER": os.getenv("GOOGLE_DRIVE_ROOT_FOLDER"),
        "TOKEN_PATH": os.getenv("GOOGLE_TOKEN_PATH"),
    }
