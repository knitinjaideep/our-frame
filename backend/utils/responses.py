from fastapi.responses import JSONResponse

def reauth_json():
    """Response telling frontend that re-auth is required."""
    return JSONResponse({"needsAuth": True, "authUrl": "/auth/start"}, status_code=401)
