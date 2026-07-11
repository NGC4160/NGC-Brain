import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, ClipboardCheck, Save } from 'lucide-react'
import { QcMediaUpload, type MediaItem } from '@/components/qc/QcMediaUpload'
import { useApp } from '@/context/AppContext'
import { fetchQcContext, saveQcForm } from '@/services/dms/qc'

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
  'Customer complaint resolved',
  'Cart charged / SOC appropriate',
]

export function QcFormPage() {
  const [params] = useSearchParams()
  const { writeMode, refreshHcp } = useApp()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [media, setMedia] = useState<MediaItem[]>([])

  const [jobNumber, setJobNumber] = useState('')
  const [customerLastName, setCustomerLastName] = useState('')
  const [technician, setTechnician] = useState('')
  const [cartMakeModel, setCartMakeModel] = useState('')
  const [serialVin, setSerialVin] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [workOrderId, setWorkOrderId] = useState<string | null>(null)

  const [beforePhotos, setBeforePhotos] = useState<boolean[]>(() => BEFORE_PHOTOS.map(() => false))
  const [inspection, setInspection] = useState<boolean[]>(() => INSPECTION_POINTS.map(() => false))
  const [quality, setQuality] = useState<boolean[]>(() => QUALITY_CHECKS.map(() => false))
  const [testDrive, setTestDrive] = useState<boolean[]>(() => TEST_DRIVE_CHECKS.map(() => false))
  const [certification, setCertification] = useState(false)
  const [testDriveNotes, setTestDriveNotes] = useState('')

  const apiAvailable = writeMode === 'api'

  useEffect(() => {
    const job = params.get('job') ?? params.get('invoice') ?? ''
    const wo = params.get('workOrderId') ?? ''
    if (!apiAvailable) {
      setJobNumber(job)
      setLoading(false)
      return
    }
    void (async () => {
      if (!job && !wo) {
        setLoading(false)
        return
      }
      try {
        const ctx = await fetchQcContext({ job: job || undefined, workOrderId: wo || undefined })
        setJobNumber(ctx.jobNumber)
        setCustomerLastName(ctx.customerLastName)
        setTechnician(ctx.technician ?? '')
        setCartMakeModel(ctx.cartMakeModel ?? '')
        setSerialVin(ctx.serialVin ?? '')
        setServiceType(ctx.serviceType ?? '')
        setWorkOrderId(ctx.workOrderId)
      } catch (err) {
        if (job) setJobNumber(job)
        setError(err instanceof Error ? err.message : 'Could not load job')
      } finally {
        setLoading(false)
      }
    })()
  }, [params, apiAvailable])

  const canSave = useMemo(
    () => jobNumber.trim() && customerLastName.trim() && certification && apiAvailable,
    [jobNumber, customerLastName, certification, apiAvailable],
  )

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const payload = {
        jobNumber: jobNumber.trim(),
        customerLastName: customerLastName.trim(),
        technician,
        cartMakeModel,
        serialVin,
        serviceType,
        workOrderId,
        beforePhotos: BEFORE_PHOTOS.map((label, i) => ({ label, checked: beforePhotos[i] })),
        inspection: INSPECTION_POINTS.map((label, i) => ({ label, checked: inspection[i] })),
        quality: QUALITY_CHECKS.map((label, i) => ({ label, checked: quality[i] })),
        testDrive: TEST_DRIVE_CHECKS.map((label, i) => ({ label, checked: testDrive[i] })),
        testDriveNotes,
        certification,
        savedFrom: 'ngc-dms',
      }
      const result = await saveQcForm(payload, media.map((m) => m.file))
      setSuccess(
        `${result.message}${result.movedToReady ? ' · Job moved to READY on the status board.' : ''}`,
      )
      if (result.movedToReady) await refreshHcp()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function toggle(setter: React.Dispatch<React.SetStateAction<boolean[]>>, index: number) {
    setter((prev) => prev.map((v, i) => (i === index ? !v : v)))
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
            Complete QC, upload photos/videos, and save to{' '}
            <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">QC forms/{'{job#}_{LastName}'}.zip</code>
          </p>
        </div>
        <Link to="/board" className="btn-secondary self-start">
          Back to board
        </Link>
      </div>

      {!apiAvailable && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          QC save requires the local DMS API. Run <code className="mx-1">npm run dev:all</code> on the shop computer —
          GitHub Pages view is read-only.
        </div>
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
          <label className="block text-sm">
            HCP invoice / job # *
            <input className="input-field mt-1" value={jobNumber} onChange={(e) => setJobNumber(e.target.value)} required />
          </label>
          <label className="block text-sm">
            Customer last name *
            <input className="input-field mt-1" value={customerLastName} onChange={(e) => setCustomerLastName(e.target.value)} required />
          </label>
          <label className="block text-sm">
            Technician
            <input className="input-field mt-1" value={technician} onChange={(e) => setTechnician(e.target.value)} />
          </label>
          <label className="block text-sm">
            Cart make / model / year
            <input className="input-field mt-1" value={cartMakeModel} onChange={(e) => setCartMakeModel(e.target.value)} />
          </label>
          <label className="block text-sm sm:col-span-2">
            Serial # or VIN
            <input className="input-field mt-1" value={serialVin} onChange={(e) => setSerialVin(e.target.value)} />
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
              <input type="checkbox" checked={beforePhotos[i]} onChange={() => toggle(setBeforePhotos, i)} />
              <span>{i + 1}. {label}</span>
            </label>
          ))}
        </ul>
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-700">7-point safety inspection</h2>
        <ul className="space-y-2">
          {INSPECTION_POINTS.map((label, i) => (
            <label key={label} className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={inspection[i]} onChange={() => toggle(setInspection, i)} />
              {label}
            </label>
          ))}
        </ul>
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-700">Final quality check</h2>
        <ul className="space-y-2">
          {QUALITY_CHECKS.map((label, i) => (
            <label key={label} className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={quality[i]} onChange={() => toggle(setQuality, i)} />
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
              <input type="checkbox" checked={testDrive[i]} onChange={() => toggle(setTestDrive, i)} />
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
