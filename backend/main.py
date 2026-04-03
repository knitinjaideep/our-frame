from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pillow_heif import register_heif_opener

# Core
from core.config import settings
from core.database import create_db_and_tables

# Import all models so metadata is populated before create_all()
import models  # noqa: F401

# Routers
from auth.routes import router as legacy_auth_router
from drive.routes import router as legacy_drive_router
from api.albums.routes import router as albums_router
from api.favorites.routes import router as favorites_router
from api.home.routes import router as home_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    register_heif_opener()
    create_db_and_tables()
    yield


app = FastAPI(title="Our Frame API", version="2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_root,
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Legacy routes (unchanged — keep working during Next.js migration)
app.include_router(legacy_auth_router, prefix="/auth", tags=["Auth"])
app.include_router(legacy_drive_router, prefix="/drive", tags=["Drive"])

# New v2 routes
app.include_router(albums_router)
app.include_router(favorites_router)
app.include_router(home_router)


@app.get("/health", tags=["Health"])
def health():
    return {"ok": True, "version": "2.0"}
