import {
  ClipboardEdit,
  Kanban,
  LayoutDashboard,
  MoreHorizontal,
  Receipt,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

const tabs: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/board', label: 'Board', icon: Kanban },
  { to: '/jobs', label: 'Jobs', icon: Wrench },
  { to: '/agent-input', label: 'Input', icon: ClipboardEdit },
  { to: '/invoicing', label: 'AR', icon: Receipt },
]

interface BottomNavProps {
  onOpenMore: () => void
}

export function BottomNav({ onOpenMore }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ngc-200 bg-white/95 backdrop-blur safe-bottom dark:border-ngc-800 dark:bg-slate-900/95 md:hidden">
      <div className="grid grid-cols-6 gap-0.5 px-1 py-1">
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
