import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { config } from '../config.js'
import { prisma } from '../lib/prisma.js'
import { getQboAdapter } from '../services/qbo/client.js'
import {
  getQboConnectionStatus,
  pullItemsFromQbo,
  syncPartToQbo,
  syncVendorToQbo,
} from '../services/qbo/syncService.js'

export const qboRouter = Router()

const pendingStates = new Map<string, string>()

qboRouter.get('/status', async (_req, res) => {
  res.json(await getQboConnectionStatus())
})

qboRouter.get('/connect', (_req, res) => {
  const state = uuidv4()
  pendingStates.set(state, 'pending')
  const adapter = getQboAdapter()
  res.json({ authUrl: adapter.getAuthUrl(state), state })
})

qboRouter.get('/mock-auth', async (req, res) => {
  if (!config.qbo.useMock) return res.status(404).end()
  const code = 'mock-code'
  const realmId = 'mock-realm-123'
  const adapter = getQboAdapter()
  const tokens = await adapter.exchangeCode(code, realmId)
  const company = await adapter.getCompanyInfo(tokens.accessToken, realmId)

  await prisma.qboConnection.upsert({
    where: { realmId },
    create: {
      realmId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
      companyName: company.CompanyName,
    },
    update: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
      companyName: company.CompanyName,
      isActive: true,
    },
  })

  res.redirect(`${config.corsOrigin}/inventory/qbo?connected=true`)
})

qboRouter.get('/callback', async (req, res) => {
  const { code, realmId } = req.query
  if (!code || !realmId) return res.status(400).json({ error: 'Missing code or realmId' })

  const adapter = getQboAdapter()
  const tokens = await adapter.exchangeCode(String(code), String(realmId))
  const company = await adapter.getCompanyInfo(tokens.accessToken, String(realmId))

  await prisma.qboConnection.upsert({
    where: { realmId: String(realmId) },
    create: {
      realmId: String(realmId),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
      companyName: company.CompanyName,
    },
    update: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
      companyName: company.CompanyName,
      isActive: true,
    },
  })

  res.redirect(`${config.corsOrigin}/inventory/qbo?connected=true`)
})

qboRouter.post('/sync/parts', async (_req, res) => {
  const parts = await prisma.part.findMany({ where: { isActive: true } })
  const results = []
  for (const part of parts) {
    try {
      await syncPartToQbo(part.id)
      results.push({ id: part.id, sku: part.sku, status: 'ok' })
    } catch (err) {
      results.push({ id: part.id, sku: part.sku, status: 'failed', error: String(err) })
    }
  }
  res.json(results)
})

qboRouter.post('/sync/vendors', async (_req, res) => {
  const vendors = await prisma.vendor.findMany({ where: { isActive: true } })
  const results = []
  for (const vendor of vendors) {
    try {
      await syncVendorToQbo(vendor.id)
      results.push({ id: vendor.id, name: vendor.name, status: 'ok' })
    } catch (err) {
      results.push({ id: vendor.id, name: vendor.name, status: 'failed', error: String(err) })
    }
  }
  res.json(results)
})

qboRouter.post('/pull/items', async (_req, res) => {
  try {
    const items = await pullItemsFromQbo()
    res.json({ imported: items.length, items })
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Pull failed' })
  }
})

qboRouter.get('/logs', async (_req, res) => {
  res.json(await prisma.qboSyncLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }))
})

qboRouter.post('/sync/retry/:entityType/:id', async (req, res) => {
  const { entityType, id } = req.params
  try {
    if (entityType === 'part') await syncPartToQbo(id)
    else if (entityType === 'vendor') await syncVendorToQbo(id)
    else return res.status(400).json({ error: 'Unknown entity type' })
    res.json({ status: 'ok' })
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Retry failed' })
  }
})
