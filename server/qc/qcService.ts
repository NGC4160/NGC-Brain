import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import JSZip from 'jszip'
import { insertQcSubmission } from '../db/qcSubmissions.js'
import { getWorkOrder, getWorkOrderByInvoice, updateWorkOrder } from '../db/workOrders.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../..')
export const QC_FORMS_DIR = join(ROOT, 'QC forms')

const MEDIA_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif',
  '.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v',
])

export interface QcMediaFile {
  originalName: string
  buffer: Buffer
  mimeType: string
}

export interface QcSaveInput {
  payload: Record<string, unknown>
  media: QcMediaFile[]
  moveToReady?: boolean
}

export interface QcSaveResult {
  fileName: string
  filePath: string
  mediaCount: number
  workOrderId: string | null
  movedToReady: boolean
}

export function sanitizeSegment(value: string): string {
  const cleaned = value.trim().replace(/[^\w-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
  return cleaned || 'unknown'
}

export function fileBaseName(jobNumber: string, lastName: string): string {
  return `${sanitizeSegment(jobNumber)}_${sanitizeSegment(lastName)}`
}

function uniqueZipPath(baseName: string): string {
  mkdirSync(QC_FORMS_DIR, { recursive: true })
  const primary = join(QC_FORMS_DIR, `${baseName}.zip`)
  if (existsSync(primary)) {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '')
    return join(QC_FORMS_DIR, `${baseName}_${stamp}.zip`)
  }
  return primary
}

export function parseLastName(customerName: string): string {
  const parts = customerName.trim().split(/\s+/).filter(Boolean)
  return parts.length ? parts[parts.length - 1]! : ''
}

export async function saveQcSubmission(input: QcSaveInput): Promise<QcSaveResult> {
  const jobNumber = String(input.payload.jobNumber ?? '').trim()
  const lastName = String(input.payload.customerLastName ?? '').trim()

  if (!jobNumber) throw new Error('HCP invoice / job # is required.')
  if (!lastName) throw new Error('Customer last name is required.')

  for (const file of input.media) {
    const ext = file.originalName.includes('.')
      ? `.${file.originalName.split('.').pop()!.toLowerCase()}`
      : ''
    if (ext && !MEDIA_EXTENSIONS.has(ext)) {
      throw new Error(`Unsupported file type: ${ext}`)
    }
  }

  const baseName = fileBaseName(jobNumber, lastName)
  const zipPath = uniqueZipPath(baseName)
  const fileName = zipPath.split(/[/\\]/).pop()!

  const savedAt = new Date().toISOString()
  const workOrder = getWorkOrderByInvoice(jobNumber)
  const workOrderId = workOrder?.id ?? null

  const savedMedia = input.media.map((file, index) => {
    const stem = sanitizeSegment(file.originalName.replace(/\.[^.]+$/, '')) || 'file'
    const ext = file.originalName.includes('.') ? `.${file.originalName.split('.').pop()}` : ''
    return {
      filename: `${String(index + 1).padStart(3, '0')}_${stem}${ext}`,
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.buffer.length,
    }
  })

  const record = {
    savedAt,
    fileName,
    jobNumber,
    customerLastName: lastName,
    workOrderId,
    form: input.payload,
    media: savedMedia,
  }

  const summary = [
    'NGC Shop QC Completion Form',
    `Saved: ${savedAt}`,
    `Job #: ${jobNumber}`,
    `Customer last name: ${lastName}`,
    `Technician: ${input.payload.technician ?? ''}`,
    `Cart: ${input.payload.cartMakeModel ?? ''}`,
    `Media files: ${savedMedia.length}`,
    '',
    'Certification:',
    input.payload.certification ? 'YES' : 'NO',
  ].join('\n')

  const zip = new JSZip()
  zip.file('form.json', JSON.stringify(record, null, 2))
  zip.file('summary.txt', summary)
  for (let i = 0; i < input.media.length; i += 1) {
    zip.file(`media/${savedMedia[i]!.filename}`, input.media[i]!.buffer)
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  writeFileSync(zipPath, zipBuffer)

  insertQcSubmission({
    workOrderId,
    jobNumber,
    customerLastName: lastName,
    fileName,
    filePath: zipPath,
    mediaCount: savedMedia.length,
    certified: Boolean(input.payload.certification),
    technician: input.payload.technician ? String(input.payload.technician) : null,
    formJson: JSON.stringify(record),
  })

  let movedToReady = false
  if (input.moveToReady !== false && input.payload.certification && workOrderId) {
    const wo = getWorkOrder(workOrderId)
    if (wo && wo.status === 'qa') {
      updateWorkOrder(workOrderId, { status: 'ready', force: true })
      movedToReady = true
    }
  }

  return {
    fileName,
    filePath: zipPath,
    mediaCount: savedMedia.length,
    workOrderId,
    movedToReady,
  }
}

export function buildQcContext(jobNumber?: string, workOrderId?: string) {
  if (!jobNumber?.trim() && !workOrderId?.trim()) return null

  const wo = workOrderId?.trim()
    ? getWorkOrder(workOrderId)
    : jobNumber
      ? getWorkOrderByInvoice(jobNumber)
      : null

  if (!wo) {
    const num = jobNumber?.trim() || (workOrderId?.trim()?.startsWith('HCP-') ? workOrderId.trim().slice(4) : workOrderId?.trim()) || ''
    if (!num && !workOrderId?.trim()) return null
    return {
      jobNumber: num,
      customerLastName: '',
      customerName: '',
      workOrderId: workOrderId?.trim() ?? null,
    }
  }

  const invoice = wo.id.startsWith('HCP-') ? wo.id.slice(4) : jobNumber ?? wo.id
  const lastName = parseLastName(wo.customerName)

  return {
    workOrderId: wo.id,
    jobNumber: invoice,
    customerName: wo.customerName,
    customerLastName: lastName,
    cartMakeModel: [wo.make, wo.model, wo.year].filter(Boolean).join(' '),
    serialVin: wo.serialVin ?? '',
    technician: wo.assignedTech ?? '',
    serviceType: wo.issueDescription,
    status: wo.status,
  }
}
