"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { formatCurrency } from "@/lib/utils"

type RevenuePoint = {
  label: string
  revenue: number
}

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbeafe" />
          <XAxis
            axisLine={false}
            dataKey="label"
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickFormatter={(value) => `$${Number(value) / 1000}k`}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            width={46}
          />
          <Tooltip
            cursor={{ fill: "rgba(37, 99, 235, 0.08)" }}
            formatter={(value) => [formatCurrency(Number(value)), "Paid revenue"]}
            labelClassName="font-semibold text-slate-900"
            contentStyle={{
              borderRadius: "14px",
              border: "1px solid #bfdbfe",
              boxShadow: "0 18px 45px rgba(15, 23, 42, 0.10)",
            }}
          />
          <Bar
            dataKey="revenue"
            fill="#2563eb"
            radius={[10, 10, 4, 4]}
            maxBarSize={42}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
