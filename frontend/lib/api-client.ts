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
const AUTHENTICATED_PATH_PREFIXES = ['/api/', '/sync/']

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
  return `${API_BASE}${path}`
}

export function thumbnailUrl(photoId: string, size = 600): string {
  return `${API_BASE}/drive/file/${encodeURIComponent(photoId)}/thumbnail?s=${size}`
}

export function previewUrl(photoId: string, width = 1600): string {
  return `${API_BASE}/drive/file/${encodeURIComponent(photoId)}/preview?w=${width}`
}

export function contentUrl(photoId: string): string {
  return `${API_BASE}/drive/file/${encodeURIComponent(photoId)}/content`
}

export function downloadUrl(photoId: string): string {
  return `${API_BASE}/drive/file/${encodeURIComponent(photoId)}/download`
}

export function videoStreamUrl(fileId: string): string {
  return `${API_BASE}/drive/file/${encodeURIComponent(fileId)}/stream`
}
