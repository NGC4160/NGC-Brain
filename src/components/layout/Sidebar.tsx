import {
  BookOpen,
  Calendar,
  ClipboardEdit,
  LayoutDashboard,
  Moon,
  Package,
  Receipt,
  Settings,
  Sun,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { navModules, appConfig } from '@/config/app.config'
import { cn } from '@/lib/utils'
import { NavLink } from 'react-router-dom'

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  ClipboardEdit,
  BookOpen,
  Wrench,
  Package,
  Users,
  Calendar,
  Receipt,
  Settings,
}

interface SidebarProps {
  darkMode: boolean
  onToggleDarkMode: () => void
}

export function Sidebar({ darkMode, onToggleDarkMode }: SidebarProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-ngc-200 bg-white dark:border-ngc-800 dark:bg-slate-900">
      <div className="border-b border-ngc-200 bg-gradient-to-br from-ngc-50 to-brand-50 px-4 py-4 dark:border-ngc-800 dark:from-ngc-950 dark:to-slate-900">
        <img
          src={appConfig.logoSrc}
          alt={appConfig.businessName}
          className="h-14 w-full object-contain object-left"
        />
        <p className="mt-2 text-xs font-medium text-ngc-500 dark:text-ngc-300">
          {appConfig.tagline}
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navModules.map((mod) => {
          const Icon = iconMap[mod.icon] ?? LayoutDashboard
          if (!mod.enabled) {
            return (
              <div
                key={mod.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 dark:text-slate-600"
                title={mod.description}
              >
                <Icon className="h-5 w-5 shrink-0 opacity-50" />
                <span>{mod.label}</span>
                <span className="ml-auto rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide dark:bg-slate-800">
                  Soon
                </span>
              </div>
            )
          }
          return (
            <NavLink
              key={mod.id}
              to={mod.path}
              end={mod.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-brand-100 text-brand-800 ring-1 ring-brand-300 dark:bg-brand-950 dark:text-brand-300 dark:ring-brand-800'
                    : 'text-ngc-600 hover:bg-ngc-50 dark:text-ngc-300 dark:hover:bg-ngc-950',
                )
              }
              title={mod.description}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {mod.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-ngc-200 p-3 dark:border-ngc-800">
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ngc-600 transition hover:bg-ngc-50 dark:text-ngc-300 dark:hover:bg-ngc-950"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </aside>
  )
}
