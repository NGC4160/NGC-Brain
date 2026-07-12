import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  ClipboardList,
  Copy,
  MessageSquare,
  Phone,
  Plus,
  AlertTriangle,
} from 'lucide-react'
import { useAuthContext } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import {
  DIAGNOSTIC_QUOTE,
  DIAGNOSTIC_TERMS_TEXT,
  FOLLOW_UP_TEXT,
  INITIAL_RESPONSE_TEXT,
  INTAKE_STAGE_LABELS,
  PICKUP_ZONE_LABELS,
  PICKUP_FEE_OUTSIDE,
  photosComplete,
  requiredPhotos,
  type IntakeLead,
  type IntakeLeadSource,
  type IntakeRequestType,
  type IntakeStage,
  type PickupZone,
} from '@/config/intakeSop'
import {
  copyText,
  createIntakeLead,
  estimateQueueLeads,
  leadsNeedingFollowUp,
  listIntakeLeads,
  markCustomerReplied,
  markFollowUpSent,
  markInitialTextSent,
  markOutreachStopped,
  patchIntakeLead,
  waitlistLeads,
} from '@/services/dms/intake'
import { cn } from '@/lib/utils'
import type { WorkOrderInput } from '@/services/dms/workOrders'

const SOURCES: { value: IntakeLeadSource; label: string }[] = [
  { value: 'web-form', label: 'Web form' },
  { value: 'text', label: 'Text' },
  { value: 'phone', label: 'Phone' },
  { value: 'walk-in', label: 'Walk-in' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Other' },
]

const PIPELINE_FILTERS: { id: string; label: string; stages?: IntakeStage[] }[] = [
  { id: 'active', label: 'Active' },
  { id: 'follow-up', label: 'Follow-up due' },
  { id: 'waitlist', label: 'SM waitlist' },
  { id: 'estimates', label: 'Estimate queue' },
  { id: 'all', label: 'All' },
]

function stageBadgeClass(stage: IntakeStage): string {
  if (stage === 'waitlist') return 'bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200'
  if (stage === 'estimate-queue') return 'bg-ngc-100 text-ngc-800 dark:bg-ngc-950 dark:text-ngc-200'
  if (stage === 'closed-no-response') return 'bg-slate-100 text-slate-500'
  if (stage === 'awaiting-reply' || stage === 'follow-up-sent') {
    return 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-100'
  }
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
}

export function CustomerIntakePage() {
  const { session, canAssignJobs, isTechnician } = useAuthContext()
  const { createJob } = useApp()
  const [leads, setLeads] = useState<IntakeLead[]>([])
  const [filter, setFilter] = useState('active')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setLeads(listIntakeLeads())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  function flash(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const followUps = useMemo(() => leadsNeedingFollowUp(leads), [leads])
  const waitlist = useMemo(() => waitlistLeads(leads), [leads])
  const estimates = useMemo(() => estimateQueueLeads(leads), [leads])

  const filtered = useMemo(() => {
    if (filter === 'follow-up') return followUps
    if (filter === 'waitlist') return waitlist
    if (filter === 'estimates') return estimates
    if (filter === 'all') return leads
    return leads.filter((l) => !['closed-no-response', 'converted'].includes(l.stage))
  }, [filter, leads, followUps, waitlist, estimates])

  const selected = leads.find((l) => l.id === selectedId) ?? null

  async function handleCopy(text: string, label: string) {
    try {
      await copyText(text)
      flash(`Copied: ${label}`)
    } catch {
      setError('Could not copy — select and copy manually')
    }
  }

  function saveLead(next: IntakeLead) {
    patchIntakeLead(next.id, next)
    refresh()
    flash('Saved')
  }

  if (isTechnician) {
    return (
      <div className="card text-sm text-slate-600 dark:text-slate-300">
        Customer intake is handled by front desk and the service manager. Use Board / Jobs / QC for
        your assigned carts.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
            <ClipboardList className="h-6 w-6 text-brand-600" />
            Customer Intake
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            SOP workflow — respond fast, collect info & photos, route diagnostics to waitlist and
            estimates to the queue.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4" />
          New lead
        </button>
      </div>

      {(followUps.length > 0 || waitlist.length > 0) && (
        <div className="grid gap-2 sm:grid-cols-2">
          {followUps.length > 0 && (
            <button
              type="button"
              className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-left text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"
              onClick={() => setFilter('follow-up')}
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {followUps.length} lead{followUps.length === 1 ? '' : 's'} due for 24-hour follow-up
            </button>
          )}
          {canAssignJobs && waitlist.length > 0 && (
            <button
              type="button"
              className="flex items-start gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-3 text-left text-sm text-brand-900 dark:border-brand-900 dark:bg-brand-950 dark:text-brand-100"
              onClick={() => setFilter('waitlist')}
            >
              <Phone className="mt-0.5 h-4 w-4 shrink-0" />
              {waitlist.length} on waitlist for scheduling
            </button>
          )}
        </div>
      )}

      {toast && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="scroll-x-tabs">
        {PIPELINE_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              'shrink-0 rounded-lg px-3 py-2 text-sm font-medium',
              filter === f.id
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700',
            )}
          >
            {f.label}
            {f.id === 'follow-up' && followUps.length > 0 ? ` (${followUps.length})` : ''}
            {f.id === 'waitlist' && waitlist.length > 0 ? ` (${waitlist.length})` : ''}
            {f.id === 'estimates' && estimates.length > 0 ? ` (${estimates.length})` : ''}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <ul className="space-y-2">
          {filtered.map((lead) => (
            <li key={lead.id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(lead.id)
                  setShowNew(false)
                }}
                className={cn(
                  'card w-full space-y-1 text-left transition',
                  selectedId === lead.id && 'ring-2 ring-brand-400',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-900 dark:text-white">{lead.customerName}</p>
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', stageBadgeClass(lead.stage))}>
                    {INTAKE_STAGE_LABELS[lead.stage]}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {lead.phone} · {lead.requestType} · {lead.source}
                </p>
                {lead.problemSummary && (
                  <p className="line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                    {lead.problemSummary}
                  </p>
                )}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="card py-8 text-center text-sm text-slate-400">No leads in this view.</li>
          )}
        </ul>

        <div>
          {showNew ? (
            <NewLeadForm
              createdBy={session?.name ?? 'Front Desk'}
              onCancel={() => setShowNew(false)}
              onCreated={(lead) => {
                refresh()
                setShowNew(false)
                setSelectedId(lead.id)
                flash('Lead created — send the initial text now')
              }}
            />
          ) : selected ? (
            <LeadDetail
              lead={selected}
              canSchedule={canAssignJobs}
              onChange={(next) => {
                saveLead(next)
              }}
              onAction={(fn, msg) => {
                const next = fn(selected)
                refresh()
                setSelectedId(next.id)
                flash(msg)
              }}
              onCopy={handleCopy}
              onConvert={async (lead) => {
                try {
                  const input: WorkOrderInput = {
                    customerName: lead.customerName,
                    make: lead.make || 'Other',
                    model: lead.model || 'Golf Cart',
                    year: lead.year,
                    serialVin: lead.serialVin,
                    issueDescription:
                      lead.symptomsOrScope ||
                      lead.problemSummary ||
                      `${lead.requestType} intake`,
                    status: 'received',
                    priority: 'normal',
                    estimatedRevenue: lead.requestType === 'diagnostic' ? DIAGNOSTIC_QUOTE : 0,
                    paidAmount: 0,
                  }
                  const job = await createJob(input)
                  patchIntakeLead(lead.id, {
                    stage: 'converted',
                    linkedJobId: job.id,
                    notes: `${lead.notes}\nConverted to ${job.id}`.trim(),
                  })
                  refresh()
                  flash(`Converted to job ${job.id}`)
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Could not create job')
                }
              }}
            />
          ) : (
            <div className="card py-12 text-center text-sm text-slate-400">
              Select a lead or create a new one to follow the intake SOP.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NewLeadForm({
  createdBy,
  onCancel,
  onCreated,
}: {
  createdBy: string
  onCancel: () => void
  onCreated: (lead: IntakeLead) => void
}) {
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [source, setSource] = useState<IntakeLeadSource>('text')
  const [requestType, setRequestType] = useState<IntakeRequestType>('diagnostic')
  const [problemSummary, setProblemSummary] = useState('')

  return (
    <form
      className="card space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        const lead = createIntakeLead({
          customerName,
          phone,
          email,
          source,
          requestType,
          problemSummary,
          createdBy,
        })
        onCreated(lead)
      }}
    >
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">New lead</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="customerName">Customer name *</label>
          <input id="customerName" required className="input-field" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone *</label>
          <input id="phone" required className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="source">Lead source</label>
          <select id="source" className="input-field" value={source} onChange={(e) => setSource(e.target.value as IntakeLeadSource)}>
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="requestType">Request type</label>
          <select id="requestType" className="input-field" value={requestType} onChange={(e) => setRequestType(e.target.value as IntakeRequestType)}>
            <option value="diagnostic">Diagnostic</option>
            <option value="estimate">Estimate</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="problemSummary">Initial request / problem</label>
          <textarea id="problemSummary" className="input-field" rows={2} value={problemSummary} onChange={(e) => setProblemSummary(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary">Create lead</button>
      </div>
    </form>
  )
}

function LeadDetail({
  lead,
  canSchedule,
  onChange,
  onAction,
  onCopy,
  onConvert,
}: {
  lead: IntakeLead
  canSchedule: boolean
  onChange: (lead: IntakeLead) => void
  onAction: (fn: (l: IntakeLead) => IntakeLead, msg: string) => void
  onCopy: (text: string, label: string) => void
  onConvert: (lead: IntakeLead) => Promise<void>
}) {
  const photoItems = requiredPhotos(lead.requestType)

  return (
    <div className="space-y-4" data-no-pull-refresh>
      <div className="card space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{lead.customerName}</h2>
            <p className="text-sm text-slate-500">{lead.phone}{lead.email ? ` · ${lead.email}` : ''}</p>
          </div>
          <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', stageBadgeClass(lead.stage))}>
            {INTAKE_STAGE_LABELS[lead.stage]}
          </span>
        </div>
      </div>

      {/* Step 1–2 outreach */}
      <section className="card space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ngc-700 dark:text-ngc-200">
          Steps 1–2 · Response
        </h3>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-950">
          <p className="font-medium text-slate-700 dark:text-slate-200">Initial text</p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">{INITIAL_RESPONSE_TEXT}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn-secondary py-2 text-xs" onClick={() => onCopy(INITIAL_RESPONSE_TEXT, 'initial text')}>
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
            {lead.stage === 'new' && (
              <button
                type="button"
                className="btn-primary py-2 text-xs"
                onClick={() => onAction(markInitialTextSent, 'Marked initial text sent — follow up in 24 hours if no reply')}
              >
                <MessageSquare className="h-3.5 w-3.5" /> Mark sent
              </button>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-950">
          <p className="font-medium text-slate-700 dark:text-slate-200">24-hour follow-up</p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">{FOLLOW_UP_TEXT}</p>
          <p className="mt-1 text-xs text-slate-400">
            {lead.followUpDueAt
              ? `Due after ${new Date(lead.followUpDueAt).toLocaleString()}`
              : 'Due 24 hours after initial text'}
            . After this, stop all outreach.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn-secondary py-2 text-xs" onClick={() => onCopy(FOLLOW_UP_TEXT, 'follow-up text')}>
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
            {(lead.stage === 'awaiting-reply' || lead.stage === 'follow-up-sent') && (
              <button
                type="button"
                className="btn-primary py-2 text-xs"
                onClick={() => onAction(markFollowUpSent, 'Follow-up marked sent')}
              >
                Mark follow-up sent
              </button>
            )}
            {lead.stage === 'follow-up-sent' && (
              <button
                type="button"
                className="btn-secondary py-2 text-xs"
                onClick={() => onAction(markOutreachStopped, 'Outreach stopped')}
              >
                Stop outreach
              </button>
            )}
            {['awaiting-reply', 'follow-up-sent', 'new'].includes(lead.stage) && (
              <button
                type="button"
                className="btn-primary py-2 text-xs"
                onClick={() => onAction(markCustomerReplied, 'Customer replied — continue on the phone')}
              >
                <Phone className="h-3.5 w-3.5" /> Customer replied / on call
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Step 3 phone */}
      <section className="card space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ngc-700 dark:text-ngc-200">
          Step 3 · On the phone
        </h3>
        {lead.requestType === 'diagnostic' && (
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-900 dark:bg-brand-950 dark:text-brand-100">
            Quote diagnostic: <strong>${DIAGNOSTIC_QUOTE} plus tax</strong>
          </p>
        )}
        <div>
          <label className="label" htmlFor="problem">Problem / how we can help</label>
          <textarea
            id="problem"
            className="input-field"
            rows={2}
            value={lead.problemSummary}
            onChange={(e) => onChange({ ...lead, problemSummary: e.target.value })}
          />
        </div>
        <div>
          <label className="label" htmlFor="location">Customer location (for pickup & delivery)</label>
          <input
            id="location"
            className="input-field"
            value={lead.locationText ?? ''}
            onChange={(e) => onChange({ ...lead, locationText: e.target.value })}
            placeholder="City / address / landmarks"
          />
        </div>
        <div>
          <label className="label" htmlFor="zone">Pickup & delivery zone</label>
          <select
            id="zone"
            className="input-field"
            value={lead.pickupZone}
            onChange={(e) => onChange({ ...lead, pickupZone: e.target.value as PickupZone })}
          >
            {(Object.keys(PICKUP_ZONE_LABELS) as PickupZone[]).map((z) => (
              <option key={z} value={z}>{PICKUP_ZONE_LABELS[z]}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Free inside 40 miles of North Shore shop or anywhere on the South Shore. ${PICKUP_FEE_OUTSIDE} outside.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={lead.diagnosticQuoted}
            onChange={(e) => onChange({ ...lead, diagnosticQuoted: e.target.checked })}
          />
          Diagnostic fee quoted (${DIAGNOSTIC_QUOTE} + tax)
        </label>
      </section>

      {/* Step 4 info */}
      <section className="card space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ngc-700 dark:text-ngc-200">
          Step 4 · Information collection
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="make">Make</label>
            <input id="make" className="input-field" value={lead.make ?? ''} onChange={(e) => onChange({ ...lead, make: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="model">Model</label>
            <input id="model" className="input-field" value={lead.model ?? ''} onChange={(e) => onChange({ ...lead, model: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="year">Year</label>
            <input id="year" type="number" className="input-field" value={lead.year ?? ''} onChange={(e) => onChange({ ...lead, year: e.target.value ? Number(e.target.value) : undefined })} />
          </div>
          <div>
            <label className="label" htmlFor="serial">Serial / VIN</label>
            <input id="serial" className="input-field" value={lead.serialVin ?? ''} onChange={(e) => onChange({ ...lead, serialVin: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="scope">
              {lead.requestType === 'diagnostic' ? 'Detailed symptoms' : 'Scope of work for estimate'}
            </label>
            <textarea
              id="scope"
              className="input-field"
              rows={3}
              value={lead.symptomsOrScope}
              onChange={(e) => onChange({ ...lead, symptomsOrScope: e.target.value })}
            />
          </div>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => onChange({ ...lead, stage: 'collecting-info' })}
        >
          Mark collecting info
        </button>
      </section>

      {/* Step 5 photos */}
      <section className="card space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ngc-700 dark:text-ngc-200">
          Step 5 · Pictures required
        </h3>
        <p className="text-xs text-slate-500">
          Goal: give the Service Manager detailed photos for an accurate estimate and cart model ID.
        </p>
        <ul className="space-y-2">
          {photoItems.map((item) => (
            <li key={item.key}>
              <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={Boolean(lead.photos[item.key])}
                  onChange={(e) =>
                    onChange({
                      ...lead,
                      photos: { ...lead.photos, [item.key]: e.target.checked },
                    })
                  }
                />
                <span>
                  {item.label}
                  {item.required ? ' *' : ' (optional)'}
                </span>
              </label>
            </li>
          ))}
        </ul>
        <div>
          <label className="label" htmlFor="photoLinks">Photo links / where stored</label>
          <input
            id="photoLinks"
            className="input-field"
            value={lead.photoLinks ?? ''}
            onChange={(e) => onChange({ ...lead, photoLinks: e.target.value })}
            placeholder="Drive folder, text thread, MMS, etc."
          />
        </div>
        <p className={cn('text-xs', photosComplete(lead) ? 'text-emerald-600' : 'text-amber-700')}>
          {photosComplete(lead) ? 'Required photos marked complete' : 'Required photos still missing'}
        </p>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => onChange({ ...lead, stage: 'awaiting-photos' })}
        >
          Mark awaiting photos
        </button>
      </section>

      {/* Step 6 after call */}
      <section className="card space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ngc-700 dark:text-ngc-200">
          Step 6 · After the call
        </h3>
        <div>
          <label className="label" htmlFor="notes">Detailed notes</label>
          <textarea
            id="notes"
            className="input-field"
            rows={4}
            value={lead.notes}
            onChange={(e) => onChange({ ...lead, notes: e.target.value })}
            placeholder="Attach photo notes, quote discussion, customer expectations…"
          />
        </div>

        {lead.requestType === 'diagnostic' && (
          <div className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Diagnostic terms (Office Coordinator)
            </p>
            <pre className="whitespace-pre-wrap rounded bg-slate-50 p-2 text-xs text-slate-600 dark:bg-slate-950 dark:text-slate-300">
              {DIAGNOSTIC_TERMS_TEXT}
            </pre>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-secondary py-2 text-xs" onClick={() => onCopy(DIAGNOSTIC_TERMS_TEXT, 'diagnostic terms')}>
                <Copy className="h-3.5 w-3.5" /> Copy terms
              </button>
              <button
                type="button"
                className="btn-primary py-2 text-xs"
                onClick={() =>
                  onChange({
                    ...lead,
                    stage: 'awaiting-diagnostic-terms',
                    diagnosticTermsSentAt: new Date().toISOString(),
                  })
                }
              >
                Mark terms sent
              </button>
              <button
                type="button"
                className="btn-primary py-2 text-xs"
                onClick={() =>
                  onChange({
                    ...lead,
                    stage: 'waitlist',
                    diagnosticTermsApprovedAt: new Date().toISOString(),
                  })
                }
              >
                Customer approved → Waitlist
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Once diagnostic terms are approved, the lead moves to the Service Manager waitlist for scheduling.
            </p>
          </div>
        )}

        {lead.requestType === 'estimate' && (
          <div className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Estimate routing</p>
            <p className="text-xs text-slate-500">
              Office Coordinator sends most estimates. Leave for Service Manager when they must create it.
            </p>
            <select
              className="input-field"
              value={lead.estimateOwner}
              onChange={(e) =>
                onChange({
                  ...lead,
                  estimateOwner: e.target.value as IntakeLead['estimateOwner'],
                })
              }
            >
              <option value="unset">Who creates the estimate?</option>
              <option value="office">Office Coordinator sends estimate</option>
              <option value="service-manager">Service Manager must create estimate</option>
            </select>
            <button
              type="button"
              className="btn-primary"
              onClick={() => onChange({ ...lead, stage: 'estimate-queue' })}
            >
              Send to estimate queue
            </button>
          </div>
        )}

        {(lead.stage === 'waitlist' || lead.stage === 'estimate-queue') && canSchedule && (
          <button type="button" className="btn-primary w-full" onClick={() => void onConvert(lead)}>
            Convert to shop job (Received)
          </button>
        )}
        {lead.linkedJobId && (
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            Linked job: {lead.linkedJobId}
          </p>
        )}
      </section>
    </div>
  )
}
