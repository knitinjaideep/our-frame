const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = `${API_BASE}/auth/start`
    }
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

export function downloadUrl(photoId: string): string {
  return `${API_BASE}/drive/file/${encodeURIComponent(photoId)}/download`
}

export function videoStreamUrl(fileId: string): string {
  return `${API_BASE}/drive/file/${encodeURIComponent(fileId)}/stream`
}
