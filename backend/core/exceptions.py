class ReauthRequired(Exception):
    """Raised when Google OAuth token is missing or expired."""


class DriveError(Exception):
    """Raised when a Google Drive API call fails."""


class NotFoundError(Exception):
    """Resource not found."""
