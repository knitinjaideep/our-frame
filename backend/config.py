import os
from pathlib import Path
from dotenv import load_dotenv

# Always load .env from the same folder as this file
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

ROOT_FOLDER_ID = os.getenv("ROOT_FOLDER_ID")

if not ROOT_FOLDER_ID:
    raise RuntimeError(
        "❌ ROOT_FOLDER_ID is not set. Please add it to your .env file, e.g.:\n\n"
        "ROOT_FOLDER_ID=your_google_drive_folder_id_here\n"
    )
