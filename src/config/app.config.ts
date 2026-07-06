import type { KpiDefinition, NavModule, ResourceCategory } from '@/types'

export const appConfig = {
  businessName: 'Neighborhood Golf Carts',
  tagline: 'Operations Dashboard',
  shortName: 'NGC',
  website: 'https://www.ngcgolfcarts.com',
  logoSrc: `${import.meta.env.BASE_URL}assets/ngc-logo.png`,
  defaultRole: 'owner' as const,
}

export const brandColors = {
  green: '#6faa2d',
  greenDark: '#3d6b12',
  blue: '#1a4d7a',
  blueLight: '#2d6ba3',
} as const

export const kpiDefinitions: KpiDefinition[] = [
  {
    id: 'active-jobs',
    label: 'Active Jobs',
    description: 'Open repair orders in progress',
    unit: 'count',
    format: 'number',
  },
  {
    id: 'completed-week',
    label: 'Completed This Week',
    description: 'Jobs closed in the last 7 days',
    unit: 'count',
    format: 'number',
  },
  {
    id: 'revenue-mtd',
    label: 'Revenue (MTD)',
    description: 'Month-to-date revenue',
    unit: 'currency',
    format: 'currency',
  },
  {
    id: 'avg-turnaround',
    label: 'Avg. Turnaround',
    description: 'Days from intake to completion',
    unit: 'days',
    format: 'decimal',
  },
  {
    id: 'parts-on-order',
    label: 'Parts on Order',
    description: 'Pending parts orders',
    unit: 'count',
    format: 'number',
  },
  {
    id: 'low-stock-alerts',
    label: 'Low-Stock Alerts',
    description: 'Parts below reorder threshold',
    unit: 'count',
    format: 'number',
  },
  {
    id: 'customer-waitlist',
    label: 'Customer Waitlist',
    description: 'Jobs queued, not yet started',
    unit: 'count',
    format: 'number',
  },
  {
    id: 'fleet-accounts',
    label: 'Fleet Accounts',
    description: 'Active fleet/commercial customers',
    unit: 'count',
    format: 'number',
  },
]

export const navModules: NavModule[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: 'LayoutDashboard',
    enabled: true,
    description: 'KPI overview and quick access',
  },
  {
    id: 'agent-input',
    label: 'Agent Input',
    path: '/agent-input',
    icon: 'ClipboardEdit',
    enabled: true,
    description: 'Log repairs, updates, and shop notes',
  },
  {
    id: 'resources',
    label: 'Manuals & Files',
    path: '/resources',
    icon: 'BookOpen',
    enabled: true,
    description: 'Service manuals and reference docs',
  },
  {
    id: 'jobs',
    label: 'Jobs',
    path: '/jobs',
    icon: 'Wrench',
    enabled: true,
    description: 'All repair orders',
  },
  {
    id: 'inventory',
    label: 'Inventory',
    path: '/inventory',
    icon: 'Package',
    enabled: false,
    description: 'Parts inventory (coming soon)',
  },
  {
    id: 'customers',
    label: 'Customers',
    path: '/customers',
    icon: 'Users',
    enabled: false,
    description: 'CRM (coming soon)',
  },
  {
    id: 'scheduling',
    label: 'Scheduling',
    path: '/scheduling',
    icon: 'Calendar',
    enabled: false,
    description: 'Appointments (coming soon)',
  },
  {
    id: 'invoicing',
    label: 'Invoicing',
    path: '/invoicing',
    icon: 'Receipt',
    enabled: true,
    description: 'AR, deposits, and payment collection',
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: 'Settings',
    enabled: true,
    description: 'HCP import, QBO connection, and DMS config',
  },
]

export const resourceCategories: ResourceCategory[] = [
  { id: 'service-manual', label: 'Service Manuals' },
  { id: 'wiring-diagram', label: 'Wiring Diagrams' },
  { id: 'parts-catalog', label: 'Parts Catalogs' },
  { id: 'vendor-doc', label: 'Vendor Docs' },
  { id: 'sop', label: 'SOPs & Checklists' },
  { id: 'warranty', label: 'Warranty Info' },
]

export const featureFlags = {
  darkMode: true,
  showFutureModules: true,
  maxPinnedResources: 10,
}
