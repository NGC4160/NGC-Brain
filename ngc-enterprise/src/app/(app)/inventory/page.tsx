import { StaticInventoryPage } from "@/components/demo/static-app-pages"
import { isStaticExport } from "@/lib/static"
import { AlertTriangle, Boxes, ClipboardList, Package, RefreshCw } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { updateInventoryReorderPoint } from "@/lib/actions/inventory"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"

export default async function InventoryPage() {
  if (isStaticExport()) {
    return <StaticInventoryPage />
  }

  const session = await auth()
  const organizationId = session?.user?.organizationId

  if (!organizationId) {
    return (
      <EmptyState
        icon={Package}
        title="No organization selected"
        description="Your user account is not connected to an organization yet."
      />
    )
  }

  const items = await prisma.inventoryItem.findMany({
    where: { organizationId, isActive: true },
    include: {
      vendor: { select: { name: true } },
      stockLevels: {
        include: { location: { select: { name: true, code: true } } },
        orderBy: { location: { name: "asc" } },
      },
      reservations: {
        where: { status: "RESERVED" },
        include: {
          workOrder: {
            select: {
              number: true,
              title: true,
              customer: { select: { displayName: true } },
            },
          },
        },
      },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  })

  const enriched = items.map((item) => {
    const onHand = item.stockLevels.reduce(
      (sum, stock) => sum + stock.quantityOnHand,
      0
    )
    const reserved = item.stockLevels.reduce(
      (sum, stock) => sum + stock.quantityReserved,
      0
    )
    const reservationQty = item.reservations.reduce(
      (sum, reservation) => sum + reservation.quantity,
      0
    )
    return {
      ...item,
      onHand,
      reserved: Math.max(reserved, reservationQty),
      available: onHand - Math.max(reserved, reservationQty),
      lowStock: onHand - Math.max(reserved, reservationQty) <= item.reorderPoint,
    }
  })

  const lowStock = enriched.filter((item) => item.lowStock)
  const totalOnHand = enriched.reduce((sum, item) => sum + item.onHand, 0)
  const totalReserved = enriched.reduce((sum, item) => sum + item.reserved, 0)
  const stockValue = enriched.reduce(
    (sum, item) => sum + item.onHand * Number(item.unitCost),
    0
  )

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-blue-100 bg-[linear-gradient(135deg,#eff6ff,#ffffff_52%,#e0f2fe)] p-6 shadow-sm dark:border-blue-900/60 dark:bg-[linear-gradient(135deg,#071827,#0c1728)]">
        <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
          Parts command
        </Badge>
        <h1 className="text-4xl font-black tracking-tight">Inventory</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Stock levels, low-stock alerts, reorder points, and reservation demand
          tied directly to active work orders.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardContent className="flex items-center gap-4 p-5">
            <Boxes className="size-9 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">On hand</p>
              <p className="text-2xl font-black">{totalOnHand}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardContent className="flex items-center gap-4 p-5">
            <ClipboardList className="size-9 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Reserved</p>
              <p className="text-2xl font-black">{totalReserved}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardContent className="flex items-center gap-4 p-5">
            <AlertTriangle className="size-9 text-amber-500" />
            <div>
              <p className="text-sm text-muted-foreground">Low stock</p>
              <p className="text-2xl font-black">{lowStock.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardContent className="flex items-center gap-4 p-5">
            <RefreshCw className="size-9 text-emerald-500" />
            <div>
              <p className="text-sm text-muted-foreground">Stock value</p>
              <p className="text-2xl font-black">{formatCurrency(stockValue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {lowStock.length ? (
        <Card className="border-amber-200 bg-amber-50/70 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="size-5" />
              Low-stock alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {lowStock.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-3xl bg-card p-4 shadow-sm">
                <p className="font-bold">{item.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Available {item.available} • reorder at {item.reorderPoint}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {enriched.length ? (
        <div className="grid gap-4">
          {enriched.map((item) => (
            <Card
              key={item.id}
              className="border-blue-100 shadow-sm dark:border-blue-900/60"
            >
              <CardContent className="grid gap-5 p-5 xl:grid-cols-[1fr_20rem]">
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-black tracking-tight">
                          {item.name}
                        </h2>
                        {item.lowStock ? (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200">
                            Low stock
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {item.sku ?? "No SKU"} • {item.category ?? "General"} •{" "}
                        {item.vendor?.name ?? "No vendor"}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="rounded-2xl bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">On hand</p>
                        <p className="font-black">{item.onHand}</p>
                      </div>
                      <div className="rounded-2xl bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">Reserved</p>
                        <p className="font-black">{item.reserved}</p>
                      </div>
                      <div className="rounded-2xl bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">Available</p>
                        <p className="font-black">{item.available}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {item.stockLevels.length ? (
                      item.stockLevels.map((stock) => (
                        <div key={stock.id} className="rounded-3xl border bg-muted/30 p-4">
                          <p className="font-bold">
                            {stock.location.name ?? stock.location.code ?? "Location"}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {stock.quantityOnHand} on hand • {stock.quantityReserved} reserved
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/50 p-4 text-sm text-muted-foreground dark:border-blue-900 dark:bg-blue-950/20">
                        No stock levels recorded yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 rounded-3xl border bg-muted/30 p-4">
                  <form action={updateInventoryReorderPoint} className="space-y-3">
                    <input type="hidden" name="itemId" value={item.id} />
                    <p className="font-bold">Reorder settings</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        name="reorderPoint"
                        type="number"
                        min="0"
                        defaultValue={item.reorderPoint}
                        aria-label="Reorder point"
                      />
                      <Input
                        name="reorderQty"
                        type="number"
                        min="0"
                        defaultValue={item.reorderQty}
                        aria-label="Reorder quantity"
                      />
                    </div>
                    <Button type="submit" variant="outline" className="w-full rounded-full">
                      Update reorder
                    </Button>
                  </form>
                  <div>
                    <p className="font-bold">Reservations</p>
                    <div className="mt-3 space-y-2">
                      {item.reservations.length ? (
                        item.reservations.slice(0, 4).map((reservation) => (
                          <div
                            key={reservation.id}
                            className="rounded-2xl bg-card p-3 text-sm"
                          >
                            <p className="font-semibold">
                              {reservation.quantity} reserved •{" "}
                              {reservation.workOrder.number}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {reservation.workOrder.customer?.displayName} •{" "}
                              {reservation.workOrder.title}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No active reservations.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title="No inventory items yet"
          description="Parts, batteries, accessories, and kits will appear here once added to inventory."
        />
      )}
    </div>
  )
}
