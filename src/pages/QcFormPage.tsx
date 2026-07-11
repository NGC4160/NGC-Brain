import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, ClipboardCheck, FolderOpen, Save } from 'lucide-react'
import { QcMediaUpload, type MediaItem } from '@/components/qc/QcMediaUpload'
import { useApp } from '@/context/AppContext'
import {
  MANUAL_JOB_ID,
  buildQcJobOptions,
  buildQcLastNameOptions,
  filterJobsByLastName,
  findJobOption,
  jobToQcContext,
} from '@/lib/qcJobPicker'
import { fetchQcContext, pickQcFormsFolder, saveQcForm } from '@/services/dms/qc'
import { JOB_STATUS_LABELS } from '@/types'

const BEFORE_PHOTOS = [
  'Front of cart (full view)',
  'Rear of cart (full view)',
  'Driver side (full profile)',
  'Passenger side (full profile)',
  'Battery compartment / pack area',
  'Dash / key switch / charge port',
  'Serial # / VIN tag or data plate',
]

const INSPECTION_POINTS = [
  'Wires, cables, and terminals',
  'Battery water / lithium pack condition',
  'Lights and horn',
  'Tires — inflation, tread, wear',
  'Steering and suspension',
  'Drivetrain (axle & motor)',
  'Brakes — operation and adjustment',
]

const QUALITY_CHECKS = [
  'Completeness — all authorized work finished',
  'Neatness — wiring secured, panels aligned',
  'Cleanliness — grease and debris removed',
  'Tightness — fasteners and terminals torqued',
  'Safety — belts, panels, hold-downs reinstalled',
  'Fluids / levels checked as applicable',
  'Accessories function correctly',
  'No tools or old parts left on cart',
  'HCP job notes and photos complete',
]

const TEST_DRIVE_CHECKS = [
  'Forward / reverse verified',
  'Brakes stop smoothly',
  'Steering tracks straight',
  'Speed / acceleration normal; no fault codes',
  'Customer complaint verified resolved',
  'Cart charged / SOC appropriate',
]

interface InspectionRow {
  checked: boolean
  notes: string
}

function applyContext(
  ctx: {
    workOrderId?: string | null
    jobNumber: string
    customerName?: string
    customerLastName: string
    technician?: string
    cartMakeModel?: string
    serialVin?: string
    serviceType?: string
    status?: string
  },
  setters: {
    setJobNumber: (v: string) => void
    setCustomerName: (v: string) => void
    setCustomerLastName: (v: string) => void
    setTechnician: (v: string) => void
    setCartMakeModel: (v: string) => void
    setSerialVin: (v: string) => void
    setServiceType: (v: string) => void
    setJobStatus: (v: string) => void
    setWorkOrderId: (v: string | null) => void
  },
) {
  setters.setJobNumber(ctx.jobNumber)
  setters.setCustomerName(ctx.customerName ?? '')
  setters.setCustomerLastName(ctx.customerLastName)
  setters.setTechnician(ctx.technician ?? '')
  setters.setCartMakeModel(ctx.cartMakeModel ?? '')
  setters.setSerialVin(ctx.serialVin ?? '')
  setters.setServiceType(ctx.serviceType ?? '')
  setters.setJobStatus(ctx.status ?? '')
  setters.setWorkOrderId(ctx.workOrderId ?? null)
}

