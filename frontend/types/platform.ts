// Platform types for Phase 1 — multi-user workspace foundation

export interface CurrentUser {
  id: number
  email: string
  display_name: string | null
  avatar_url: string | null
  is_platform_admin: boolean
  created_at: string
}

export interface Workspace {
  id: number
  owner_user_id: number
  name: string
  slug: string
  subtitle: string | null
  layout_preset: string
  theme_preset: string
  privacy_mode: string
  folder_template: string
  onboarding_complete: boolean
  drive_connect_deferred: boolean
  created_at: string
  updated_at: string
}

export interface WorkspaceStatus {
  workspace_id: number
  onboarding_complete: boolean
  drive_status: 'not_connected' | 'active' | 'expired' | 'revoked' | 'pending'
  has_root_folder: boolean
}

export interface DriveConnectionStatus {
  status: 'not_connected' | 'active' | 'expired' | 'revoked' | 'pending'
  google_account_email: string | null
  has_root_folder: boolean
  root_folder_id?: string | null
}

export interface DriveFolder {
  id: string
  name: string
}

export type LayoutPreset = 'editorial' | 'grid' | 'timeline'
export type ThemePreset = 'warm_dark' | 'cool_dark' | 'soft_light'
export type PrivacyMode = 'private' | 'invite_only' | 'public'
export type FolderTemplate = 'family' | 'events' | 'travel' | 'custom'
