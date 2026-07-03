import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { applyStockChange } from '../services/inventory.js'
import { getQboAdapter } from '../services/qbo/client.js'

export const retailRouter = Router()

retailRouter.get('/', async (_req, res) => {
  res.json(await prisma.retailSale.findMany({
    include: { customer: true, location: true, lines: { include: { part: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  }))
})

retailRouter.post('/', async (req, res) => {
  const { locationId, customerId, lines } = req.body as {
    locationId: string
    customerId?: string
    lines: { partId: string; quantity: number; unitPrice: number }[]
  }

  const count = await prisma.retailSale.count()
  const total = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)

  const sale = await prisma.$transaction(async (tx) => {
    const created = await tx.retailSale.create({
      data: {
        number: `RS-${String(count + 1).padStart(5, '0')}`,
        locationId,
        customerId,
        total,
        lines: { create: lines },
      },
      include: { lines: { include: { part: true } }, location: true, customer: true },
    })

    for (const line of lines) {
      await applyStockChange({
        partId: line.partId,
        locationId,
        quantityDelta: -line.quantity,
        type: 'RETAIL_SALE',
        referenceType: 'RetailSale',
        referenceId: created.id,
        reason: 'Retail counter sale',
      })
    }

    return created
  })

  const connection = await prisma.qboConnection.findFirst({ where: { isActive: true } })
  if (connection) {
    try {
      const adapter = getQboAdapter()
      const invoice = await adapter.createInvoice(connection.accessToken, connection.realmId, {
        DocNumber: sale.number,
        TotalAmt: total,
        Line: sale.lines.map((l) => ({
          Description: l.part.name,
          Amount: l.quantity * Number(l.unitPrice),
          DetailType: 'SalesItemLineDetail',
          SalesItemLineDetail: {
            ItemRef: l.part.qboId ? { value: l.part.qboId } : undefined,
            Qty: l.quantity,
            UnitPrice: Number(l.unitPrice),
          },
        })),
      })
      await prisma.retailSale.update({ where: { id: sale.id }, data: { qboInvoiceId: invoice.Id } })
      return res.status(201).json({ ...sale, qboInvoiceId: invoice.Id })
    } catch {
      // sale recorded locally even if QBO fails
    }
  }

  res.status(201).json(sale)
})
