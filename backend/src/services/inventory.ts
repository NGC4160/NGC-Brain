import type { Part, Prisma, StockMovementType } from '@prisma/client'
import { prisma } from '../lib/prisma.js'

export async function getPartTotalQty(partId: string): Promise<number> {
  const levels = await prisma.inventoryLevel.findMany({ where: { partId } })
  return levels.reduce((sum, l) => sum + l.quantity, 0)
}

export async function getOrCreateInventoryLevel(partId: string, locationId: string) {
  return prisma.inventoryLevel.upsert({
    where: { partId_locationId: { partId, locationId } },
    create: { partId, locationId, quantity: 0 },
    update: {},
  })
}

interface StockChangeInput {
  partId: string
  locationId: string
  quantityDelta: number
  type: StockMovementType
  reason?: string
  referenceType?: string
  referenceId?: string
  userId?: string
  fromLocationId?: string
  toLocationId?: string
}

export async function applyStockChange(input: StockChangeInput) {
  const level = await getOrCreateInventoryLevel(input.partId, input.locationId)
  const quantityBefore = level.quantity
  const quantityAfter = quantityBefore + input.quantityDelta

  if (quantityAfter < 0) {
    throw new Error(`Insufficient stock for part ${input.partId} at location ${input.locationId}`)
  }

  const [updatedLevel, movement] = await prisma.$transaction([
    prisma.inventoryLevel.update({
      where: { id: level.id },
      data: { quantity: quantityAfter },
    }),
    prisma.stockMovement.create({
      data: {
        partId: input.partId,
        type: input.type,
        quantity: Math.abs(input.quantityDelta),
        quantityBefore,
        quantityAfter,
        locationId: input.locationId,
        fromLocationId: input.fromLocationId,
        toLocationId: input.toLocationId,
        reason: input.reason,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        userId: input.userId,
      },
    }),
  ])

  return { level: updatedLevel, movement, quantityAfter }
}

export async function transferStock(
  partId: string,
  fromLocationId: string,
  toLocationId: string,
  quantity: number,
  userId?: string,
) {
  if (quantity <= 0) throw new Error('Transfer quantity must be positive')
  if (fromLocationId === toLocationId) throw new Error('Cannot transfer to same location')

  const out = await applyStockChange({
    partId,
    locationId: fromLocationId,
    quantityDelta: -quantity,
    type: 'TRANSFER',
    fromLocationId,
    toLocationId,
    userId,
    reason: 'Transfer out',
  })

  const inn = await applyStockChange({
    partId,
    locationId: toLocationId,
    quantityDelta: quantity,
    type: 'TRANSFER',
    fromLocationId,
    toLocationId,
    userId,
    reason: 'Transfer in',
  })

  return { out, in: inn }
}

export function isLowStock(part: Part, totalQty: number): boolean {
  return part.reorderPoint > 0 && totalQty <= part.reorderPoint
}

export async function getLowStockParts() {
  const parts = await prisma.part.findMany({
    where: { isActive: true },
    include: {
      inventoryLevels: { include: { location: true } },
      category: true,
      primaryVendor: true,
    },
  })

  const lowStock = []
  for (const part of parts) {
    const totalQty = part.inventoryLevels.reduce((s, l) => s + l.quantity, 0)
    if (isLowStock(part, totalQty)) {
      lowStock.push({ ...part, totalQty })
    }
  }
  return lowStock
}

export async function getInventoryValuation() {
  const parts = await prisma.part.findMany({
    where: { isActive: true, partType: 'INVENTORY' },
    include: { inventoryLevels: true },
  })

  let totalValue = 0
  const byCategory: Record<string, number> = {}

  for (const part of parts) {
    const qty = part.inventoryLevels.reduce((s, l) => s + l.quantity, 0)
    const value = qty * Number(part.costAverage || part.costLast)
    totalValue += value
    const cat = part.categoryId ?? 'uncategorized'
    byCategory[cat] = (byCategory[cat] ?? 0) + value
  }

  return { totalValue, byCategory }
}

export type PartWithLevels = Prisma.PartGetPayload<{
  include: { inventoryLevels: { include: { location: true } }; category: true; primaryVendor: true }
}>

export async function findPartByBarcode(barcode: string): Promise<PartWithLevels | null> {
  return prisma.part.findFirst({
    where: { OR: [{ barcode }, { sku: barcode }], isActive: true },
    include: {
      inventoryLevels: { include: { location: true } },
      category: true,
      primaryVendor: true,
    },
  })
}
