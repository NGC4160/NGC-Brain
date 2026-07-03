import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { RepairJob } from '@/types'

interface RevenueChartProps {
  jobs: RepairJob[]
}

export function RevenueChart({ jobs }: RevenueChartProps) {
  const completed = jobs.filter(
    (j) => j.status === 'picked-up' && j.completedAt && j.estimatedRevenue,
  )

  const byWeek: Record<string, number> = {}
  completed.forEach((j) => {
    const d = new Date(j.completedAt!)
    const weekLabel = `${d.getMonth() + 1}/${d.getDate()}`
    byWeek[weekLabel] = (byWeek[weekLabel] ?? 0) + (j.estimatedRevenue ?? 0)
  })

  const data = Object.entries(byWeek)
    .slice(-6)
    .map(([week, revenue]) => ({ week, revenue }))

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        No completed job revenue data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 12 }}
          className="fill-slate-500"
        />
        <YAxis tick={{ fontSize: 12 }} className="fill-slate-500" />
        <Tooltip
          formatter={(value: number) => [`$${value}`, 'Revenue']}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '13px',
          }}
        />
        <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
