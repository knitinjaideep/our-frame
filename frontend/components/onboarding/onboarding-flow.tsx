'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import {
  createWorkspace,
  updateWorkspace,
  getWorkspace,
  fetchBootstrap,
  setRootFolder,
} from '@/lib/platform-api'
import type { LayoutPreset, ThemePreset, PrivacyMode, FolderTemplate } from '@/types/platform'
import { StepWelcome } from './steps/step-welcome'
import { StepName } from './steps/step-name'
import { StepLayout } from './steps/step-layout'
import { StepPrivacy } from './steps/step-privacy'
import { StepDriveConnect } from './steps/step-drive-connect'
import { StepFolderPicker } from './steps/step-folder-picker'
import { StepFolderStructure } from './steps/step-folder-structure'
import { StepFinish } from './steps/step-finish'
import { useCurrentUser } from '@/hooks/use-auth'
import type { Workspace } from '@/types/platform'

/* ─────────────────────────────────────────────────────────────────────────────
   Step ordering — note 'folder-structure' comes after 'folder-picker' and is
   only relevant when the user has selected a folder with subfolders.
   The flow may skip 'folder-picker' and 'folder-structure' if Drive is deferred.
───────────────────────────────────────────────────────────────────────────── */
const STEPS = [
  'welcome',
  'name',
  'layout',
  'privacy',
  'drive',
  'folder-picker',
  'folder-structure',
  'finish',
] as const
type Step = typeof STEPS[number]

function isValidStep(s: string | null): s is Step {
  return STEPS.includes(s as Step)
}

/* ── Onboarding local state ── */
export type OnboardingState = {
  name: string
  slug: string
  subtitle: string
  layout_preset: LayoutPreset
  theme_preset: ThemePreset
  privacy_mode: PrivacyMode
  folder_template: FolderTemplate
  root_folder_id?: string
  root_folder_name?: string
  structure_recommendation_id?: string
  workspace?: Workspace
}

/* ── Slide animation ── */
const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit:  (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
}

/* ── Progress dots (visible steps only) ── */
const VISIBLE_STEPS: Step[] = ['welcome', 'name', 'layout', 'privacy', 'drive', 'folder-picker', 'finish']

