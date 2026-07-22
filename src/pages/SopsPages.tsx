import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Play,
  RotateCcw,
} from 'lucide-react'
import { useAuthContext } from '@/context/AuthContext'
import { hasFullSopLibrary, ROLE_LABELS } from '@/config/staff'
import {
  checklistProgress,
  completeSopRun,
  getSop,
  getSopRun,
  groupSopsBySection,
  listAllSops,
  resetSopRun,
  saveSopRun,
  sopsForRole,
  startOrResumeRun,
  toggleRunItem,
} from '@/sops/registry'
import type { SopDefinition, SopRuntime } from '@/sops/types'

const RUNTIME_LABELS: Record<SopRuntime, string> = {
  module: 'Live module',
  checklist: 'Checklist',
  policy: 'Policy',
  reference: 'Reference',
}

export function SopsHubPage() {
  const { session } = useAuthContext()
  const role = session?.role ?? null
  const fullLibrary = hasFullSopLibrary(role)
  const sops = useMemo(() => sopsForRole(role, { status: ['active', 'draft'] }), [role])
  const sections = useMemo(() => groupSopsBySection(sops), [sops])
  const allCount = listAllSops().length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white sm:text-2xl" data-guide="guide-page-title">
          <BookOpen className="h-6 w-6 text-brand-600" />
          Shop SOPs
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {fullLibrary
            ? `Full procedure library for ${session?.name ?? 'management'} — read any SOP anytime (${sops.length} on file).`
            : `Procedures for your role (${sops.length} shown · ${allCount} on file).`}
        </p>
      </div>

      {fullLibrary && (
        <div className="rounded-xl border border-ngc-200 bg-ngc-50/80 px-4 py-3 text-sm text-ngc-900 dark:border-ngc-800 dark:bg-ngc-950/50 dark:text-ngc-100">
          <p className="font-medium">Ryan & Christine — always-on SOP library</p>
          <p className="mt-1 text-ngc-800/90 dark:text-ngc-200/90">
            Office, shop floor, driver, and shared procedures are listed below. Open a live workflow
            or read the full steps whenever you need them.
          </p>
        </div>
      )}

      {sections.map((group) => (
        <section key={group.section} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {group.label}
            <span className="ml-2 font-normal normal-case text-slate-400">
              ({group.sops.length})
            </span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {group.sops.map((sop) => (
              <SopCard key={sop.id} sop={sop} />
            ))}
          </div>
        </section>
      ))}

      {sops.length === 0 && (
        <div className="card py-10 text-center text-sm text-slate-400">
          No SOPs available for this role.
        </div>
      )}

      <div className="card text-sm text-slate-600 dark:text-slate-300">
        <p className="font-medium text-slate-900 dark:text-white">Who sees what</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Office & service manager — full library (read anytime)</li>
          <li>Technicians — QC, shop workflow & whiteboard</li>
          <li>Drivers — zones, route checklist, board / workflow context</li>
        </ul>
      </div>
    </div>
  )
}

