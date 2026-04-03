# Import all models so SQLModel.metadata is populated before create_all()
from .album import DriveAlbum
from .photo import DrivePhoto
from .favorite import Favorite
from .ai_result import AIResult

__all__ = ["DriveAlbum", "DrivePhoto", "Favorite", "AIResult"]
