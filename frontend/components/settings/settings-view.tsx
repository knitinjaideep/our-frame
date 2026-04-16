'use client'

import { useState, useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { HardDrive, CheckCircle2, AlertCircle, Loader2, Trash2, AlertTriangle } from 'lucide-react'
import { useBootstrap } from '@/hooks/use-auth'
import {
  updateWorkspace,
  deleteWorkspace,
  getWorkspace,
  getDriveStatus,
  getDriveConnectUrl,
  listDriveFolders,
  setRootFolder,
} from '@/lib/platform-api'
import type { PrivacyMode } from '@/types/platform'

const PRIVACY_OPTIONS: { value: PrivacyMode; label: string }[] = [
  { value: 'private',     label: 'Private — only me' },
  { value: 'invite_only', label: 'Invite Only — family members I invite' },
  { value: 'public',      label: 'Public — anyone with the link (coming soon)' },
]

const LAYOUT_OPTIONS = [
  { value: 'editorial', label: 'Editorial' },
  { value: 'grid',      label: 'Grid' },
  { value: 'timeline',  label: 'Timeline' },
]

// ── Drive section ─────────────────────────────────────────────────────────────

function DriveSection({ workspaceId }: { workspaceId: number }) {
  const qc = useQueryClient()

  const { data: status, isLoading } = useQuery({
    queryKey: ['driveStatus', workspaceId],
    queryFn: () => getDriveStatus(workspaceId),
    staleTime: 30_000,
  })

  const { data: folders } = useQuery({
    queryKey: ['driveFolders', workspaceId],
    queryFn: () => listDriveFolders(workspaceId),
    enabled: status?.status === 'active',
    staleTime: 5 * 60_000,
  })

  const setFolderMutation = useMutation({
    mutationFn: (folderId: string) => setRootFolder(workspaceId, folderId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['driveStatus', workspaceId] }),
  })

  const isConnected = status?.status === 'active'

  return (
    <section className="space-y-4">
      <h2 className="font-serif text-xl text-foreground">Google Drive</h2>
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            ) : isConnected ? (
              <CheckCircle2 className="w-4 h-4 text-primary" />
            ) : (
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {isConnected ? 'Connected' : 'Not connected'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {status?.google_account_email ?? (isLoading ? 'Loading…' : 'No Drive account linked')}
            </p>
          </div>
          <a
            href={getDriveConnectUrl(workspaceId)}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-border text-xs text-foreground hover:border-primary/40 transition-colors"
          >
            {isConnected ? 'Reconnect' : 'Connect Drive'}
          </a>
        </div>

        {isConnected && (
          <div className="border-t border-border pt-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">Root folder</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {status?.root_folder_id
                  ? `Folder ID: ${status.root_folder_id}`
                  : 'Not set — select a folder below'}
              </p>
            </div>
            {folders && folders.length > 0 && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFolderMutation.mutate(f.id)}
                    disabled={setFolderMutation.isPending}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm"
                    style={{
                      background:  status?.root_folder_id === f.id ? 'oklch(0.70 0.145 58 / 10%)' : 'transparent',
                      borderColor: status?.root_folder_id === f.id ? 'var(--primary)' : 'var(--border)',
                    }}
                  >
                    <HardDrive className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground truncate">{f.name}</span>
                    {status?.root_folder_id === f.id && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary ml-auto flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

// ── Delete confirmation dialog ────────────────────────────────────────────────

function DeleteDialog({
  workspaceName,
  onCancel,
  onConfirm,
  isPending,
}: {
  workspaceName: string
  onCancel: () => void
  onConfirm: () => void
  isPending: boolean
}) {
  const [typed, setTyped] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Focus after mount animation
    const t = setTimeout(() => inputRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [])

  const confirmed = typed === workspaceName

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'oklch(0 0 0 / 60%)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !isPending) onCancel() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1,    y: 0 }}
        exit={{    opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-lg text-foreground">Delete workspace</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This permanently deletes{' '}
              <strong className="text-foreground">{workspaceName}</strong> and disconnects
              your Google Drive. Your photos stay in Drive — only the workspace is removed.
              This cannot be undone.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Type{' '}
            <span className="font-mono px-1 py-0.5 rounded bg-muted text-destructive text-xs">
              {workspaceName}
            </span>{' '}
            to confirm
          </label>
          <input
            ref={inputRef}
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && confirmed && !isPending) onConfirm()
              if (e.key === 'Escape' && !isPending) onCancel()
            }}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-destructive transition-colors font-mono"
            placeholder={workspaceName}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-foreground hover:border-muted-foreground transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!confirmed || isPending}
            className="flex-1 px-4 py-2.5 rounded-xl bg-destructive text-white font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Delete workspace
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Workspace form ────────────────────────────────────────────────────────────

function WorkspaceForm({
  workspaceId,
  initialName,
  initialSubtitle,
  initialPrivacy,
  initialLayout,
}: {
  workspaceId: number
  initialName: string
  initialSubtitle: string
  initialPrivacy: PrivacyMode
  initialLayout: string
}) {
  const qc = useQueryClient()
  const [name,     setName]     = useState(initialName)
  const [subtitle, setSubtitle] = useState(initialSubtitle)
  const [privacy,  setPrivacy]  = useState<PrivacyMode>(initialPrivacy)
  const [layout,   setLayout]   = useState(initialLayout)
  const [saved,    setSaved]    = useState(false)

  // Sync if the parent workspace data refreshes
  useEffect(() => { setName(initialName) },     [initialName])
  useEffect(() => { setSubtitle(initialSubtitle) }, [initialSubtitle])
  useEffect(() => { setPrivacy(initialPrivacy) },  [initialPrivacy])
  useEffect(() => { setLayout(initialLayout) },    [initialLayout])

  const saveMutation = useMutation({
    mutationFn: () =>
      updateWorkspace(workspaceId, {
        name:          name.trim(),
        subtitle:      subtitle.trim() || undefined,
        privacy_mode:  privacy,
        layout_preset: layout,
      }),
    onSuccess: () => {
      // Refresh bootstrap so the top-nav workspace name updates if changed
      qc.invalidateQueries({ queryKey: ['bootstrap'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const isDirty =
    name     !== initialName     ||
    subtitle !== initialSubtitle ||
    privacy  !== initialPrivacy  ||
    layout   !== initialLayout

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground" htmlFor="s-name">
          Name
        </label>
        <input
          id="s-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-primary transition-colors"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground" htmlFor="s-subtitle">
          Subtitle{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          id="s-subtitle"
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-primary transition-colors"
          placeholder="Memories, moments, and milestones"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">Layout</label>
        <div className="flex gap-2 flex-wrap">
          {LAYOUT_OPTIONS.map((l) => (
            <button
              key={l.value}
              onClick={() => setLayout(l.value)}
              className="px-3.5 py-1.5 rounded-lg border text-sm transition-colors"
              style={{
                background:  layout === l.value ? 'oklch(0.70 0.145 58 / 10%)' : 'transparent',
                borderColor: layout === l.value ? 'var(--primary)'              : 'var(--border)',
                color:       layout === l.value ? 'var(--primary)'              : 'var(--muted-foreground)',
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">Privacy</label>
        <select
          value={privacy}
          onChange={(e) => setPrivacy(e.target.value as PrivacyMode)}
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-primary transition-colors"
        >
          {PRIVACY_OPTIONS.map((p) => (
            <option key={p.value} value={p.value} disabled={p.value === 'public'}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-2 flex items-center gap-3">
        <button
          onClick={() => saveMutation.mutate()}
          disabled={!isDirty || saveMutation.isPending}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-40 flex items-center gap-2"
        >
          {saveMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Save changes
        </button>
        <AnimatePresence>
          {saved && (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm text-primary flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Saved
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function SettingsView() {
  const router = useRouter()
  const qc = useQueryClient()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Use bootstrap — same source of truth as AuthGate.
  // This guarantees we're editing the exact workspace the gate is guarding.
  const { data: bootstrap, isLoading: bootstrapLoading } = useBootstrap()
  const workspaceSummary = bootstrap?.workspace

  // Fetch the full workspace record (layout, privacy, subtitle, etc.)
  // bootstrap only returns a summary; the full PATCH form needs all fields.
  const { data: fullWorkspace, isLoading: wsLoading } = useQuery({
    queryKey: ['workspace', workspaceSummary?.id],
    queryFn: () => getWorkspace(workspaceSummary!.id),
    enabled: !!workspaceSummary?.id,
    staleTime: 60_000,
  })

  const isLoading = bootstrapLoading || wsLoading
  const workspace = workspaceSummary

  const deleteMutation = useMutation({
    mutationFn: () => deleteWorkspace(workspace!.id),
    onSuccess: async () => {
      setShowDeleteDialog(false)
      // Wipe the entire React Query cache — all workspace/drive/bootstrap data
      // is now invalid. AuthGate will re-evaluate from a clean state.
      qc.clear()
      router.replace('/onboarding')
    },
    onError: () => {
      setShowDeleteDialog(false)
    },
  })

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-6 py-12 space-y-10">

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-serif text-3xl text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your workspace and connections.</p>
          </motion.div>

          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          )}

          {workspace && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-10"
            >
              {/* Workspace */}
              <section className="space-y-4">
                <h2 className="font-serif text-xl text-foreground">Workspace</h2>
                {fullWorkspace ? (
                  <WorkspaceForm
                    workspaceId={fullWorkspace.id}
                    initialName={fullWorkspace.name}
                    initialSubtitle={fullWorkspace.subtitle ?? ''}
                    initialPrivacy={fullWorkspace.privacy_mode as PrivacyMode}
                    initialLayout={fullWorkspace.layout_preset}
                  />
                ) : (
                  <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading workspace details…
                  </div>
                )}
              </section>

              {/* Drive */}
              <DriveSection workspaceId={workspace.id} />

              {/* Metadata */}
              <section className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-6">
                <p>
                  Workspace ID:{' '}
                  <span className="text-foreground font-mono">{workspace.id}</span>
                </p>
                <p>
                  Slug:{' '}
                  <span className="text-foreground font-mono">{workspace.slug}</span>
                </p>
              </section>

              {/* Danger zone */}
              <section className="space-y-4">
                <h2 className="font-serif text-xl text-foreground">Danger zone</h2>
                <div className="bg-card border border-destructive/30 rounded-xl p-6 flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Delete this workspace</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Permanently removes this workspace and disconnects Google Drive.
                      Your photos stay safe in Drive. This cannot be undone.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-destructive/40 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </section>
            </motion.div>
          )}
        </div>
      </div>

      {/* Delete dialog — fixed overlay, rendered outside the scroll container */}
      <AnimatePresence>
        {showDeleteDialog && workspace && (
          <DeleteDialog
            workspaceName={workspace.name}
            onCancel={() => setShowDeleteDialog(false)}
            onConfirm={() => deleteMutation.mutate()}
            isPending={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>
    </>
  )
}
