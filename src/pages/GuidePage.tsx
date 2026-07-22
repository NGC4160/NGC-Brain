import { CheckCircle2, Circle, GraduationCap, Play, RotateCcw } from 'lucide-react'
import { useGuide } from '@/context/GuideContext'
import { cn } from '@/lib/utils'

export function GuidePage() {
  const {
    steps,
    chapters,
    progress,
    percentDone,
    start,
    resume,
    restart,
    goTo,
    isComplete,
  } = useGuide()

  const hasProgress = progress.completedIds.length > 0

  return (
    <div className="space-y-6" data-guide="guide-welcome">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
          <GraduationCap className="h-6 w-6 text-brand-600" />
          Learning Guide
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Walk through every dashboard feature step by step. Progress is saved on this phone or
          computer.
        </p>
      </div>

      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {percentDone}% complete
            </p>
            <p className="text-xs text-slate-500">
              {progress.completedIds.length} of {steps.length} steps
              {progress.finishedAt ? ' · finished' : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => (hasProgress && !progress.finishedAt ? resume() : start())}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Play className="h-4 w-4" />
              {hasProgress && !progress.finishedAt ? 'Resume tour' : 'Start tour'}
            </button>
            {hasProgress && (
              <button
                type="button"
                onClick={restart}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                <RotateCcw className="h-4 w-4" />
                Restart
              </button>
            )}
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${percentDone}%` }}
          />
        </div>
      </div>

      <div className="space-y-6">
        {chapters.map((chapter) => {
          const chapterSteps = steps.filter((s) => s.chapter === chapter)
          return (
            <section key={chapter} className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {chapter}
              </h2>
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-ngc-200 bg-white dark:divide-slate-800 dark:border-ngc-800 dark:bg-slate-900">
                {chapterSteps.map((s) => {
                  const done = isComplete(s.id)
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => {
                          goTo(s.id)
                        }}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-ngc-50 dark:hover:bg-ngc-950"
                      >
                        {done ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                        ) : (
                          <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              'block text-sm font-medium',
                              done
                                ? 'text-slate-500 dark:text-slate-400'
                                : 'text-slate-900 dark:text-white',
                            )}
                          >
                            {s.title}
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">
                            {s.body}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
