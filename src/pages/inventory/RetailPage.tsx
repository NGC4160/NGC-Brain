import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { api, type Part, type Location } from '@/lib/api'
import { BarcodeScanner } from '@/components/inventory/BarcodeScanner'
import { formatCurrency } from '@/lib/utils'

interface CartLine { part: Part; quantity: number; unitPrice: number }

export function RetailPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [locationId, setLocationId] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [sales, setSales] = useState<Awaited<ReturnType<typeof api.retail.list>>>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.locations.list().then((locs) => {
      setLocations(locs)
      if (locs[0]) setLocationId(locs[0].id)
    })
    api.retail.list().then(setSales)
  }, [])

  const addPart = async (code: string) => {
    try {
      const part = await api.parts.byBarcode(code)
      if (!part.sellPrice) {
        alert('Part has no retail price set')
        return
      }
      setCart((prev) => {
        const existing = prev.find((l) => l.part.id === part.id)
        if (existing) {
          return prev.map((l) => l.part.id === part.id ? { ...l, quantity: l.quantity + 1 } : l)
        }
        return [...prev, { part, quantity: 1, unitPrice: Number(part.sellPrice) }]
      })
    } catch {
      alert(`Part not found: ${code}`)
    }
  }

  const total = cart.reduce((s, l) => s + l.quantity * l.unitPrice, 0)

  const checkout = async () => {
    if (!locationId || cart.length === 0) return
    setSubmitting(true)
    try {
      await api.retail.create({
        locationId,
        lines: cart.map((l) => ({ partId: l.part.id, quantity: l.quantity, unitPrice: l.unitPrice })),
      })
      setCart([])
      api.retail.list().then(setSales)
      alert('Sale completed! QBO invoice created if connected.')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Sale failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Retail Counter Sales</h1>
        <p className="text-slate-500">Scan parts to sell over the counter</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <label className="label">Location</label>
          <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="input-field">
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>

          <BarcodeScanner onScan={addPart} placeholder="Scan barcode to add to cart..." />

          <div className="card space-y-3">
            <h2 className="font-semibold">Cart ({cart.length} items)</h2>
            {cart.length === 0 ? (
              <p className="text-sm text-slate-500">Scan a barcode to start</p>
            ) : cart.map((line) => (
              <div key={line.part.id} className="flex items-center justify-between text-sm">
                <span>{line.part.sku} × {line.quantity}</span>
                <div className="flex items-center gap-2">
                  <span>{formatCurrency(line.quantity * line.unitPrice)}</span>
                  <button type="button" onClick={() => setCart((c) => c.filter((l) => l.part.id !== line.part.id))}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
            {cart.length > 0 && (
              <>
                <div className="border-t pt-3 flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <button type="button" onClick={checkout} disabled={submitting} className="btn-primary w-full">
                  <Plus className="h-4 w-4" /> Complete Sale
                </button>
              </>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold">Recent Sales</h2>
          <ul className="space-y-2 text-sm">
            {sales.slice(0, 15).map((s) => (
              <li key={s.id} className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                <span>{s.number} — {s.location.code}</span>
                <span className="font-medium">{formatCurrency(Number(s.total))}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
