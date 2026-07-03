import type { Part, PartType } from '@prisma/client'

export interface QboItem {
  Id: string
  SyncToken: string
  Name: string
  Sku?: string
  Type: 'Inventory' | 'NonInventory'
  QtyOnHand?: number
  UnitPrice?: number
  PurchaseCost?: number
  Description?: string
}

export interface QboVendor {
  Id: string
  SyncToken: string
  DisplayName: string
  PrimaryEmailAddr?: { Address: string }
  PrimaryPhone?: { FreeFormNumber: string }
}

export interface QboInvoice {
  Id: string
  DocNumber: string
  TotalAmt: number
}

export interface QboPurchaseOrder {
  Id: string
  DocNumber: string
}

export interface QboBill {
  Id: string
  DocNumber: string
}

export interface QboAdapter {
  getAuthUrl(state: string): string
  exchangeCode(code: string, realmId: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
    realmId: string
  }>
  refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
  }>
  getCompanyInfo(accessToken: string, realmId: string): Promise<{ CompanyName: string }>
  listItems(accessToken: string, realmId: string): Promise<QboItem[]>
  createItem(accessToken: string, realmId: string, item: Partial<QboItem>): Promise<QboItem>
  updateItem(accessToken: string, realmId: string, item: QboItem): Promise<QboItem>
  listVendors(accessToken: string, realmId: string): Promise<QboVendor[]>
  createVendor(accessToken: string, realmId: string, vendor: Partial<QboVendor>): Promise<QboVendor>
  updateVendor(accessToken: string, realmId: string, vendor: QboVendor): Promise<QboVendor>
  createInvoice(accessToken: string, realmId: string, data: Record<string, unknown>): Promise<QboInvoice>
  createPurchaseOrder(accessToken: string, realmId: string, data: Record<string, unknown>): Promise<QboPurchaseOrder>
  createBill(accessToken: string, realmId: string, data: Record<string, unknown>): Promise<QboBill>
  createInventoryAdjustment(accessToken: string, realmId: string, data: Record<string, unknown>): Promise<{ Id: string }>
}

export function partToQboType(partType: PartType): 'Inventory' | 'NonInventory' {
  return partType === 'INVENTORY' ? 'Inventory' : 'NonInventory'
}

export function qboTypeToPartType(qboType: string): PartType {
  return qboType === 'Inventory' ? 'INVENTORY' : 'NON_INVENTORY'
}

export function partToQboItem(part: Part, qtyOnHand?: number): Partial<QboItem> {
  return {
    Name: part.name,
    Sku: part.sku,
    Type: partToQboType(part.partType),
    Description: part.description ?? undefined,
    UnitPrice: part.sellPrice ? Number(part.sellPrice) : undefined,
    PurchaseCost: Number(part.costAverage) || Number(part.costLast),
    QtyOnHand: part.partType === 'INVENTORY' ? qtyOnHand : undefined,
  }
}
