import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider, useApp } from '@/context/AppContext'
import { Layout } from '@/components/layout/Layout'
import { DashboardPage } from '@/pages/DashboardPage'
import { AgentInputPage } from '@/pages/AgentInputPage'
import { ResourcesPage } from '@/pages/ResourcesPage'
import { JobsPage } from '@/pages/JobsPage'
import { InvoicingPage } from '@/pages/InvoicingPage'
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
        <Route path="/inventory" element={<ComingSoonPage />} />
        <Route path="/customers" element={<ComingSoonPage />} />
        <Route path="/scheduling" element={<ComingSoonPage />} />
        <Route path="/invoicing" element={<InvoicingPage />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

  return (
    <BrowserRouter basename={basename || undefined}>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  )
}
