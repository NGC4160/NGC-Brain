import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle, Link2, RefreshCw, XCircle } from 'lucide-react'
import { api, type QboStatus } from '@/lib/api'

export function QboPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<QboStatus | null>(null)
  const [syncing, setSyncing] = useState(false)
  const justConnected = searchParams.get('connected') === 'true'

  const load = () => api.qbo.status().then(setStatus)

  useEffect(() => { load() }, [])

  const connect = async () => {
    const { authUrl } = await api.qbo.connect()
    window.location.href = authUrl
  }

  const syncAll = async (type: 'parts' | 'vendors') => {
    setSyncing(true)
    try {
      if (type === 'parts') await api.qbo.syncParts()
      else await api.qbo.syncVendors()
      load()
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">QuickBooks Online</h1>
        <p className="text-slate-500">Two-way sync for inventory & non-inventory items</p>
      </div>

      {justConnected && (
        <div className="card flex items-center gap-3 border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          <p className="text-emerald-800 dark:text-emerald-300">Successfully connected to QuickBooks!</p>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {status?.connected ? (
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            ) : (
              <XCircle className="h-8 w-8 text-slate-400" />
            )}
            <div>
              <h2 className="font-semibold">
                {status?.connected ? status.companyName : 'Not Connected'}
              </h2>
              <p className="text-sm text-slate-500">
                {status?.connected
                  ? `Realm: ${status.realmId} · ${status.failedParts ?? 0} part sync failures · ${status.failedVendors ?? 0} vendor failures`
                  : 'Connect your QBO account to sync inventory'}
              </p>
            </div>
          </div>
          {!status?.connected ? (
            <button type="button" onClick={connect} className="btn-primary">
              <Link2 className="h-4 w-4" /> Connect QuickBooks
            </button>
          ) : (
            <div className="flex gap-2">
              <button type="button" onClick={() => syncAll('parts')} disabled={syncing} className="btn-secondary">
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> Sync Parts
              </button>
              <button type="button" onClick={() => syncAll('vendors')} disabled={syncing} className="btn-secondary">
                Sync Vendors
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 font-semibold">Account Mapping</h2>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          {[
            ['Inventory Asset', 'Inventory Asset account'],
            ['COGS', 'Cost of Goods Sold'],
            ['Sales Income', 'Retail parts sales'],
            ['Expense', 'Shop supplies (non-inventory)'],
            ['Accounts Payable', 'Vendor bills'],
          ].map(([label, desc]) => (
            <div key={label} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <p className="font-medium">{label}</p>
              <p className="text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">Configure account IDs in QBO settings after connecting with live credentials.</p>
      </div>

      {status?.recentLogs && status.recentLogs.length > 0 && (
        <div className="card">
          <h2 className="mb-4 font-semibold">Recent Sync Log</h2>
          <ul className="space-y-2 text-sm">
            {status.recentLogs.map((log) => (
              <li key={log.id} className="flex items-center justify-between">
                <span>{log.entityType} — {log.message}</span>
                <span className={`rounded px-1.5 py-0.5 text-xs ${
                  log.status === 'SYNCED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>{log.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card bg-slate-50 dark:bg-slate-900">
        <h2 className="mb-2 font-semibold">Development Mode</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          With <code>QBO_USE_MOCK=true</code>, clicking Connect uses a mock sandbox that simulates QBO API calls
          without real credentials. Set <code>QBO_USE_MOCK=false</code> and add your Intuit app credentials for production.
        </p>
      </div>
    </div>
  )
}
