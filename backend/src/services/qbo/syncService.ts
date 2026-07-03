import { prisma } from '../../lib/prisma.js'
import { getQboAdapter } from './client.js'
import { partToQboItem, qboTypeToPartType } from './types.js'
import { getPartTotalQty } from '../inventory.js'

async function getActiveConnection() {
  return prisma.qboConnection.findFirst({ where: { isActive: true } })
}

async function ensureFreshToken(connection: { id: string; accessToken: string; refreshToken: string; tokenExpiresAt: Date }) {
  if (connection.tokenExpiresAt > new Date()) {
    return connection
  }
  const adapter = getQboAdapter()
  const tokens = await adapter.refreshAccessToken(connection.refreshToken)
  return prisma.qboConnection.update({
    where: { id: connection.id },
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
    },
  })
}

export async function syncPartToQbo(partId: string) {
  const connection = await getActiveConnection()
  if (!connection) throw new Error('No active QBO connection')

  const conn = await ensureFreshToken(connection)
  const part = await prisma.part.findUniqueOrThrow({ where: { id: partId } })
  const adapter = getQboAdapter()
  const totalQty = await getPartTotalQty(partId)

  try {
    let qboItem
    if (part.qboId) {
      qboItem = await adapter.updateItem(conn.accessToken, conn.realmId, {
        Id: part.qboId,
        SyncToken: part.qboSyncToken ?? '0',
        Name: part.name,
        Sku: part.sku,
        Type: part.partType === 'INVENTORY' ? 'Inventory' : 'NonInventory',
        UnitPrice: part.sellPrice ? Number(part.sellPrice) : undefined,
        PurchaseCost: Number(part.costAverage) || Number(part.costLast),
        QtyOnHand: part.partType === 'INVENTORY' ? totalQty : undefined,
      })
    } else {
      qboItem = await adapter.createItem(conn.accessToken, conn.realmId, partToQboItem(part, totalQty))
    }

    await prisma.part.update({
      where: { id: partId },
      data: {
        qboId: qboItem.Id,
        qboSyncToken: qboItem.SyncToken,
        syncStatus: 'SYNCED',
        syncError: null,
        lastSyncedAt: new Date(),
      },
    })

    await prisma.qboSyncLog.create({
      data: {
        entityType: 'Part',
        entityId: partId,
        direction: 'APP_TO_QBO',
        status: 'SYNCED',
        qboId: qboItem.Id,
        message: `Synced part ${part.sku}`,
      },
    })

    return qboItem
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown sync error'
    await prisma.part.update({
      where: { id: partId },
      data: { syncStatus: 'FAILED', syncError: message },
    })
    await prisma.qboSyncLog.create({
      data: {
        entityType: 'Part',
        entityId: partId,
        direction: 'APP_TO_QBO',
        status: 'FAILED',
        message,
      },
    })
    throw err
  }
}

export async function syncVendorToQbo(vendorId: string) {
  const connection = await getActiveConnection()
  if (!connection) throw new Error('No active QBO connection')

  const conn = await ensureFreshToken(connection)
  const vendor = await prisma.vendor.findUniqueOrThrow({ where: { id: vendorId } })
  const adapter = getQboAdapter()

  try {
    let qboVendor
    if (vendor.qboId) {
      qboVendor = await adapter.updateVendor(conn.accessToken, conn.realmId, {
        Id: vendor.qboId,
        SyncToken: vendor.qboSyncToken ?? '0',
        DisplayName: vendor.name,
        PrimaryEmailAddr: vendor.email ? { Address: vendor.email } : undefined,
        PrimaryPhone: vendor.phone ? { FreeFormNumber: vendor.phone } : undefined,
      })
    } else {
      qboVendor = await adapter.createVendor(conn.accessToken, conn.realmId, {
        DisplayName: vendor.name,
        PrimaryEmailAddr: vendor.email ? { Address: vendor.email } : undefined,
        PrimaryPhone: vendor.phone ? { FreeFormNumber: vendor.phone } : undefined,
      })
    }

    await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        qboId: qboVendor.Id,
        qboSyncToken: qboVendor.SyncToken,
        syncStatus: 'SYNCED',
        syncError: null,
        lastSyncedAt: new Date(),
      },
    })

    return qboVendor
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown sync error'
    await prisma.vendor.update({
      where: { id: vendorId },
      data: { syncStatus: 'FAILED', syncError: message },
    })
    throw err
  }
}

