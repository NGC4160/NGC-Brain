export type GuideStep = {
  id: string
  /** Curriculum chapter shown in the hub */
  chapter: string
  title: string
  body: string
  /** Short how-to tip */
  tip?: string
  /** Navigate here before highlighting */
  route: string
  /** Matches data-guide="…" on a DOM element */
  target?: string
  /** Module gate — skip if user cannot access */
  moduleId?: string
  /** Open the mobile drawer so nav targets are visible */
  openDrawer?: boolean
}

export type GuideProgress = {
  completedIds: string[]
  lastStepId: string | null
  finishedAt: string | null
  dismissedWelcome: boolean
}
