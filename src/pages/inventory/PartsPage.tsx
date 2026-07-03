import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, type Part } from '@/lib/api'
import { BarcodeScanner } from '@/components/inventory/BarcodeScanner'
import { formatCurrency } from '@/lib/utils'

export function PartsPage() {
  const [searchParams] = useSearchParams()
  const [parts, setParts] = useState<Part[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [scanResult, setScanResult] = useState<Part | null>(null)
  const lowStockOnly = searchParams.get('lowStock') === 'true'

  const load = () => {
    setLoading(true)
    api.parts.list({
      ...(search ? { search } : {}),
      ...(lowStockOnly ? { lowStock: 'true' } : {}),
    }).then(setParts).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, lowStockOnly])

  const handleScan = async (code: string) => {
    try {
      const part = await api.parts.byBarcode(code)
      setScanResult(part)
      setSearch(code)
    } catch {
      setScanResult(null)
      alert(`No part found for barcode: ${code}`)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Parts Catalog</h1>
        <p className="text-slate-500">Inventory & non-inventory items synced with QBO</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarcodeScanner onScan={handleScan} />
        <input
          type="search"
          placeholder="Search SKU, name, or barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field"
        />
      </div>

      {scanResult && (
        <div className="card border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-950/30">
          <p className="font-semibold text-brand-800 dark:text-brand-300">Scanned: {scanResult.sku}</p>
          <p className="text-sm">{scanResult.name} — {scanResult.totalQty ?? 0} on hand</p>
        </div>
      )}

      {lowStockOnly && (
        <p className="text-sm text-amber-600">Showing low-stock parts only</p>
      )}

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3 text-left font-medium">SKU</th>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-right font-medium">On Hand</th>
              <th className="px-4 py-3 text-right font-medium">Reorder</th>
              <th className="px-4 py-3 text-right font-medium">Cost</th>
              <th className="px-4 py-3 text-right font-medium">Retail</th>
              <th className="px-4 py-3 text-center font-medium">QBO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
            ) : parts.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No parts found</td></tr>
            ) : parts.map((p) => (
              <tr key={p.id} className={p.isLowStock ? 'bg-red-50/50 dark:bg-red-950/20' : ''}>
                <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-3">
                  {p.name}
                  {p.isCore && <span className="ml-2 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-950 dark:text-purple-300">CORE</span>}
                </td>
                <td className="px-4 py-3 text-xs">{p.partType === 'INVENTORY' ? 'Inventory' : 'Non-Inv'}</td>
                <td className="px-4 py-3 text-right font-medium">
                  <span className={p.isLowStock ? 'text-red-600' : ''}>{p.totalQty ?? 0}</span>
                </td>
                <td className="px-4 py-3 text-right text-slate-500">{p.reorderPoint}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(Number(p.costAverage))}</td>
                <td className="px-4 py-3 text-right">{p.sellPrice ? formatCurrency(Number(p.sellPrice)) : '—'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    p.syncStatus === 'SYNCED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                    p.syncStatus === 'FAILED' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' :
                    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>{p.syncStatus ?? 'PENDING'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
