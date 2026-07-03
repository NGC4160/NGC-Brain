import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { applyStockChange } from '../services/inventory.js'

export const coreReturnsRouter = Router()

coreReturnsRouter.get('/', async (_req, res) => {
  res.json(await prisma.coreReturn.findMany({
    include: { part: true, vendor: true },
    orderBy: { createdAt: 'desc' },
  }))
})

coreReturnsRouter.post('/', async (req, res) => {
  const { partId, vendorId, quantity, locationId, notes, rmaNumber } = req.body
  const part = await prisma.part.findUniqueOrThrow({ where: { id: partId } })

  if (!part.isCore) {
    return res.status(400).json({ error: 'Part is not marked as a core item' })
  }

  const count = await prisma.coreReturn.count()
  const coreCharge = part.coreCharge ?? part.costLast

  const coreReturn = await prisma.coreReturn.create({
    data: {
      number: `CR-${String(count + 1).padStart(5, '0')}`,
      partId,
      vendorId,
      quantity,
      coreCharge,
      notes,
      rmaNumber,
      status: 'PENDING',
    },
    include: { part: true, vendor: true },
  })

  if (locationId) {
    await applyStockChange({
      partId,
      locationId,
      quantityDelta: -quantity,
      type: 'CORE_RETURN',
      referenceType: 'CoreReturn',
      referenceId: coreReturn.id,
      reason: `Core return ${coreReturn.number}`,
    })
  }

  res.status(201).json(coreReturn)
})

coreReturnsRouter.patch('/:id/status', async (req, res) => {
  const { status, creditAmount } = req.body
  const data: Record<string, unknown> = { status }

  if (status === 'SHIPPED') data.shippedAt = new Date()
  if (status === 'CREDITED') {
    data.creditedAt = new Date()
    data.creditAmount = creditAmount
  }

  const updated = await prisma.coreReturn.update({
    where: { id: req.params.id },
    data,
    include: { part: true, vendor: true },
  })
  res.json(updated)
})
