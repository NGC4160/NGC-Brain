import { HashRouter, Navigate, Routes, Route } from 'react-router-dom'
import { AppProvider, useApp } from '@/context/AppContext'
import { AuthProvider, useAuthContext } from '@/context/AuthContext'
import { GuideProvider } from '@/context/GuideContext'
import { Layout } from '@/components/layout/Layout'
import { DashboardPage } from '@/pages/DashboardPage'
import { AgentInputPage } from '@/pages/AgentInputPage'
import { CustomerIntakePage } from '@/pages/CustomerIntakePage'
import { SopsHubPage, SopDetailPage } from '@/pages/SopsPages'
import { KpiHubPage } from '@/pages/KpiHubPage'
import { ResourcesPage } from '@/pages/ResourcesPage'
import { JobsPage } from '@/pages/JobsPage'
import { StatusBoardPage } from '@/pages/StatusBoardPage'
import { QcFormPage } from '@/pages/QcFormPage'
import { InvoicingPage } from '@/pages/InvoicingPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { ComingSoonPage } from '@/pages/ComingSoonPage'
import { LoginPage } from '@/pages/LoginPage'
import { GuidePage } from '@/pages/GuidePage'

function RequireModule({
  moduleId,
  children,
}: {
  moduleId: string
  children: React.ReactNode
}) {
  const { canAccessModule } = useAuthContext()
  if (!canAccessModule(moduleId)) {
    return <Navigate to="/" replace />
  }
  return children
}

function AppRoutes() {
  const { darkMode, setDarkMode } = useApp()
  const { isAuthenticated } = useAuthContext()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <GuideProvider>
    <Layout
      darkMode={darkMode}
      onToggleDarkMode={() => setDarkMode(!darkMode)}
    >
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route
          path="/agent-input"
          element={
            <RequireModule moduleId="agent-input">
              <AgentInputPage />
            </RequireModule>
          }
        />
        <Route
          path="/intake"
          element={
            <RequireModule moduleId="intake">
              <CustomerIntakePage />
            </RequireModule>
          }
        />
        <Route
          path="/sops"
          element={
            <RequireModule moduleId="sops">
              <SopsHubPage />
            </RequireModule>
          }
        />
        <Route
          path="/sops/:sopId"
          element={
            <RequireModule moduleId="sops">
              <SopDetailPage />
            </RequireModule>
          }
        />
        <Route
          path="/kpi-hub"
          element={
            <RequireModule moduleId="kpi-hub">
              <KpiHubPage />
            </RequireModule>
          }
        />
        <Route
          path="/resources"
          element={
            <RequireModule moduleId="resources">
              <ResourcesPage />
            </RequireModule>
          }
        />
        <Route
          path="/jobs"
          element={
            <RequireModule moduleId="jobs">
              <JobsPage />
            </RequireModule>
          }
        />
        <Route
          path="/board"
          element={
            <RequireModule moduleId="board">
              <StatusBoardPage />
            </RequireModule>
          }
        />
        <Route
          path="/qc"
          element={
            <RequireModule moduleId="qc">
              <QcFormPage />
            </RequireModule>
          }
        />
        <Route path="/qc/:jobId" element={
          <RequireModule moduleId="qc">
            <QcFormPage />
          </RequireModule>
        } />
        <Route path="/inventory" element={<ComingSoonPage />} />
        <Route path="/customers" element={<ComingSoonPage />} />
        <Route path="/scheduling" element={<ComingSoonPage />} />
        <Route
          path="/invoicing"
          element={
            <RequireModule moduleId="invoicing">
              <InvoicingPage />
            </RequireModule>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireModule moduleId="settings">
              <SettingsPage />
            </RequireModule>
          }
        />
      </Routes>
    </Layout>
    </GuideProvider>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </HashRouter>
  )
}
