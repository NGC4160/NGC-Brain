import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

export const locationsRouter = Router()

locationsRouter.get('/', async (_req, res) => {
  const locations = await prisma.location.findMany({
    where: { isActive: true },
    include: {
      inventoryLevels: {
        include: { part: { include: { category: true } } },
      },
    },
  })
  res.json(locations)
})

locationsRouter.get('/:id/stock', async (req, res) => {
  const levels = await prisma.inventoryLevel.findMany({
    where: { locationId: req.params.id },
    include: { part: { include: { category: true, primaryVendor: true } } },
    orderBy: { part: { sku: 'asc' } },
  })
  res.json(levels)
})
