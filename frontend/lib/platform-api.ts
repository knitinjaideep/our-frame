/**
 * Platform API client — Phase 1 workspace/auth endpoints.
 */
import { API_BASE, apiClient, ApiError } from './api-client'
import type {
  CurrentUser,
  DriveConnectionStatus,
  DriveFolder,
  Workspace,
  WorkspaceStatus,
} from '@/types/platform'

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  try {
    return await apiClient.get<CurrentUser>('/api/auth/me')
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null
    throw err
  }
}

export interface BootstrapPayload {
  authenticated: boolean
  user: CurrentUser | null
  has_workspace: boolean
  workspace: { id: number; name: string; slug: string; onboarding_complete: boolean; drive_connect_deferred: boolean } | null
  active_workspace_id: number | null
  has_drive_connection: boolean
  has_root_folder: boolean
  has_media: boolean
  onboarding_complete: boolean
  drive_connect_deferred: boolean
  next_route: string
}

export async function fetchBootstrap(token?: string | null): Promise<BootstrapPayload> {
  const url = token ? `/api/auth/bootstrap?t=${encodeURIComponent(token)}` : '/api/auth/bootstrap'
  return apiClient.get<BootstrapPayload>(url)
}

export function getLoginUrl(): string {
  // Uses the legacy /auth/start which hits the already-authorized redirect URI
  // (http://localhost:8000/auth/callback). The callback now also creates a
  // platform UserSession, so this is fully compatible with Phase 1.
  return `${API_BASE}/auth/start`
}

export async function logout(): Promise<void> {
  await apiClient.post('/api/auth/logout', {})
}

// ── Workspaces ────────────────────────────────────────────────────────────────

export async function listWorkspaces(): Promise<Workspace[]> {
  return apiClient.get<Workspace[]>('/api/workspaces')
}

export async function createWorkspace(data: {
  name: string
  slug?: string
  subtitle?: string
  layout_preset?: string
  theme_preset?: string
  privacy_mode?: string
  folder_template?: string
}): Promise<Workspace> {
  return apiClient.post<Workspace>('/api/workspaces', data)
}

export async function getWorkspace(id: number): Promise<Workspace> {
  return apiClient.get<Workspace>(`/api/workspaces/${id}`)
}

export async function updateWorkspace(
  id: number,
  data: Partial<{
    name: string
    slug: string
    subtitle: string
    layout_preset: string
    theme_preset: string
    privacy_mode: string
    folder_template: string
    onboarding_complete: boolean
    drive_connect_deferred: boolean
  }>
): Promise<Workspace> {
  return apiClient.patch<Workspace>(`/api/workspaces/${id}`, data)
}

export async function getWorkspaceStatus(id: number): Promise<WorkspaceStatus> {
  return apiClient.get<WorkspaceStatus>(`/api/workspaces/${id}/status`)
}

export async function deleteWorkspace(id: number): Promise<void> {
  await apiClient.delete(`/api/workspaces/${id}`)
}

// ── Drive Connection ──────────────────────────────────────────────────────────

export function getDriveConnectUrl(workspaceId: number): string {
  return `${API_BASE}/api/drive/connect/${workspaceId}`
}

export async function getDriveStatus(workspaceId: number): Promise<DriveConnectionStatus> {
  return apiClient.get<DriveConnectionStatus>(`/api/drive/${workspaceId}/status`)
}

export async function setRootFolder(workspaceId: number, rootFolderId: string): Promise<void> {
  await apiClient.post(`/api/drive/${workspaceId}/root-folder`, { root_folder_id: rootFolderId })
}

export async function listDriveFolders(workspaceId: number): Promise<DriveFolder[]> {
  const res = await apiClient.get<{ folders: DriveFolder[] }>(`/api/drive/${workspaceId}/folders`)
  return res.folders
}

export async function listDriveFolderChildren(workspaceId: number, folderId: string): Promise<DriveFolder[]> {
  const res = await apiClient.get<{ folders: DriveFolder[] }>(`/api/drive/${workspaceId}/folders/${folderId}/children`)
  return res.folders
}

export interface FolderStructureRecommendation {
  id: string
  title: string
  description: string
  reasoning: string
  template: string
  preview: string[]
}

export interface FolderAnalysisResult {
  folder_id: string
  subfolder_count: number
  subfolders_sampled: string[]
  recommendations: FolderStructureRecommendation[]
}

export async function analyzeFolderStructure(workspaceId: number, folderId: string): Promise<FolderAnalysisResult> {
  return apiClient.post<FolderAnalysisResult>(`/api/drive/${workspaceId}/analyze`, { folder_id: folderId })
}

// ── Drive Sync ────────────────────────────────────────────────────────────────

export interface SyncProgress {
  totalFolders: number
  totalPhotos: number
}

interface SyncDriveResponse {
  skipped?: boolean
  reason?: string
  complete?: boolean
  remaining_queue?: Record<string, unknown>[]
  total_folders?: number
  total_photos?: number
}

// Safety cap on resume iterations — at ~45s/call this is ~22 minutes of wall
// time, which is generous for a family-sized library while still preventing
// a runaway loop if the backend never reports complete.
const SYNC_MAX_ITERATIONS = 30

/**
 * Drives the resumable Drive sync to completion (or failure). Calls
 * POST /sync/drive repeatedly, feeding back `remaining_queue` as
 * `resume_queue` until the backend reports `complete: true`. Each call is
 * time-bounded server-side, so this stays well under any single request's
 * function timeout even for a large Drive library.
 */
export async function runFullDriveSync(
  workspaceId: number,
  onProgress?: (progress: SyncProgress) => void
): Promise<void> {
  let resumeQueue: Record<string, unknown>[] | null = null
  let totalFolders = 0
  let totalPhotos = 0

  for (let i = 0; i < SYNC_MAX_ITERATIONS; i++) {
    const data: SyncDriveResponse = await apiClient.post<SyncDriveResponse>(
      `/sync/drive?workspace_id=${workspaceId}`,
      resumeQueue ? { resume_queue: resumeQueue } : {}
    )

    if (data.skipped) {
      throw new Error(data.reason || 'Sync was skipped')
    }

    // Each response reports only what that call processed, so accumulate.
    totalFolders += data.total_folders ?? 0
    totalPhotos += data.total_photos ?? 0
    onProgress?.({ totalFolders, totalPhotos })

    if (data.complete) {
      return
    }

    resumeQueue = data.remaining_queue ?? null
    if (!resumeQueue || resumeQueue.length === 0) {
      // complete=false but no queue to resume — treat as done rather than looping forever
      return
    }
  }

  throw new Error(
    'Sync stopped before it finished — this library is larger than a single sync session. ' +
    'Everything found so far has been saved, so your archive is partly ready.'
  )
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function adminListWorkspaces() {
  return apiClient.get('/api/admin/workspaces')
}

export async function adminListUsers() {
  return apiClient.get('/api/admin/users')
}

export async function adminGetStats() {
  return apiClient.get('/api/admin/stats')
}
