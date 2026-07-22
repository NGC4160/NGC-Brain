import { useEffect, useLayoutEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, GraduationCap, X } from 'lucide-react'
import { useGuide } from '@/context/GuideContext'
import { cn } from '@/lib/utils'

type Rect = { top: number; left: number; width: number; height: number }

function measureTarget(selector: string | undefined): Rect | null {
  if (!selector) return null
  const el = document.querySelector(`[data-guide="${selector}"]`) as HTMLElement | null
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width < 2 && r.height < 2) return null
  const pad = 8
  return {
    top: Math.max(8, r.top - pad),
    left: Math.max(8, r.left - pad),
    width: Math.min(window.innerWidth - 16, r.width + pad * 2),
    height: Math.min(window.innerHeight - 16, r.height + pad * 2),
  }
}

export function LearningGuideOverlay() {
  const { active, step, stepIndex, steps, next, back, stop } = useGuide()
  const [rect, setRect] = useState<Rect | null>(null)

  useLayoutEffect(() => {
    if (!active || !step) {
      setRect(null)
      return
    }
    const update = () => setRect(measureTarget(step.target))
    update()
    const t1 = window.setTimeout(update, 120)
    const t2 = window.setTimeout(update, 400)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [active, step, stepIndex])

  useEffect(() => {
    if (!active || !rect) return
    const el = step?.target
      ? (document.querySelector(`[data-guide="${step.target}"]`) as HTMLElement | null)
      : null
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [active, rect, step])

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stop()
      if (e.key === 'ArrowRight' || e.key === 'Enter') next()
      if (e.key === 'ArrowLeft') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, next, back, stop])

  if (!active || !step) return null

  const isLast = stepIndex >= steps.length - 1
  const progressPct = Math.round(((stepIndex + 1) / steps.length) * 100)

  // Place card below spotlight when there is room; otherwise near bottom
  const cardTop =
    rect && rect.top + rect.height + 200 < window.innerHeight
      ? rect.top + rect.height + 12
      : undefined

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Learning guide">
      <div className="absolute inset-0 bg-slate-950/55" onClick={stop} />

      {rect && (
        <div
          className="pointer-events-none absolute rounded-xl ring-2 ring-brand-400 shadow-[0_0_0_9999px_rgba(2,6,23,0.55)] transition-all duration-200"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
        />
      )}

      <div
        className={cn(
          'absolute inset-x-3 z-[81] mx-auto w-[min(28rem,calc(100%-1.5rem))] rounded-2xl border border-brand-200 bg-white p-4 shadow-2xl dark:border-brand-800 dark:bg-slate-900 sm:p-5',
          cardTop == null && 'bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-8',
        )}
        style={cardTop != null ? { top: cardTop } : undefined}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
              {step.chapter} · {stepIndex + 1}/{steps.length}
            </p>
            <h2 className="mt-0.5 text-base font-bold text-slate-900 dark:text-white sm:text-lg">
              {step.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={stop}
            className="touch-target inline-flex shrink-0 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close guide"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{step.body}</p>
        {step.tip && (
          <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs font-medium text-brand-800 dark:bg-brand-950 dark:text-brand-200">
            Tip: {step.tip}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={back}
            disabled={stepIndex === 0}
            className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-sm font-medium text-slate-600 disabled:opacity-40 dark:text-slate-300"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <button
            type="button"
            onClick={next}
            className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            {isLast ? 'Finish' : 'Next'}
            {!isLast && <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}

export function GuideWelcomeModal() {
  const { progress, dismissWelcome, start, percentDone } = useGuide()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!progress.dismissedWelcome && !progress.finishedAt) {
      const t = window.setTimeout(() => setOpen(true), 600)
      return () => window.clearTimeout(t)
    }
  }, [progress.dismissedWelcome, progress.finishedAt])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/50 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-ngc-200 bg-white p-5 shadow-2xl dark:border-ngc-800 dark:bg-slate-900 sm:p-6">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
          <GraduationCap className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Learn the dashboard</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Take a short guided walkthrough of every module — Home, Intake, SOPs, KPIs, Jobs, Board,
          QC, Invoicing, and Settings. You can pause and resume anytime.
        </p>
        {percentDone > 0 && (
          <p className="mt-2 text-xs font-medium text-brand-700 dark:text-brand-300">
            {percentDone}% already explored on this device
          </p>
        )}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
            onClick={() => {
              dismissWelcome()
              setOpen(false)
              start()
            }}
          >
            Start guide
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
            onClick={() => {
              dismissWelcome()
              setOpen(false)
            }}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}

export function GuideFab() {
  const { start, resume, progress, active, percentDone } = useGuide()
  if (active) return null

  const hasProgress = progress.completedIds.length > 0 && !progress.finishedAt

  return (
    <button
      type="button"
      data-guide="guide-launcher"
      onClick={() => (hasProgress ? resume() : start())}
      className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-3 z-40 inline-flex items-center gap-2 rounded-full bg-brand-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-lg ring-1 ring-brand-700 hover:bg-brand-700 md:bottom-6 md:right-6"
      title="Learning guide"
    >
      <GraduationCap className="h-4 w-4" />
      <span className="hidden sm:inline">{hasProgress ? 'Resume guide' : 'Guide'}</span>
      {percentDone > 0 && percentDone < 100 && (
        <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">{percentDone}%</span>
      )}
    </button>
  )
}
