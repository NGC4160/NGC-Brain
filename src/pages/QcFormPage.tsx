import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, ClipboardCheck } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useAuthContext } from '@/context/AuthContext'
import { filterJobsForSession, isJobAssignedTo } from '@/lib/jobAccess'
import { JOB_STATUS_LABELS, type RepairJob } from '@/types'

const QC_STORAGE = 'ngc-qc-submissions-v1'

interface QcChecklist {
  prework: Record<string, boolean>
  beforePhotos: Record<string, boolean>
  inspection: Record<string, boolean>
  electric: Record<string, boolean>
  quality: Record<string, boolean>
  testDrive: Record<string, boolean>
  testDriveNotes: string
  certification: boolean
  techSignature: string
  completedAt?: string
}

function emptyChecklist(): QcChecklist {
  return {
    prework: {
      reviewedJob: false,
      verifiedCart: false,
      ppe: false,
      towRun: false,
      batteryDisconnect: false,
      workArea: false,
    },
    beforePhotos: {
      front: false,
      rear: false,
      driverSide: false,
      passengerSide: false,
      battery: false,
      dash: false,
      serial: false,
    },
    inspection: {
      wires: false,
      battery: false,
      lights: false,
      tires: false,
      steering: false,
      drivetrain: false,
      brakes: false,
    },
    electric: {
      faultCodes: false,
      monitorLog: false,
      charger: false,
      lithiumGuide: false,
      na: false,
    },
    quality: {
      completeness: false,
      neatness: false,
      cleanliness: false,
      tightness: false,
      safety: false,
      fluids: false,
      accessories: false,
      toolsParts: false,
      hcpUpdated: false,
    },
    testDrive: {
      forwardReverse: false,
      brakes: false,
      steering: false,
      speed: false,
      complaintResolved: false,
      charged: false,
    },
    testDriveNotes: '',
    certification: false,
    techSignature: '',
  }
}

function loadQcMap(): Record<string, QcChecklist> {
  try {
    const raw = localStorage.getItem(QC_STORAGE)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, QcChecklist>
  } catch {
    return {}
  }
}

function saveQcMap(map: Record<string, QcChecklist>) {
  localStorage.setItem(QC_STORAGE, JSON.stringify(map))
}

