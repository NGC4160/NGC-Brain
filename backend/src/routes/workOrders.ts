import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { applyStockChange } from '../services/inventory.js'
import { createQboInvoiceForWorkOrder } from '../services/qbo/syncService.js'

export const workOrdersRouter = Router()

workOrdersRouter.get('/', async (req, res) => {
  const { status } = req.query
  const orders = await prisma.workOrder.findMany({
    where: status ? { status: status as never } : undefined,
    include: {
      customer: true,
      lines: { include: { part: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(orders)
})

workOrdersRouter.get('/:id', async (req, res) => {
  const order = await prisma.workOrder.findUnique({
    where: { id: req.params.id },
    include: { customer: true, lines: { include: { part: true } } },
  })
  if (!order) return res.status(404).json({ error: 'Not found' })
  res.json(order)
})

workOrdersRouter.post('/', async (req, res) => {
  const count = await prisma.workOrder.count()
  const order = await prisma.workOrder.create({
    data: { ...req.body, number: req.body.number ?? `WO-${String(count + 1).padStart(5, '0')}` },
    include: { lines: { include: { part: true } } },
  })
  res.status(201).json(order)
})

workOrdersRouter.post('/:id/lines', async (req, res) => {
  const { partId, quantity, unitCost } = req.body
  const line = await prisma.workOrderLine.create({
    data: { workOrderId: req.params.id, partId, quantity, unitCost },
    include: { part: true },
  })
  res.status(201).json(line)
})

workOrdersRouter.post('/:id/issue', async (req, res) => {
  const { lineId, locationId } = req.body
  const line = await prisma.workOrderLine.findUniqueOrThrow({
    where: { id: lineId },
    include: { part: true },
  })

  await applyStockChange({
    partId: line.partId,
    locationId,
    quantityDelta: -line.quantity,
    type: 'ISSUE',
    referenceType: 'WorkOrder',
    referenceId: req.params.id,
    reason: `Issued to work order`,
  })

  const updated = await prisma.workOrderLine.update({
    where: { id: lineId },
    data: { issued: true },
    include: { part: true },
  })
  res.json(updated)
})

workOrdersRouter.post('/:id/return', async (req, res) => {
  const { lineId, locationId, quantity } = req.body
  const line = await prisma.workOrderLine.findUniqueOrThrow({ where: { id: lineId } })

  await applyStockChange({
    partId: line.partId,
    locationId,
    quantityDelta: quantity,
    type: 'RETURN',
    referenceType: 'WorkOrder',
    referenceId: req.params.id,
    reason: 'Returned from work order',
  })

  const updated = await prisma.workOrderLine.update({
    where: { id: lineId },
    data: { returnedQty: line.returnedQty + quantity },
    include: { part: true },
  })
  res.json(updated)
})

workOrdersRouter.post('/:id/invoice', async (req, res) => {
  try {
    const invoice = await createQboInvoiceForWorkOrder(req.params.id)
    res.json(invoice)
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Invoice failed' })
  }
})
