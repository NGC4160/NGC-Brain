import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider, useApp } from '@/context/AppContext'
import { Layout } from '@/components/layout/Layout'
import { DashboardPage } from '@/pages/DashboardPage'
import { AgentInputPage } from '@/pages/AgentInputPage'
import { ResourcesPage } from '@/pages/ResourcesPage'
import { JobsPage } from '@/pages/JobsPage'
import { ComingSoonPage } from '@/pages/ComingSoonPage'
import { InventoryLayout } from '@/pages/inventory/InventoryLayout'
import { InventoryDashboardPage } from '@/pages/inventory/InventoryDashboardPage'
import { PartsPage } from '@/pages/inventory/PartsPage'
import { StockPage } from '@/pages/inventory/StockPage'
import { RetailPage } from '@/pages/inventory/RetailPage'
import { PurchaseOrdersPage } from '@/pages/inventory/PurchaseOrdersPage'
import { InventoryWorkOrdersPage } from '@/pages/inventory/InventoryWorkOrdersPage'
import { CoreReturnsPage } from '@/pages/inventory/CoreReturnsPage'
import { QboPage } from '@/pages/inventory/QboPage'
import { AlertsPage } from '@/pages/inventory/AlertsPage'

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
        <Route path="/inventory" element={<InventoryLayout />}>
          <Route index element={<InventoryDashboardPage />} />
          <Route path="parts" element={<PartsPage />} />
          <Route path="stock" element={<StockPage />} />
          <Route path="retail" element={<RetailPage />} />
          <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
          <Route path="work-orders" element={<InventoryWorkOrdersPage />} />
          <Route path="core-returns" element={<CoreReturnsPage />} />
          <Route path="qbo" element={<QboPage />} />
          <Route path="alerts" element={<AlertsPage />} />
        </Route>
        <Route path="/customers" element={<ComingSoonPage />} />
        <Route path="/scheduling" element={<ComingSoonPage />} />
        <Route path="/invoicing" element={<ComingSoonPage />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  )
}
