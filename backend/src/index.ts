import { createApp } from './app.js'
import { config } from './config.js'
import { processLowStockAlerts } from './services/alerts.js'

const app = createApp()

app.listen(config.port, () => {
  console.log(`GreenLine Inventory API running on http://localhost:${config.port}`)
  console.log(`QBO mode: ${config.qbo.useMock ? 'MOCK' : 'LIVE'}`)
})

// Low-stock alert check every hour
setInterval(() => {
  processLowStockAlerts().catch((err) => console.error('Alert job failed:', err))
}, 60 * 60 * 1000)
