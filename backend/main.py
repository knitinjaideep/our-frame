import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import routers
from auth.routes import router as auth_router
from drive.routes import router as drive_router

# Load environment variables from backend/.env
load_dotenv()

# Create FastAPI app
app = FastAPI(title="Our Frame API")

# CORS setup for frontend (React/Vite dev servers)
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

# Register routers
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(drive_router, prefix="/drive", tags=["Drive"])


@app.get("/")
def root():
    """
    Health check endpoint.
    """
    return {"ok": True, "service": "our-frame"}