export function OnboardingFlow() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const qc = useQueryClient()
  const { data: user } = useCurrentUser()

  /* Normalize step from URL — only accept valid STEPS entries */
  const rawStep = searchParams.get('step')
  const initialStep: Step = isValidStep(rawStep) ? rawStep : 'welcome'

  const initialWorkspaceId = searchParams.get('workspace')
    ? Number(searchParams.get('workspace'))
    : undefined

  const [step, setStep] = useState<Step>(initialStep)
  const [dir, setDir]   = useState(1)
  const [state, setState] = useState<OnboardingState>({
    name: '',
    slug: '',
    subtitle: '',
    layout_preset: 'editorial',
    theme_preset: 'warm_dark',
    privacy_mode: 'private',
    folder_template: 'family',
    workspace: initialWorkspaceId ? ({ id: initialWorkspaceId } as Workspace) : undefined,
  })

  /* If returning from Drive OAuth, fetch the full workspace record */
  const { data: fetchedWorkspace } = useQuery({
    queryKey: ['workspace', initialWorkspaceId],
    queryFn: () => getWorkspace(initialWorkspaceId!),
    enabled: !!initialWorkspaceId && !state.workspace?.name,
    staleTime: 0,
  })

  useEffect(() => {
    if (fetchedWorkspace && !state.workspace?.name) {
      setState((s) => ({ ...s, workspace: fetchedWorkspace, name: s.name || fetchedWorkspace.name }))
    }
  }, [fetchedWorkspace]) // eslint-disable-line react-hooks/exhaustive-deps

  /* Apply theme preview on document root during onboarding */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme_preset)
  }, [state.theme_preset])

  const stepIdx = STEPS.indexOf(step)

  function go(nextStep: Step) {
    const nextIdx = STEPS.indexOf(nextStep)
    setDir(nextIdx > stepIdx ? 1 : -1)
    setStep(nextStep)
  }

  async function refetchBootstrap() {
    await qc.refetchQueries({ queryKey: ['bootstrap'] })
  }

  /* ── Mutations ── */
  const createMutation = useMutation({
    mutationFn: (data: OnboardingState) =>
      createWorkspace({
        name: data.name,
        slug: data.slug || undefined,
        subtitle: data.subtitle || undefined,
        layout_preset: data.layout_preset,
        theme_preset: data.theme_preset,
        privacy_mode: data.privacy_mode,
        folder_template: data.folder_template,
      }),
    onSuccess: (workspace) => {
      setState((s) => ({ ...s, workspace }))
      go('drive')
    },
  })

  const skipDriveMutation = useMutation({
    mutationFn: (workspaceId: number) =>
      updateWorkspace(workspaceId, { drive_connect_deferred: true }),
    onSuccess: () => go('finish'),
  })

  const setRootFolderMutation = useMutation({
    mutationFn: ({ workspaceId, folderId }: { workspaceId: number; folderId: string }) =>
      setRootFolder(workspaceId, folderId),
    onSuccess: () => go('folder-structure'),
  })

  const updateTemplateMutation = useMutation({
    mutationFn: ({ workspaceId, template }: { workspaceId: number; template: string }) =>
      updateWorkspace(workspaceId, { folder_template: template }),
    onSuccess: () => go('finish'),
  })

  const finishMutation = useMutation({
    mutationFn: (workspaceId: number) =>
      updateWorkspace(workspaceId, { onboarding_complete: true }),
    onSuccess: async () => {
      console.debug('[OnboardingFlow] finish: persisted onboarding_complete, refetching bootstrap')
      await refetchBootstrap()
      console.debug('[OnboardingFlow] finish: bootstrap refetched, navigating to /home')
      router.push('/home')
    },
  })

  /* ── Step handlers ── */
  const onNameDone = (name: string, slug: string, subtitle: string) => {
    setState((s) => ({ ...s, name, slug, subtitle }))
    go('layout')
  }

  const onLayoutDone = (layout_preset: LayoutPreset, theme_preset: ThemePreset) => {
    setState((s) => ({ ...s, layout_preset, theme_preset }))
    go('privacy')
  }

  const onPrivacyDone = (privacy_mode: PrivacyMode) => {
    const next = { ...state, privacy_mode }
    setState(next)
    createMutation.mutate(next)
  }

  const onDriveConnected = () => {
    // Drive is active — go to folder picker
    go('folder-picker')
  }

  const onSkipDrive = () => {
    if (state.workspace?.id) {
      skipDriveMutation.mutate(state.workspace.id)
    } else {
      go('finish')
    }
  }

  const onFolderPicked = (folderId: string, folderName: string) => {
    setState((s) => ({ ...s, root_folder_id: folderId, root_folder_name: folderName }))
    if (state.workspace?.id) {
      setRootFolderMutation.mutate({ workspaceId: state.workspace.id, folderId })
    } else {
      go('folder-structure')
    }
  }

  const onSkipFolderPicker = () => {
    go('finish')
  }

  const onStructureDone = (template: string, recommendationId: string) => {
    setState((s) => ({ ...s, folder_template: template as FolderTemplate, structure_recommendation_id: recommendationId }))
    if (state.workspace?.id) {
      updateTemplateMutation.mutate({ workspaceId: state.workspace.id, template })
    } else {
      go('finish')
    }
  }

  const onFinish = () => {
    if (state.workspace?.id) {
      finishMutation.mutate(state.workspace.id)
    } else {
      router.push('/home')
    }
  }

  /* ── Progress indicator — only show visible steps ── */
  const visibleIdx = VISIBLE_STEPS.indexOf(step as typeof VISIBLE_STEPS[number])
  const progressStep = visibleIdx >= 0 ? visibleIdx : VISIBLE_STEPS.indexOf(
    step === 'folder-structure' ? 'folder-picker' : 'finish'
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header bar */}
      <header className="px-6 py-5 flex items-center justify-between">
        <span className="font-serif text-xl italic font-semibold" style={{
          background: 'linear-gradient(105deg, var(--gold-shadow) 0%, var(--gold-mid) 40%, var(--gold-highlight) 55%, var(--gold-mid) 70%, var(--gold-shadow) 100%)',
          backgroundSize: '250% auto',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Our Frame
        </span>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {VISIBLE_STEPS.map((s, i) => {
            const done    = i < progressStep
            const current = i === progressStep
            return (
              <motion.span
                key={s}
                layout
                className="block rounded-full transition-all duration-300"
                style={{
                  width:  current ? '20px' : '6px',
                  height: '6px',
                  background: done || current
                    ? 'var(--primary)'
                    : 'oklch(1 0 0 / 15%)',
                }}
              />
            )
          })}
        </div>
      </header>

      {/* Step content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-lg"
          >
            {step === 'welcome' && (
              <StepWelcome onNext={() => go('name')} user={user} />
            )}

            {step === 'name' && (
              <StepName
                onNext={onNameDone}
                defaultName={state.name}
                defaultSubtitle={state.subtitle}
              />
            )}

            {step === 'layout' && (
              <StepLayout
                onNext={onLayoutDone}
                defaultLayout={state.layout_preset}
                defaultTheme={state.theme_preset}
              />
            )}

            {step === 'privacy' && (
              <StepPrivacy
                onNext={onPrivacyDone}
                loading={createMutation.isPending}
                error={createMutation.error?.message}
              />
            )}

            {step === 'drive' && state.workspace && (
              <StepDriveConnect
                workspaceId={state.workspace.id}
                onConnected={onDriveConnected}
                onSkip={onSkipDrive}
              />
            )}
            {step === 'drive' && !state.workspace && (
              <div className="text-center text-muted-foreground text-sm">Loading…</div>
            )}

            {step === 'folder-picker' && state.workspace && (
              <StepFolderPicker
                workspaceId={state.workspace.id}
                onNext={onFolderPicked}
                onSkip={onSkipFolderPicker}
              />
            )}

            {step === 'folder-structure' && state.workspace && state.root_folder_id && state.root_folder_name && (
              <StepFolderStructure
                workspaceId={state.workspace.id}
                folderId={state.root_folder_id}
                folderName={state.root_folder_name}
                onNext={onStructureDone}
                onBack={() => go('folder-picker')}
              />
            )}

            {step === 'finish' && (
              <StepFinish
                workspaceName={state.name || state.workspace?.name || 'your archive'}
                subtitle={state.subtitle || null}
                themePreset={state.theme_preset}
                layoutPreset={state.layout_preset}
                privacyMode={state.privacy_mode}
                rootFolderName={state.root_folder_name || null}
                folderTemplate={state.structure_recommendation_id || state.folder_template}
                onFinish={onFinish}
                loading={finishMutation.isPending}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
