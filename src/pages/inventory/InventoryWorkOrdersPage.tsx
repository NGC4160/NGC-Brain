import { useEffect, useState } from 'react'
import { api, type WorkOrder, type Location } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

export function InventoryWorkOrdersPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [locations, setLocations] = useState<Location[]>([])

  useEffect(() => {
    api.workOrders.list().then(setOrders)
    api.locations.list().then(setLocations)
  }, [])

  const issueLine = async (woId: string, lineId: string) => {
    const locationId = locations[0]?.id
    if (!locationId) return
    try {
      await api.workOrders.issue(woId, { lineId, locationId })
      api.workOrders.list().then(setOrders)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Issue failed')
    }
  }

  const invoice = async (woId: string) => {
    try {
      const inv = await api.workOrders.invoice(woId)
      alert(`QBO Invoice created: ${(inv as { DocNumber?: string }).DocNumber}`)
      api.workOrders.list().then(setOrders)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Invoice failed')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Work Order Parts</h1>
        <p className="text-slate-500">Issue parts to repair jobs and invoice via QBO</p>
      </div>

      {orders.map((wo) => (
        <div key={wo.id} className="card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">{wo.number}</h2>
              <p className="text-sm text-slate-500">
                {wo.customer?.name} · {wo.cartMake} {wo.cartModel} · {wo.status}
              </p>
              {wo.description && <p className="mt-1 text-sm">{wo.description}</p>}
            </div>
            {wo.status !== 'INVOICED' && wo.lines && wo.lines.length > 0 && (
              <button type="button" onClick={() => invoice(wo.id)} className="btn-primary text-xs">
                Invoice to QBO
              </button>
            )}
          </div>

          {wo.lines && wo.lines.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Part</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Cost</th>
                  <th className="pb-2 text-center">Issued</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {wo.lines.map((line) => (
                  <tr key={line.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-2">{line.part.sku} — {line.part.name}</td>
                    <td className="py-2 text-right">{line.quantity}</td>
                    <td className="py-2 text-right">{formatCurrency(Number(line.unitCost))}</td>
                    <td className="py-2 text-center">
                      {line.issued ? (
                        <span className="text-emerald-600">Yes</span>
                      ) : (
                        <span className="text-amber-600">Pending</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {!line.issued && (
                        <button type="button" onClick={() => issueLine(wo.id, line.id)} className="btn-secondary py-1 text-xs">
                          Issue from {locations[0]?.code ?? 'stock'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-500">No parts on this work order</p>
          )}
        </div>
      ))}
    </div>
  )
}
