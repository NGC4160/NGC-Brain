const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  health: () => request<{ status: string; qboMock: boolean }>('/health'),

  dashboard: {
    kpis: () => request<DashboardKpis>('/dashboard/kpis'),
  },

  parts: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return request<Part[]>('/parts' + qs)
    },
    get: (id: string) => request<PartDetail>('/parts/' + id),
    byBarcode: (code: string) => request<Part>('/parts/barcode/' + encodeURIComponent(code)),
    create: (data: Partial<Part>) => request<Part>('/parts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Part>) => request<Part>('/parts/' + id, { method: 'PATCH', body: JSON.stringify(data) }),
    adjust: (id: string, data: { locationId: string; quantityDelta: number; reason?: string }) =>
      request('/parts/' + id + '/adjust', { method: 'POST', body: JSON.stringify(data) }),
    transfer: (id: string, data: { fromLocationId: string; toLocationId: string; quantity: number }) =>
      request('/parts/' + id + '/transfer', { method: 'POST', body: JSON.stringify(data) }),
    categories: () => request<Category[]>('/parts/meta/categories'),
    lowStock: () => request<Part[]>('/parts/meta/low-stock'),
  },

  locations: {
    list: () => request<Location[]>('/locations'),
    stock: (id: string) => request<InventoryLevel[]>('/locations/' + id + '/stock'),
  },

  workOrders: {
    list: (status?: string) => request<WorkOrder[]>('/work-orders' + (status ? '?status=' + status : '')),
    get: (id: string) => request<WorkOrder>('/work-orders/' + id),
    create: (data: Partial<WorkOrder>) => request<WorkOrder>('/work-orders', { method: 'POST', body: JSON.stringify(data) }),
    addLine: (id: string, data: { partId: string; quantity: number; unitCost: number }) =>
      request('/work-orders/' + id + '/lines', { method: 'POST', body: JSON.stringify(data) }),
    issue: (id: string, data: { lineId: string; locationId: string }) =>
      request('/work-orders/' + id + '/issue', { method: 'POST', body: JSON.stringify(data) }),
    invoice: (id: string) => request('/work-orders/' + id + '/invoice', { method: 'POST' }),
  },

  vendors: {
    list: () => request<Vendor[]>('/vendors'),
    create: (data: Partial<Vendor>) => request<Vendor>('/vendors', { method: 'POST', body: JSON.stringify(data) }),
  },

  purchaseOrders: {
    list: () => request<PurchaseOrder[]>('/purchase-orders'),
    create: (data: unknown) => request<PurchaseOrder>('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
    receive: (id: string, data: { lineId: string; locationId: string; quantity: number }) =>
      request('/purchase-orders/' + id + '/receive', { method: 'POST', body: JSON.stringify(data) }),
    bill: (id: string) => request('/purchase-orders/' + id + '/bill', { method: 'POST' }),
  },

  retail: {
    list: () => request<RetailSale[]>('/retail'),
    create: (data: { locationId: string; customerId?: string; lines: { partId: string; quantity: number; unitPrice: number }[] }) =>
      request<RetailSale>('/retail', { method: 'POST', body: JSON.stringify(data) }),
  },

  coreReturns: {
    list: () => request<CoreReturn[]>('/core-returns'),
    create: (data: unknown) => request<CoreReturn>('/core-returns', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, data: { status: string; creditAmount?: number }) =>
      request('/core-returns/' + id + '/status', { method: 'PATCH', body: JSON.stringify(data) }),
  },

  qbo: {
    status: () => request<QboStatus>('/qbo/status'),
    connect: () => request<{ authUrl: string; state: string }>('/qbo/connect'),
    syncParts: () => request('/qbo/sync/parts', { method: 'POST' }),
    syncVendors: () => request('/qbo/sync/vendors', { method: 'POST' }),
    pullItems: () => request('/qbo/pull/items', { method: 'POST' }),
    logs: () => request<QboSyncLog[]>('/qbo/logs'),
    retry: (entityType: string, id: string) =>
      request('/qbo/sync/retry/' + entityType + '/' + id, { method: 'POST' }),
  },

  alerts: {
    settings: () => request<AlertSetting[]>('/alerts/settings'),
    addSetting: (data: { channel: 'EMAIL' | 'SMS'; recipient: string }) =>
      request('/alerts/settings', { method: 'POST', body: JSON.stringify(data) }),
    removeSetting: (id: string) => request('/alerts/settings/' + id, { method: 'DELETE' }),
    logs: () => request<AlertLog[]>('/alerts/logs'),
    trigger: () => request<{ sent: number; parts: number }>('/alerts/trigger', { method: 'POST' }),
  },
}

export interface Category { id: string; name: string }
export interface Vendor { id: string; name: string; email?: string; phone?: string; syncStatus?: string }
export interface Location { id: string; name: string; code: string; address?: string }

export interface InventoryLevel {
  id: string
  quantity: number
  binLocation?: string
  part?: Part
  location?: Location
}

export interface Part {
  id: string
  sku: string
  name: string
  description?: string
  partType: 'INVENTORY' | 'NON_INVENTORY'
  costLast: number
  costAverage: number
  sellPrice?: number
  reorderPoint: number
  reorderQty: number
  barcode?: string
  isCore: boolean
  coreCharge?: number
  brand?: string
  isActive: boolean
  syncStatus?: string
  syncError?: string
  qboId?: string
  totalQty?: number
  isLowStock?: boolean
  category?: Category
  primaryVendor?: Vendor
  inventoryLevels?: InventoryLevel[]
}

export interface PartDetail extends Part {
  stockMovements?: { id: string; type: string; quantity: number; createdAt: string; reason?: string }[]
}

export interface WorkOrder {
  id: string
  number: string
  status: string
  cartMake?: string
  cartModel?: string
  description?: string
  technician?: string
  customer?: { name: string }
  lines?: { id: string; partId: string; quantity: number; unitCost: number; issued: boolean; part: Part }[]
}

export interface PurchaseOrder {
  id: string
  number: string
  status: string
  vendor: Vendor
  lines: { id: string; quantity: number; receivedQty: number; unitCost: number; part: Part }[]
}

export interface RetailSale {
  id: string
  number: string
  total: number
  createdAt: string
  location: Location
  customer?: { name: string }
  lines: { quantity: number; unitPrice: number; part: Part }[]
}

export interface CoreReturn {
  id: string
  number: string
  quantity: number
  coreCharge: number
  status: string
  rmaNumber?: string
  shippedAt?: string
  creditedAt?: string
  creditAmount?: number
  part: Part
  vendor: Vendor
}

export interface DashboardKpis {
  totalSkus: number
  lowStockCount: number
  outOfStockCount: number
  inventoryValue: number
  openPOs: number
  openWorkOrders: number
  failedQboSyncs: number
  retailSalesMtd: number
  retailTransactionsMtd: number
  lowStockAlerts: Part[]
  topUsedParts: { part: Part; quantity: number }[]
}

export interface QboStatus {
  connected: boolean
  companyName?: string
  realmId?: string
  failedParts?: number
  failedVendors?: number
  recentLogs?: QboSyncLog[]
}

export interface QboSyncLog {
  id: string
  entityType: string
  status: string
  message?: string
  createdAt: string
}

export interface AlertSetting {
  id: string
  channel: 'EMAIL' | 'SMS'
  recipient: string
  enabled: boolean
}

export interface AlertLog {
  id: string
  message: string
  channel: string
  recipient: string
  sent: boolean
  error?: string
  createdAt: string
}
