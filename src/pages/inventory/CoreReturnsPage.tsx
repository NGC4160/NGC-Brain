import { useEffect, useState } from 'react'
import { api, type CoreReturn, type Vendor, type Part, type Location } from '@/lib/api'
import { BarcodeScanner } from '@/components/inventory/BarcodeScanner'
import { formatCurrency } from '@/lib/utils'

export function CoreReturnsPage() {
  const [returns, setReturns] = useState<CoreReturn[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedPart, setSelectedPart] = useState<Part | null>(null)
  const [vendorId, setVendorId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [rmaNumber, setRmaNumber] = useState('')

  const load = () => api.coreReturns.list().then(setReturns)

  useEffect(() => {
    load()
    api.vendors.list().then(setVendors)
    api.locations.list().then((locs) => {
      setLocations(locs)
      if (locs[0]) setLocationId(locs[0].id)
    })
  }, [])

  const handleScan = async (code: string) => {
    try {
      const part = await api.parts.byBarcode(code)
      if (!part.isCore) {
        alert('This part is not marked as a core item')
        return
      }
      setSelectedPart(part)
      if (part.primaryVendor) setVendorId(part.primaryVendor.id)
    } catch {
      alert(`Part not found: ${code}`)
    }
  }

  const submit = async () => {
    if (!selectedPart || !vendorId) return
    try {
      await api.coreReturns.create({
        partId: selectedPart.id,
        vendorId,
        quantity,
        locationId,
        rmaNumber: rmaNumber || undefined,
      })
      setSelectedPart(null)
      setQuantity(1)
      setRmaNumber('')
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Core return failed')
    }
  }

  const updateStatus = async (id: string, status: string) => {
    await api.coreReturns.updateStatus(id, {
      status,
      ...(status === 'CREDITED' ? { creditAmount: 0 } : {}),
    })
    load()
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    SHIPPED: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    CREDITED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    REJECTED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Core Returns (RMA)</h1>
        <p className="text-slate-500">Return cores to vendors for credit — motors, controllers, etc.</p>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold">New Core Return</h2>
        <BarcodeScanner onScan={handleScan} placeholder="Scan core part barcode..." />

        {selectedPart && (
          <div className="rounded-lg bg-purple-50 p-3 text-sm dark:bg-purple-950/30">
            <p className="font-medium">{selectedPart.sku} — {selectedPart.name}</p>
            <p className="text-purple-700 dark:text-purple-300">
              Core charge: {formatCurrency(Number(selectedPart.coreCharge ?? 0))}
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Vendor</label>
            <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="input-field">
              <option value="">Select vendor</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Ship from location</label>
            <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="input-field">
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Quantity</label>
            <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value, 10))} className="input-field" />
          </div>
          <div>
            <label className="label">RMA Number (optional)</label>
            <input value={rmaNumber} onChange={(e) => setRmaNumber(e.target.value)} className="input-field" />
          </div>
        </div>

        <button type="button" onClick={submit} disabled={!selectedPart || !vendorId} className="btn-primary">
          Create Core Return
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3 text-left">Return #</th>
              <th className="px-4 py-3 text-left">Part</th>
              <th className="px-4 py-3 text-left">Vendor</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Core $</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {returns.map((cr) => (
              <tr key={cr.id}>
                <td className="px-4 py-3 font-mono text-xs">{cr.number}</td>
                <td className="px-4 py-3">{cr.part.sku}</td>
                <td className="px-4 py-3">{cr.vendor.name}</td>
                <td className="px-4 py-3 text-right">{cr.quantity}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(Number(cr.coreCharge))}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusColors[cr.status]}`}>{cr.status}</span>
                </td>
                <td className="px-4 py-3 text-right space-x-1">
                  {cr.status === 'PENDING' && (
                    <button type="button" onClick={() => updateStatus(cr.id, 'SHIPPED')} className="btn-secondary py-1 text-xs">Ship</button>
                  )}
                  {cr.status === 'SHIPPED' && (
                    <button type="button" onClick={() => updateStatus(cr.id, 'CREDITED')} className="btn-primary py-1 text-xs">Mark Credited</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
