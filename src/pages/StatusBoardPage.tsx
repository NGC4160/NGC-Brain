import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Plus } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useAuthContext } from '@/context/AuthContext'
import { WorkOrderForm } from '@/components/jobs/WorkOrderForm'
import { filterJobsForSession } from '@/lib/jobAccess'
import {
  JOB_PRIORITY_LABELS,
  JOB_STATUS_LABELS,
  type JobStatus,
  type RepairJob,
} from '@/types'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

const BOARD_COLUMNS: JobStatus[] = [
  'received',
  'diagnosing',
  'waiting-parts',
  'in-repair',
  'qa',
  'ready',
]

export function StatusBoardPage() {
  const { jobs, createJob, updateJob, writeMode } = useApp()
  const { session, canAssignJobs, isTechnician, techNames } = useAuthContext()
  const visibleJobs = useMemo(
    () => filterJobsForSession(jobs, session),
    [jobs, session],
  )
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState<RepairJob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const columns = useMemo(() => {
    const map = Object.fromEntries(BOARD_COLUMNS.map((s) => [s, [] as RepairJob[]])) as Record<
      JobStatus,
      RepairJob[]
    >
    for (const job of visibleJobs) {
      if (BOARD_COLUMNS.includes(job.status)) map[job.status].push(job)
    }
    for (const status of BOARD_COLUMNS) {
      map[status].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    }
    return map
  }, [visibleJobs])

  async function moveJob(job: RepairJob, status: JobStatus) {
    setError(null)
    try {
      await updateJob(job.id, { status })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update status')
    }
  }

  async function assignJob(job: RepairJob, tech: string) {
    setError(null)
    try {
      await updateJob(job.id, {
        assignedTech: tech === 'Unassigned' ? '' : tech,
      } as Partial<RepairJob>)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not assign tech')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
            Shop Status Board
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isTechnician
              ? `Your assigned carts - ${session?.name}`
              : canAssignJobs
                ? 'Assign technicians, then move carts through the shop'
                : 'Move carts through the shop'}
            {' · '}
            {writeMode === 'api' ? 'SQLite API' : 'this device'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/jobs" className="btn-secondary">
            List view
          </Link>
          {!isTechnician && (
            <button type="button" className="btn-primary" onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4" />
              New job
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {BOARD_COLUMNS.map((status) => (
          <section
            key={status}
            className="w-[min(18rem,85vw)] shrink-0 rounded-xl border border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40"
          >
            <header className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {JOB_STATUS_LABELS[status]}
              </h2>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-950">
                {columns[status].length}
              </span>
            </header>
            <ul className="space-y-2 p-2">
              {columns[status].map((job) => (
                <li
                  key={job.id}
                  className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950"
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setEditing(job)}
                  >
                    <p className="font-medium text-slate-900 dark:text-white">{job.customerName}</p>
                    <p className="text-xs text-slate-500">
                      {job.make} {job.model}
                      {job.year ? ` · ${job.year}` : ''}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                      {job.issueDescription}
                    </p>
                  </button>
                  {job.depositMessage && (
                    <p
                      className={cn(
                        'mt-2 rounded px-2 py-1 text-[11px]',
                        job.depositBlocked
                          ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200'
                          : 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-100',
                      )}
                    >
                      {job.depositMessage}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span>{JOB_PRIORITY_LABELS[job.priority]}</span>
                    <span>{job.assignedTech ?? 'Unassigned'}</span>
                    <span className="ml-auto font-medium text-slate-700 dark:text-slate-200">
                      {job.estimatedRevenue ? formatCurrency(job.estimatedRevenue) : '—'}
                    </span>
                  </div>
                  {canAssignJobs && (
                    <label className="mt-2 block text-[11px] font-medium text-slate-500">
                      Assign tech
                      <select
                        className="input-field mt-1 py-2 text-sm"
                        value={job.assignedTech ?? 'Unassigned'}
                        onChange={(e) => void assignJob(job, e.target.value)}
                      >
                        <option value="Unassigned">Unassigned</option>
                        {techNames.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className="mt-2 block text-[11px] font-medium text-slate-500">
                    Move to
                    <select
                      className="input-field mt-1 py-2 text-sm"
                      value={job.status}
                      onChange={(e) => void moveJob(job, e.target.value as JobStatus)}
                    >
                      {BOARD_COLUMNS.map((s) => (
                        <option key={s} value={s}>
                          {JOB_STATUS_LABELS[s]}
                        </option>
                      ))}
                      <option value="picked-up">{JOB_STATUS_LABELS['picked-up']}</option>
                    </select>
                  </label>
                  {['in-repair', 'qa', 'ready'].includes(job.status) && (
                    <Link
                      to={`/qc/${encodeURIComponent(job.id)}`}
                      className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline"
                    >
                      Open QC form
                    </Link>
                  )}
                </li>
              ))}
              {columns[status].length === 0 && (
                <li className="px-2 py-6 text-center text-xs text-slate-400">Empty</li>
              )}
            </ul>
          </section>
        ))}
      </div>

      {(showNew || editing) && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4"
          data-no-pull-refresh
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl dark:bg-slate-900 sm:max-w-2xl sm:rounded-2xl sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
              {editing ? `Edit ${editing.id}` : 'New work order'}
            </h2>
            <WorkOrderForm
              initial={editing ?? undefined}
              submitLabel={editing ? 'Update job' : 'Create job'}
              onCancel={() => {
                setShowNew(false)
                setEditing(null)
              }}
              onSubmit={async (input) => {
                if (editing) {
                  await updateJob(editing.id, input)
                  setEditing(null)
                } else {
                  await createJob(input)
                  setShowNew(false)
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
