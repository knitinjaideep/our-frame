from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
import os
import pickle

SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly']

def get_drive_service():
    creds = None
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'client_secrets.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)

    return build('drive', 'v3', credentials=creds)

def fetch_photos_from_folder(folder_id: str):
    service = get_drive_service()
    query = f"'{folder_id}' in parents and mimeType contains 'image/'"
    results = service.files().list(
        q=query,
        fields="files(id, name, mimeType, webViewLink)",
    ).execute()
    
    files = results.get('files', [])
    
    # Add thumbnail URLs for each file
    for file in files:
        # Generate thumbnail URL using Google Drive's thumbnail API
        file['thumbnailLink'] = f"https://drive.google.com/thumbnail?id={file['id']}&sz=w400-h300"
    
    return files
