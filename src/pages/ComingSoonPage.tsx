import { useLocation } from 'react-router-dom'
import { navModules } from '@/config/app.config'
import { Construction } from 'lucide-react'

export function ComingSoonPage() {
  const { pathname } = useLocation()
  const mod = navModules.find((m) => m.path === pathname)

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Construction className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        {mod?.label ?? 'Module'} — Coming Soon
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        {mod?.description ?? 'This module is planned for a future release.'}
        Enable it in <code className="text-xs">src/config/app.config.ts</code> once implemented.
      </p>
    </div>
  )
}
