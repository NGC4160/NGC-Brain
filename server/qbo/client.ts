import { getDb } from '../db/client.js'
import { nowIso } from '../db/utils.js'

const QBO_BASE = {
  sandbox: 'https://sandbox-quickbooks.api.intuit.com',
  production: 'https://quickbooks.api.intuit.com',
}

const OAUTH_BASE = 'https://appcenter.intuit.com/connect/oauth2'
const TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'

export function getQboConfig() {
  return {
    clientId: process.env.QBO_CLIENT_ID?.trim() ?? '',
    clientSecret: process.env.QBO_CLIENT_SECRET?.trim() ?? '',
    redirectUri: process.env.QBO_REDIRECT_URI ?? 'http://localhost:3001/api/qbo/callback',
    environment: (process.env.QBO_ENVIRONMENT ?? 'production') as 'sandbox' | 'production',
    realmId: process.env.QBO_REALM_ID?.trim() ?? '',
  }
}

export function isQboConfigured(): boolean {
  const c = getQboConfig()
  return !!(c.clientId && c.clientSecret)
}

export function getAuthorizationUrl(state: string): string {
  const { clientId, redirectUri } = getQboConfig()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'com.intuit.quickbooks.accounting',
    state,
  })
  return `${OAUTH_BASE}?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string, realmId: string) {
  const { clientId, clientSecret } = getQboConfig()
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: getQboConfig().redirectUri,
    }),
  })
  if (!res.ok) throw new Error(`QBO token exchange failed: ${await res.text()}`)
  const data = (await res.json()) as {
    access_token: string
    refresh_token: string
    expires_in: number
  }
  saveConnection(realmId, data.access_token, data.refresh_token, data.expires_in)
  return data
}

export function saveConnection(realmId: string, accessToken: string, refreshToken: string, expiresIn: number) {
  const db = getDb()
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()
  db.prepare(
    `INSERT INTO qbo_connection (id, realm_id, access_token, refresh_token, token_expires_at, connected_at, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET realm_id=excluded.realm_id, access_token=excluded.access_token,
       refresh_token=excluded.refresh_token, token_expires_at=excluded.token_expires_at, updated_at=excluded.updated_at`,
  ).run(realmId, accessToken, refreshToken, expiresAt, nowIso(), nowIso())
}

export function getConnection() {
  return getDb().prepare('SELECT * FROM qbo_connection WHERE id = 1').get() as {
    realm_id: string
    access_token: string
    refresh_token: string
    token_expires_at: string
    company_name: string | null
    connected_at: string
  } | undefined
}

export async function refreshAccessToken() {
  const conn = getConnection()
  if (!conn) throw new Error('QBO not connected')
  const { clientId, clientSecret } = getQboConfig()
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: conn.refresh_token,
    }),
  })
  if (!res.ok) throw new Error(`QBO refresh failed: ${await res.text()}`)
  const data = (await res.json()) as { access_token: string; refresh_token: string; expires_in: number }
  saveConnection(conn.realm_id, data.access_token, data.refresh_token, data.expires_in)
  return data.access_token
}

export async function qboRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let conn = getConnection()
  if (!conn) throw new Error('QuickBooks not connected')

  if (new Date(conn.token_expires_at).getTime() < Date.now() + 60_000) {
    await refreshAccessToken()
    conn = getConnection()!
  }

  const { environment } = getQboConfig()
  const base = QBO_BASE[environment]
  const url = `${base}/v3/company/${conn.realm_id}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${conn.access_token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) throw new Error(`QBO API ${path}: ${await res.text()}`)
  return res.json() as Promise<T>
}

/** NGC income account routing for QBO sync (per finance overview) */
export const NGC_INCOME_ACCOUNTS = {
  lithium: 'LFP Conversions Only',
  generalRepair: 'Sales and Services',
  services: 'Services Income',
  parts: 'Sales of Product Income',
  shopSupply: 'Shop Supply Fee',
  tips: 'Housecall Pro Tips',
} as const

export const NGC_BOOKKEEPER = 'Griffin & Furman, LLC'
