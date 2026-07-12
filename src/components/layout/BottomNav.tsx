import {
  ClipboardCheck,
  ClipboardEdit,
  ClipboardList,
  Kanban,
  LayoutDashboard,
  Library,
  MoreHorizontal,
  Receipt,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuthContext } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

interface Tab {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  moduleId: string
}

const allTabs: Tab[] = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true, moduleId: 'dashboard' },
  { to: '/intake', label: 'Intake', icon: ClipboardList, moduleId: 'intake' },
  { to: '/sops', label: 'SOPs', icon: Library, moduleId: 'sops' },
  { to: '/board', label: 'Board', icon: Kanban, moduleId: 'board' },
  { to: '/jobs', label: 'Jobs', icon: Wrench, moduleId: 'jobs' },
  { to: '/qc', label: 'QC', icon: ClipboardCheck, moduleId: 'qc' },
  { to: '/agent-input', label: 'Input', icon: ClipboardEdit, moduleId: 'agent-input' },
  { to: '/invoicing', label: 'AR', icon: Receipt, moduleId: 'invoicing' },
]

interface BottomNavProps {
  onOpenMore: () => void
}

export function BottomNav({ onOpenMore }: BottomNavProps) {
  const { canAccessModule, isTechnician, session } = useAuthContext()
  const isOffice =
    session?.role === 'front-desk' ||
    session?.role === 'service-manager' ||
    session?.role === 'owner'
  const isDriver = session?.role === 'driver'

  const preferred = allTabs.filter((t) => {
    if (!canAccessModule(t.moduleId)) return false
    if (isTechnician && (t.moduleId === 'invoicing' || t.moduleId === 'intake')) return false
    if (!isTechnician && t.moduleId === 'qc') return false
    if (isOffice && t.moduleId === 'agent-input') return false
    // Ryan / Christine / Owner: keep SOPs in the primary bar (drop AR if needed)
    if (isOffice && t.moduleId === 'invoicing') return false
    // Drivers: Home, SOPs, Board
    if (isDriver && !['dashboard', 'sops', 'board'].includes(t.moduleId)) return false
    // Techs: prefer SOPs over agent-input in the bar
    if (isTechnician && t.moduleId === 'agent-input') return false
    return true
  })

  const tabs = preferred.slice(0, 5)

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ngc-200 bg-white/95 backdrop-blur safe-bottom dark:border-ngc-800 dark:bg-slate-900/95 md:hidden">
      <div
        className="grid gap-0.5 px-1 py-1"
        style={{ gridTemplateColumns: `repeat(${tabs.length + 1}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 text-[10px] font-medium',
                  isActive
                    ? 'text-brand-700 dark:text-brand-300'
                    : 'text-slate-500 dark:text-slate-400',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.25]')} />
                  {tab.label}
                </>
              )}
            </NavLink>
          )
        })}
        <button
          type="button"
          onClick={onOpenMore}
          className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400"
        >
          <MoreHorizontal className="h-5 w-5" />
          More
        </button>
      </div>
    </nav>
  )
}
