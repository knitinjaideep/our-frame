'use client'

/**
 * HomeSetupView — in-app setup assistant rendered on /home when the workspace
 * is not fully configured.
 *
 * Setup states (in order):
 *   no_workspace        → ask user to create a workspace (name)
 *   no_drive            → Drive not connected; show Connect CTA
 *   no_root_folder      → Drive connected but no root folder selected
 *   no_media            → configured but no images found yet
 *   ready               → caller should not render this component at all
 *
 * Each state renders inside the existing /home shell with TopNav intact.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import {
  HardDrive,
  Folder,
  CheckCircle2,
  Circle,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Loader2,
  FolderOpen,
  LayoutGrid,
} from 'lucide-react'
import {
  createWorkspace,
  updateWorkspace,
  getDriveConnectUrl,
  getDriveStatus,
  setRootFolder,
  listDriveFolders,
  analyzeFolderStructure,
} from '@/lib/platform-api'
import type { DriveFolder } from '@/types/platform'

// ── Types ─────────────────────────────────────────────────────────────────────

type SetupState =
  | 'no_workspace'
  | 'no_drive'
  | 'no_root_folder'
  | 'no_structure'
  | 'no_media'

interface Props {
  setupState: SetupState
  workspaceId?: number
  workspaceName?: string
  userName?: string | null
}

// ── Checklist item ─────────────────────────────────────────────────────────────

function ChecklistItem({
  done,
  active,
  label,
  sublabel,
}: {
  done: boolean
  active: boolean
  label: string
  sublabel?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex-shrink-0">
        {done ? (
          <CheckCircle2
            className="w-4 h-4"
            style={{ color: 'var(--primary)' }}
          />
        ) : (
          <Circle
            className="w-4 h-4"
            style={{ color: active ? 'var(--primary)' : 'oklch(1 0 0 / 20%)' }}
          />
        )}
      </span>
      <div>
        <p
          className="text-sm font-medium"
          style={{
            color: done
              ? 'var(--muted-foreground)'
              : active
              ? 'var(--foreground)'
              : 'oklch(1 0 0 / 30%)',
            textDecoration: done ? 'line-through' : 'none',
          }}
        >
          {label}
        </p>
        {sublabel && active && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {sublabel}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Shared card wrapper ────────────────────────────────────────────────────────

function SetupCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-6 sm:p-8"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
      }}
    >
      {children}
    </div>
  )
}

// ── State: No workspace ────────────────────────────────────────────────────────

function NoWorkspacePanel({ userName, onCreated }: { userName?: string | null; onCreated: (id: number, name: string) => void }) {
  const [name, setName] = useState('')
  const qc = useQueryClient()

  const createMutation = useMutation({
    mutationFn: () => createWorkspace({ name: name.trim() }),
    onSuccess: async (ws) => {
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
      onCreated(ws.id, ws.name)
    },
  })

  const greeting = userName ? `Welcome, ${userName.split(' ')[0]}` : 'Welcome'

  return (
    <SetupCard>
      <div className="space-y-6">
        <div className="space-y-1.5">
          <p className="text-eyebrow-gold text-xs uppercase tracking-widest">{greeting}</p>
          <h2 className="font-serif text-2xl sm:text-3xl italic" style={{ color: 'var(--foreground)' }}>
            Let&apos;s set up your archive
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)', maxWidth: '28rem' }}>
            Give your family vault a name — this is what you&apos;ll see at the top of every page.
          </p>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="e.g. The Kotcherlakota Archive"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) createMutation.mutate() }}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{
              background: 'var(--background)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
            }}
            autoFocus
          />
          <button
            onClick={() => createMutation.mutate()}
            disabled={!name.trim() || createMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Continue
            {!createMutation.isPending && <ArrowRight className="w-4 h-4" />}
          </button>
          {createMutation.error && (
            <p className="text-xs text-destructive text-center">
              {(createMutation.error as Error).message}
            </p>
          )}
        </div>
      </div>
    </SetupCard>
  )
}

// ── State: No Drive ────────────────────────────────────────────────────────────

function NoDrivePanel({ workspaceId }: { workspaceId: number }) {
  const connectUrl = getDriveConnectUrl(workspaceId)

  return (
    <SetupCard>
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div
            className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--amber-muted)', border: '1px solid var(--amber-border)' }}
          >
            <HardDrive className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-xl italic" style={{ color: 'var(--foreground)' }}>
              Connect Google Drive
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)', maxWidth: '28rem' }}>
              Your photos stay exactly where they are — in your own Google Drive. Our Frame reads
              them with read-only access. We never upload or store your originals.
            </p>
          </div>
        </div>

        {/* Trust badges */}
        <div
          className="rounded-xl px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3"
          style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
        >
          {[
            { label: 'Read-only access', sub: 'We can only view, never modify' },
            { label: 'Your Drive, your data', sub: 'Nothing is copied to our servers' },
            { label: 'Revoke anytime', sub: 'Remove access from Google at any time' },
          ].map((item) => (
            <div key={item.label} className="space-y-0.5">
              <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{item.label}</p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{item.sub}</p>
            </div>
          ))}
        </div>

        <a
          href={connectUrl}
          className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-medium text-sm transition-opacity hover:opacity-90"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          <HardDrive className="w-4 h-4" />
          Connect Google Drive
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </SetupCard>
  )
}

