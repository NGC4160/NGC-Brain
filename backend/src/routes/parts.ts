import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { applyStockChange, findPartByBarcode, getLowStockParts, getPartTotalQty, transferStock } from '../services/inventory.js'
import { syncPartToQbo } from '../services/qbo/syncService.js'

export const partsRouter = Router()

partsRouter.get('/', async (req, res) => {
  const { search, category, lowStock, partType } = req.query
  const parts = await prisma.part.findMany({
    where: {
      isActive: true,
      ...(search ? {
        OR: [
          { sku: { contains: String(search), mode: 'insensitive' } },
          { name: { contains: String(search), mode: 'insensitive' } },
          { barcode: { contains: String(search), mode: 'insensitive' } },
        ],
      } : {}),
      ...(category ? { categoryId: String(category) } : {}),
      ...(partType ? { partType: partType as 'INVENTORY' | 'NON_INVENTORY' } : {}),
    },
    include: {
      category: true,
      primaryVendor: true,
      inventoryLevels: { include: { location: true } },
    },
    orderBy: { sku: 'asc' },
  })

  const enriched = await Promise.all(parts.map(async (p) => {
    const totalQty = p.inventoryLevels.reduce((s, l) => s + l.quantity, 0)
    return { ...p, totalQty, isLowStock: p.reorderPoint > 0 && totalQty <= p.reorderPoint }
  }))

  const filtered = lowStock === 'true' ? enriched.filter((p) => p.isLowStock) : enriched
  res.json(filtered)
})

partsRouter.get('/barcode/:code', async (req, res) => {
  const part = await findPartByBarcode(req.params.code)
  if (!part) return res.status(404).json({ error: 'Part not found' })
  const totalQty = part.inventoryLevels.reduce((s, l) => s + l.quantity, 0)
  res.json({ ...part, totalQty })
})

partsRouter.get('/:id', async (req, res) => {
  const part = await prisma.part.findUnique({
    where: { id: req.params.id },
    include: {
      category: true,
      primaryVendor: true,
      inventoryLevels: { include: { location: true } },
      stockMovements: { orderBy: { createdAt: 'desc' }, take: 50 },
    },
  })
  if (!part) return res.status(404).json({ error: 'Not found' })
  const totalQty = await getPartTotalQty(part.id)
  res.json({ ...part, totalQty })
})

partsRouter.post('/', async (req, res) => {
  const part = await prisma.part.create({ data: req.body })
  const locations = await prisma.location.findMany({ where: { isActive: true } })
  for (const loc of locations) {
    await prisma.inventoryLevel.create({ data: { partId: part.id, locationId: loc.id, quantity: 0 } })
  }
  try {
    await syncPartToQbo(part.id)
  } catch {
    // QBO sync optional on create if not connected
  }
  res.status(201).json(part)
})

partsRouter.patch('/:id', async (req, res) => {
  const part = await prisma.part.update({ where: { id: req.params.id }, data: req.body })
  try { await syncPartToQbo(part.id) } catch { /* queue retry */ }
  res.json(part)
})

partsRouter.post('/:id/adjust', async (req, res) => {
  const { locationId, quantityDelta, reason } = req.body
  const result = await applyStockChange({
    partId: req.params.id,
    locationId,
    quantityDelta,
    type: 'ADJUST',
    reason,
  })
  res.json(result)
})

partsRouter.post('/:id/transfer', async (req, res) => {
  const { fromLocationId, toLocationId, quantity } = req.body
  const result = await transferStock(req.params.id, fromLocationId, toLocationId, quantity)
  res.json(result)
})

partsRouter.get('/meta/categories', async (_req, res) => {
  const categories = await prisma.partCategory.findMany({ orderBy: { name: 'asc' } })
  res.json(categories)
})

partsRouter.get('/meta/low-stock', async (_req, res) => {
  res.json(await getLowStockParts())
})
