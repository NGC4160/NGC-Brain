import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/inventory', label: 'Overview', end: true },
  { to: '/inventory/parts', label: 'Parts' },
  { to: '/inventory/stock', label: 'Stock' },
  { to: '/inventory/retail', label: 'Retail' },
  { to: '/inventory/purchase-orders', label: 'POs' },
  { to: '/inventory/work-orders', label: 'Work Orders' },
  { to: '/inventory/core-returns', label: 'Core Returns' },
  { to: '/inventory/qbo', label: 'QBO' },
  { to: '/inventory/alerts', label: 'Alerts' },
]

export function InventoryLayout() {
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-1 border-b border-slate-200 pb-1 dark:border-slate-800">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                'rounded-t-lg px-3 py-2 text-sm font-medium transition',
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-400'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
