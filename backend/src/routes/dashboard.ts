import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { getInventoryValuation, getLowStockParts } from '../services/inventory.js'
import { processLowStockAlerts } from '../services/alerts.js'

export const dashboardRouter = Router()

dashboardRouter.get('/kpis', async (_req, res) => {
  const [partCount, lowStock, valuation, openPOs, openWOs, failedSyncs, retailMonth] = await Promise.all([
    prisma.part.count({ where: { isActive: true } }),
    getLowStockParts(),
    getInventoryValuation(),
    prisma.purchaseOrder.count({ where: { status: { in: ['SENT', 'PARTIAL'] } } }),
    prisma.workOrder.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_PARTS'] } } }),
    prisma.part.count({ where: { syncStatus: 'FAILED' } }),
    prisma.retailSale.aggregate({
      where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      _sum: { total: true },
      _count: true,
    }),
  ])

  const outOfStock = (await prisma.part.findMany({
    where: { isActive: true, partType: 'INVENTORY' },
    include: { inventoryLevels: true },
  })).filter((p) => p.inventoryLevels.reduce((s, l) => s + l.quantity, 0) === 0).length

  const topUsed = await prisma.stockMovement.groupBy({
    by: ['partId'],
    where: { type: { in: ['ISSUE', 'RETAIL_SALE'] }, createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 10,
  })

  const topParts = await Promise.all(topUsed.map(async (t) => {
    const part = await prisma.part.findUnique({ where: { id: t.partId } })
    return { part, quantity: t._sum.quantity ?? 0 }
  }))

  res.json({
    totalSkus: partCount,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock,
    inventoryValue: valuation.totalValue,
    openPOs,
    openWorkOrders: openWOs,
    failedQboSyncs: failedSyncs,
    retailSalesMtd: Number(retailMonth._sum.total ?? 0),
    retailTransactionsMtd: retailMonth._count,
    lowStockAlerts: lowStock,
    topUsedParts: topParts.filter((t) => t.part),
    valuationByCategory: valuation.byCategory,
  })
})

export const alertsRouter = Router()

alertsRouter.get('/settings', async (_req, res) => {
  res.json(await prisma.alertSetting.findMany())
})

alertsRouter.post('/settings', async (req, res) => {
  const setting = await prisma.alertSetting.create({ data: req.body })
  res.status(201).json(setting)
})

alertsRouter.delete('/settings/:id', async (req, res) => {
  await prisma.alertSetting.delete({ where: { id: req.params.id } })
  res.status(204).end()
})

alertsRouter.get('/logs', async (_req, res) => {
  res.json(await prisma.alertLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }))
})

alertsRouter.post('/trigger', async (_req, res) => {
  const result = await processLowStockAlerts()
  res.json(result)
})
