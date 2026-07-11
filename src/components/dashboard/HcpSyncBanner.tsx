import { RefreshCw, Wifi, WifiOff, Database } from 'lucide-react'
import { formatRelativeDate } from '@/lib/utils'
import { describeDataMode, formatSyncSource } from '@/services/hcp/fetchDashboard'
import type { HCPDashboardPayload } from '@/services/hcp/fetchDashboard'
import { NGC_BOOKKEEPER } from '@/config/business'
import { Link } from 'react-router-dom'

interface HcpSyncBannerProps {
  meta: Pick<HCPDashboardPayload, 'source' | 'syncedAt' | 'jobCount' | 'bookkeeper'> | null
  loading: boolean
  error: string | null
  onRefresh: () => void
}

export function HcpSyncBanner({ meta, loading, error, onRefresh }: HcpSyncBannerProps) {
  const source = meta?.source
  const isLive = source === 'live'
  const isDms = source === 'dms'
  const canLiveRefresh = isLive || Boolean(import.meta.env.VITE_HCP_API_URL)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ngc-200 bg-ngc-50 px-4 py-3 dark:border-ngc-800 dark:bg-ngc-950">
      <div className="flex items-start gap-3">
        {isLive ? (
          <Wifi className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
        ) : isDms ? (
          <Database className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
        ) : (
          <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-ngc-400" />
        )}
        <div>
          <p className="text-sm font-medium text-ngc-700 dark:text-ngc-200">
            {loading
              ? 'Loading shop data…'
              : meta
                ? `${formatSyncSource(meta.source)} · ${meta.jobCount} jobs`
                : 'Shop data not loaded'}
          </p>
          {!loading && (
            <p className="mt-0.5 text-xs text-slate-500">
              {describeDataMode(source)}
            </p>
          )}
          {meta?.syncedAt && !loading && (
            <p className="text-xs text-slate-500">
              Last updated {formatRelativeDate(meta.syncedAt)}
            </p>
          )}
          <p className="text-xs text-slate-500">
            Bookkeeper: {meta?.bookkeeper ?? NGC_BOOKKEEPER}
            {' · '}
            <Link to="/settings" className="text-brand-600 hover:underline">
              Settings
            </Link>
          </p>
          {error && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="btn-secondary shrink-0 py-2"
        title={
          canLiveRefresh
            ? 'Reload dashboard data'
            : 'Reloads the published cache on Pages (not a live HCP pull)'
        }
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </button>
    </div>
  )
}
