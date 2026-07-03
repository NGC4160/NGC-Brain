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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Repair Jobs
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {jobs.length} total jobs · {filtered.length} shown
          </p>
        </div>
        <select
          className="input-field w-auto"
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

      <div className="card overflow-x-auto p-0">
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
