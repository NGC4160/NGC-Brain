import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { brandColors } from '@/config/app.config'
import type { RevenueCategory } from '@/types/invoicing'
import { formatCurrency } from '@/lib/utils'

interface RevenueCategoryChartProps {
  data: RevenueCategory[]
}

export function RevenueCategoryChart({ data }: RevenueCategoryChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        No invoice category data yet
      </div>
    )
  }

  const chartData = data.slice(0, 6).map((d) => ({
    name: d.label.replace(' Conversions', '').replace(' Replacement', ''),
    amount: d.amount,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(value: number) => [formatCurrency(value), 'Billed']} />
        <Bar dataKey="amount" fill={brandColors.blue} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