function SopCard({ sop }: { sop: SopDefinition }) {
  const { canAccessModule } = useAuthContext()
  const run = getSopRun(sop.id)
  const progress = sop.runtime === 'checklist' ? checklistProgress(sop, run) : null
  const pathModule = sop.modulePath?.replace(/^\//, '').split('/')[0] ?? ''
  const canOpenModule =
    Boolean(sop.modulePath) && (pathModule === 'sops' || canAccessModule(pathModule))

  return (
    <article className="card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white">{sop.title}</h2>
          <p className="mt-1 text-xs text-slate-500">{sop.description}</p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {RUNTIME_LABELS[sop.runtime]}
        </span>
      </div>
      <p className="text-[11px] text-slate-400">
        Owners: {sop.ownerRoles.map((r) => ROLE_LABELS[r]).join(', ')}
        {sop.lastVerified ? ` · verified ${sop.lastVerified}` : ''}
      </p>
      {progress && progress.total > 0 && (
        <p className="text-xs text-slate-500">
          Checklist {progress.requiredDone}/{progress.requiredTotal} required
          {run?.completedAt ? ' · completed' : ''}
        </p>
      )}
      <div className="mt-auto flex flex-wrap gap-2">
        {sop.runtime === 'module' && sop.modulePath && canOpenModule && (
          <Link to={sop.modulePath} className="btn-primary py-2 text-xs">
            <Play className="h-3.5 w-3.5" /> Open workflow
          </Link>
        )}
        {(sop.runtime === 'checklist' ||
          sop.runtime === 'reference' ||
          sop.runtime === 'policy' ||
          sop.runtime === 'module') && (
          <Link
            to={`/sops/${sop.id}`}
            className={
              sop.runtime === 'module' && canOpenModule ? 'btn-secondary py-2 text-xs' : 'btn-primary py-2 text-xs'
            }
          >
            <ClipboardList className="h-3.5 w-3.5" />
            {sop.runtime === 'checklist' ? 'Run checklist' : 'Read SOP'}
          </Link>
        )}
      </div>
    </article>
  )
}

export function SopDetailPage() {
  const { sopId } = useParams()
  const navigate = useNavigate()
  const { session } = useAuthContext()
  const sop = sopId ? getSop(sopId) : undefined
  const [run, setRun] = useState(() => (sopId ? getSopRun(sopId) : null))
  const [notes, setNotes] = useState(run?.notes ?? '')

  useEffect(() => {
    if (!sopId) return
    setRun(getSopRun(sopId))
  }, [sopId])

  if (!sop) {
    return (
      <div className="card space-y-3">
        <p className="text-sm text-slate-600">SOP not found.</p>
        <Link to="/sops" className="btn-secondary">
          Back to SOPs
        </Link>
      </div>
    )
  }

  const canRead =
    session &&
    (hasFullSopLibrary(session.role) || sop.accessRoles.includes(session.role))

  if (session && !canRead) {
    return (
      <div className="card text-sm text-slate-600">
        Your role does not have access to this SOP.
      </div>
    )
  }

  const progress = checklistProgress(sop, run)

  function ensureRun() {
    if (!session) return null
    const next = startOrResumeRun(sop!.id, session.name)
    setRun(next)
    return next
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <button
        type="button"
        className="text-sm text-brand-600 hover:underline"
        onClick={() => navigate('/sops')}
      >
        ← All SOPs
      </button>

      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">{sop.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{sop.description}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
            {RUNTIME_LABELS[sop.runtime]}
          </span>
          {sop.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-ngc-50 px-2 py-0.5 text-ngc-700 dark:bg-ngc-950 dark:text-ngc-200"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {sop.modulePath && sop.runtime === 'module' && (
        <Link to={sop.modulePath} className="btn-primary inline-flex">
          <Play className="h-4 w-4" /> Open live workflow
        </Link>
      )}

      {sop.modulePath && sop.runtime === 'policy' && (
        <Link to={sop.modulePath} className="btn-secondary inline-flex">
          <ExternalLink className="h-4 w-4" /> Open related DMS screen
        </Link>
      )}

      {sop.modulePath &&
        sop.runtime !== 'module' &&
        sop.runtime !== 'policy' &&
        !sop.modulePath.startsWith('/sops/') && (
          <Link to={sop.modulePath} className="btn-secondary inline-flex">
            <ExternalLink className="h-4 w-4" /> Related screen
          </Link>
        )}

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ngc-700 dark:text-ngc-200">
          Steps
        </h2>
        <ol className="space-y-3">
          {sop.steps.map((step, idx) => (
            <li key={step.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {idx + 1}. {step.title}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{step.summary}</p>
              {step.scripts?.map((script) => (
                <div key={script.id} className="mt-2 rounded bg-slate-50 p-2 text-xs dark:bg-slate-950">
                  <p className="font-medium text-slate-700 dark:text-slate-200">{script.label}</p>
                  <p className="mt-1 whitespace-pre-wrap text-slate-600 dark:text-slate-300">
                    {script.text}
                  </p>
                  <button
                    type="button"
                    className="mt-2 text-brand-600 hover:underline"
                    onClick={() => void navigator.clipboard.writeText(script.text)}
                  >
                    Copy script
                  </button>
                </div>
              ))}
            </li>
          ))}
        </ol>
      </section>

      {sop.checklist && sop.checklist.length > 0 && (
        <section className="card space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ngc-700 dark:text-ngc-200">
              Checklist
            </h2>
            <p className="text-xs text-slate-500">
              {progress.requiredDone}/{progress.requiredTotal} required
            </p>
          </div>
          {!run && (
            <button type="button" className="btn-primary" onClick={() => ensureRun()}>
              Start checklist
            </button>
          )}
          {run && (
            <>
              <ul className="space-y-2">
                {sop.checklist.map((item) => (
                  <li key={item.id}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={Boolean(run.checked[item.id])}
                        onChange={(e) => {
                          ensureRun()
                          toggleRunItem(sop.id, item.id, e.target.checked)
                          setRun(getSopRun(sop.id))
                        }}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        {item.label}
                        {item.required === false ? (
                          <span className="ml-1 text-xs text-slate-400">(optional)</span>
                        ) : null}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Notes for this run"
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value)
                  const current = getSopRun(sop.id)
                  if (current) saveSopRun({ ...current, notes: e.target.value })
                }}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={progress.requiredDone < progress.requiredTotal}
                  onClick={() => {
                    completeSopRun(sop.id)
                    setRun(getSopRun(sop.id))
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" /> Mark complete
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    if (!session) return
                    resetSopRun(sop.id, session.name)
                    setNotes('')
                    setRun(getSopRun(sop.id))
                  }}
                >
                  <RotateCcw className="h-4 w-4" /> Reset
                </button>
              </div>
              {run.completedAt && (
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Completed {new Date(run.completedAt).toLocaleString()}
                </p>
              )}
            </>
          )}
        </section>
      )}

      {sop.relatedSopIds && sop.relatedSopIds.length > 0 && (
        <section className="card space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Related</h2>
          <ul className="flex flex-wrap gap-2">
            {sop.relatedSopIds.map((id) => {
              const related = getSop(id)
              if (!related) return null
              return (
                <li key={id}>
                  <Link
                    to={
                      related.runtime === 'module' && related.modulePath
                        ? related.modulePath
                        : `/sops/${id}`
                    }
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {related.shortTitle}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