export function QcFormPage() {
  const [params] = useSearchParams()
  const { jobs, updateJob, writeMode } = useApp()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [folderMsg, setFolderMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [media, setMedia] = useState<MediaItem[]>([])

  const allJobOptions = useMemo(() => buildQcJobOptions(jobs), [jobs])
  const lastNameOptions = useMemo(() => buildQcLastNameOptions(jobs), [jobs])

  const [selectedJobId, setSelectedJobId] = useState('')
  const [lastNameFilter, setLastNameFilter] = useState('')

  const [jobNumber, setJobNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerLastName, setCustomerLastName] = useState('')
  const [technician, setTechnician] = useState('')
  const [cartMakeModel, setCartMakeModel] = useState('')
  const [serialVin, setSerialVin] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [jobStatus, setJobStatus] = useState('')
  const [workOrderId, setWorkOrderId] = useState<string | null>(null)

  const [beforePhotos, setBeforePhotos] = useState<boolean[]>(() => BEFORE_PHOTOS.map(() => false))
  const [inspection, setInspection] = useState<InspectionRow[]>(() =>
    INSPECTION_POINTS.map(() => ({ checked: false, notes: '' })),
  )
  const [quality, setQuality] = useState<boolean[]>(() => QUALITY_CHECKS.map(() => false))
  const [testDrive, setTestDrive] = useState<boolean[]>(() => TEST_DRIVE_CHECKS.map(() => false))
  const [certification, setCertification] = useState(false)
  const [testDriveNotes, setTestDriveNotes] = useState('')

  const manualMode = selectedJobId === MANUAL_JOB_ID
  const filteredJobOptions = useMemo(
    () => filterJobsByLastName(allJobOptions, lastNameFilter),
    [allJobOptions, lastNameFilter],
  )

  const canPickFolder = typeof window !== 'undefined' && 'showDirectoryPicker' in window

  useEffect(() => {
    const job = params.get('job') ?? params.get('invoice') ?? ''
    const wo = params.get('workOrderId') ?? ''

    void (async () => {
      try {
        if (job || wo) {
          const match = findJobOption(allJobOptions, { jobNumber: job, workOrderId: wo })
          if (match) {
            setSelectedJobId(match.workOrderId)
            setLastNameFilter(match.customerLastName)
            applyContext(jobToQcContext(jobs.find((j) => j.id === match.workOrderId)!), {
              setJobNumber,
              setCustomerName,
              setCustomerLastName,
              setTechnician,
              setCartMakeModel,
              setSerialVin,
              setServiceType,
              setJobStatus,
              setWorkOrderId,
            })
          } else {
            const ctx = await fetchQcContext({
              job: job || undefined,
              workOrderId: wo || undefined,
              jobs,
            })
            setSelectedJobId(MANUAL_JOB_ID)
            applyContext(ctx, {
              setJobNumber,
              setCustomerName,
              setCustomerLastName,
              setTechnician,
              setCartMakeModel,
              setSerialVin,
              setServiceType,
              setJobStatus,
              setWorkOrderId,
            })
            if (ctx.customerLastName) setLastNameFilter(ctx.customerLastName)
          }
        }
      } catch (err) {
        if (job) {
          setSelectedJobId(MANUAL_JOB_ID)
          setJobNumber(job)
        }
        setError(err instanceof Error ? err.message : 'Could not load job')
      } finally {
        setLoading(false)
      }
    })()
  }, [params, jobs, allJobOptions])

  function handleJobSelect(workOrderId: string) {
    setSelectedJobId(workOrderId)
    if (workOrderId === MANUAL_JOB_ID || !workOrderId) return

    const job = jobs.find((j) => j.id === workOrderId)
    if (!job) return

    const ctx = jobToQcContext(job)
    applyContext(ctx, {
      setJobNumber,
      setCustomerName,
      setCustomerLastName,
      setTechnician,
      setCartMakeModel,
      setSerialVin,
      setServiceType,
      setJobStatus,
      setWorkOrderId,
    })
    if (ctx.customerLastName) setLastNameFilter(ctx.customerLastName)
  }

  function handleLastNameSelect(lastName: string) {
    setLastNameFilter(lastName)
    if (!lastName) return

    const matches = filterJobsByLastName(allJobOptions, lastName)
    if (matches.length === 1) {
      handleJobSelect(matches[0]!.workOrderId)
      return
    }

    if (selectedJobId && selectedJobId !== MANUAL_JOB_ID) {
      const current = allJobOptions.find((o) => o.workOrderId === selectedJobId)
      if (current && current.customerLastName.toLowerCase() !== lastName.toLowerCase()) {
        setSelectedJobId('')
        setWorkOrderId(null)
      }
    }

    if (manualMode || !selectedJobId) {
      setCustomerLastName(lastName)
    }
  }

  const canSave = useMemo(
    () => Boolean(jobNumber.trim() && customerLastName.trim() && certification),
    [jobNumber, customerLastName, certification],
  )

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const payload = {
        jobNumber: jobNumber.trim(),
        customerName: customerName.trim(),
        customerLastName: customerLastName.trim(),
        technician,
        cartMakeModel,
        serialVin,
        serviceType,
        jobStatus,
        workOrderId,
        beforePhotos: BEFORE_PHOTOS.map((label, i) => ({ label, checked: beforePhotos[i] })),
        inspection: INSPECTION_POINTS.map((label, i) => ({
          label,
          checked: inspection[i]!.checked,
          notes: inspection[i]!.notes.trim(),
        })),
        quality: QUALITY_CHECKS.map((label, i) => ({ label, checked: quality[i] })),
        testDrive: TEST_DRIVE_CHECKS.map((label, i) => ({ label, checked: testDrive[i] })),
        testDriveNotes,
        certification,
        savedFrom: writeMode === 'api' ? 'ngc-dms-api' : 'ngc-dms-pages',
      }
      const result = await saveQcForm(payload, media.map((m) => m.file))

      let movedToReady = result.movedToReady
      if (
        !movedToReady &&
        certification &&
        workOrderId &&
        jobs.find((j) => j.id === workOrderId)?.status === 'qa'
      ) {
        await updateJob(workOrderId, { status: 'ready', force: true })
        movedToReady = true
      }

      setSuccess(
        `${result.message}${movedToReady ? ' · Job moved to READY on the status board.' : ''}`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handlePickFolder() {
    setFolderMsg(null)
    const ok = await pickQcFormsFolder()
    setFolderMsg(
      ok
        ? 'QC forms folder selected — future saves will write there automatically.'
        : 'Could not access folder. Saves will download as zip files instead.',
    )
  }

  function toggleBool(setter: React.Dispatch<React.SetStateAction<boolean[]>>, index: number) {
    setter((prev) => prev.map((v, i) => (i === index ? !v : v)))
  }

  function toggleInspection(index: number) {
    setInspection((prev) =>
      prev.map((row, i) => (i === index ? { ...row, checked: !row.checked } : row)),
    )
  }

  function setInspectionNotes(index: number, notes: string) {
    setInspection((prev) => prev.map((row, i) => (i === index ? { ...row, notes } : row)))
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading job…</p>
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
            <ClipboardCheck className="h-7 w-7 text-brand-600" />
            Shop QC Form
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Select a job to autofill, or enter manually. Saves{' '}
            <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">{'{job#}_{LastName}'}.zip</code>{' '}
            with checklist + all photos/videos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canPickFolder && (
            <button type="button" className="btn-secondary" onClick={() => void handlePickFolder()}>
              <FolderOpen className="h-4 w-4" />
              QC forms folder
            </button>
          )}
          <Link to="/board" className="btn-secondary">
            Back to board
          </Link>
        </div>
      </div>

      {folderMsg && (
        <p className="text-sm text-brand-700 dark:text-brand-300">{folderMsg}</p>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-100">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      <section className="card space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-700">Job information</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            Select job
            <select
              className="input-field mt-1"
              value={selectedJobId}
              onChange={(e) => handleJobSelect(e.target.value)}
            >
              <option value="">— Choose a job —</option>
              {filteredJobOptions.map((opt) => (
                <option key={opt.workOrderId} value={opt.workOrderId}>
                  {opt.label}
                </option>
              ))}
              <option value={MANUAL_JOB_ID}>Not listed — enter manually</option>
            </select>
          </label>

          <label className="block text-sm sm:col-span-2">
            Filter by customer last name
            <select
              className="input-field mt-1"
              value={lastNameFilter}
              onChange={(e) => handleLastNameSelect(e.target.value)}
            >
              <option value="">— All customers —</option>
              {lastNameOptions.map((opt) => (
                <option key={opt.lastName} value={opt.lastName}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            HCP invoice / job # *
            <input
              className="input-field mt-1"
              value={jobNumber}
              onChange={(e) => setJobNumber(e.target.value)}
              readOnly={!manualMode && Boolean(selectedJobId)}
              required
            />
          </label>

          <label className="block text-sm">
            Customer last name *
            <input
              className="input-field mt-1"
              value={customerLastName}
              onChange={(e) => setCustomerLastName(e.target.value)}
              readOnly={!manualMode && Boolean(selectedJobId)}
              required
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            Customer name
            <input
              className="input-field mt-1 bg-slate-50 dark:bg-slate-900/60"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              readOnly={!manualMode && Boolean(selectedJobId)}
              placeholder="Autofilled from job"
            />
          </label>

          <label className="block text-sm">
            Technician
            <input className="input-field mt-1" value={technician} onChange={(e) => setTechnician(e.target.value)} />
          </label>

          <label className="block text-sm">
            Board status
            <input
              className="input-field mt-1 bg-slate-50 dark:bg-slate-900/60"
              value={jobStatus ? (JOB_STATUS_LABELS[jobStatus as keyof typeof JOB_STATUS_LABELS] ?? jobStatus) : ''}
              readOnly
              placeholder="Autofilled from job"
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            Cart make / model / year
            <input className="input-field mt-1" value={cartMakeModel} onChange={(e) => setCartMakeModel(e.target.value)} />
          </label>

          <label className="block text-sm sm:col-span-2">
            Serial # or VIN
            <input className="input-field mt-1" value={serialVin} onChange={(e) => setSerialVin(e.target.value)} />
          </label>

          <label className="block text-sm sm:col-span-2">
            Service / complaint
            <textarea
              className="input-field mt-1 min-h-[72px] bg-slate-50 dark:bg-slate-900/60"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              readOnly={!manualMode && Boolean(selectedJobId)}
              placeholder="Autofilled from job"
            />
          </label>
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-700">Photos &amp; videos</h2>
        <p className="text-sm text-slate-500">Before-work shots, findings, repairs, test drive — upload as many as needed.</p>
        <QcMediaUpload items={media} onChange={setMedia} />
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-700">Required before-work photos (7)</h2>
        <ul className="space-y-2">
          {BEFORE_PHOTOS.map((label, i) => (
            <label key={label} className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={beforePhotos[i]} onChange={() => toggleBool(setBeforePhotos, i)} />
              <span>{i + 1}. {label}</span>
            </label>
          ))}
        </ul>
      </section>

      <section className="card space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-700">7-point safety inspection</h2>
        <ul className="space-y-4">
          {INSPECTION_POINTS.map((label, i) => (
            <li key={label} className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <label className="flex items-start gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={inspection[i]!.checked}
                  onChange={() => toggleInspection(i)}
                  className="mt-0.5"
                />
                {label}
              </label>
              <label className="block text-xs text-slate-500">
                Notes
                <textarea
                  className="input-field mt-1 min-h-[56px] text-sm"
                  value={inspection[i]!.notes}
                  onChange={(e) => setInspectionNotes(i, e.target.value)}
                  placeholder="Optional — findings, adjustments, or follow-up"
                />
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-700">Final quality check</h2>
        <ul className="space-y-2">
          {QUALITY_CHECKS.map((label, i) => (
            <label key={label} className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={quality[i]} onChange={() => toggleBool(setQuality, i)} />
              {label}
            </label>
          ))}
        </ul>
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-700">Test drive &amp; delivery readiness</h2>
        <ul className="space-y-2">
          {TEST_DRIVE_CHECKS.map((label, i) => (
            <label key={label} className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={testDrive[i]} onChange={() => toggleBool(setTestDrive, i)} />
              {label}
            </label>
          ))}
        </ul>
        <label className="block text-sm">
          Test drive notes
          <textarea className="input-field mt-1 min-h-[72px]" value={testDriveNotes} onChange={(e) => setTestDriveNotes(e.target.value)} placeholder="Leave blank if no issues." />
        </label>
      </section>

      <section className="card border-2 border-brand-200 bg-brand-50/50 dark:border-brand-900 dark:bg-brand-950/20">
        <label className="flex items-start gap-3 text-sm font-medium text-brand-900 dark:text-brand-100">
          <input type="checkbox" checked={certification} onChange={(e) => setCertification(e.target.checked)} className="mt-1" />
          I certify that I completed all required steps, uploaded photos/videos, performed the 7-point inspection,
          test drove this cart, and verified it is complete, neat, clean, tight, and ready for customer pickup or delivery.
        </label>
      </section>

      <button type="button" className="btn-primary w-full sm:w-auto" disabled={!canSave || saving} onClick={() => void handleSave()}>
        <Save className="h-4 w-4" />
        {saving ? 'Saving…' : 'Save QC Form'}
      </button>
    </div>
  )
}
