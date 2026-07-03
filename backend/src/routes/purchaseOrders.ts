import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { applyStockChange } from '../services/inventory.js'
import { createQboBillForPO, syncVendorToQbo } from '../services/qbo/syncService.js'

export const vendorsRouter = Router()

vendorsRouter.get('/', async (_req, res) => {
  res.json(await prisma.vendor.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }))
})

vendorsRouter.post('/', async (req, res) => {
  const vendor = await prisma.vendor.create({ data: req.body })
  try { await syncVendorToQbo(vendor.id) } catch { /* optional */ }
  res.status(201).json(vendor)
})

vendorsRouter.patch('/:id', async (req, res) => {
  const vendor = await prisma.vendor.update({ where: { id: req.params.id }, data: req.body })
  try { await syncVendorToQbo(vendor.id) } catch { /* optional */ }
  res.json(vendor)
})

export const purchaseOrdersRouter = Router()

purchaseOrdersRouter.get('/', async (_req, res) => {
  res.json(await prisma.purchaseOrder.findMany({
    include: { vendor: true, lines: { include: { part: true } } },
    orderBy: { createdAt: 'desc' },
  }))
})

purchaseOrdersRouter.post('/', async (req, res) => {
  const count = await prisma.purchaseOrder.count()
  const po = await prisma.purchaseOrder.create({
    data: {
      ...req.body,
      number: req.body.number ?? `PO-${String(count + 1).padStart(5, '0')}`,
      lines: req.body.lines ? { create: req.body.lines } : undefined,
    },
    include: { vendor: true, lines: { include: { part: true } } },
  })
  res.status(201).json(po)
})

purchaseOrdersRouter.post('/:id/receive', async (req, res) => {
  const { lineId, locationId, quantity } = req.body
  const line = await prisma.pOLine.findUniqueOrThrow({
    where: { id: lineId },
    include: { part: true, purchaseOrder: true },
  })

  const newReceived = line.receivedQty + quantity
  if (newReceived > line.quantity) {
    return res.status(400).json({ error: 'Cannot receive more than ordered' })
  }

  await applyStockChange({
    partId: line.partId,
    locationId,
    quantityDelta: quantity,
    type: 'RECEIVE',
    referenceType: 'PurchaseOrder',
    referenceId: line.purchaseOrderId,
    reason: `Received PO ${line.purchaseOrder.number}`,
  })

  const avgCost = (Number(line.part.costAverage) * line.receivedQty + Number(line.unitCost) * quantity)
    / (line.receivedQty + quantity || 1)
  await prisma.part.update({
    where: { id: line.partId },
    data: { costLast: line.unitCost, costAverage: avgCost },
  })

  const updatedLine = await prisma.pOLine.update({
    where: { id: lineId },
    data: { receivedQty: newReceived },
    include: { part: true },
  })

  const allLines = await prisma.pOLine.findMany({ where: { purchaseOrderId: line.purchaseOrderId } })
  const allReceived = allLines.every((l) => l.id === lineId ? newReceived >= l.quantity : l.receivedQty >= l.quantity)
  const anyReceived = allLines.some((l) => l.id === lineId ? newReceived > 0 : l.receivedQty > 0)

  await prisma.purchaseOrder.update({
    where: { id: line.purchaseOrderId },
    data: { status: allReceived ? 'RECEIVED' : anyReceived ? 'PARTIAL' : 'SENT' },
  })

  res.json(updatedLine)
})

purchaseOrdersRouter.post('/:id/bill', async (req, res) => {
  try {
    const bill = await createQboBillForPO(req.params.id)
    res.json(bill)
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Bill creation failed' })
  }
})
