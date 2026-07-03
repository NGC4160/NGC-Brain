import { v4 as uuidv4 } from 'uuid'
import type { QboAdapter, QboBill, QboInvoice, QboItem, QboPurchaseOrder, QboVendor } from './types.js'

const mockItems: Map<string, QboItem> = new Map()
const mockVendors: Map<string, QboVendor> = new Map()

function nextId(): string {
  return String(1000 + mockItems.size + mockVendors.size + Math.floor(Math.random() * 100))
}

export class MockQboAdapter implements QboAdapter {
  getAuthUrl(state: string): string {
    return `http://localhost:3001/api/qbo/mock-auth?state=${state}`
  }

  async exchangeCode(_code: string, realmId: string) {
    return {
      accessToken: `mock-access-${uuidv4()}`,
      refreshToken: `mock-refresh-${uuidv4()}`,
      expiresIn: 3600,
      realmId: realmId || 'mock-realm-123',
    }
  }

  async refreshAccessToken(refreshToken: string) {
    return {
      accessToken: `mock-access-${uuidv4()}`,
      refreshToken,
      expiresIn: 3600,
    }
  }

  async getCompanyInfo(_accessToken: string, _realmId: string) {
    return { CompanyName: 'GreenLine Golf Cart Repair (Sandbox)' }
  }

  async listItems(_accessToken: string, _realmId: string): Promise<QboItem[]> {
    return Array.from(mockItems.values())
  }

  async createItem(_accessToken: string, _realmId: string, item: Partial<QboItem>): Promise<QboItem> {
    const created: QboItem = {
      Id: nextId(),
      SyncToken: '0',
      Name: item.Name ?? 'Unnamed',
      Sku: item.Sku,
      Type: item.Type ?? 'Inventory',
      QtyOnHand: item.QtyOnHand ?? 0,
      UnitPrice: item.UnitPrice,
      PurchaseCost: item.PurchaseCost,
      Description: item.Description,
    }
    mockItems.set(created.Id, created)
    return created
  }

  async updateItem(_accessToken: string, _realmId: string, item: QboItem): Promise<QboItem> {
    const updated = { ...item, SyncToken: String(parseInt(item.SyncToken, 10) + 1) }
    mockItems.set(item.Id, updated)
    return updated
  }

  async listVendors(_accessToken: string, _realmId: string): Promise<QboVendor[]> {
    return Array.from(mockVendors.values())
  }

  async createVendor(_accessToken: string, _realmId: string, vendor: Partial<QboVendor>): Promise<QboVendor> {
    const created: QboVendor = {
      Id: nextId(),
      SyncToken: '0',
      DisplayName: vendor.DisplayName ?? 'Vendor',
      PrimaryEmailAddr: vendor.PrimaryEmailAddr,
      PrimaryPhone: vendor.PrimaryPhone,
    }
    mockVendors.set(created.Id, created)
    return created
  }

  async updateVendor(_accessToken: string, _realmId: string, vendor: QboVendor): Promise<QboVendor> {
    const updated = { ...vendor, SyncToken: String(parseInt(vendor.SyncToken, 10) + 1) }
    mockVendors.set(vendor.Id, updated)
    return updated
  }

  async createInvoice(_accessToken: string, _realmId: string, data: Record<string, unknown>): Promise<QboInvoice> {
    return {
      Id: nextId(),
      DocNumber: String(data.DocNumber ?? `INV-${Date.now()}`),
      TotalAmt: Number(data.TotalAmt ?? 0),
    }
  }

  async createPurchaseOrder(_accessToken: string, _realmId: string, data: Record<string, unknown>): Promise<QboPurchaseOrder> {
    return {
      Id: nextId(),
      DocNumber: String(data.DocNumber ?? `PO-${Date.now()}`),
    }
  }

  async createBill(_accessToken: string, _realmId: string, data: Record<string, unknown>): Promise<QboBill> {
    return {
      Id: nextId(),
      DocNumber: String(data.DocNumber ?? `BILL-${Date.now()}`),
    }
  }

  async createInventoryAdjustment(_accessToken: string, _realmId: string, _data: Record<string, unknown>) {
    return { Id: nextId() }
  }
}

export const mockQboAdapter = new MockQboAdapter()
