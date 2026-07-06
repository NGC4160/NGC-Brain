import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { generateId } from '@/lib/utils'
import {
  JOB_PRIORITY_LABELS,
  JOB_STATUS_LABELS,
  SUBMISSION_TYPE_LABELS,
  type JobPriority,
  type JobStatus,
  type SubmissionType,
  type AgentSubmission,
  type RepairJob,
} from '@/types'
import { CheckCircle2 } from 'lucide-react'

const TECHS = ['Mike T.', 'Carlos R.', 'Front Desk']
const MAKES = ['Club Car', 'EZGO', 'Yamaha', 'Other']

type FormTab = SubmissionType

const TABS: { id: FormTab; label: string }[] = [
  { id: 'repair-intake', label: 'Repair Intake' },
  { id: 'status-update', label: 'Status Update' },
  { id: 'parts-used', label: 'Parts Used' },
  { id: 'time-log', label: 'Time Log' },
  { id: 'quick-note', label: 'Quick Note' },
]

export function AgentInputPage() {
  const { jobs, addJob, updateJob, addSubmission, hcpConnected } = useApp()
  const [activeTab, setActiveTab] = useState<FormTab>('repair-intake')
  const [submittedBy, setSubmittedBy] = useState('Mike T.')
  const [success, setSuccess] = useState<string | null>(null)

  const openJobs = jobs.filter((j) => j.status !== 'picked-up')

  function showSuccess(msg: string) {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 4000)
  }

  function handleIntake(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const jobNum = 1047 + Math.floor(Math.random() * 100)
    const jobId = `JOB-${jobNum}`

    const job = {
      id: jobId,
      customerName: fd.get('customerName') as string,
      make: fd.get('make') as string,
      model: fd.get('model') as string,
      year: fd.get('year') ? Number(fd.get('year')) : undefined,
      serialVin: (fd.get('serialVin') as string) || undefined,
      issueDescription: fd.get('issueDescription') as string,
      priority: fd.get('priority') as JobPriority,
      assignedTech: (fd.get('assignedTech') as string) || undefined,
      status: 'received' as JobStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addJob(job)
    addSubmission({
      id: generateId('sub'),
      type: 'repair-intake',
      submittedBy,
      submittedAt: new Date().toISOString(),
      jobId,
      payload: job as unknown as Record<string, unknown>,
    })
    e.currentTarget.reset()
    showSuccess(`Repair intake logged — ${jobId}`)
  }

  function handleStatusUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const jobId = fd.get('jobId') as string
    const status = fd.get('status') as JobStatus
    const notes = fd.get('notes') as string

    const updates: Partial<RepairJob> = { status }
    if (status === 'picked-up') {
      updates.completedAt = new Date().toISOString()
    }

    updateJob(jobId, updates)
    addSubmission({
      id: generateId('sub'),
      type: 'status-update',
      submittedBy,
      submittedAt: new Date().toISOString(),
      jobId,
      payload: { jobId, status, notes },
    })
    e.currentTarget.reset()
    showSuccess(`Status updated to ${JOB_STATUS_LABELS[status]}`)
  }

  function handlePartsUsed(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const jobId = fd.get('jobId') as string
    const cost = Number(fd.get('cost'))
    const quantity = Number(fd.get('quantity'))

    const job = jobs.find((j) => j.id === jobId)
    if (job) {
      updateJob(jobId, {
        partsCost: (job.partsCost ?? 0) + cost * quantity,
      })
    }

    addSubmission({
      id: generateId('sub'),
      type: 'parts-used',
      submittedBy,
      submittedAt: new Date().toISOString(),
      jobId,
      payload: {
        jobId,
        partName: fd.get('partName'),
        sku: fd.get('sku'),
        quantity,
        cost,
      },
    })
    e.currentTarget.reset()
    showSuccess('Parts usage logged')
  }

  function handleTimeLog(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const jobId = fd.get('jobId') as string
    const hours = Number(fd.get('hours'))

    const job = jobs.find((j) => j.id === jobId)
    if (job) {
      updateJob(jobId, { laborHours: (job.laborHours ?? 0) + hours })
    }

    addSubmission({
      id: generateId('sub'),
      type: 'time-log',
      submittedBy,
      submittedAt: new Date().toISOString(),
      jobId,
      payload: {
        jobId,
        techName: fd.get('techName'),
        hours,
        taskDescription: fd.get('taskDescription'),
      },
    })
    e.currentTarget.reset()
    showSuccess('Time log recorded')
  }

  function handleQuickNote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const jobId = (fd.get('jobId') as string) || undefined

    addSubmission({
      id: generateId('sub'),
      type: 'quick-note',
      submittedBy,
      submittedAt: new Date().toISOString(),
      jobId,
      payload: { jobId, note: fd.get('note') },
    })
    e.currentTarget.reset()
    showSuccess('Note saved')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Agent Input
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Log repairs, status changes, parts, time, and shop notes
        </p>
      </div>

      {hcpConnected && (
        <div className="rounded-lg border border-ngc-200 bg-ngc-50 px-4 py-3 text-sm text-ngc-700 dark:border-ngc-800 dark:bg-ngc-950 dark:text-ngc-200">
          Jobs are synced from <strong>Housecall Pro</strong>. Create or update repair orders in
          HCP. Notes and time logs here are saved locally on this device.
        </div>
      )}

      <div className="card">
        <label className="label" htmlFor="submittedBy">
          Submitting as
        </label>
        <select
          id="submittedBy"
          className="input-field max-w-xs"
          value={submittedBy}
          onChange={(e) => setSubmittedBy(e.target.value)}
        >
          {TECHS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1 dark:border-slate-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'border-b-2 border-brand-600 text-brand-700 dark:text-brand-400'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card">
        {activeTab === 'repair-intake' && (
          <form onSubmit={handleIntake} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="customerName">
                Customer Name *
              </label>
              <input id="customerName" name="customerName" required className="input-field" />
            </div>
            <div>
              <label className="label" htmlFor="make">
                Make *
              </label>
              <select id="make" name="make" required className="input-field">
                {MAKES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="model">
                Model *
              </label>
              <input id="model" name="model" required className="input-field" />
            </div>
            <div>
              <label className="label" htmlFor="year">
                Year
              </label>
              <input id="year" name="year" type="number" min="1990" max="2030" className="input-field" />
            </div>
            <div>
              <label className="label" htmlFor="serialVin">
                Serial / VIN
              </label>
              <input id="serialVin" name="serialVin" className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="issueDescription">
                Issue Description *
              </label>
              <textarea
                id="issueDescription"
                name="issueDescription"
                required
                rows={3}
                className="input-field"
              />
            </div>
            <div>
              <label className="label" htmlFor="priority">
                Priority
              </label>
              <select id="priority" name="priority" defaultValue="normal" className="input-field">
                {Object.entries(JOB_PRIORITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="assignedTech">
                Assigned Tech
              </label>
              <select id="assignedTech" name="assignedTech" className="input-field">
                <option value="">Unassigned</option>
                {TECHS.filter((t) => t !== 'Front Desk').map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary">
                Submit Repair Intake
              </button>
            </div>
          </form>
        )}

        {activeTab === 'status-update' && (
          <form onSubmit={handleStatusUpdate} className="grid max-w-lg gap-4">
            <div>
              <label className="label" htmlFor="jobId">
                Job ID *
              </label>
              <select id="jobId" name="jobId" required className="input-field">
                <option value="">Select job…</option>
                {openJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.id} — {j.customerName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="status">
                New Status *
              </label>
              <select id="status" name="status" required className="input-field">
                {Object.entries(JOB_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="notes">
                Notes
              </label>
              <textarea id="notes" name="notes" rows={3} className="input-field" />
            </div>
            <button type="submit" className="btn-primary w-fit">
              Update Status
            </button>
          </form>
        )}

        {activeTab === 'parts-used' && (
          <form onSubmit={handlePartsUsed} className="grid max-w-lg gap-4">
            <div>
              <label className="label" htmlFor="jobId">
                Job ID *
              </label>
              <select id="jobId" name="jobId" required className="input-field">
                <option value="">Select job…</option>
                {openJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.id} — {j.customerName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="partName">
                Part Name *
              </label>
              <input id="partName" name="partName" required className="input-field" />
            </div>
            <div>
              <label className="label" htmlFor="sku">
                SKU
              </label>
              <input id="sku" name="sku" className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="quantity">
                  Quantity *
                </label>
                <input id="quantity" name="quantity" type="number" min="1" defaultValue="1" required className="input-field" />
              </div>
              <div>
                <label className="label" htmlFor="cost">
                  Unit Cost ($) *
                </label>
                <input id="cost" name="cost" type="number" min="0" step="0.01" required className="input-field" />
              </div>
            </div>
            <button type="submit" className="btn-primary w-fit">
              Log Parts
            </button>
          </form>
        )}

        {activeTab === 'time-log' && (
          <form onSubmit={handleTimeLog} className="grid max-w-lg gap-4">
            <div>
              <label className="label" htmlFor="jobId">
                Job ID *
              </label>
              <select id="jobId" name="jobId" required className="input-field">
                <option value="">Select job…</option>
                {openJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.id} — {j.customerName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="techName">
                Tech Name *
              </label>
              <select id="techName" name="techName" required defaultValue={submittedBy} className="input-field">
                {TECHS.filter((t) => t !== 'Front Desk').map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="hours">
                Hours *
              </label>
              <input id="hours" name="hours" type="number" min="0.25" step="0.25" required className="input-field" />
            </div>
            <div>
              <label className="label" htmlFor="taskDescription">
                Task Description *
              </label>
              <textarea id="taskDescription" name="taskDescription" required rows={2} className="input-field" />
            </div>
            <button type="submit" className="btn-primary w-fit">
              Log Time
            </button>
          </form>
        )}

        {activeTab === 'quick-note' && (
          <form onSubmit={handleQuickNote} className="grid max-w-lg gap-4">
            <div>
              <label className="label" htmlFor="jobId">
                Job ID (optional)
              </label>
              <select id="jobId" name="jobId" className="input-field">
                <option value="">General shop note</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.id} — {j.customerName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="note">
                Note *
              </label>
              <textarea id="note" name="note" required rows={4} className="input-field" placeholder="What happened? Any follow-ups needed?" />
            </div>
            <button type="submit" className="btn-primary w-fit">
              Save Note
            </button>
          </form>
        )}
      </div>

      <RecentSubmissions />
    </div>
  )
}

function RecentSubmissions() {
  const { submissions } = useApp()

  if (submissions.length === 0) return null

  return (
    <section className="card">
      <h2 className="mb-4 text-lg font-semibold">Your Recent Submissions</h2>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {submissions.slice(0, 10).map((sub: AgentSubmission) => (
          <li key={sub.id} className="py-3 text-sm">
            <span className="font-medium">{SUBMISSION_TYPE_LABELS[sub.type]}</span>
            {sub.jobId && <span className="text-slate-500"> · {sub.jobId}</span>}
            <span className="block text-xs text-slate-400">
              {sub.submittedBy} · {new Date(sub.submittedAt).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
