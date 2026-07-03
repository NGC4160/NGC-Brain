import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'

interface LayoutProps {
  children: ReactNode
  darkMode: boolean
  onToggleDarkMode: () => void
}

export function Layout({ children, darkMode, onToggleDarkMode }: LayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      </main>
    </div>
  )
}
