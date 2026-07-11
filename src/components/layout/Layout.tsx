import { useEffect, useState, type ReactNode } from 'react'
import { Menu, Moon, RefreshCw, Sun, X } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { MobileDrawer } from './MobileDrawer'
import { PullToRefresh } from './PullToRefresh'
import { appConfig } from '@/config/app.config'
import { useApp } from '@/context/AppContext'

interface LayoutProps {
  children: ReactNode
  darkMode: boolean
  onToggleDarkMode: () => void
}

export function Layout({ children, darkMode, onToggleDarkMode }: LayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [pullRefreshing, setPullRefreshing] = useState(false)
  const location = useLocation()
  const { refreshHcp, hcpLoading } = useApp()

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  async function handleRefresh() {
    setPullRefreshing(true)
    try {
      await refreshHcp()
    } finally {
      setPullRefreshing(false)
    }
  }

  return (
    <div className="flex min-h-dvh bg-slate-50 dark:bg-slate-950">
      <div className="hidden md:flex">
        <Sidebar darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-ngc-200 bg-white/95 px-3 py-2.5 backdrop-blur safe-top dark:border-ngc-800 dark:bg-slate-900/95 md:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="touch-target inline-flex items-center justify-center rounded-lg text-ngc-600 dark:text-ngc-300"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <NavLink to="/" className="min-w-0 flex-1">
            <img
              src={appConfig.logoSrc}
              alt={appConfig.businessName}
              className="h-9 w-auto max-w-full object-contain object-left"
            />
          </NavLink>
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={hcpLoading || pullRefreshing}
            className="touch-target inline-flex items-center justify-center rounded-lg text-ngc-600 dark:text-ngc-300"
            aria-label="Refresh shop data"
            title="Refresh"
          >
            <RefreshCw
              className={`h-5 w-5 ${hcpLoading || pullRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="touch-target inline-flex items-center justify-center rounded-lg text-ngc-600 dark:text-ngc-300"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </header>

        <PullToRefresh
          onRefresh={handleRefresh}
          refreshing={pullRefreshing}
          className="min-h-0"
        >
          <div className="mx-auto max-w-7xl px-4 py-5 pb-24 sm:px-6 sm:py-8 md:pb-8">
            {children}
          </div>
        </PullToRefresh>

        <BottomNav onOpenMore={() => setDrawerOpen(true)} />
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/50"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col bg-white shadow-xl dark:bg-slate-900 safe-top safe-bottom">
            <div className="flex items-center justify-between border-b border-ngc-200 px-4 py-3 dark:border-ngc-800">
              <p className="text-sm font-semibold text-ngc-700 dark:text-ngc-200">Menu</p>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="touch-target inline-flex items-center justify-center rounded-lg text-slate-500"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <MobileDrawer darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
          </div>
        </div>
      )}
    </div>
  )
}
