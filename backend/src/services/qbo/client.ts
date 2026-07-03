import { config } from '../../config.js'
import type { QboAdapter } from './types.js'
import { mockQboAdapter } from './mockAdapter.js'

class LiveQboAdapter implements QboAdapter {
  private baseUrl = config.qbo.environment === 'production'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox-quickbooks.api.intuit.com'

  private oauthBase = 'https://oauth.platform.intuit.com/oauth2/v1'

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: config.qbo.clientId,
      response_type: 'code',
      scope: 'com.intuit.quickbooks.accounting',
      redirect_uri: config.qbo.redirectUri,
      state,
    })
    return `https://appcenter.intuit.com/connect/oauth2?${params}`
  }

  async exchangeCode(code: string, realmId: string) {
    const res = await fetch(`${this.oauthBase}/tokens/bearer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${config.qbo.clientId}:${config.qbo.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.qbo.redirectUri,
      }),
    })
    if (!res.ok) throw new Error(`QBO token exchange failed: ${await res.text()}`)
    const data = await res.json() as { access_token: string; refresh_token: string; expires_in: number }
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      realmId,
    }
  }

  async refreshAccessToken(refreshToken: string) {
    const res = await fetch(`${this.oauthBase}/tokens/bearer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${config.qbo.clientId}:${config.qbo.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })
    if (!res.ok) throw new Error(`QBO token refresh failed: ${await res.text()}`)
    const data = await res.json() as { access_token: string; refresh_token: string; expires_in: number }
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    }
  }

  private async qboFetch<T>(accessToken: string, realmId: string, path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}/v3/company/${realmId}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    if (!res.ok) throw new Error(`QBO API error: ${await res.text()}`)
    const json = await res.json() as { QueryResponse?: Record<string, unknown[]> } & Record<string, unknown>
    return json as T
  }

  async getCompanyInfo(accessToken: string, realmId: string) {
    const data = await this.qboFetch<{ CompanyInfo: { CompanyName: string } }>(
      accessToken, realmId, '/companyinfo/' + realmId,
    )
    return data.CompanyInfo
  }

  async listItems(accessToken: string, realmId: string) {
    const data = await this.qboFetch<{ QueryResponse: { Item?: import('./types.js').QboItem[] } }>(
      accessToken, realmId, "/query?query=" + encodeURIComponent("SELECT * FROM Item MAXRESULTS 1000"),
    )
    return data.QueryResponse.Item ?? []
  }

  async createItem(accessToken: string, realmId: string, item: Partial<import('./types.js').QboItem>) {
    const data = await this.qboFetch<{ Item: import('./types.js').QboItem }>(
      accessToken, realmId, '/item', { method: 'POST', body: JSON.stringify(item) },
    )
    return data.Item
  }

  async updateItem(accessToken: string, realmId: string, item: import('./types.js').QboItem) {
    const data = await this.qboFetch<{ Item: import('./types.js').QboItem }>(
      accessToken, realmId, '/item', { method: 'POST', body: JSON.stringify(item) },
    )
    return data.Item
  }

  async listVendors(accessToken: string, realmId: string) {
    const data = await this.qboFetch<{ QueryResponse: { Vendor?: import('./types.js').QboVendor[] } }>(
      accessToken, realmId, "/query?query=" + encodeURIComponent("SELECT * FROM Vendor MAXRESULTS 1000"),
    )
    return data.QueryResponse.Vendor ?? []
  }

  async createVendor(accessToken: string, realmId: string, vendor: Partial<import('./types.js').QboVendor>) {
    const data = await this.qboFetch<{ Vendor: import('./types.js').QboVendor }>(
      accessToken, realmId, '/vendor', { method: 'POST', body: JSON.stringify(vendor) },
    )
    return data.Vendor
  }

  async updateVendor(accessToken: string, realmId: string, vendor: import('./types.js').QboVendor) {
    const data = await this.qboFetch<{ Vendor: import('./types.js').QboVendor }>(
      accessToken, realmId, '/vendor', { method: 'POST', body: JSON.stringify(vendor) },
    )
    return data.Vendor
  }

  async createInvoice(accessToken: string, realmId: string, data: Record<string, unknown>) {
    const result = await this.qboFetch<{ Invoice: import('./types.js').QboInvoice }>(
      accessToken, realmId, '/invoice', { method: 'POST', body: JSON.stringify(data) },
    )
    return result.Invoice
  }

  async createPurchaseOrder(accessToken: string, realmId: string, data: Record<string, unknown>) {
    const result = await this.qboFetch<{ PurchaseOrder: import('./types.js').QboPurchaseOrder }>(
      accessToken, realmId, '/purchaseorder', { method: 'POST', body: JSON.stringify(data) },
    )
    return result.PurchaseOrder
  }

  async createBill(accessToken: string, realmId: string, data: Record<string, unknown>) {
    const result = await this.qboFetch<{ Bill: import('./types.js').QboBill }>(
      accessToken, realmId, '/bill', { method: 'POST', body: JSON.stringify(data) },
    )
    return result.Bill
  }

  async createInventoryAdjustment(accessToken: string, realmId: string, data: Record<string, unknown>) {
    const result = await this.qboFetch<{ InventoryAdjustment: { Id: string } }>(
      accessToken, realmId, '/inventoryadjustment', { method: 'POST', body: JSON.stringify(data) },
    )
    return result.InventoryAdjustment
  }
}

export function getQboAdapter(): QboAdapter {
  return config.qbo.useMock ? mockQboAdapter : new LiveQboAdapter()
}
