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
} from '@/lib/platform-api'
import type { LayoutPreset, ThemePreset, PrivacyMode, FolderTemplate, Workspace } from '@/types/platform'
import { StepWelcome } from './steps/step-welcome'
import { StepName } from './steps/step-name'
import { StepLayout } from './steps/step-layout'
import { StepPrivacy } from './steps/step-privacy'
import { StepDriveConnect } from './steps/step-drive-connect'
import { StepFinish } from './steps/step-finish'

export type OnboardingState = {
  name: string
  slug: string
  subtitle: string
  layout_preset: LayoutPreset
  theme_preset: ThemePreset
  privacy_mode: PrivacyMode
  folder_template: FolderTemplate
  workspace?: Workspace
}

const STEPS = ['welcome', 'name', 'layout', 'privacy', 'drive', 'finish'] as const
type Step = typeof STEPS[number]

function isValidStep(s: string | null): s is Step {
  return STEPS.includes(s as Step)
}

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
}

export function OnboardingFlow() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const qc = useQueryClient()

  // Normalize step from URL — only accept valid STEPS entries.
  // The Drive OAuth callback returns ?step=drive.
  const rawStep = searchParams.get('step')
  const initialStep: Step = isValidStep(rawStep) ? rawStep : 'welcome'

  const initialWorkspaceId = searchParams.get('workspace')
    ? Number(searchParams.get('workspace'))
    : undefined

  const [step, setStep] = useState<Step>(initialStep)
  const [dir, setDir] = useState(1)
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

  // If returning from Drive OAuth, fetch the full workspace record so we have
  // its name for the finish screen and the full object in state.
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

  const stepIdx = STEPS.indexOf(step)

  function go(nextStep: Step) {
    const nextIdx = STEPS.indexOf(nextStep)
    setDir(nextIdx > stepIdx ? 1 : -1)
    setStep(nextStep)
  }

  // Shared helper: refetch bootstrap so AuthGate sees fresh state before we
  // navigate away from /onboarding.
  async function refetchBootstrap() {
    await qc.refetchQueries({ queryKey: ['bootstrap'] })
  }

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
      // No navigation here — just advance the local step
      go('drive')
    },
  })

  const skipDriveMutation = useMutation({
    mutationFn: (workspaceId: number) =>
      updateWorkspace(workspaceId, { drive_connect_deferred: true }),
    onSuccess: () => {
      go('finish')
    },
  })

  const finishMutation = useMutation({
    mutationFn: (workspaceId: number) =>
      updateWorkspace(workspaceId, { onboarding_complete: true }),
    onSuccess: async () => {
      // CRITICAL: refetch bootstrap BEFORE navigating.
      // If we navigate first, AuthGate evaluates stale cache (onboarding_complete=false)
      // and immediately redirects back to /onboarding.
      console.debug('[OnboardingFlow] finish: persisted onboarding_complete, refetching bootstrap')
      await refetchBootstrap()
      console.debug('[OnboardingFlow] finish: bootstrap refetched, navigating to /')
      router.push('/')
    },
  })

  const onNameDone = (name: string, slug: string, subtitle: string) => {
    setState((s) => ({ ...s, name, slug, subtitle }))
    go('layout')
  }

  const onLayoutDone = (layout_preset: LayoutPreset, privacy_mode: PrivacyMode, folder_template: FolderTemplate) => {
    setState((s) => ({ ...s, layout_preset, privacy_mode, folder_template }))
    go('privacy')
  }

  const onPrivacyDone = (privacy_mode: PrivacyMode) => {
    setState((s) => ({ ...s, privacy_mode }))
    createMutation.mutate({ ...state, privacy_mode })
  }

  const onDriveConnected = () => {
    go('finish')
  }

  const onSkipDrive = () => {
    if (state.workspace?.id) {
      skipDriveMutation.mutate(state.workspace.id)
    } else {
      go('finish')
    }
  }

  const onFinish = () => {
    if (state.workspace?.id) {
      finishMutation.mutate(state.workspace.id)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-8 py-6 flex items-center justify-between">
        <span className="font-serif text-xl text-primary">Our Frame</span>
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className="block w-1.5 h-1.5 rounded-full transition-colors"
              style={{
                background: i <= stepIdx ? 'var(--primary)' : 'oklch(1 0 0 / 15%)',
              }}
            />
          ))}
        </div>
      </header>

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
              <StepWelcome onNext={() => go('name')} />
            )}
            {step === 'name' && (
              <StepName onNext={onNameDone} />
            )}
            {step === 'layout' && (
              <StepLayout onNext={onLayoutDone} />
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
            {step === 'finish' && (
              <StepFinish
                workspaceName={state.name || state.workspace?.name || 'your workspace'}
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