function CheckGroup({
  title,
  items,
  values,
  onChange,
}: {
  title: string
  items: { key: string; label: string }[]
  values: Record<string, boolean>
  onChange: (key: string, checked: boolean) => void
}) {
  return (
    <section className="card space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ngc-700 dark:text-ngc-200">
        {title}
      </h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.key}>
            <label className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={Boolean(values[item.key])}
                onChange={(e) => onChange(item.key, e.target.checked)}
              />
              <span>{item.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function QcFormPage() {
  const { jobId: routeJobId } = useParams()
  const navigate = useNavigate()
  const { jobs, updateJob } = useApp()
  const { session, isTechnician } = useAuthContext()
  const visibleJobs = useMemo(
    () => filterJobsForSession(jobs, session),
    [jobs, session],
  )

  const qcCandidates = useMemo(
    () =>
      visibleJobs.filter((j) =>
        ['in-repair', 'qa', 'ready'].includes(j.status),
      ),
    [visibleJobs],
  )

  const [selectedId, setSelectedId] = useState(routeJobId ?? '')
  const selectedJob: RepairJob | undefined = visibleJobs.find(
    (j) => j.id === (selectedId || routeJobId),
  )

  const [form, setForm] = useState<QcChecklist>(() => {
    const map = loadQcMap()
    const id = routeJobId ?? ''
    return id && map[id] ? map[id] : emptyChecklist()
  })
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function selectJob(id: string) {
    setSelectedId(id)
    const map = loadQcMap()
    setForm(map[id] ? { ...emptyChecklist(), ...map[id] } : emptyChecklist())
    setSavedMsg(null)
    setError(null)
    navigate(id ? `/qc/${encodeURIComponent(id)}` : '/qc', { replace: true })
  }

  function patchSection(
    section: keyof Pick<
      QcChecklist,
      'prework' | 'beforePhotos' | 'inspection' | 'electric' | 'quality' | 'testDrive'
    >,
    key: string,
    checked: boolean,
  ) {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: checked },
    }))
  }

  async function handleSave(moveToReady: boolean) {
    setError(null)
    setSavedMsg(null)
    if (!selectedJob) {
      setError('Select an assigned job first')
      return
    }
    if (isTechnician && !isJobAssignedTo(selectedJob, session)) {
      setError('You can only QC jobs assigned to you')
      return
    }
    if (!form.certification || !form.techSignature.trim()) {
      setError('Sign the certification and type your name before saving')
      return
    }

    const completed: QcChecklist = {
      ...form,
      techSignature: form.techSignature.trim(),
      completedAt: new Date().toISOString(),
    }
    const map = loadQcMap()
    map[selectedJob.id] = completed
    saveQcMap(map)

    // Download a JSON copy for the shop archive
    const blob = new Blob(
      [
        JSON.stringify(
          {
            jobId: selectedJob.id,
            customerName: selectedJob.customerName,
            cart: `${selectedJob.make} ${selectedJob.model}`,
            technician: session?.name,
            form: completed,
          },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    )
    const last = selectedJob.customerName.trim().split(/\s+/).pop() ?? 'Customer'
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${selectedJob.id}_${last}_QC.json`
    a.click()
    URL.revokeObjectURL(a.href)

    if (moveToReady && selectedJob.status !== 'ready' && selectedJob.status !== 'picked-up') {
      try {
        await updateJob(selectedJob.id, { status: 'ready' })
        setSavedMsg('QC saved and job moved to Ready')
      } catch (err) {
        setSavedMsg('QC saved on this device')
        setError(err instanceof Error ? err.message : 'Could not move job to Ready')
      }
    } else {
      setSavedMsg('QC saved on this device (JSON downloaded)')
    }
    setForm(completed)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white sm:text-2xl" data-guide="guide-page-title">
          <ClipboardCheck className="h-6 w-6 text-brand-600" />
          Shop QC Form
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isTechnician
            ? `Complete QC for carts assigned to ${session?.name}`
            : 'Complete QC for shop jobs, then move carts to Ready'}
        </p>
      </div>

      <div className="card space-y-3">
        <label className="label" htmlFor="qcJob">
          Job
        </label>
        <select
          id="qcJob"
          className="input-field"
          value={selectedJob?.id ?? ''}
          onChange={(e) => selectJob(e.target.value)}
        >
          <option value="">Select a job…</option>
          {qcCandidates.map((j) => (
            <option key={j.id} value={j.id}>
              {j.customerName} · {j.make} {j.model} · {JOB_STATUS_LABELS[j.status]}
              {j.assignedTech ? ` · ${j.assignedTech}` : ''}
            </option>
          ))}
        </select>
        {qcCandidates.length === 0 && (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {isTechnician
              ? 'No assigned jobs in In Repair / QA / Ready. Ask the service manager to assign work to you.'
              : 'No jobs in In Repair / QA / Ready yet.'}
          </p>
        )}
        {selectedJob && (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {selectedJob.issueDescription}
            {' · '}
            <Link className="text-brand-600 hover:underline" to="/board">
              Status board
            </Link>
          </p>
        )}
      </div>

      {selectedJob && (
        <>
          <CheckGroup
            title="Pre-work shop procedure"
            items={[
              { key: 'reviewedJob', label: 'Reviewed job — complaint, authorized work, parts' },
              { key: 'verifiedCart', label: 'Verified correct cart (invoice #, keys, physical cart)' },
              { key: 'ppe', label: 'PPE in use (glasses, gloves; lithium protocols if needed)' },
              { key: 'towRun', label: 'Tow/run switch in TOW or OFF; cart secured' },
              { key: 'batteryDisconnect', label: 'Battery disconnect / lockout when required' },
              { key: 'workArea', label: 'Work area clean; tools and chocks set safely' },
            ]}
            values={form.prework}
            onChange={(k, v) => patchSection('prework', k, v)}
          />

          <CheckGroup
            title="Required before-work photos (7)"
            items={[
              { key: 'front', label: '1 — Front of cart' },
              { key: 'rear', label: '2 — Rear of cart' },
              { key: 'driverSide', label: '3 — Driver side' },
              { key: 'passengerSide', label: '4 — Passenger side' },
              { key: 'battery', label: '5 — Battery compartment / pack' },
              { key: 'dash', label: '6 — Dash / key / charge port' },
              { key: 'serial', label: '7 — Serial / VIN tag' },
            ]}
            values={form.beforePhotos}
            onChange={(k, v) => patchSection('beforePhotos', k, v)}
          />

          <CheckGroup
            title="7-point safety inspection"
            items={[
              { key: 'wires', label: 'Wires, cables, and terminals' },
              { key: 'battery', label: 'Battery water / lithium pack condition' },
              { key: 'lights', label: 'Lights and horn (if applicable)' },
              { key: 'tires', label: 'Tires — inflation, tread, wear' },
              { key: 'steering', label: 'Steering and suspension' },
              { key: 'drivetrain', label: 'Drivetrain (axle & motor)' },
              { key: 'brakes', label: 'Brakes — operation and adjustment' },
            ]}
            values={form.inspection}
            onChange={(k, v) => patchSection('inspection', k, v)}
          />

          <CheckGroup
            title="Electric diagnostic close-out"
            items={[
              { key: 'faultCodes', label: 'Fault codes reviewed and cleared' },
              { key: 'monitorLog', label: 'Post-repair monitor / log saved if required' },
              { key: 'charger', label: 'Charger tested / verified compatible' },
              { key: 'lithiumGuide', label: 'Lithium care guide staged for customer' },
              { key: 'na', label: 'N/A — non-electrical job' },
            ]}
            values={form.electric}
            onChange={(k, v) => patchSection('electric', k, v)}
          />

          <CheckGroup
            title="Final quality check"
            items={[
              { key: 'completeness', label: 'Completeness — all authorized work finished' },
              { key: 'neatness', label: 'Neatness — wiring secured; panels aligned' },
              { key: 'cleanliness', label: 'Cleanliness — cart and bay wiped down' },
              { key: 'tightness', label: 'Tightness — fasteners and terminals snug' },
              { key: 'safety', label: 'Safety — belts, panels, hold-downs reinstalled' },
              { key: 'fluids', label: 'Fluids / levels checked as applicable' },
              { key: 'accessories', label: 'Accessories function correctly' },
              { key: 'toolsParts', label: 'No tools or old parts left on the cart' },
              { key: 'hcpUpdated', label: 'Job notes / parts / labor / photos updated' },
            ]}
            values={form.quality}
            onChange={(k, v) => patchSection('quality', k, v)}
          />

          <CheckGroup
            title="Test drive & delivery readiness"
            items={[
              { key: 'forwardReverse', label: 'Forward / reverse verified' },
              { key: 'brakes', label: 'Brakes stop smoothly' },
              { key: 'steering', label: 'Steering tracks straight' },
              { key: 'speed', label: 'Speed / acceleration normal; no fault codes' },
              { key: 'complaintResolved', label: 'Customer complaint verified resolved' },
              { key: 'charged', label: 'Cart charged / SOC ready for pickup' },
            ]}
            values={form.testDrive}
            onChange={(k, v) => patchSection('testDrive', k, v)}
          />

          <div className="card space-y-3">
            <label className="label" htmlFor="testDriveNotes">
              Test drive notes
            </label>
            <textarea
              id="testDriveNotes"
              className="input-field"
              rows={3}
              value={form.testDriveNotes}
              onChange={(e) => setForm((p) => ({ ...p, testDriveNotes: e.target.value }))}
              placeholder="Leave blank if no issues. If issues found, do not move to Ready."
            />
          </div>

          <div className="card space-y-3 border-brand-200 dark:border-brand-900">
            <label className="flex items-start gap-3 text-sm font-medium text-ngc-800 dark:text-ngc-100">
              <input
                type="checkbox"
                className="mt-1"
                checked={form.certification}
                onChange={(e) => setForm((p) => ({ ...p, certification: e.target.checked }))}
              />
              <span>
                I certify that I completed the required QC steps, safety inspection, and test drive,
                and this cart is ready for customer pickup or delivery.
              </span>
            </label>
            <div>
              <label className="label" htmlFor="techSignature">
                Technician signature (type name)
              </label>
              <input
                id="techSignature"
                className="input-field"
                value={form.techSignature}
                onChange={(e) => setForm((p) => ({ ...p, techSignature: e.target.value }))}
                placeholder={session?.name ?? 'Your name'}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {savedMsg && (
            <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              {savedMsg}
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary" onClick={() => void handleSave(false)}>
              Save QC only
            </button>
            <button type="button" className="btn-primary" onClick={() => void handleSave(true)}>
              Save QC & move to Ready
            </button>
          </div>
        </>
      )}
    </div>
  )
}
