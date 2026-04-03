import os
from pathlib import Path
from dotenv import load_dotenv

# Always load .env from the same folder as this file
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

ROOT_FOLDER_ID = os.getenv("ROOT_FOLDER_ID", "")
