import { parseLastName } from '@/lib/qcClient'
import type { QcContext } from '@/services/dms/qc'
import type { RepairJob } from '@/types'
import { JOB_STATUS_LABELS, type JobStatus } from '@/types'

export const MANUAL_JOB_ID = '__manual__'

const STATUS_SORT: JobStatus[] = [
  'qa',
  'in-repair',
  'waiting-parts',
  'diagnosing',
  'received',
  'ready',
  'picked-up',
]

export function getJobInvoiceNumber(job: RepairJob): string {
  if (job.invoiceNumber?.trim()) return job.invoiceNumber.trim()
  if (job.id.startsWith('HCP-')) return job.id.slice(4)
  return job.id
}

export interface QcJobOption {
  workOrderId: string
  jobNumber: string
  customerName: string
  customerLastName: string
  status: JobStatus
  label: string
}

export function jobToQcContext(job: RepairJob): QcContext {
  return {
    workOrderId: job.id,
    jobNumber: getJobInvoiceNumber(job),
    customerName: job.customerName,
    customerLastName: parseLastName(job.customerName),
    cartMakeModel: [job.make, job.model, job.year].filter(Boolean).join(' '),
    serialVin: job.serialVin ?? '',
    technician: job.assignedTech ?? '',
    serviceType: job.issueDescription,
    status: job.status,
  }
}

export function buildQcJobOptions(jobs: RepairJob[]): QcJobOption[] {
  return [...jobs]
    .sort((a, b) => {
      const sa = STATUS_SORT.indexOf(a.status)
      const sb = STATUS_SORT.indexOf(b.status)
      if (sa !== sb) return sa - sb
      return b.updatedAt.localeCompare(a.updatedAt)
    })
    .map((job) => {
      const jobNumber = getJobInvoiceNumber(job)
      const customerLastName = parseLastName(job.customerName)
      return {
        workOrderId: job.id,
        jobNumber,
        customerName: job.customerName,
        customerLastName,
        status: job.status,
        label: `${jobNumber} — ${job.customerName} (${JOB_STATUS_LABELS[job.status]})`,
      }
    })
}

export interface QcLastNameOption {
  lastName: string
  label: string
  jobCount: number
}

export function buildQcLastNameOptions(jobs: RepairJob[]): QcLastNameOption[] {
  const counts = new Map<string, number>()
  for (const job of jobs) {
    const lastName = parseLastName(job.customerName)
    if (!lastName) continue
    counts.set(lastName, (counts.get(lastName) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([lastName, jobCount]) => ({
      lastName,
      jobCount,
      label: jobCount > 1 ? `${lastName} (${jobCount} jobs)` : lastName,
    }))
}

export function filterJobsByLastName(jobs: QcJobOption[], lastName: string): QcJobOption[] {
  if (!lastName.trim()) return jobs
  const needle = lastName.trim().toLowerCase()
  return jobs.filter((j) => j.customerLastName.toLowerCase() === needle)
}

export function findJobOption(
  options: QcJobOption[],
  params: { workOrderId?: string; jobNumber?: string },
): QcJobOption | undefined {
  const wo = params.workOrderId?.trim()
  const num = params.jobNumber?.trim()
  if (wo) {
    const byId = options.find((o) => o.workOrderId === wo)
    if (byId) return byId
  }
  if (num) {
    return options.find(
      (o) =>
        o.jobNumber === num ||
        o.workOrderId === num ||
        o.workOrderId === `HCP-${num}`,
    )
  }
  return undefined
}
