import { LineItemType, WorkOrderStatus } from "@prisma/client"
import { BarChart3 } from "lucide-react"

import {
  ReportsDashboard,
  type ReportsDashboardData,
} from "@/components/reports/reports-dashboard"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

function monthKeys() {
  const keys: string[] = []
  const now = new Date()
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
    keys.push(
      date.toLocaleDateString("en-US", {
        month: "short",
      })
    )
  }
  return keys
}

function seedData(): ReportsDashboardData {
  return {
    revenue: [
      { name: "Feb", revenue: 42000, collected: 35500 },
      { name: "Mar", revenue: 46500, collected: 39000 },
      { name: "Apr", revenue: 51000, collected: 44250 },
      { name: "May", revenue: 57500, collected: 50600 },
      { name: "Jun", revenue: 62000, collected: 54800 },
      { name: "Jul", revenue: 68000, collected: 60250 },
    ],
    jobs: [
      { name: "Feb", active: 18, completed: 36 },
      { name: "Mar", active: 20, completed: 41 },
      { name: "Apr", active: 16, completed: 47 },
      { name: "May", active: 22, completed: 51 },
      { name: "Jun", active: 19, completed: 55 },
      { name: "Jul", active: 24, completed: 58 },
    ],
    techs: [
      { name: "Peyton", hours: 128, jobs: 38 },
      { name: "Morgan", hours: 92, jobs: 24 },
      { name: "Sam", hours: 86, jobs: 21 },
      { name: "Chris", hours: 74, jobs: 18 },
    ],
    partsMargin: [
      { name: "Lithium", margin: 43, revenue: 58000 },
      { name: "Service", margin: 68, revenue: 21000 },
      { name: "Tires", margin: 39, revenue: 12000 },
      { name: "Accessories", margin: 52, revenue: 9500 },
    ],
    drivers: [
      { name: "Chris", completed: 46, onTime: 42 },
      { name: "Taylor", completed: 39, onTime: 36 },
      { name: "Dana", completed: 22, onTime: 20 },
    ],
  }
}

export default async function ReportsPage() {
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No organization selected"
        description="Your user account is not connected to an organization yet."
      />
    )
  }

  const since = new Date()
  since.setMonth(since.getMonth() - 5)
  since.setDate(1)
  since.setHours(0, 0, 0, 0)

  const [invoices, workOrders, timeEntries, lineItems, dispatches] =
    await Promise.all([
      prisma.invoice.findMany({
        where: { organizationId, createdAt: { gte: since } },
        select: {
          createdAt: true,
          grandTotal: true,
          amountPaid: true,
        },
      }),
      prisma.workOrder.findMany({
        where: { organizationId, createdAt: { gte: since } },
        select: { createdAt: true, completedAt: true, status: true },
      }),
      prisma.timeEntry.findMany({
        where: {
          startedAt: { gte: since },
          user: { organizationId },
        },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.lineItem.findMany({
        where: {
          type: LineItemType.PART,
          OR: [
            { workOrder: { organizationId } },
            { invoice: { organizationId } },
            { estimate: { organizationId } },
          ],
        },
        include: { inventoryItem: { select: { category: true } } },
      }),
      prisma.dispatch.findMany({
        where: { organizationId, createdAt: { gte: since } },
        include: { driver: { select: { name: true, email: true } } },
      }),
    ])

  const keys = monthKeys()
  const revenue = keys.map((name) => {
    const rows = invoices.filter(
      (invoice) =>
        invoice.createdAt.toLocaleDateString("en-US", { month: "short" }) === name
    )
    return {
      name,
      revenue: rows.reduce((sum, invoice) => sum + Number(invoice.grandTotal), 0),
      collected: rows.reduce((sum, invoice) => sum + Number(invoice.amountPaid), 0),
    }
  })
  const jobs = keys.map((name) => {
    const rows = workOrders.filter(
      (workOrder) =>
        workOrder.createdAt.toLocaleDateString("en-US", { month: "short" }) === name
    )
    return {
      name,
      active: rows.filter(
        (workOrder) => workOrder.status !== WorkOrderStatus.COMPLETED
      ).length,
      completed: rows.filter(
        (workOrder) => workOrder.status === WorkOrderStatus.COMPLETED
      ).length,
    }
  })
  const techMap = new Map<string, { name: string; hours: number; jobs: Set<string> }>()
  timeEntries.forEach((entry) => {
    const name = entry.user.name ?? entry.user.email
    const row = techMap.get(name) ?? { name, hours: 0, jobs: new Set<string>() }
    row.hours += (entry.durationMin ?? 0) / 60
    if (entry.workOrderId) row.jobs.add(entry.workOrderId)
    techMap.set(name, row)
  })
  const techs = Array.from(techMap.values()).map((row) => ({
    name: row.name,
    hours: Math.round(row.hours),
    jobs: row.jobs.size,
  }))
  const partsMap = new Map<string, { name: string; cost: number; revenue: number }>()
  lineItems.forEach((lineItem) => {
    const name = lineItem.inventoryItem?.category ?? "Parts"
    const row = partsMap.get(name) ?? { name, cost: 0, revenue: 0 }
    row.cost += Number(lineItem.quantity) * Number(lineItem.unitCost)
    row.revenue += Number(lineItem.quantity) * Number(lineItem.unitPrice)
    partsMap.set(name, row)
  })
  const partsMargin = Array.from(partsMap.values()).map((row) => ({
    name: row.name,
    margin: row.revenue ? Math.round(((row.revenue - row.cost) / row.revenue) * 100) : 0,
    revenue: row.revenue,
  }))
  const driverMap = new Map<string, { name: string; completed: number; onTime: number }>()
  dispatches.forEach((dispatch) => {
    const name = dispatch.driver?.name ?? dispatch.driver?.email ?? "Unassigned"
    const row = driverMap.get(name) ?? { name, completed: 0, onTime: 0 }
    if (dispatch.completedAt) {
      row.completed += 1
      if (!dispatch.windowEnd || dispatch.completedAt <= dispatch.windowEnd) {
        row.onTime += 1
      }
    }
    driverMap.set(name, row)
  })
  const drivers = Array.from(driverMap.values())

  const fallback = seedData()
  const data: ReportsDashboardData = {
    revenue: revenue.some((row) => row.revenue > 0) ? revenue : fallback.revenue,
    jobs: jobs.some((row) => row.active || row.completed) ? jobs : fallback.jobs,
    techs: techs.length ? techs : fallback.techs,
    partsMargin: partsMargin.length ? partsMargin : fallback.partsMargin,
    drivers: drivers.some((row) => row.completed) ? drivers : fallback.drivers,
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-blue-100 bg-[linear-gradient(135deg,#eff6ff,#ffffff_52%,#e0f2fe)] p-6 shadow-sm dark:border-blue-900/60 dark:bg-[linear-gradient(135deg,#071827,#0c1728)]">
        <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
          Executive dashboards
        </Badge>
        <h1 className="text-4xl font-black tracking-tight">Reports</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Revenue, jobs, tech productivity, parts margin, and driver performance
          for owner-level operating decisions.
        </p>
      </section>

      <ReportsDashboard data={data} />
    </div>
  )
}
