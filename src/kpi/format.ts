import { formatCurrency } from '@/lib/utils'
import type { KpiFormat, KpiSnapshot } from './types'

export function formatKpiValue(value: number, format: KpiFormat): string {
  switch (format) {
    case 'currency':
      return formatCurrency(value)
    case 'percent':
      return `${Math.round(value * 10) / 10}%`
    case 'days':
      return `${value} days`
    case 'decimal':
      return `${Math.round(value * 10) / 10}`
    default:
      return String(Math.round(value * 10) / 10)
  }
}

export function formatTrend(trend: number): string {
  if (trend === 0) return '0%'
  const sign = trend > 0 ? '+' : ''
  return `${sign}${trend}%`
}

export function exportKpisToCsv(kpis: KpiSnapshot[]): string {
  const header = [
    'id',
    'name',
    'category',
    'current',
    'target',
    'unit',
    'status',
    'trend_pct',
    'progress_pct',
    'last_updated',
  ]
  const rows = kpis.map((k) =>
    [
      k.id,
      `"${k.name.replace(/"/g, '""')}"`,
      k.category,
      k.current,
      k.target,
      k.unit,
      k.status,
      k.trend,
      k.progressPct,
      k.lastUpdated,
    ].join(','),
  )
  return [header.join(','), ...rows].join('\n')
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Opens a print-friendly window (browser → Save as PDF) */
export function printKpisPdf(kpis: KpiSnapshot[], title: string) {
  const rows = kpis
    .map(
      (k) =>
        `<tr>
          <td>${k.name}</td>
          <td>${k.category}</td>
          <td>${formatKpiValue(k.current, k.format)}</td>
          <td>${formatKpiValue(k.target, k.format)}</td>
          <td>${k.status}</td>
          <td>${formatTrend(k.trend)}</td>
        </tr>`,
    )
    .join('')
  const html = `<!doctype html><html><head><title>${title}</title>
    <style>
      body{font-family:system-ui,sans-serif;padding:24px;color:#0f172a}
      h1{font-size:20px;margin:0 0 8px}
      p{color:#64748b;font-size:12px;margin:0 0 16px}
      table{border-collapse:collapse;width:100%;font-size:12px}
      th,td{border:1px solid #e2e8f0;padding:8px;text-align:left}
      th{background:#f8fafc}
    </style></head><body>
    <h1>${title}</h1>
    <p>Generated ${new Date().toLocaleString()} · ${kpis.length} KPIs</p>
    <table><thead><tr>
      <th>KPI</th><th>Category</th><th>Current</th><th>Target</th><th>Status</th><th>Trend</th>
    </tr></thead><tbody>${rows}</tbody></table>
    <script>window.onload=()=>window.print()</script>
    </body></html>`
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html)
  w.document.close()
}
