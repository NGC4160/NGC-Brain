import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppProvider, useApp } from '@/context/AppContext'
import { Layout } from '@/components/layout/Layout'
import { DashboardPage } from '@/pages/DashboardPage'
import { AgentInputPage } from '@/pages/AgentInputPage'
import { ResourcesPage } from '@/pages/ResourcesPage'
import { JobsPage } from '@/pages/JobsPage'
import { StatusBoardPage } from '@/pages/StatusBoardPage'
import { InvoicingPage } from '@/pages/InvoicingPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { ComingSoonPage } from '@/pages/ComingSoonPage'

function AppRoutes() {
  const { darkMode, setDarkMode } = useApp()

  return (
    <Layout
      darkMode={darkMode}
      onToggleDarkMode={() => setDarkMode(!darkMode)}
    >
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/agent-input" element={<AgentInputPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/board" element={<StatusBoardPage />} />
        <Route path="/inventory" element={<ComingSoonPage />} />
        <Route path="/customers" element={<ComingSoonPage />} />
        <Route path="/scheduling" element={<ComingSoonPage />} />
        <Route path="/invoicing" element={<InvoicingPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  // HashRouter avoids GitHub Pages 404s on deep links / iPhone Safari refreshes
  return (
    <HashRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </HashRouter>
  )
}