// ── State: No root folder ──────────────────────────────────────────────────────

function NoRootFolderPanel({
  workspaceId,
  onSelected,
}: {
  workspaceId: number
  onSelected: (folderId: string, folderName: string) => void
}) {
  const { data: folders, isLoading, error, refetch } = useQuery({
    queryKey: ['drive-folders', workspaceId],
    queryFn: () => listDriveFolders(workspaceId),
    staleTime: 60_000,
  })

  const setRootMutation = useMutation({
    mutationFn: (folder: DriveFolder) => setRootFolder(workspaceId, folder.id),
    onSuccess: (_, folder) => onSelected(folder.id, folder.name),
  })

  return (
    <SetupCard>
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div
            className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--amber-muted)', border: '1px solid var(--amber-border)' }}
          >
            <Folder className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-xl italic" style={{ color: 'var(--foreground)' }}>
              Choose your photo folder
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)', maxWidth: '28rem' }}>
              Select the top-level folder in your Drive that contains your photos and videos.
              We&apos;ll use this as the root of your archive.
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 py-4" style={{ color: 'var(--muted-foreground)' }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading your Drive folders…</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 py-3">
            <p className="text-sm text-destructive flex-1">
              Could not load Drive folders. Check that your Drive is still connected.
            </p>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: 'var(--primary)' }}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {folders && folders.length === 0 && (
          <p className="text-sm py-2" style={{ color: 'var(--muted-foreground)' }}>
            No folders found in your Drive root. Make sure your photos are in a folder.
          </p>
        )}

        {folders && folders.length > 0 && (
          <div
            className="rounded-xl overflow-hidden divide-y"
            style={{ border: '1px solid var(--border)', '--tw-divide-opacity': '1' } as React.CSSProperties}
          >
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setRootMutation.mutate(folder)}
                disabled={setRootMutation.isPending}
                className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors group"
                style={{ background: 'var(--card)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--muted)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--card)')}
              >
                <div className="flex items-center gap-3">
                  <FolderOpen
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: 'var(--primary)' }}
                  />
                  <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    {folder.name}
                  </span>
                </div>
                {setRootMutation.isPending && setRootMutation.variables?.id === folder.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
                ) : (
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--muted-foreground)' }} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </SetupCard>
  )
}

// ── State: No structure ────────────────────────────────────────────────────────

