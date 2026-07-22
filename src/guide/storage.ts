import type { GuideProgress } from './types'

const STORAGE_KEY = 'ngc-learning-guide-v1'

const DEFAULT_PROGRESS: GuideProgress = {
  completedIds: [],
  lastStepId: null,
  finishedAt: null,
  dismissedWelcome: false,
}

export function loadGuideProgress(): GuideProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PROGRESS }
    const parsed = JSON.parse(raw) as Partial<GuideProgress>
    return {
      completedIds: Array.isArray(parsed.completedIds) ? parsed.completedIds : [],
      lastStepId: parsed.lastStepId ?? null,
      finishedAt: parsed.finishedAt ?? null,
      dismissedWelcome: Boolean(parsed.dismissedWelcome),
    }
  } catch {
    return { ...DEFAULT_PROGRESS }
  }
}

export function saveGuideProgress(progress: GuideProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function resetGuideProgress(): GuideProgress {
  const next = { ...DEFAULT_PROGRESS }
  saveGuideProgress(next)
  return next
}
