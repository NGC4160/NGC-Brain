"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  BadgeDollarSign,
  Boxes,
  BriefcaseBusiness,
  Route,
  TimerReset,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

export type ReportsDashboardData = {
  revenue: { name: string; revenue: number; collected: number }[]
  jobs: { name: string; active: number; completed: number }[]
  techs: { name: string; hours: number; jobs: number }[]
  partsMargin: { name: string; margin: number; revenue: number }[]
  drivers: { name: string; completed: number; onTime: number }[]
}

const pieColors = ["#2563eb", "#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444"]

function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
}: {
  title: string
  value: string
  helper: string
  icon: typeof BadgeDollarSign
}) {
  return (
    <Card className="border-blue-100 bg-white/82 shadow-sm dark:border-blue-900/60 dark:bg-white/[0.04]">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-black tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function ReportsDashboard({ data }: { data: ReportsDashboardData }) {
  const totalRevenue = data.revenue.reduce((sum, row) => sum + row.revenue, 0)
  const completedJobs = data.jobs.reduce((sum, row) => sum + row.completed, 0)
  const totalHours = data.techs.reduce((sum, row) => sum + row.hours, 0)
  const completedRoutes = data.drivers.reduce((sum, row) => sum + row.completed, 0)

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Revenue"
          value={formatCurrency(totalRevenue)}
          helper="Open + issued invoices"
          icon={BadgeDollarSign}
        />
        <MetricCard
          title="Jobs completed"
          value={String(completedJobs)}
          helper="Last 6 periods"
          icon={BriefcaseBusiness}
        />
        <MetricCard
          title="Tech hours"
          value={`${Math.round(totalHours)}h`}
          helper="Billable productivity"
          icon={TimerReset}
        />
        <MetricCard
          title="Routes completed"
          value={String(completedRoutes)}
          helper="Pickup and delivery"
          icon={Route}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Revenue dashboard</CardTitle>
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                Revenue
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="collected"
                  stroke="#14b8a6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Jobs dashboard</CardTitle>
              <Badge variant="outline" className="rounded-full">
                Active vs complete
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.jobs}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="active" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                <Bar dataKey="completed" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Tech productivity</CardTitle>
              <Badge variant="outline" className="rounded-full">
                Hours + jobs
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.techs}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="#2563eb" radius={[8, 8, 0, 0]} />
                <Bar dataKey="jobs" fill="#14b8a6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Parts margin</CardTitle>
              <Badge className="gap-1 bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200">
                <Boxes className="size-3" />
                Margin
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid h-80 gap-4 md:grid-cols-[1fr_13rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.partsMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="margin" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.partsMargin}
                  dataKey="revenue"
                  nameKey="name"
                  innerRadius={42}
                  outerRadius={76}
                  paddingAngle={4}
                >
                  {data.partsMargin.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={pieColors[index % pieColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60 xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Driver performance</CardTitle>
              <Badge variant="outline" className="rounded-full">
                Completed + on-time
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.drivers}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completed" fill="#2563eb" radius={[8, 8, 0, 0]} />
                <Bar dataKey="onTime" fill="#14b8a6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
