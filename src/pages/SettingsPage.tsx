import { useCallback, useEffect, useState } from 'react'
import {
  Database,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
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

export function SettingsPage() {
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null)
  const [qboStatus, setQboStatus] = useState<QboStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [imp, qbo] = await Promise.all([fetchImportStatus(), fetchQboStatus()])
      setImportStatus(imp)
      setQboStatus(qbo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings & Import</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Import Housecall Pro exports, connect QuickBooks Online, and manage DMS configuration
        </p>
      </div>

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
        </dl>
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
                Import all exportable HCP data into the local DMS database
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleImport()}
            disabled={importing || loading}
            className="btn-primary"
          >
            <RefreshCw className={`h-4 w-4 ${importing ? 'animate-spin' : ''}`} />
            {importing ? 'Importing…' : 'Run Import'}
          </button>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Supported export files</h3>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {HCP_EXPORT_FILE_LIST.map((file) => (
              <li key={file} className="font-mono text-xs text-slate-600 dark:text-slate-400">
                data/imports/hcp/{file}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Place exports from Housecall Pro in <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">data/imports/hcp/</code>{' '}
            or run <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">npm run import:hcp</code> from the project root.
          </p>
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

        {importStatus?.lastImport && (
          <p className="mt-4 text-xs text-slate-500">
            Last import: {importStatus.lastImport.status} ·{' '}
            {importStatus.lastImport.completed_at ?? importStatus.lastImport.started_at}
          </p>
        )}
      </section>

      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">QuickBooks Online</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Connect QBO for invoice and payment sync. Accounting records stay in QuickBooks for{' '}
              {NGC_BOOKKEEPER}.
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
              disabled={!qboStatus?.configured || loading}
              className="btn-secondary"
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
                {!qboStatus.configured
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
