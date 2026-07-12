import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Play,
  RotateCcw,
} from 'lucide-react'
import { useAuthContext } from '@/context/AuthContext'
import {
  checklistProgress,
  completeSopRun,
  getSop,
  getSopRun,
  listAllSops,
  resetSopRun,
  saveSopRun,
  sopsForRole,
  startOrResumeRun,
  toggleRunItem,
} from '@/sops/registry'
import type { SopDefinition, SopRuntime } from '@/sops/types'
import { ROLE_LABELS } from '@/config/staff'

const RUNTIME_LABELS: Record<SopRuntime, string> = {
  module: 'Live module',
  checklist: 'Checklist',
  policy: 'Policy',
  reference: 'Reference',
}

export function SopsHubPage() {
  const { session } = useAuthContext()
  const role = session?.role ?? null
  const sops = useMemo(() => sopsForRole(role, { status: ['active', 'draft'] }), [role])
  const allCount = listAllSops().length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
          <BookOpen className="h-6 w-6 text-brand-600" />
          Shop SOPs
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Operating procedures on file ({sops.length} for your role · {allCount} total). Open a live
          module or run a checklist — new SOPs added to the registry appear here automatically.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sops.map((sop) => (
          <SopCard key={sop.id} sop={sop} />
        ))}
      </div>

      {sops.length === 0 && (
        <div className="card py-10 text-center text-sm text-slate-400">
          No SOPs available for this role.
        </div>
      )}

      <div className="card text-sm text-slate-600 dark:text-slate-300">
        <p className="font-medium text-slate-900 dark:text-white">Adding future SOPs</p>
        <p className="mt-1">
          Drop a definition into <code className="text-xs">src/sops/catalog/</code> (or save a custom
          SOP from Settings) following <code className="text-xs">docs/ADDING_SOPS.md</code>. Checklist
          SOPs become runnable immediately; module SOPs link to their DMS screen.
        </p>
      </div>
    </div>
  )
}

function SopCard({ sop }: { sop: SopDefinition }) {
  const run = getSopRun(sop.id)
  const progress =
    sop.runtime === 'checklist' ? checklistProgress(sop, run) : null

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
        Owners:{' '}
        {sop.ownerRoles.map((r) => ROLE_LABELS[r]).join(', ')}
        {sop.lastVerified ? ` · verified ${sop.lastVerified}` : ''}
      </p>
      {progress && progress.total > 0 && (
        <p className="text-xs text-slate-500">
          Checklist {progress.requiredDone}/{progress.requiredTotal} required
          {run?.completedAt ? ' · completed' : ''}
        </p>
      )}
      <div className="mt-auto flex flex-wrap gap-2">
        {sop.runtime === 'module' && sop.modulePath && (
          <Link to={sop.modulePath} className="btn-primary py-2 text-xs">
            <Play className="h-3.5 w-3.5" /> Open workflow
          </Link>
        )}
        {(sop.runtime === 'checklist' || sop.runtime === 'reference' || sop.runtime === 'policy') && (
          <Link to={`/sops/${sop.id}`} className="btn-primary py-2 text-xs">
            <ClipboardList className="h-3.5 w-3.5" />
            {sop.runtime === 'checklist' ? 'Run checklist' : 'View SOP'}
          </Link>
        )}
        {sop.relatedSopIds && sop.relatedSopIds.length > 0 && (
          <span className="self-center text-[11px] text-slate-400">
            {sop.relatedSopIds.length} related
          </span>
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

  if (session && !sop.accessRoles.includes(session.role)) {
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
            <span key={t} className="rounded-full bg-ngc-50 px-2 py-0.5 text-ngc-700 dark:bg-ngc-950 dark:text-ngc-200">
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

      {sop.modulePath && sop.runtime !== 'module' && sop.runtime !== 'policy' && !sop.modulePath.startsWith('/sops/') && (
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
                  <p className="mt-1 whitespace-pre-wrap text-slate-600 dark:text-slate-300">{script.text}</p>
                  <button
                    type="button"
                    className="btn-secondary mt-2 py-1.5 text-xs"
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
              Checklist ({progress.requiredDone}/{progress.requiredTotal} required)
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-secondary py-2 text-xs"
                onClick={() => {
                  ensureRun()
                }}
              >
                <Play className="h-3.5 w-3.5" /> Start / resume
              </button>
              <button
                type="button"
                className="btn-secondary py-2 text-xs"
                onClick={() => {
                  if (!session) return
                  resetSopRun(sop.id, session.name)
                  setRun(getSopRun(sop.id))
                  setNotes('')
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            </div>
          </div>
          <ul className="space-y-2">
            {sop.checklist.map((item) => (
              <li key={item.id}>
                <label className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={Boolean(run?.checked[item.id])}
                    onChange={(e) => {
                      ensureRun()
                      toggleRunItem(sop.id, item.id, e.target.checked)
                      setRun(getSopRun(sop.id))
                    }}
                  />
                  <span>
                    {item.label}
                    {item.required !== false ? ' *' : ''}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div>
            <label className="label" htmlFor="sopNotes">Notes</label>
            <textarea
              id="sopNotes"
              className="input-field"
              rows={3}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value)
                const current = ensureRun()
                if (current) {
                  saveSopRun({ ...current, notes: e.target.value })
                  setRun(getSopRun(sop.id))
                }
              }}
            />
          </div>
          <button
            type="button"
            className="btn-primary"
            disabled={progress.requiredDone < progress.requiredTotal}
            onClick={() => {
              completeSopRun(sop.id)
              setRun(getSopRun(sop.id))
            }}
          >
            <CheckCircle2 className="h-4 w-4" /> Mark SOP complete
          </button>
          {run?.completedAt && (
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              Completed {new Date(run.completedAt).toLocaleString()} by {run.runBy}
            </p>
          )}
        </section>
      )}

      {sop.relatedSopIds && sop.relatedSopIds.length > 0 && (
        <section className="card space-y-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Related SOPs</h2>
          <ul className="space-y-1">
            {sop.relatedSopIds.map((id) => {
              const related = getSop(id)
              if (!related) return null
              return (
                <li key={id}>
                  <Link
                    to={related.runtime === 'module' && related.modulePath ? related.modulePath : `/sops/${id}`}
                    className="flex items-center gap-1 text-sm text-brand-600 hover:underline"
                  >
                    {related.title}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {sop.sourceDoc && (
        <p className="text-xs text-slate-400">Source: {sop.sourceDoc}</p>
      )}
    </div>
  )
}
