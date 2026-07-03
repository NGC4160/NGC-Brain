import { useApp } from '@/context/AppContext'
import { kpiDefinitions } from '@/config/app.config'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { ResourceCard } from '@/components/resources/ResourceCard'
import { SUBMISSION_TYPE_LABELS, JOB_STATUS_LABELS } from '@/types'
import { formatRelativeDate } from '@/lib/utils'
import { Link } from 'react-router-dom'
import type { DateRangePreset } from '@/types'

const DATE_RANGE_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
]

export function DashboardPage() {
  const {
    kpis,
    dateRange,
    setDateRange,
    jobs,
    submissions,
    pinnedResources,
    toggleResourcePin,
  } = useApp()

  const activeJobs = jobs.filter((j) => !['picked-up', 'ready'].includes(j.status))

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Shop overview — KPIs, activity, and quick links
          </p>
        </div>
        <div className="flex rounded-lg border border-slate-200 p-1 dark:border-slate-700">
          {DATE_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDateRange(opt.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                dateRange === opt.value
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          Key Metrics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpiDefinitions.map((def) => {
            const data = kpis.find((k) => k.id === def.id)!
            return (
              <KpiCard
                key={def.id}
                definition={def}
                data={data}
                onClick={() => {
                  if (def.id === 'active-jobs' || def.id === 'customer-waitlist') {
                    window.location.hash = ''
                  }
                }}
              />
            )
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Revenue Trend
          </h2>
          <RevenueChart jobs={jobs} />
        </section>

        <section className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Active Jobs
            </h2>
            <Link
              to="/jobs"
              className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              View all →
            </Link>
          </div>
          {activeJobs.length === 0 ? (
            <p className="text-sm text-slate-400">No active jobs right now.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeJobs.slice(0, 5).map((job) => (
                <li key={job.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {job.id} — {job.customerName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {job.make} {job.model} · {job.assignedTech ?? 'Unassigned'}
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-400">
                    {JOB_STATUS_LABELS[job.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {pinnedResources.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Pinned Manuals & Files
            </h2>
            <Link
              to="/resources"
              className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Browse all →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pinnedResources.slice(0, 6).map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onTogglePin={toggleResourcePin}
                compact
              />
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Recent Agent Activity
          </h2>
          <Link
            to="/agent-input"
            className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            Log update →
          </Link>
        </div>
        {submissions.length === 0 ? (
          <p className="text-sm text-slate-400">
            No submissions yet. Use Agent Input to log repairs and shop updates.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {submissions.slice(0, 8).map((sub) => (
              <li key={sub.id} className="flex items-start justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {SUBMISSION_TYPE_LABELS[sub.type]}
                    {sub.jobId && (
                      <span className="ml-2 text-slate-500">· {sub.jobId}</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {sub.submittedBy} · {formatRelativeDate(sub.submittedAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
