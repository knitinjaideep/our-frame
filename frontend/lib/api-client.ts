export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000'
export const SESSION_STORAGE_KEY = 'of_session_t'

function storedSessionToken(): string | null {
  if (typeof window === 'undefined') return null
  return (
    window.sessionStorage.getItem(SESSION_STORAGE_KEY) ||
    window.localStorage.getItem(SESSION_STORAGE_KEY)
  )
}

// Backend routers that authenticate the caller. The session cookie is the
// primary mechanism; the ?t= token is the fallback for browsers/deployments
// where the cross-origin cookie never lands (the same reason /auth/callback
// hands the token to the frontend in the first place). `/sync` is not under
// `/api`, but its workspace-scoped calls are authenticated just the same.
const AUTHENTICATED_PATH_PREFIXES = [
  '/api/',
  '/sync/',
  '/media/',
  '/drive/file/',
  '/albums',
  '/favorites',
  '/home/',
  '/sections',
]

function withSessionToken(path: string): string {
  const token = storedSessionToken()
  const needsToken = AUTHENTICATED_PATH_PREFIXES.some((p) => path.startsWith(p))
  if (!token || !needsToken || path.includes('t=')) return path
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}t=${encodeURIComponent(token)}`
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${withSessionToken(path)}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (res.status === 401) {
    // Throw — let AuthGate / useCurrentUser handle the redirect to /login.
    // Never redirect to the legacy /auth/start here.
    throw new ApiError(401, 'Unauthorized')
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText)
    throw new ApiError(res.status, detail)
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path: string) => apiFetch<void>(path, { method: 'DELETE' }),
}

/** Build the full URL for a media asset (thumbnail/preview) served by FastAPI */
export function mediaUrl(path: string): string {
  if (path.startsWith('http')) return path
  return `${API_BASE}${withSessionToken(path)}`
}

/**
 * Full URL for an album's cover photo when it is rendered large (the album
 * header's full-bleed cover band, `docs/OUR-FRAME-DESIGN-SYSTEM.md` §10/§12).
 *
 * `Album.thumbnail_url` is built by the backend for *card*-sized use: for a
 * media-synced file it points at the cached `thumbnail` derivative, which is
 * only 400px on its longest edge (`backend/services/media_derivative_service
 * .py`'s `PHOTO_DERIVATIVE_SIZES`). Stretching that across a ~1400px header
 * band is exactly the "never enlarge a small source image" case §12 forbids,
 * so the cached-route form is upgraded to the `grid` derivative (900px) —
 * still a precomputed, on-disk-cached derivative sourced from Google's CDN
 * thumbnail (never a full-original download), and already generated for any
 * photo that has appeared in a gallery, so this reuses a derivative rather
 * than adding work.
 *
 * `preview` (1800px) is deliberately *not* used: it is excluded from the
 * CDN shortcut and generating it downloads the full original, which a header
 * image must not trigger.
 *
 * Any other shape (absolute URL, or the legacy `/drive/file/...` fallback used
 * for files that have not been media-synced yet) is passed through unchanged —
 * the legacy route re-downloads the original on every request, so silently
 * asking it for a larger size would add a Drive fetch per page view *and*
 * break browser-cache sharing with the folder card that requests the same URL.
 * PR 7 owns the real fix (a proper cover field + responsive sizes).
 */
export function albumCoverUrl(path: string): string {
  const upgraded = path.startsWith('/media/file/') ? path.replace(/\/thumbnail$/, '/grid') : path
  return mediaUrl(upgraded)
}

export function thumbnailUrl(photoId: string, size = 600): string {
  return `${API_BASE}${withSessionToken(`/drive/file/${encodeURIComponent(photoId)}/thumbnail?s=${size}`)}`
}

export function previewUrl(photoId: string, width = 1600): string {
  return `${API_BASE}${withSessionToken(`/drive/file/${encodeURIComponent(photoId)}/preview?w=${width}`)}`
}

export function contentUrl(photoId: string): string {
  return `${API_BASE}${withSessionToken(`/drive/file/${encodeURIComponent(photoId)}/content`)}`
}

export function downloadUrl(photoId: string): string {
  return `${API_BASE}${withSessionToken(`/drive/file/${encodeURIComponent(photoId)}/download`)}`
}

export function videoStreamUrl(fileId: string): string {
  return `${API_BASE}${withSessionToken(`/drive/file/${encodeURIComponent(fileId)}/stream`)}`
}