function NoStructurePanel({
  workspaceId,
  rootFolderId,
  onDone,
}: {
  workspaceId: number
  rootFolderId: string
  onDone: () => void
}) {
  const [selected, setSelected] = useState<string | null>(null)

  const { data: analysis, isLoading, error } = useQuery({
    queryKey: ['folder-analysis', workspaceId, rootFolderId],
    queryFn: () => analyzeFolderStructure(workspaceId, rootFolderId),
    staleTime: Infinity,
  })

  const qc = useQueryClient()
  const saveMutation = useMutation({
    mutationFn: (template: string) =>
      updateWorkspace(workspaceId, { folder_template: template, onboarding_complete: true }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['bootstrap'] })
      onDone()
    },
  })

  const recommendations = analysis?.recommendations ?? []

  return (
    <SetupCard>
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div
            className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--amber-muted)', border: '1px solid var(--amber-border)' }}
          >
            <LayoutGrid className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-xl italic" style={{ color: 'var(--foreground)' }}>
              How are your folders organised?
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)', maxWidth: '28rem' }}>
              {analysis
                ? `We found ${analysis.subfolder_count} folders. Pick the structure that best matches how your photos are organised — we'll use this to build your albums.`
                : 'Analysing your folder structure…'}
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 py-4" style={{ color: 'var(--muted-foreground)' }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Reading your folders…</span>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive py-2">
            Could not analyse your folder structure. You can still choose manually below.
          </p>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-2.5">
            {recommendations.map((rec) => (
              <button
                key={rec.id}
                onClick={() => setSelected(rec.id)}
                className="w-full text-left rounded-xl px-5 py-4 transition-all"
                style={{
                  background: selected === rec.id ? 'var(--amber-muted)' : 'var(--background)',
                  border: `1px solid ${selected === rec.id ? 'var(--amber-border)' : 'var(--border)'}`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                      {rec.title}
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                      {rec.description}
                    </p>
                    {rec.reasoning && rec.id !== 'custom' && (
                      <p className="text-xs italic" style={{ color: 'var(--primary)', opacity: 0.8 }}>
                        {rec.reasoning}
                      </p>
                    )}
                  </div>
                  <div
                    className="flex-shrink-0 w-4 h-4 rounded-full mt-0.5 border-2 transition-all"
                    style={{
                      borderColor: selected === rec.id ? 'var(--primary)' : 'var(--border)',
                      background: selected === rec.id ? 'var(--primary)' : 'transparent',
                    }}
                  />
                </div>
                {rec.preview && rec.preview.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {rec.preview.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: 'var(--muted)',
                          color: 'var(--muted-foreground)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => selected && saveMutation.mutate(
            recommendations.find((r) => r.id === selected)?.template ?? 'custom'
          )}
          disabled={!selected || saveMutation.isPending}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Confirm structure and open my archive
          {!saveMutation.isPending && <ArrowRight className="w-4 h-4" />}
        </button>
        {saveMutation.error && (
          <p className="text-xs text-destructive text-center">{(saveMutation.error as Error).message}</p>
        )}
      </div>
    </SetupCard>
  )
}

// ── State: No media ────────────────────────────────────────────────────────────

function NoMediaPanel({ workspaceId }: { workspaceId: number }) {
  const qc = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    await qc.invalidateQueries({ queryKey: ['bootstrap'] })
    await qc.invalidateQueries({ queryKey: ['albums'] })
    setRefreshing(false)
  }

  return (
    <SetupCard>
      <div className="space-y-5 text-center">
        <div
          className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
          style={{ background: 'var(--amber-muted)', border: '1px solid var(--amber-border)' }}
        >
          <FolderOpen className="w-6 h-6" style={{ color: 'var(--primary)' }} />
        </div>

        <div className="space-y-2">
          <h3 className="font-serif text-xl italic" style={{ color: 'var(--foreground)' }}>
            No photos found yet
          </h3>
          <p className="text-sm leading-relaxed mx-auto" style={{ color: 'var(--muted-foreground)', maxWidth: '26rem' }}>
            Your archive is configured but we haven&apos;t found any images in the selected folder.
            Make sure your photos are inside the root folder you chose, then try refreshing.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
        </div>

        <p className="text-xs" style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}>
          It can take a moment for Drive to index newly added files.
        </p>
      </div>
    </SetupCard>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

const CHECKLIST: { key: SetupState | 'done'; label: string; sublabel?: string }[] = [
  { key: 'no_workspace',   label: 'Name your archive',        sublabel: 'Give your family vault a name' },
  { key: 'no_drive',       label: 'Connect Google Drive',     sublabel: 'Read-only, your photos stay in Drive' },
  { key: 'no_root_folder', label: 'Choose a root folder',     sublabel: 'Pick the folder that holds your photos' },
  { key: 'no_structure',   label: 'Set folder structure',     sublabel: 'Tell us how your albums are organised' },
  { key: 'done',           label: 'Browse your memories',     sublabel: 'Your archive is ready' },
]

const STATE_ORDER: (SetupState | 'done')[] = [
  'no_workspace',
  'no_drive',
  'no_root_folder',
  'no_structure',
  'done',
]

export function HomeSetupView({ setupState, workspaceId, workspaceName, userName }: Props) {
  const searchParams = useSearchParams()
  const qc = useQueryClient()

  // Internal state for folder-picker → structure step transition
  const [localState, setLocalState] = useState<SetupState>(setupState)
  const [localWorkspaceId, setLocalWorkspaceId] = useState<number | undefined>(workspaceId)
  const [localWorkspaceName, setLocalWorkspaceName] = useState<string | undefined>(workspaceName)
  const [rootFolderId, setRootFolderId] = useState<string | undefined>()

  // Sync external state if bootstrap refreshes and moves us forward
  useEffect(() => {
    setLocalState(setupState)
    setLocalWorkspaceId(workspaceId)
    setLocalWorkspaceName(workspaceName)
  }, [setupState, workspaceId, workspaceName])

  // If Drive just connected (from OAuth callback ?drive_connected=1), refetch bootstrap
  useEffect(() => {
    if (searchParams.get('drive_connected') === '1') {
      qc.invalidateQueries({ queryKey: ['bootstrap'] })
    }
  }, [searchParams, qc])

  // Fetch Drive status after Drive is connected to get root_folder_id
  const { data: driveStatus } = useQuery({
    queryKey: ['drive-status', localWorkspaceId],
    queryFn: () => getDriveStatus(localWorkspaceId!),
    enabled: !!localWorkspaceId && (localState === 'no_root_folder' || localState === 'no_structure'),
    staleTime: 30_000,
  })

  const resolvedRootFolderId = rootFolderId ?? driveStatus?.root_folder_id ?? undefined

  const currentIdx = STATE_ORDER.indexOf(localState)
  const doneUpTo = currentIdx

  const displayName = localWorkspaceName ?? 'Your archive'

  return (
    <div className="content-padding py-16 sm:py-24 max-w-2xl mx-auto space-y-12">

      {/* Welcome heading */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-3"
      >
        <p className="text-eyebrow-gold text-xs uppercase tracking-widest">
          {localState === 'no_workspace' ? 'Welcome' : `Setting up ${displayName}`}
        </p>
        <h1
          className="font-serif leading-tight"
          style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontStyle: 'italic', color: 'var(--foreground)' }}
        >
          {localState === 'no_workspace'
            ? 'Create your family archive'
            : localState === 'no_drive'
            ? 'Connect your photo library'
            : localState === 'no_root_folder'
            ? 'Where are your photos?'
            : localState === 'no_structure'
            ? 'Map your folder structure'
            : 'Almost there…'}
        </h1>
      </motion.div>

      {/* Setup checklist */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <SetupCard>
          <div className="space-y-3.5">
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-4" style={{ color: 'var(--muted-foreground)' }}>
              Setup progress
            </p>
            {CHECKLIST.map((item, i) => (
              <ChecklistItem
                key={item.key}
                done={i < doneUpTo}
                active={i === doneUpTo}
                label={item.label}
                sublabel={item.sublabel}
              />
            ))}
          </div>
        </SetupCard>
      </motion.div>

      {/* Active step panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={localState}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        >
          {localState === 'no_workspace' && (
            <NoWorkspacePanel
              userName={userName}
              onCreated={(id, name) => {
                setLocalWorkspaceId(id)
                setLocalWorkspaceName(name)
                setLocalState('no_drive')
              }}
            />
          )}

          {localState === 'no_drive' && localWorkspaceId && (
            <NoDrivePanel workspaceId={localWorkspaceId} />
          )}

          {localState === 'no_root_folder' && localWorkspaceId && (
            <NoRootFolderPanel
              workspaceId={localWorkspaceId}
              onSelected={(folderId, folderName) => {
                setRootFolderId(folderId)
                setLocalState('no_structure')
              }}
            />
          )}

          {localState === 'no_structure' && localWorkspaceId && resolvedRootFolderId && (
            <NoStructurePanel
              workspaceId={localWorkspaceId}
              rootFolderId={resolvedRootFolderId}
              onDone={() => {
                qc.invalidateQueries({ queryKey: ['bootstrap'] })
              }}
            />
          )}

          {localState === 'no_media' && localWorkspaceId && (
            <NoMediaPanel workspaceId={localWorkspaceId} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Privacy footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="text-xs text-center"
        style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}
      >
        Your photos stay in your Google Drive. Our Frame requests read-only access and never stores originals.
      </motion.p>
    </div>
  )
}