export async function pullItemsFromQbo() {
  const connection = await getActiveConnection()
  if (!connection) throw new Error('No active QBO connection')

  const conn = await ensureFreshToken(connection)
  const adapter = getQboAdapter()
  const items = await adapter.listItems(conn.accessToken, conn.realmId)

  const results = []
  for (const item of items) {
    if (!item.Sku) continue
    const existing = await prisma.part.findFirst({ where: { qboId: item.Id } })
      ?? await prisma.part.findFirst({ where: { sku: item.Sku } })

    const partType = qboTypeToPartType(item.Type)
    const data = {
      name: item.Name,
      sku: item.Sku,
      partType,
      sellPrice: item.UnitPrice,
      costAverage: item.PurchaseCost ?? 0,
      qboId: item.Id,
      qboSyncToken: item.SyncToken,
      syncStatus: 'SYNCED' as const,
      lastSyncedAt: new Date(),
    }

    if (existing) {
      const updated = await prisma.part.update({ where: { id: existing.id }, data })
      results.push(updated)
    }
  }

  return results
}

export async function createQboInvoiceForWorkOrder(workOrderId: string) {
  const connection = await getActiveConnection()
  if (!connection) throw new Error('No active QBO connection')

  const conn = await ensureFreshToken(connection)
  const wo = await prisma.workOrder.findUniqueOrThrow({
    where: { id: workOrderId },
    include: { lines: { include: { part: true } }, customer: true },
  })

  const adapter = getQboAdapter()
  const total = wo.lines.reduce((s, l) => s + l.quantity * Number(l.unitCost), 0)

  const invoice = await adapter.createInvoice(conn.accessToken, conn.realmId, {
    DocNumber: wo.number,
    TotalAmt: total,
    Line: wo.lines.map((l) => ({
      Description: l.part.name,
      Amount: l.quantity * Number(l.unitCost),
      DetailType: 'SalesItemLineDetail',
      SalesItemLineDetail: {
        ItemRef: l.part.qboId ? { value: l.part.qboId } : undefined,
        Qty: l.quantity,
        UnitPrice: Number(l.unitCost),
      },
    })),
  })

  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: { qboInvoiceId: invoice.Id, status: 'INVOICED', invoicedAt: new Date() },
  })

  return invoice
}

export async function createQboBillForPO(poId: string) {
  const connection = await getActiveConnection()
  if (!connection) throw new Error('No active QBO connection')

  const conn = await ensureFreshToken(connection)
  const po = await prisma.purchaseOrder.findUniqueOrThrow({
    where: { id: poId },
    include: { lines: { include: { part: true } }, vendor: true },
  })

  const adapter = getQboAdapter()
  const bill = await adapter.createBill(conn.accessToken, conn.realmId, {
    DocNumber: po.number,
    VendorRef: po.vendor.qboId ? { value: po.vendor.qboId } : undefined,
    Line: po.lines.map((l) => ({
      Description: l.part.name,
      Amount: l.receivedQty * Number(l.unitCost),
      DetailType: 'ItemBasedExpenseLineDetail',
      ItemBasedExpenseLineDetail: {
        ItemRef: l.part.qboId ? { value: l.part.qboId } : undefined,
        Qty: l.receivedQty,
        UnitPrice: Number(l.unitCost),
      },
    })),
  })

  return bill
}

export async function getQboConnectionStatus() {
  const connection = await prisma.qboConnection.findFirst({ where: { isActive: true } })
  if (!connection) return { connected: false }

  const failedParts = await prisma.part.count({ where: { syncStatus: 'FAILED' } })
  const failedVendors = await prisma.vendor.count({ where: { syncStatus: 'FAILED' } })
  const recentLogs = await prisma.qboSyncLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return {
    connected: true,
    companyName: connection.companyName,
    realmId: connection.realmId,
    tokenExpiresAt: connection.tokenExpiresAt,
    failedParts,
    failedVendors,
    recentLogs,
  }
}
