import { NextResponse } from "next/server"

import { formatCurrency } from "@/lib/utils"

export async function GET(request: Request) {
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "1") {
    return NextResponse.json({ results: [] })
  }

  const [{ auth }, { prisma }] = await Promise.all([
    import("@/lib/auth"),
    import("@/lib/db"),
  ])
  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return NextResponse.json({ results: [] }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim()

  if (!q) {
    return NextResponse.json({ results: [] })
  }

  const [customers, workOrders, invoices] = await Promise.all([
    prisma.customer.findMany({
      where: {
        organizationId,
        OR: [
          { displayName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, displayName: true, email: true, phone: true },
      take: 6,
      orderBy: { displayName: "asc" },
    }),
    prisma.workOrder.findMany({
      where: {
        organizationId,
        OR: [
          { number: { contains: q, mode: "insensitive" } },
          { title: { contains: q, mode: "insensitive" } },
          { customer: { displayName: { contains: q, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        customer: { select: { displayName: true } },
      },
      take: 6,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.invoice.findMany({
      where: {
        organizationId,
        OR: [
          { number: { contains: q, mode: "insensitive" } },
          { customer: { displayName: { contains: q, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true,
        number: true,
        status: true,
        amountDue: true,
        customer: { select: { displayName: true } },
      },
      take: 6,
      orderBy: { updatedAt: "desc" },
    }),
  ])

  return NextResponse.json({
    results: [
      ...customers.map((customer) => ({
        type: "customer",
        id: customer.id,
        title: customer.displayName,
        subtitle: customer.email ?? customer.phone ?? "Customer",
        href: `/customers/${customer.id}`,
      })),
      ...workOrders.map((workOrder) => ({
        type: "workOrder",
        id: workOrder.id,
        title: `${workOrder.number} • ${workOrder.title}`,
        subtitle: `${workOrder.customer?.displayName ?? "Customer"} • ${workOrder.status}`,
        href: `/work-orders/${workOrder.id}`,
      })),
      ...invoices.map((invoice) => ({
        type: "invoice",
        id: invoice.id,
        title: `Invoice ${invoice.number}`,
        subtitle: `${invoice.customer?.displayName ?? "Customer"} • ${formatCurrency(
          Number(invoice.amountDue)
        )} due`,
        href: `/invoices/${invoice.id}`,
      })),
    ],
  })
}
