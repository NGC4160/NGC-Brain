import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { partsRouter } from './routes/parts.js'
import { locationsRouter } from './routes/locations.js'
import { workOrdersRouter } from './routes/workOrders.js'
import { vendorsRouter, purchaseOrdersRouter } from './routes/purchaseOrders.js'
import { retailRouter } from './routes/retail.js'
import { coreReturnsRouter } from './routes/coreReturns.js'
import { qboRouter } from './routes/qbo.js'
import { dashboardRouter, alertsRouter } from './routes/dashboard.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: config.corsOrigin }))
  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', qboMock: config.qbo.useMock })
  })

  app.use('/api/parts', partsRouter)
  app.use('/api/locations', locationsRouter)
  app.use('/api/work-orders', workOrdersRouter)
  app.use('/api/vendors', vendorsRouter)
  app.use('/api/purchase-orders', purchaseOrdersRouter)
  app.use('/api/retail', retailRouter)
  app.use('/api/core-returns', coreReturnsRouter)
  app.use('/api/qbo', qboRouter)
  app.use('/api/dashboard', dashboardRouter)
  app.use('/api/alerts', alertsRouter)

  return app
}
