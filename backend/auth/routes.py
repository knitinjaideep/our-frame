from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse, JSONResponse
from google_drive_client import create_auth_url, exchange_code_for_credentials

router = APIRouter()

@router.get("/start")
def auth_start():
    url = create_auth_url()
    return RedirectResponse(url)

@router.get("/callback")
def auth_callback(request: Request):
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(400, "Missing code")
    exchange_code_for_credentials(code)
    return JSONResponse({"ok": True, "message": "Authorization complete. You can close this tab."})
