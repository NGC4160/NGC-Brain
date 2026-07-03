import { useEffect, useState } from 'react'
import { api, type PurchaseOrder, type Location } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

export function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [receiveQty, setReceiveQty] = useState<Record<string, number>>({})

  const load = () => {
    api.purchaseOrders.list().then(setOrders)
    api.locations.list().then(setLocations)
  }

  useEffect(() => { load() }, [])

  const receive = async (poId: string, lineId: string) => {
    const qty = receiveQty[lineId] ?? 1
    const locationId = locations[0]?.id
    if (!locationId) return
    try {
      await api.purchaseOrders.receive(poId, { lineId, locationId, quantity: qty })
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Receive failed')
    }
  }

  const createBill = async (poId: string) => {
    try {
      const bill = await api.purchaseOrders.bill(poId)
      alert(`QBO Bill created: ${(bill as { DocNumber?: string }).DocNumber}`)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Bill creation failed')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
        <p className="text-slate-500">Receive stock and sync bills to QBO</p>
      </div>

      <div className="space-y-4">
        {orders.map((po) => (
          <div key={po.id} className="card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{po.number}</h2>
                <p className="text-sm text-slate-500">{po.vendor.name} · {po.status}</p>
              </div>
              {po.status !== 'DRAFT' && (
                <button type="button" onClick={() => createBill(po.id)} className="btn-secondary text-xs">
                  Create QBO Bill
                </button>
              )}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Part</th>
                  <th className="pb-2 text-right">Ordered</th>
                  <th className="pb-2 text-right">Received</th>
                  <th className="pb-2 text-right">Cost</th>
                  <th className="pb-2 text-right">Receive</th>
                </tr>
              </thead>
              <tbody>
                {po.lines.map((line) => (
                  <tr key={line.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-2">{line.part.sku} — {line.part.name}</td>
                    <td className="py-2 text-right">{line.quantity}</td>
                    <td className="py-2 text-right">{line.receivedQty}</td>
                    <td className="py-2 text-right">{formatCurrency(Number(line.unitCost))}</td>
                    <td className="py-2 text-right">
                      {line.receivedQty < line.quantity && (
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            min={1}
                            max={line.quantity - line.receivedQty}
                            value={receiveQty[line.id] ?? 1}
                            onChange={(e) => setReceiveQty({ ...receiveQty, [line.id]: parseInt(e.target.value, 10) })}
                            className="input-field w-16 py-1 text-center"
                          />
                          <button type="button" onClick={() => receive(po.id, line.id)} className="btn-primary py-1 text-xs">
                            Receive
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  )
}
