import { useEffect, useState } from 'react'
import { api, type Location, type InventoryLevel } from '@/lib/api'
import { BarcodeScanner } from '@/components/inventory/BarcodeScanner'

export function StockPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLoc, setSelectedLoc] = useState<string>('')
  const [stock, setStock] = useState<InventoryLevel[]>([])
  const [highlightId, setHighlightId] = useState<string | null>(null)

  useEffect(() => {
    api.locations.list().then((locs) => {
      setLocations(locs)
      if (locs[0]) setSelectedLoc(locs[0].id)
    })
  }, [])

  useEffect(() => {
    if (selectedLoc) api.locations.stock(selectedLoc).then(setStock)
  }, [selectedLoc])

  const handleScan = async (code: string) => {
    try {
      const part = await api.parts.byBarcode(code)
      setHighlightId(part.id)
      const row = document.getElementById(`stock-${part.id}`)
      row?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } catch {
      alert(`No part found: ${code}`)
    }
  }

  const loc = locations.find((l) => l.id === selectedLoc)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Stock by Location</h1>
        <p className="text-slate-500">Main Shop & South Bay inventory levels</p>
      </div>

      <div className="flex flex-wrap gap-4">
        {locations.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setSelectedLoc(l.id)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
              selectedLoc === l.id
                ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-400'
                : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
            }`}
          >
            {l.name} ({l.code})
          </button>
        ))}
      </div>

      {loc && <p className="text-sm text-slate-500">{loc.address}</p>}

      <BarcodeScanner onScan={handleScan} placeholder="Scan to find part in this location..." />

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3 text-left font-medium">SKU</th>
              <th className="px-4 py-3 text-left font-medium">Part</th>
              <th className="px-4 py-3 text-left font-medium">Bin</th>
              <th className="px-4 py-3 text-right font-medium">Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {stock.filter((s) => s.quantity > 0 || s.part?.partType === 'INVENTORY').map((s) => (
              <tr
                key={s.id}
                id={`stock-${s.part?.id}`}
                className={highlightId === s.part?.id ? 'bg-brand-50 dark:bg-brand-950/30' : ''}
              >
                <td className="px-4 py-3 font-mono text-xs">{s.part?.sku}</td>
                <td className="px-4 py-3">{s.part?.name}</td>
                <td className="px-4 py-3 text-slate-500">{s.binLocation ?? '—'}</td>
                <td className="px-4 py-3 text-right font-medium">{s.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
