from __future__ import annotations

from typing import Optional

from core.config import settings

_client = None

# Signed URLs are deliberately short-lived: they are the only credential a
# browser holds for a private derivative, so they must expire well before a
# revoked session would matter.
SIGNED_URL_TTL_SECONDS = 300


def _get_client():
    """
    Lazily build and cache a Supabase client.

    This is only invoked from the "supabase" storage backend code paths, so
    environments that never enable that backend (the default is "local")
    never need Supabase credentials configured.
    """
    global _client
    if _client is not None:
        return _client

    if not settings.supabase_url or not settings.effective_supabase_secret_key:
        raise RuntimeError(
            "Supabase storage backend requires SUPABASE_URL and "
            "SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) to be configured."
        )

    try:
        from supabase import create_client
    except ImportError as exc:  # pragma: no cover - depends on install state
        raise RuntimeError(
            "Supabase storage backend requires the 'supabase' package to be installed."
        ) from exc

    _client = create_client(settings.supabase_url, settings.effective_supabase_secret_key)
    return _client


def _bucket():
    return _get_client().storage.from_(settings.supabase_media_bucket)


def upload_derivative_bytes(storage_key: str, data: bytes, content_type: str) -> None:
    """
    Upload derivative bytes to the configured Supabase Storage bucket, overwriting
    any existing object at the same key (derivatives are regenerated in place).
    """
    try:
        _bucket().upload(
            storage_key,
            data,
            file_options={"content-type": content_type, "upsert": "true"},
        )
    except Exception as exc:  # noqa: BLE001 - surfaced to caller as a bounded failure detail
        raise RuntimeError(str(exc)[:500]) from exc


def create_signed_url(storage_key: str, expires_in: int = SIGNED_URL_TTL_SECONDS) -> str:
    """
    Return a short-lived signed URL for private access to a derivative object.
    """
    try:
        response = _bucket().create_signed_url(storage_key, expires_in)
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(str(exc)[:500]) from exc

    url: Optional[str] = None
    if isinstance(response, dict):
        url = response.get("signedURL") or response.get("signedUrl")
    if not url:
        raise RuntimeError("Supabase did not return a signed URL")
    return url
