'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { listDriveFolders, listDriveFolderChildren } from '@/lib/platform-api'
import { Folder, FolderOpen, ChevronRight, HardDrive, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import type { DriveFolder } from '@/types/platform'

interface Props {
  workspaceId: number
  onNext: (folderId: string, folderName: string) => void
  onSkip: () => void
}

function FolderRow({
  folder,
  selected,
  onSelect,
  workspaceId,
}: {
  folder: DriveFolder
  selected: boolean
  onSelect: (id: string, name: string) => void
  workspaceId: number
}) {
  const [expanded, setExpanded] = useState(false)

  const { data: children, isLoading } = useQuery({
    queryKey: ['folderChildren', workspaceId, folder.id],
    queryFn: () => listDriveFolderChildren(workspaceId, folder.id),
    enabled: expanded,
    staleTime: 60_000,
  })

  return (
    <div>
      <div
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150"
        style={{
          background: selected ? 'var(--amber-subtle)' : 'transparent',
          border: `1px solid ${selected ? 'var(--primary)' : 'transparent'}`,
        }}
      >
        {/* Expand chevron */}
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v) }}
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors hover:bg-muted/60"
          aria-label="Expand folder"
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          ) : (
            <ChevronRight
              className="w-3 h-3 text-muted-foreground transition-transform duration-200"
              style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}
            />
          )}
        </button>

        {/* Folder icon */}
        <span style={{ color: selected ? 'var(--primary)' : 'var(--muted-foreground)' }}>
          {selected || expanded
            ? <FolderOpen className="w-4 h-4" />
            : <Folder className="w-4 h-4" />}
        </span>

        {/* Name — click to select */}
        <button
          className="flex-1 text-left text-sm text-foreground"
          onClick={() => onSelect(folder.id, folder.name)}
        >
          {folder.name}
        </button>

        {selected && (
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--primary)' }} />
        )}
      </div>

      {/* Children */}
      <AnimatePresence>
        {expanded && children && children.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="pl-6 mt-0.5 space-y-0.5 overflow-hidden"
          >
            {children.slice(0, 12).map((child) => (
              <div
                key={child.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors hover:bg-muted/40"
                onClick={() => onSelect(child.id, child.name)}
                style={{
                  border: '1px solid transparent',
                }}
              >
                <Folder className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
                <span className="text-xs text-muted-foreground">{child.name}</span>
              </div>
            ))}
            {children.length > 12 && (
              <p className="text-xs text-muted-foreground px-3 py-1 opacity-60">
                +{children.length - 12} more…
              </p>
            )}
          </motion.div>
        )}
        {expanded && children && children.length === 0 && (
          <p className="pl-8 text-xs text-muted-foreground py-1.5">No sub-folders</p>
        )}
      </AnimatePresence>
    </div>
  )
}

export function StepFolderPicker({ workspaceId, onNext, onSkip }: Props) {
  const [selectedId, setSelectedId]     = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState<string | null>(null)

  const { data: folders, isLoading, isError } = useQuery({
    queryKey: ['driveFolders', workspaceId],
    queryFn: () => listDriveFolders(workspaceId),
    staleTime: 60_000,
    retry: 2,
  })

  const handleSelect = (id: string, name: string) => {
    setSelectedId(id)
    setSelectedName(name)
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--primary)' }}>
          Step 5 of 6
        </p>
        <h2 className="font-serif text-3xl text-foreground">Choose a root folder</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Select the Google Drive folder that contains your photos and videos.
          This becomes the root of your archive — everything is read from here.
        </p>
      </div>

      {/* Folder list */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2.5 px-4 py-3"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <HardDrive className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          <span className="text-sm font-medium text-foreground">My Drive</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {isLoading ? 'Loading…' : folders ? `${folders.length} folders` : ''}
          </span>
        </div>

        {/* Folder tree */}
        <div className="px-2 py-2 max-h-72 overflow-y-auto space-y-0.5">
          {isLoading && (
            <div className="flex items-center gap-2 px-3 py-6 justify-center text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading your folders…</span>
            </div>
          )}

          {isError && (
            <div className="flex items-center gap-2 px-3 py-6 justify-center text-muted-foreground">
              <AlertCircle className="w-4 h-4" style={{ color: 'var(--destructive)' }} />
              <span className="text-sm">Couldn't load folders. Check your Drive connection.</span>
            </div>
          )}

          {folders && folders.length === 0 && (
            <div className="px-3 py-6 text-center">
              <p className="text-sm text-muted-foreground">No top-level folders found in your Drive.</p>
              <p className="text-xs text-muted-foreground mt-1">Try choosing a subfolder or skip this step.</p>
            </div>
          )}

          {folders?.map((folder) => (
            <FolderRow
              key={folder.id}
              folder={folder}
              selected={selectedId === folder.id}
              onSelect={handleSelect}
              workspaceId={workspaceId}
            />
          ))}
        </div>
      </div>

      {/* Selected folder summary */}
      {selectedName && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
          style={{ background: 'var(--amber-subtle)', border: '1px solid var(--amber-border)' }}
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--primary)' }} />
          <div>
            <p className="text-sm font-medium text-foreground">
              <span style={{ color: 'var(--primary)' }}>{selectedName}</span> selected as root
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              We'll read your photos and videos from this folder and its subfolders.
            </p>
          </div>
        </motion.div>
      )}

      {/* Privacy reassurance */}
      <div
        className="px-4 py-3 rounded-xl text-xs text-muted-foreground leading-relaxed"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <span style={{ color: 'var(--primary)' }}>✓</span>{' '}
        We request <strong className="text-foreground">read-only</strong> access.
        We never copy, modify, or delete your files.
        Your Drive connection can be revoked from Google Account settings at any time.
      </div>

      {/* Actions */}
      <div className="space-y-2.5">
        <button
          onClick={() => selectedId && selectedName && onNext(selectedId, selectedName)}
          disabled={!selectedId}
          className="w-full px-6 py-3.5 rounded-xl font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
          }}
        >
          Use {selectedName ?? 'selected folder'}
        </button>
        <button
          onClick={onSkip}
          className="w-full px-6 py-3 rounded-xl text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Skip — I'll choose a folder later
        </button>
      </div>
    </div>
  )
}
