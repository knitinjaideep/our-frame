'use client'

/**
 * useWorkspace — single source of truth for the active workspace settings.
 *
 * Reads from the bootstrap payload which is already cached by AuthGate.
 * Provides typed theme/layout/privacy helpers so components never need to
 * parse raw strings themselves.
 *
 * Downstream use:
 *   - theme_preset  → applied as data-theme on <html> (see ThemeProvider)
 *   - layout_preset → read by home page to choose editorial/grid/timeline layout
 *   - privacy_mode  → shown in profile dropdown and settings
 *   - name/subtitle → shown in top-nav brand area
 */

import { useQuery } from '@tanstack/react-query'
import { fetchBootstrap, getWorkspace } from '@/lib/platform-api'
import type { ThemePreset, LayoutPreset, PrivacyMode } from '@/types/platform'

export interface WorkspaceSettings {
  id: number
  name: string
  subtitle: string | null
  theme_preset: ThemePreset
  layout_preset: LayoutPreset
  privacy_mode: PrivacyMode
  folder_template: string
  slug: string
  onboarding_complete: boolean
}

const THEME_PRESETS: ThemePreset[] = ['warm_dark', 'cool_dark', 'soft_light']
const LAYOUT_PRESETS: LayoutPreset[] = ['editorial', 'grid', 'timeline']
const PRIVACY_MODES: PrivacyMode[] = ['private', 'invite_only', 'public']

function coerceTheme(v: string): ThemePreset {
  return THEME_PRESETS.includes(v as ThemePreset) ? (v as ThemePreset) : 'warm_dark'
}
function coerceLayout(v: string): LayoutPreset {
  return LAYOUT_PRESETS.includes(v as LayoutPreset) ? (v as LayoutPreset) : 'editorial'
}
function coercePrivacy(v: string): PrivacyMode {
  return PRIVACY_MODES.includes(v as PrivacyMode) ? (v as PrivacyMode) : 'private'
}

export function useWorkspace(): { workspace: WorkspaceSettings | null; isLoading: boolean } {
  // Reuse the bootstrap query (already in cache from AuthGate) to get workspace id
  const { data: bootstrap, isLoading: bsLoading } = useQuery({
    queryKey: ['bootstrap', null],
    queryFn: () => fetchBootstrap(),
    staleTime: 0,
    retry: false,
    enabled: typeof window !== 'undefined',
  })

  const workspaceId = bootstrap?.active_workspace_id ?? null

  const { data: ws, isLoading: wsLoading } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => getWorkspace(workspaceId!),
    enabled: workspaceId != null,
    staleTime: 2 * 60 * 1000,
  })

  if (!ws) {
    return { workspace: null, isLoading: bsLoading || wsLoading }
  }

  return {
    workspace: {
      id: ws.id,
      name: ws.name,
      subtitle: ws.subtitle,
      theme_preset: coerceTheme(ws.theme_preset),
      layout_preset: coerceLayout(ws.layout_preset),
      privacy_mode: coercePrivacy(ws.privacy_mode),
      folder_template: ws.folder_template,
      slug: ws.slug,
      onboarding_complete: ws.onboarding_complete,
    },
    isLoading: wsLoading,
  }
}
