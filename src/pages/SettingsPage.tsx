import { FormEvent, useCallback, useEffect, useState } from 'react'
import {
  Database,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  BookOpen,
  Globe,
  KeyRound,
} from 'lucide-react'
import {
  fetchImportStatus,
  fetchQboStatus,
  getQboConnectUrl,
  HCP_EXPORT_FILE_LIST,
  runHcpImport,
  type ImportStatus,
  type QboStatus,
} from '@/services/dms/api'
import { NGC_BOOKKEEPER } from '@/config/business'
import { ROLE_LABELS, MAX_TECHNICIANS } from '@/config/staff'
import { useAuthContext } from '@/context/AuthContext'
import { Link } from 'react-router-dom'
import { createDraftSop, listAllSops, saveCustomSop } from '@/sops/registry'

type ApiMode = 'checking' | 'live' | 'pages'

export function SettingsPage() {
  const { staff, updateStaffMember, canManageStaff, resetStaffDefaults } = useAuthContext()
  const [apiMode, setApiMode] = useState<ApiMode>('checking')
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null)
  const [qboStatus, setQboStatus] = useState<QboStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [customTitle, setCustomTitle] = useState('')
  const [customDesc, setCustomDesc] = useState('')
  const [customItems, setCustomItems] = useState('')
  const [customSavedId, setCustomSavedId] = useState<string | null>(null)
  const sopCount = listAllSops().length

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [imp, qbo] = await Promise.all([fetchImportStatus(), fetchQboStatus()])
      setImportStatus(imp)
      setQboStatus(qbo)
      setApiMode('live')
    } catch {
      setApiMode('pages')
      setImportStatus({
        counts: { customers: 0, vehicles: 0, workOrders: 0, pricebookItems: 0 },
        lastImport: null,
        bookkeeper: NGC_BOOKKEEPER,
      })
      setQboStatus({
        configured: false,
        connected: false,
        realmId: null,
        companyName: null,
        bookkeeper: NGC_BOOKKEEPER,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleImport = async () => {
    setImporting(true)
    setError(null)
    setImportResult(null)
    try {
      const { stats, status } = await runHcpImport()
      setImportStatus(status)
      setImportResult(
        `Imported ${stats.workOrdersCreated + stats.workOrdersUpdated} work orders, ` +
          `${stats.customersCreated + stats.customersUpdated} customers, ` +
          `${stats.pricebookCreated + stats.pricebookUpdated} pricebook items.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const handleQboConnect = async () => {
    try {
      const url = await getQboConnectUrl()
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start QBO connection')
    }
  }

  const onPages = apiMode === 'pages'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings & Import</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Shop configuration, Housecall Pro import, and QuickBooks Online
        </p>
      </div>

      {apiMode !== 'checking' && (
        <div
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
            onPages
              ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950'
              : 'border-brand-200 bg-brand-50 dark:border-brand-900 dark:bg-brand-950'
          }`}
        >
          <Globe className={`mt-0.5 h-5 w-5 shrink-0 ${onPages ? 'text-amber-700 dark:text-amber-300' : 'text-brand-600'}`} />
          <div>
            <p className={`text-sm font-medium ${onPages ? 'text-amber-900 dark:text-amber-100' : 'text-brand-800 dark:text-brand-100'}`}>
              {onPages ? 'Running on GitHub Pages (static)' : 'Connected to local NGC API'}
            </p>
            <p className={`mt-0.5 text-xs ${onPages ? 'text-amber-800 dark:text-amber-200' : 'text-brand-700 dark:text-brand-300'}`}>
              {onPages
                ? 'Dashboard data is the published HCP cache. Live import and QBO connect need npm run dev:all on a computer.'
                : 'Import and QuickBooks actions are available against the local SQLite DMS.'}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {importResult && (
        <div className="flex items-start gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800 dark:border-brand-900 dark:bg-brand-950 dark:text-brand-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {importResult}
        </div>
      )}

      <section className="card p-6">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Business Profile</h2>
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Bookkeeper</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
              {importStatus?.bookkeeper ?? qboStatus?.bookkeeper ?? NGC_BOOKKEEPER}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Accounting basis</dt>
            <dd className="mt-1 text-sm text-slate-900 dark:text-white">Cash (QuickBooks Online)</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Daily board URL</dt>
            <dd className="mt-1 text-sm text-slate-900 dark:text-white">
              <a
                href="https://ngc4160.github.io/NGC-Brain/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:underline"
              >
                ngc4160.github.io/NGC-Brain
              </a>
            </dd>
          </div>
        </dl>
      </section>

      {canManageStaff && (
        <section className="card space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <KeyRound className="mt-0.5 h-5 w-5 text-brand-600" />
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Staff passcodes
                </h2>
                <p className="text-sm text-slate-500">
                  Up to {MAX_TECHNICIANS} technicians + service manager. Passcodes are 4–6 digits
                  (shop-floor PINs on this device).
                </p>
              </div>
            </div>
            <button type="button" className="btn-secondary" onClick={resetStaffDefaults}>
              Reset defaults
            </button>
          </div>
          <ul className="space-y-3">
            {staff.map((member) => (
              <li
                key={member.id}
                className="grid gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800 sm:grid-cols-[1fr_1fr_7rem]"
              >
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {ROLE_LABELS[member.role]}
                    {member.techSlot ? ` · slot ${member.techSlot}` : ''}
                  </p>
                  <input
                    className="input-field mt-1"
                    value={member.name}
                    placeholder={member.role === 'technician' ? 'Technician name' : 'Name'}
                    onChange={(e) => updateStaffMember(member.id, { name: e.target.value })}
                    disabled={member.role !== 'technician' && member.id === 'owner-ngc'}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Passcode
                  </p>
                  <input
                    className="input-field mt-1 tracking-widest"
                    inputMode="numeric"
                    value={member.passcode}
                    placeholder="4–6 digits"
                    onChange={(e) =>
                      updateStaffMember(member.id, {
                        passcode: e.target.value.replace(/\D/g, '').slice(0, 6),
                      })
                    }
                  />
                </div>
                <div className="flex items-end">
                  {member.role === 'technician' ? (
                    <label className="flex min-h-11 items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={member.active && Boolean(member.name.trim() && member.passcode)}
                        onChange={(e) =>
                          updateStaffMember(member.id, {
                            active: e.target.checked,
                          })
                        }
                      />
                      Active
                    </label>
                  ) : (
                    <p className="pb-3 text-xs text-slate-400">
                      {member.active ? 'Active' : 'Inactive'}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card space-y-4 p-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-brand-600" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">SOPs on file</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {sopCount} procedures registered. The DMS hub runs every catalog SOP plus any custom
              checklists saved on this device. Ship permanent SOPs in{' '}
              <code className="text-xs">src/sops/catalog/</code> — see{' '}
              <code className="text-xs">docs/ADDING_SOPS.md</code>.
            </p>
          </div>
        </div>
        <Link to="/sops" className="btn-secondary inline-flex">
          Open SOPs hub
        </Link>

        {canManageStaff && (
          <form
            className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800"
            onSubmit={(e: FormEvent) => {
              e.preventDefault()
              const title = customTitle.trim()
              if (!title) return
              const id = title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
                .slice(0, 48)
              const checklist = customItems
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean)
                .map((label, i) => ({ id: `item-${i + 1}`, label, required: true }))
              const sop = createDraftSop({
                id: id || `custom-${Date.now()}`,
                title,
                description: customDesc.trim() || 'Custom shop checklist.',
                status: 'active',
                runtime: 'checklist',
                accessRoles: ['front-desk', 'service-manager', 'owner', 'technician'],
                ownerRoles: ['service-manager'],
                steps: [
                  {
                    id: 'run',
                    title: 'Run checklist',
                    summary: 'Complete every required item, then mark the run complete.',
                  },
                ],
                checklist:
                  checklist.length > 0
                    ? checklist
                    : [{ id: 'done', label: 'Procedure completed', required: true }],
              })
              saveCustomSop(sop)
              setCustomSavedId(sop.id)
              setCustomTitle('')
              setCustomDesc('')
              setCustomItems('')
            }}
          >
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Add checklist SOP (this device)
            </h3>
            <p className="text-xs text-slate-500">
              Instantly operable from the SOPs hub. For shop-wide permanent SOPs, also add them to the
              catalog in a deploy.
            </p>
            <input
              className="input-field w-full"
              placeholder="Title (e.g. Battery watering)"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              required
            />
            <input
              className="input-field w-full"
              placeholder="Short description"
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
            />
            <textarea
              className="input-field min-h-[88px] w-full"
              placeholder="Checklist items — one per line"
              value={customItems}
              onChange={(e) => setCustomItems(e.target.value)}
            />
            <button type="submit" className="btn-primary">
              Save to SOP registry
            </button>
            {customSavedId && (
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Saved.{' '}
                <Link to={`/sops/${customSavedId}`} className="underline">
                  Open SOP
                </Link>
              </p>
            )}
          </form>
        )}
      </section>

      <section className="card p-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-brand-600" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Manuals & Google Drive</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Add Drive share links in <code className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-800">src/data/resources.json</code>
            </p>
          </div>
        </div>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
          <li>In Google Drive, open the file → Share → Anyone with the link → Copy link</li>
          <li>
            Prefer a file link like{' '}
            <code className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-800">
              https://drive.google.com/file/d/FILE_ID/view
            </code>
          </li>
          <li>Add or edit an entry in resources.json (title, category, url, make/model, tags)</li>
          <li>
            Redeploy Pages with <code className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-800">npm run deploy:pages</code>
          </li>
        </ol>
        <Link to="/resources" className="btn-secondary mt-4 inline-flex">
          Open Manuals & Files
        </Link>
      </section>

      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-brand-600" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Housecall Pro Import
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Import HCP exports into the local DMS database
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleImport()}
            disabled={importing || loading || onPages}
            className="btn-primary"
            title={onPages ? 'Requires local API (npm run dev:all)' : undefined}
          >
            <RefreshCw className={`h-4 w-4 ${importing ? 'animate-spin' : ''}`} />
            {importing ? 'Importing…' : 'Run Import'}
          </button>
        </div>

        {onPages ? (
          <p className="mt-4 text-sm text-slate-500">
            On Pages this button is disabled. On a computer:{' '}
            <code className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-800">npm run import:hcp</code>{' '}
            or start <code className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-800">npm run dev:all</code> and use this page.
          </p>
        ) : (
          <>
            <div className="mt-6">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Supported export files</h3>
              <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                {HCP_EXPORT_FILE_LIST.map((file) => (
                  <li key={file} className="font-mono text-xs text-slate-600 dark:text-slate-400">
                    data/imports/hcp/{file}
                  </li>
                ))}
              </ul>
            </div>

            {importStatus && (
              <div className="mt-6 grid gap-4 sm:grid-cols-4">
                {[
                  { label: 'Customers', value: importStatus.counts.customers },
                  { label: 'Vehicles', value: importStatus.counts.vehicles },
                  { label: 'Work Orders', value: importStatus.counts.workOrders },
                  { label: 'Pricebook Items', value: importStatus.counts.pricebookItems },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="text-xl font-semibold text-slate-900 dark:text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">QuickBooks Online</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Accounting stays in QBO for {NGC_BOOKKEEPER}. OAuth connect works with the local API (Phase 5 finishes sync).
            </p>
          </div>
          {qboStatus?.connected ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-800 dark:bg-brand-900 dark:text-brand-200">
              <CheckCircle2 className="h-4 w-4" />
              Connected
            </span>
          ) : (
            <button
              type="button"
              onClick={() => void handleQboConnect()}
              disabled={!qboStatus?.configured || loading || onPages}
              className="btn-secondary"
              title={onPages ? 'Requires local API' : undefined}
            >
              <ExternalLink className="h-4 w-4" />
              Connect QuickBooks
            </button>
          )}
        </div>

        {qboStatus && (
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</dt>
              <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                {onPages
                  ? 'Available with local API + QBO credentials in .env'
                  : !qboStatus.configured
                    ? 'Add QBO_CLIENT_ID and QBO_CLIENT_SECRET to .env'
                    : qboStatus.connected
                      ? `Connected · ${qboStatus.companyName ?? qboStatus.realmId}`
                      : 'Not connected'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Income routing</dt>
              <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                LFP Conversions Only · Sales and Services · Services Income
              </dd>
            </div>
          </dl>
        )}
      </section>

      <div className="flex justify-end">
        <button type="button" onClick={() => void load()} disabled={loading} className="btn-secondary">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh status
        </button>
      </div>
    </div>
  )
}
