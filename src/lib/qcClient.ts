import JSZip from 'jszip'
import type { RepairJob } from '@/types'
import type { QcContext, QcSaveResult, QcSubmissionSummary } from '@/services/dms/qc'

const QC_SUBMISSIONS_KEY = 'ngc-qc-submissions-v1'
const QC_DIR_HANDLE_KEY = 'ngc-qc-forms-directory'

const MEDIA_EXT = /\.(jpe?g|png|gif|webp|heic|heif|mp4|mov|avi|mkv|webm|m4v)$/i

export function sanitizeSegment(value: string): string {
  const cleaned = value.trim().replace(/[^\w-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
  return cleaned || 'unknown'
}

export function fileBaseName(jobNumber: string, lastName: string): string {
  return `${sanitizeSegment(jobNumber)}_${sanitizeSegment(lastName)}`
}

export function parseLastName(customerName: string): string {
  const parts = customerName.trim().split(/\s+/).filter(Boolean)
  return parts.length ? parts[parts.length - 1]! : ''
}

export function buildQcContextFromJobs(
  jobs: RepairJob[],
  params: { job?: string; workOrderId?: string },
): QcContext | null {
  const jobParam = params.job?.trim()
  const woParam = params.workOrderId?.trim()
  if (!jobParam && !woParam) return null

  const wo = jobs.find((j) => {
    if (woParam && j.id === woParam) return true
    if (jobParam) {
      if (j.id === jobParam || j.id === `HCP-${jobParam}`) return true
      if (j.invoiceNumber === jobParam) return true
    }
    return false
  })

  if (!wo) {
    const num = jobParam || (woParam?.startsWith('HCP-') ? woParam.slice(4) : woParam) || ''
    if (!num) return null
    return {
      workOrderId: woParam ?? null,
      jobNumber: num,
      customerLastName: '',
      customerName: '',
    }
  }

  const invoice =
    wo.invoiceNumber ?? (wo.id.startsWith('HCP-') ? wo.id.slice(4) : jobParam ?? wo.id)

  return {
    workOrderId: wo.id,
    jobNumber: invoice,
    customerName: wo.customerName,
    customerLastName: parseLastName(wo.customerName),
    cartMakeModel: [wo.make, wo.model, wo.year].filter(Boolean).join(' '),
    serialVin: wo.serialVin ?? '',
    technician: wo.assignedTech ?? '',
    serviceType: wo.issueDescription,
    status: wo.status,
  }
}

function loadSubmissionLog(): QcSubmissionSummary[] {
  try {
    const raw = localStorage.getItem(QC_SUBMISSIONS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as QcSubmissionSummary[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function appendSubmission(entry: QcSubmissionSummary) {
  const next = [entry, ...loadSubmissionLog()].slice(0, 200)
  localStorage.setItem(QC_SUBMISSIONS_KEY, JSON.stringify(next))
}

export function listLocalQcSubmissions(): QcSubmissionSummary[] {
  return loadSubmissionLog()
}

async function readFileBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer()
}

export async function buildQcZip(
  payload: Record<string, unknown>,
  media: File[],
): Promise<{ blob: Blob; fileName: string; mediaCount: number }> {
  const jobNumber = String(payload.jobNumber ?? '').trim()
  const lastName = String(payload.customerLastName ?? '').trim()
  const baseName = fileBaseName(jobNumber, lastName)
  const fileName = `${baseName}.zip`
  const savedAt = new Date().toISOString()

  const savedMedia: Array<{ filename: string; originalName: string; mimeType: string; sizeBytes: number }> = []

  const zip = new JSZip()
  for (let i = 0; i < media.length; i += 1) {
    const file = media[i]!
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/') && !MEDIA_EXT.test(file.name)) {
      continue
    }
    const stem = sanitizeSegment(file.name.replace(/\.[^.]+$/, '')) || 'file'
    const ext = file.name.includes('.') ? `.${file.name.split('.').pop()}` : ''
    const arcName = `${String(i + 1).padStart(3, '0')}_${stem}${ext}`
    const buf = await readFileBuffer(file)
    zip.file(`media/${arcName}`, buf)
    savedMedia.push({
      filename: arcName,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: buf.byteLength,
    })
  }

  const record = {
    savedAt,
    fileName,
    jobNumber,
    customerLastName: lastName,
    workOrderId: payload.workOrderId ?? null,
    form: payload,
    media: savedMedia,
  }

  const inspectionLines = Array.isArray(payload.inspection)
    ? (payload.inspection as Array<{ label?: string; checked?: boolean; notes?: string }>)
        .filter((row) => row.notes?.trim())
        .map((row) => `  ${row.label ?? ''}: ${row.notes?.trim()}`)
    : []

  const summary = [
    'NGC Shop QC Completion Form',
    `Saved: ${savedAt}`,
    `Job #: ${jobNumber}`,
    `Customer: ${payload.customerName ?? ''}`,
    `Customer last name: ${lastName}`,
    `Technician: ${payload.technician ?? ''}`,
    `Cart: ${payload.cartMakeModel ?? ''}`,
    `Service: ${payload.serviceType ?? ''}`,
    `Media files: ${savedMedia.length}`,
    '',
    ...(inspectionLines.length
      ? ['Safety inspection notes:', ...inspectionLines, '']
      : []),
    'Certification:',
    payload.certification ? 'YES' : 'NO',
  ].join('\n')

  zip.file('form.json', JSON.stringify(record, null, 2))
  zip.file('summary.txt', summary)

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  return { blob, fileName, mediaCount: savedMedia.length }
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

async function getStoredDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (!('indexedDB' in window)) return null
  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('ngc-qc-storage', 1)
      req.onupgradeneeded = () => req.result.createObjectStore('handles')
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    return await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
      const tx = db.transaction('handles', 'readonly')
      const req = tx.objectStore('handles').get(QC_DIR_HANDLE_KEY)
      req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle | undefined) ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

async function storeDirectoryHandle(handle: FileSystemDirectoryHandle) {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open('ngc-qc-storage', 1)
    req.onupgradeneeded = () => req.result.createObjectStore('handles')
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('handles', 'readwrite')
    tx.objectStore('handles').put(handle, QC_DIR_HANDLE_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function saveToDirectory(blob: Blob, fileName: string): Promise<boolean> {
  const picker = (window as Window & { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> })
    .showDirectoryPicker
  if (!picker) return false

  let handle: FileSystemDirectoryHandle | null = await getStoredDirectoryHandle()
  if (handle) {
    try {
      const h = handle as FileSystemDirectoryHandle & {
        queryPermission?: (o: { mode: string }) => Promise<string>
        requestPermission?: (o: { mode: string }) => Promise<string>
      }
      if (h.queryPermission && h.requestPermission) {
        const perm = await h.queryPermission({ mode: 'readwrite' })
        if (perm !== 'granted') {
          const req = await h.requestPermission({ mode: 'readwrite' })
          if (req !== 'granted') handle = null
        }
      }
    } catch {
      handle = null
    }
  }

  if (!handle) {
    try {
      handle = await picker.call(window)
      await storeDirectoryHandle(handle)
    } catch {
      return false
    }
  }

  try {
    const fileHandle = await handle.getFileHandle(fileName, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(blob)
    await writable.close()
    return true
  } catch {
    return false
  }
}

export async function saveQcFormClient(
  payload: Record<string, unknown>,
  media: File[],
): Promise<QcSaveResult & { savedToFolder?: boolean }> {
  const { blob, fileName, mediaCount } = await buildQcZip(payload, media)

  let savedToFolder = false
  if (await saveToDirectory(blob, fileName)) {
    savedToFolder = true
  } else {
    triggerDownload(blob, fileName)
  }

  const entry: QcSubmissionSummary = {
    id: `qc_${Date.now()}`,
    jobNumber: String(payload.jobNumber),
    customerLastName: String(payload.customerLastName),
    fileName,
    mediaCount,
    certified: Boolean(payload.certification),
    savedAt: new Date().toISOString(),
  }
  appendSubmission(entry)

  return {
    ok: true,
    fileName,
    file: savedToFolder ? `QC forms/${fileName}` : `Downloads/${fileName}`,
    mediaCount,
    workOrderId: (payload.workOrderId as string | null) ?? null,
    movedToReady: false,
    message: savedToFolder
      ? `Saved ${fileName} to your QC forms folder`
      : `Downloaded ${fileName} — move it to your QC forms folder`,
    savedToFolder,
  }
}

export async function pickQcFormsFolder(): Promise<boolean> {
  const picker = (window as Window & { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> })
    .showDirectoryPicker
  if (!picker) return false
  try {
    const handle = await picker.call(window)
    await storeDirectoryHandle(handle)
    return true
  } catch {
    return false
  }
}
