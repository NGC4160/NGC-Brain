import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/context/AuthContext'
import { GUIDE_STEPS, chaptersFromSteps } from '@/guide/steps'
import { loadGuideProgress, resetGuideProgress, saveGuideProgress } from '@/guide/storage'
import type { GuideProgress, GuideStep } from '@/guide/types'

type GuideStore = {
  steps: GuideStep[]
  chapters: string[]
  progress: GuideProgress
  active: boolean
  stepIndex: number
  step: GuideStep | null
  openDrawerForStep: boolean
  start: (fromId?: string) => void
  resume: () => void
  stop: () => void
  next: () => void
  back: () => void
  goTo: (id: string) => void
  restart: () => void
  dismissWelcome: () => void
  markComplete: (id: string) => void
  isComplete: (id: string) => boolean
  percentDone: number
}

const GuideContext = createContext<GuideStore | null>(null)

export function GuideProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { canAccessModule } = useAuthContext()
  const [progress, setProgress] = useState<GuideProgress>(() => loadGuideProgress())
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  const steps = useMemo(
    () =>
      GUIDE_STEPS.filter((s) => {
        if (!s.moduleId) return true
        if (s.moduleId === 'dashboard') return true
        return canAccessModule(s.moduleId)
      }),
    [canAccessModule],
  )

  const chapters = useMemo(() => chaptersFromSteps(steps), [steps])
  const step = steps[stepIndex] ?? null

  useEffect(() => {
    saveGuideProgress(progress)
  }, [progress])

  // Keep index valid when role filters change
  useEffect(() => {
    if (stepIndex >= steps.length) {
      setStepIndex(Math.max(0, steps.length - 1))
    }
  }, [steps.length, stepIndex])

  const navigateForStep = useCallback(
    (s: GuideStep) => {
      if (s.route) navigate(s.route)
    },
    [navigate],
  )

  const markComplete = useCallback((id: string) => {
    setProgress((p) => {
      if (p.completedIds.includes(id)) return { ...p, lastStepId: id }
      return { ...p, completedIds: [...p.completedIds, id], lastStepId: id }
    })
  }, [])

  const activateAt = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, steps.length - 1))
      const s = steps[clamped]
      setStepIndex(clamped)
      setActive(true)
      if (s) {
        navigateForStep(s)
        markComplete(s.id)
      }
    },
    [steps, navigateForStep, markComplete],
  )

  const start = useCallback(
    (fromId?: string) => {
      if (fromId) {
        const idx = steps.findIndex((s) => s.id === fromId)
        activateAt(idx >= 0 ? idx : 0)
        return
      }
      activateAt(0)
    },
    [steps, activateAt],
  )

  const resume = useCallback(() => {
    if (progress.lastStepId) {
      const idx = steps.findIndex((s) => s.id === progress.lastStepId)
      activateAt(idx >= 0 ? idx : 0)
      return
    }
    const firstIncomplete = steps.findIndex((s) => !progress.completedIds.includes(s.id))
    activateAt(firstIncomplete >= 0 ? firstIncomplete : 0)
  }, [progress, steps, activateAt])

  const stop = useCallback(() => setActive(false), [])

  const next = useCallback(() => {
    if (!step) return
    markComplete(step.id)
    if (stepIndex >= steps.length - 1) {
      setProgress((p) => ({
        ...p,
        finishedAt: new Date().toISOString(),
        lastStepId: step.id,
      }))
      setActive(false)
      return
    }
    activateAt(stepIndex + 1)
  }, [step, stepIndex, steps.length, markComplete, activateAt])

  const back = useCallback(() => {
    if (stepIndex <= 0) return
    activateAt(stepIndex - 1)
  }, [stepIndex, activateAt])

  const goTo = useCallback(
    (id: string) => {
      const idx = steps.findIndex((s) => s.id === id)
      if (idx >= 0) activateAt(idx)
    },
    [steps, activateAt],
  )

  const restart = useCallback(() => {
    const cleared = resetGuideProgress()
    setProgress(cleared)
    activateAt(0)
  }, [activateAt])

  const dismissWelcome = useCallback(() => {
    setProgress((p) => ({ ...p, dismissedWelcome: true }))
  }, [])

  const isComplete = useCallback(
    (id: string) => progress.completedIds.includes(id),
    [progress.completedIds],
  )

  const percentDone = steps.length
    ? Math.round((progress.completedIds.filter((id) => steps.some((s) => s.id === id)).length / steps.length) * 100)
    : 0

  const value: GuideStore = {
    steps,
    chapters,
    progress,
    active,
    stepIndex,
    step,
    openDrawerForStep: Boolean(active && step?.openDrawer),
    start,
    resume,
    stop,
    next,
    back,
    goTo,
    restart,
    dismissWelcome,
    markComplete,
    isComplete,
    percentDone,
  }

  return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>
}

export function useGuide(): GuideStore {
  const ctx = useContext(GuideContext)
  if (!ctx) throw new Error('useGuide must be used within GuideProvider')
  return ctx
}
