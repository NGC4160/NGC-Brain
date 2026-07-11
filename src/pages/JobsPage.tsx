import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { JOB_PRIORITY_LABELS, JOB_STATUS_LABELS } from '@/types'
import { formatCurrency } from '@/lib/utils'

export function JobsPage() {
  const { jobs } = useApp()
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered =
    statusFilter === 'all'
      ? jobs
      : jobs.filter((j) => j.status === statusFilter)

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
            Repair Jobs
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {jobs.length} total · {filtered.length} shown
          </p>
        </div>
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
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {sorted.map((job) => (
          <article key={job.id} className="card space-y-2">
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
            {job.issueDescription && (
              <p className="line-clamp-2 text-sm text-slate-500">{job.issueDescription}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-2 text-xs text-slate-500 dark:border-slate-800">
              <span>{JOB_PRIORITY_LABELS[job.priority]}</span>
              <span>{job.assignedTech ?? 'Unassigned'}</span>
              <span className="ml-auto font-medium text-slate-700 dark:text-slate-200">
                {job.estimatedRevenue ? formatCurrency(job.estimatedRevenue) : '—'}
              </span>
            </div>
          </article>
        ))}
        {sorted.length === 0 && (
          <p className="card py-8 text-center text-sm text-slate-400">No jobs match this filter.</p>
        )}
      </div>

      {/* Desktop table */}
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
              <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
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
    </div>
  )
}
