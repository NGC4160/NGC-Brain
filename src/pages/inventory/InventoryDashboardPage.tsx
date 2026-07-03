import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  DollarSign,
  Package,
  ShoppingCart,
  Truck,
  Wrench,
} from 'lucide-react'
import { api, type DashboardKpis } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { InventoryKpiCard } from '@/components/inventory/InventoryKpiCard'

export function InventoryDashboardPage() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.dashboard.kpis()
      .then(setKpis)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-slate-500">Loading inventory dashboard...</p>
  if (error) return (
    <div className="card border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
      <p className="font-medium text-amber-800 dark:text-amber-200">API unavailable</p>
      <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">{error}</p>
      <p className="mt-2 text-sm text-amber-600">Start the backend: <code>cd backend && npm run dev</code></p>
    </div>
  )
  if (!kpis) return null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory Dashboard</h1>
        <p className="mt-1 text-slate-500">2 locations · retail + repair parts · QBO synced</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InventoryKpiCard label="Total SKUs" value={String(kpis.totalSkus)} icon={Package} />
        <InventoryKpiCard label="Low Stock" value={String(kpis.lowStockCount)} icon={AlertTriangle} variant={kpis.lowStockCount > 0 ? 'warning' : 'default'} />
        <InventoryKpiCard label="Out of Stock" value={String(kpis.outOfStockCount)} icon={AlertTriangle} variant={kpis.outOfStockCount > 0 ? 'danger' : 'default'} />
        <InventoryKpiCard label="Inventory Value" value={formatCurrency(kpis.inventoryValue)} icon={DollarSign} />
        <InventoryKpiCard label="Open POs" value={String(kpis.openPOs)} icon={Truck} />
        <InventoryKpiCard label="Open Work Orders" value={String(kpis.openWorkOrders)} icon={Wrench} />
        <InventoryKpiCard label="Retail Sales (MTD)" value={formatCurrency(kpis.retailSalesMtd)} icon={ShoppingCart} />
        <InventoryKpiCard label="QBO Sync Failures" value={String(kpis.failedQboSyncs)} icon={AlertTriangle} variant={kpis.failedQboSyncs > 0 ? 'danger' : 'default'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">Low-Stock Alerts</h2>
            <Link to="/inventory/parts?lowStock=true" className="text-sm text-brand-600 hover:underline">
              View all <ArrowRight className="inline h-4 w-4" />
            </Link>
          </div>
          {kpis.lowStockAlerts.length === 0 ? (
            <p className="text-sm text-slate-500">All parts above reorder point</p>
          ) : (
            <ul className="space-y-2">
              {kpis.lowStockAlerts.slice(0, 8).map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm dark:bg-red-950/30">
                  <span className="font-medium">{p.sku} — {p.name}</span>
                  <span className="text-red-600 dark:text-red-400">{p.totalQty} / {p.reorderPoint}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Top Used Parts (30 days)</h2>
          {kpis.topUsedParts.length === 0 ? (
            <p className="text-sm text-slate-500">No usage data yet</p>
          ) : (
            <ul className="space-y-2">
              {kpis.topUsedParts.map(({ part, quantity }) => (
                <li key={part!.id} className="flex items-center justify-between text-sm">
                  <span>{part!.sku} — {part!.name}</span>
                  <span className="font-medium text-slate-600 dark:text-slate-400">{quantity} used</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { to: '/inventory/parts', label: 'Parts Catalog' },
          { to: '/inventory/stock', label: 'Stock by Location' },
          { to: '/inventory/retail', label: 'Retail Sales' },
          { to: '/inventory/purchase-orders', label: 'Purchase Orders' },
          { to: '/inventory/work-orders', label: 'Work Orders' },
          { to: '/inventory/core-returns', label: 'Core Returns' },
          { to: '/inventory/qbo', label: 'QuickBooks' },
          { to: '/inventory/alerts', label: 'Alert Settings' },
        ].map((link) => (
          <Link key={link.to} to={link.to} className="card transition hover:border-brand-300 hover:shadow-md dark:hover:border-brand-700">
            <span className="font-medium text-brand-700 dark:text-brand-400">{link.label}</span>
            <ArrowRight className="mt-2 h-4 w-4 text-slate-400" />
          </Link>
        ))}
      </div>
    </div>
  )
}
