import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useAuthContext } from '@/context/AuthContext'
import { WorkOrderForm } from '@/components/jobs/WorkOrderForm'
import { filterJobsForSession } from '@/lib/jobAccess'
import { JOB_PRIORITY_LABELS, JOB_STATUS_LABELS, type RepairJob } from '@/types'
import { formatCurrency } from '@/lib/utils'

export function JobsPage() {
  const { jobs, createJob, updateJob, writeMode } = useApp()
  const { session, canAssignJobs, isTechnician } = useAuthContext()
  const visibleJobs = useMemo(
    () => filterJobsForSession(jobs, session),
    [jobs, session],
  )
  const [statusFilter, setStatusFilter] = useState('all')
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState<RepairJob | null>(null)

  const filtered =
    statusFilter === 'all'
      ? visibleJobs
      : visibleJobs.filter((j) => j.status === statusFilter)

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div data-guide="guide-page-title">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
            Repair Jobs
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isTechnician
              ? `Assigned to you · ${visibleJobs.length} jobs · ${writeMode}`
              : `${visibleJobs.length} total · ${filtered.length} shown · ${writeMode}`}
            {canAssignJobs ? ' · assign techs below' : ''}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            className="input-field sm:w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            {Object.entries(JOB_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <Link to="/board" className="btn-secondary">
            Status board
          </Link>
          {!isTechnician && (
            <button type="button" className="btn-primary" onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4" />
              New job
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {sorted.map((job) => (
          <button
            key={job.id}
            type="button"
            className="card w-full space-y-2 text-left"
            onClick={() => setEditing(job)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white">{job.customerName}</p>
                <p className="text-xs text-slate-500">{job.id}</p>
              </div>
              <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-400">
                {JOB_STATUS_LABELS[job.status]}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {job.make} {job.model}
              {job.year ? ` (${job.year})` : ''}
            </p>
            {job.depositMessage && (
              <p className="text-xs text-amber-700 dark:text-amber-300">{job.depositMessage}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-2 text-xs text-slate-500 dark:border-slate-800">
              <span>{JOB_PRIORITY_LABELS[job.priority]}</span>
              <span>{job.assignedTech ?? 'Unassigned'}</span>
              <span className="ml-auto font-medium text-slate-700 dark:text-slate-200">
                {job.estimatedRevenue ? formatCurrency(job.estimatedRevenue) : '—'}
              </span>
            </div>
          </button>
        ))}
        {sorted.length === 0 && (
          <p className="card py-8 text-center text-sm text-slate-400">No jobs match this filter.</p>
        )}
      </div>

      <div className="card hidden overflow-x-auto p-0 md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="px-5 py-3 font-medium text-slate-500">Job ID</th>
              <th className="px-5 py-3 font-medium text-slate-500">Customer</th>
              <th className="px-5 py-3 font-medium text-slate-500">Cart</th>
              <th className="px-5 py-3 font-medium text-slate-500">Status</th>
              <th className="px-5 py-3 font-medium text-slate-500">Priority</th>
              <th className="px-5 py-3 font-medium text-slate-500">Tech</th>
              <th className="px-5 py-3 font-medium text-slate-500">Est. Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sorted.map((job) => (
              <tr
                key={job.id}
                className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50"
                onClick={() => setEditing(job)}
              >
                <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                  {job.id}
                </td>
                <td className="px-5 py-3">{job.customerName}</td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                  {job.make} {job.model}
                  {job.year ? ` (${job.year})` : ''}
                </td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-400">
                    {JOB_STATUS_LABELS[job.status]}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-600">{JOB_PRIORITY_LABELS[job.priority]}</td>
                <td className="px-5 py-3 text-slate-600">{job.assignedTech ?? '—'}</td>
                <td className="px-5 py-3">
                  {job.estimatedRevenue ? formatCurrency(job.estimatedRevenue) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-slate-400">
            No jobs match this filter.
          </p>
        )}
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
