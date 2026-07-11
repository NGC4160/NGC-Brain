import { useMemo, useState } from 'react'
import type { JobPriority, JobStatus, RepairJob } from '@/types'
import { JOB_PRIORITY_LABELS, JOB_STATUS_LABELS } from '@/types'
import { evaluateDepositGate } from '@/lib/depositGates'
import { DEPOSIT_BATTERY, DEPOSIT_LITHIUM, DIAGNOSTIC_MIN } from '@/lib/depositGates'
import type { WorkOrderInput } from '@/services/dms/workOrders'
import { useAuthContext } from '@/context/AuthContext'

const MAKES = ['Club Car', 'EZGO', 'Yamaha', 'Star EV', 'Icon', 'Other']
const STATUSES = Object.keys(JOB_STATUS_LABELS) as JobStatus[]

interface WorkOrderFormProps {
  initial?: Partial<RepairJob>
  submitLabel?: string
  onSubmit: (input: WorkOrderInput) => Promise<void>
  onCancel?: () => void
}

export function WorkOrderForm({
  initial,
  submitLabel = 'Save work order',
  onSubmit,
  onCancel,
}: WorkOrderFormProps) {
  const { techNames, canAssignJobs, canOverrideDeposit, session, isTechnician } =
    useAuthContext()
  const techOptions = useMemo(() => {
    const names = [...techNames]
    if (initial?.assignedTech && !names.includes(initial.assignedTech)) {
      names.push(initial.assignedTech)
    }
    return names
  }, [techNames, initial?.assignedTech])

  const [customerName, setCustomerName] = useState(initial?.customerName ?? '')
  const [make, setMake] = useState(initial?.make ?? 'Club Car')
  const [model, setModel] = useState(initial?.model ?? '')
  const [year, setYear] = useState(initial?.year?.toString() ?? '')
  const [serialVin, setSerialVin] = useState(initial?.serialVin ?? '')
  const [issueDescription, setIssueDescription] = useState(initial?.issueDescription ?? '')
  const [priority, setPriority] = useState<JobPriority>(initial?.priority ?? 'normal')
  const [assignedTech, setAssignedTech] = useState(
    initial?.assignedTech ?? (isTechnician ? session?.name ?? '' : ''),
  )
  const [status, setStatus] = useState<JobStatus>(initial?.status ?? 'received')
  const [estimatedRevenue, setEstimatedRevenue] = useState(
    initial?.estimatedRevenue?.toString() ?? '',
  )
  const [paidAmount, setPaidAmount] = useState(initial?.paidAmount?.toString() ?? '0')
  const [force, setForce] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const gate = useMemo(
    () =>
      evaluateDepositGate({
        description: issueDescription,
        totalAmount: Number(estimatedRevenue) || 0,
        paidAmount: Number(paidAmount) || 0,
        status,
      }),
    [issueDescription, estimatedRevenue, paidAmount, status],
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        customerName: customerName.trim(),
        make,
        model: model.trim(),
        year: year ? Number(year) : undefined,
        serialVin: serialVin.trim() || undefined,
        issueDescription: issueDescription.trim(),
        priority,
        assignedTech: assignedTech && assignedTech !== 'Unassigned' ? assignedTech : '',
        status,
        estimatedRevenue: estimatedRevenue ? Number(estimatedRevenue) : 0,
        paidAmount: paidAmount ? Number(paidAmount) : 0,
        force: force && canOverrideDeposit,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save work order')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        Deposit gates: Lithium ${DEPOSIT_LITHIUM.toLocaleString()} · Battery $
        {DEPOSIT_BATTERY.toLocaleString()} · Diagnostic ${DIAGNOSTIC_MIN}
        {canAssignJobs ? ' · Service manager can assign technicians' : ''}
      </div>

      <div className="sm:col-span-2">
        <label className="label" htmlFor="customerName">Customer *</label>
        <input
          id="customerName"
          required
          className="input-field"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          disabled={isTechnician && Boolean(initial?.id)}
        />
      </div>

      <div>
        <label className="label" htmlFor="make">Make *</label>
        <select
          id="make"
          className="input-field"
          value={make}
          onChange={(e) => setMake(e.target.value)}
          disabled={isTechnician && Boolean(initial?.id)}
        >
          {MAKES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="model">Model *</label>
        <input
          id="model"
          required
          className="input-field"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={isTechnician && Boolean(initial?.id)}
        />
      </div>
      <div>
        <label className="label" htmlFor="year">Year</label>
        <input
          id="year"
          type="number"
          min={1990}
          max={2035}
          className="input-field"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="serialVin">Serial / VIN</label>
        <input
          id="serialVin"
          className="input-field"
          value={serialVin}
          onChange={(e) => setSerialVin(e.target.value)}
        />
      </div>

      <div className="sm:col-span-2">
        <label className="label" htmlFor="issueDescription">Issue / work description *</label>
        <textarea
          id="issueDescription"
          required
          rows={3}
          className="input-field"
          value={issueDescription}
          onChange={(e) => setIssueDescription(e.target.value)}
          placeholder="Include lithium / battery / diagnostic keywords when relevant"
        />
      </div>

      <div>
        <label className="label" htmlFor="status">Status</label>
        <select
          id="status"
          className="input-field"
          value={status}
          onChange={(e) => setStatus(e.target.value as JobStatus)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{JOB_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="priority">Priority</label>
        <select
          id="priority"
          className="input-field"
          value={priority}
          onChange={(e) => setPriority(e.target.value as JobPriority)}
        >
          {Object.entries(JOB_PRIORITY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="assignedTech">Assigned tech</label>
        <select
          id="assignedTech"
          className="input-field"
          value={assignedTech || 'Unassigned'}
          onChange={(e) => setAssignedTech(e.target.value)}
          disabled={!canAssignJobs}
        >
          <option value="Unassigned">Unassigned</option>
          {techOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {!canAssignJobs && (
          <p className="mt-1 text-xs text-slate-500">
            Only the service manager can assign jobs
          </p>
        )}
      </div>
      <div>
        <label className="label" htmlFor="estimatedRevenue">Job total ($)</label>
        <input
          id="estimatedRevenue"
          type="number"
          min={0}
          step="0.01"
          className="input-field"
          value={estimatedRevenue}
          onChange={(e) => setEstimatedRevenue(e.target.value)}
          disabled={isTechnician}
        />
      </div>
      <div>
        <label className="label" htmlFor="paidAmount">Paid / deposit ($)</label>
        <input
          id="paidAmount"
          type="number"
          min={0}
          step="0.01"
          className="input-field"
          value={paidAmount}
          onChange={(e) => setPaidAmount(e.target.value)}
          disabled={isTechnician}
        />
      </div>

      {gate.message && (
        <div
          className={`sm:col-span-2 rounded-lg border px-3 py-2 text-sm ${
            gate.blocked
              ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
              : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100'
          }`}
        >
          <p className="font-medium">{gate.code}</p>
          <p className="mt-1">{gate.message}</p>
        </div>
      )}

      {gate.blocked && canOverrideDeposit && (
        <label className="sm:col-span-2 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            className="mt-1"
            checked={force}
            onChange={(e) => setForce(e.target.checked)}
          />
          Override deposit gate (service manager / owner)
        </label>
      )}

      {error && (
        <p className="sm:col-span-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="sm:col-span-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn-primary"
          disabled={saving || (gate.blocked && !(force && canOverrideDeposit))}
        >
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
