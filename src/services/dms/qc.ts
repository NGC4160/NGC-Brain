export interface QcContext {
  workOrderId: string | null
  jobNumber: string
  customerName?: string
  customerLastName: string
  cartMakeModel?: string
  serialVin?: string
  technician?: string
  serviceType?: string
  status?: string
}

export interface QcSaveResult {
  ok: boolean
  fileName: string
  file: string
  mediaCount: number
  workOrderId: string | null
  movedToReady: boolean
  message: string
  error?: string
  savedToFolder?: boolean
}

export interface QcSubmissionSummary {
  id: string
  jobNumber: string
  customerLastName: string
  fileName: string
  mediaCount: number
  certified: boolean
  savedAt: string
}

import {
  buildQcContextFromJobs,
  listLocalQcSubmissions,
  saveQcFormClient,
} from '@/lib/qcClient'
import type { RepairJob } from '@/types'
import { probeWritableApi } from '@/services/dms/workOrders'

const API = import.meta.env.VITE_HCP_API_URL ?? ''

export async function fetchQcContext(params: {
  job?: string
  workOrderId?: string
  jobs?: RepairJob[]
}): Promise<QcContext> {
  if (params.jobs?.length) {
    const ctx = buildQcContextFromJobs(params.jobs, params)
    if (ctx) return ctx
  }

  if (!API) {
    throw new Error('Job not found — enter job # and customer last name manually.')
  }

  const qs = new URLSearchParams()
  if (params.job) qs.set('job', params.job)
  if (params.workOrderId) qs.set('workOrderId', params.workOrderId)
  const res = await fetch(`${API}/api/qc/context?${qs}`)
  if (!res.ok) {
    const data = (await res.json()) as { error?: string }
    throw new Error(data.error ?? 'Could not load job context')
  }
  return res.json() as Promise<QcContext>
}

export async function saveQcForm(
  payload: Record<string, unknown>,
  media: File[],
): Promise<QcSaveResult> {
  const apiUp = await probeWritableApi()
  if (apiUp) {
    const formData = new FormData()
    formData.append('payload', JSON.stringify(payload))
    formData.append('moveToReady', 'true')
    for (const file of media) {
      formData.append('media', file, file.name)
    }
    const res = await fetch(`${API}/api/qc/save`, { method: 'POST', body: formData })
    const data = (await res.json()) as QcSaveResult
    if (res.ok && data.ok) return data
    if (res.status >= 500) {
      // fall through to client save
    } else {
      throw new Error(data.error ?? 'Save failed')
    }
  }

  return saveQcFormClient(payload, media)
}

export async function fetchRecentQcSubmissions(): Promise<QcSubmissionSummary[]> {
  if (await probeWritableApi()) {
    try {
      const res = await fetch(`${API}/api/qc/submissions`)
      if (res.ok) {
        const data = (await res.json()) as { submissions: Array<Record<string, unknown>> }
        return data.submissions.map((s) => ({
          id: String(s.id),
          jobNumber: String(s.jobNumber),
          customerLastName: String(s.customerLastName),
          fileName: String(s.fileName),
          mediaCount: Number(s.mediaCount),
          certified: Boolean(s.certified),
          savedAt: String(s.savedAt),
        }))
      }
    } catch {
      // local fallback
    }
  }
  return listLocalQcSubmissions()
}

export { pickQcFormsFolder } from '@/lib/qcClient'
