import {
  BookOpen,
  Calendar,
  ClipboardCheck,
  ClipboardEdit,
  ClipboardList,
  Kanban,
  LayoutDashboard,
  Library,
  LogOut,
  Moon,
  Package,
  Receipt,
  Settings,
  Sun,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { navModules, appConfig } from '@/config/app.config'
import { ROLE_LABELS } from '@/config/staff'
import { useAuthContext } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  ClipboardEdit,
  ClipboardCheck,
  ClipboardList,
  Library,
  BookOpen,
  Wrench,
  Kanban,
  Package,
  Users,
  Calendar,
  Receipt,
  Settings,
}

interface MobileDrawerProps {
  darkMode: boolean
  onToggleDarkMode: () => void
}

export function MobileDrawer({ darkMode, onToggleDarkMode }: MobileDrawerProps) {
  const { session, canAccessModule, signOut } = useAuthContext()
  const modules = navModules.filter((m) => m.enabled && canAccessModule(m.id))

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="border-b border-ngc-200 bg-gradient-to-br from-ngc-50 to-brand-50 px-4 py-4 dark:border-ngc-800 dark:from-ngc-950 dark:to-slate-900">
        <img
          src={appConfig.logoSrc}
          alt={appConfig.businessName}
          className="h-12 w-full object-contain object-left"
        />
        <p className="mt-2 text-xs font-medium text-ngc-500 dark:text-ngc-300">
          {appConfig.tagline}
        </p>
        {session && (
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold">{session.name}</span>
            <span className="text-slate-400"> · {ROLE_LABELS[session.role]}</span>
          </p>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {modules.map((mod) => {
          const Icon = iconMap[mod.icon] ?? LayoutDashboard
          return (
            <NavLink
              key={mod.id}
              to={mod.path}
              end={mod.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex min-h-12 items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition',
                  isActive
                    ? 'bg-brand-100 text-brand-800 ring-1 ring-brand-300 dark:bg-brand-950 dark:text-brand-300 dark:ring-brand-800'
                    : 'text-ngc-600 hover:bg-ngc-50 dark:text-ngc-300 dark:hover:bg-ngc-950',
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{mod.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="space-y-1 border-t border-ngc-200 p-3 dark:border-ngc-800">
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-ngc-600 dark:text-ngc-300"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          {darkMode ? 'Light mode' : 'Dark mode'}
        </button>
        <button
          type="button"
          onClick={signOut}
          className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-ngc-600 dark:text-ngc-300"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </div>
  )
}
