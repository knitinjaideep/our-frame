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
