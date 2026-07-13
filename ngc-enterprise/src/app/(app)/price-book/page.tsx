import { StaticPriceBookPage } from "@/components/demo/static-app-pages"
import { isStaticExport } from "@/lib/static"
import { LineItemType } from "@prisma/client"
import { BookOpen, Calculator, Plus, Search, Star } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createPriceBookItem } from "@/lib/actions/price-book"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { cn, formatCurrency } from "@/lib/utils"

type SearchParams = Promise<{ q?: string }>

function margin(unitCost: number, unitPrice: number) {
  if (!unitPrice) return 0
  return Math.round(((unitPrice - unitCost) / unitPrice) * 100)
}

export default async function PriceBookPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  if (isStaticExport()) {
    return <StaticPriceBookPage />
  }

  const session = await auth()
  const organizationId = session?.user?.organizationId
  const params = await searchParams
  const query = params?.q?.trim() ?? ""

  if (!organizationId) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No organization selected"
        description="Your user account is not connected to an organization yet."
      />
    )
  }

  const items = await prisma.priceBookItem.findMany({
    where: {
      organizationId,
      isActive: true,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { sku: { contains: query, mode: "insensitive" } },
              { category: { contains: query, mode: "insensitive" } },
              { subcategory: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [
      { isFavorite: "desc" },
      { category: "asc" },
      { subcategory: "asc" },
      { name: "asc" },
    ],
  })

  const favorites = items.filter((item) => item.isFavorite)
  const grouped = items.reduce<Record<string, Record<string, typeof items>>>(
    (acc, item) => {
      const category = item.category || "General"
      const subcategory = item.subcategory || "Uncategorized"
      acc[category] ??= {}
      acc[category][subcategory] ??= []
      acc[category][subcategory].push(item)
      return acc
    },
    {}
  )

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-blue-100 bg-[linear-gradient(135deg,#eff6ff,#ffffff_52%,#e0f2fe)] p-6 shadow-sm dark:border-blue-900/60 dark:bg-[linear-gradient(135deg,#071827,#0c1728)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
              Catalog control
            </Badge>
            <h1 className="text-4xl font-black tracking-tight">Price Book</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Search services, parts, fees, favorites, and margins from the shop
              counter without digging through spreadsheets.
            </p>
          </div>
          <Dialog>
            <DialogTrigger render={<Button className="rounded-full" />}>
              <Plus className="size-4" />
              Add item
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <form action={createPriceBookItem}>
                <DialogHeader>
                  <DialogTitle>Add price book item</DialogTitle>
                  <DialogDescription>
                    Add a service, part, labor line, or fee to the active price
                    book for this organization.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" required placeholder="48V lithium conversion" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input id="sku" name="sku" placeholder="LITH-48V-PRO" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" name="category" placeholder="Lithium" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subcategory">Subcategory</Label>
                    <Input id="subcategory" name="subcategory" placeholder="Conversions" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <select
                      id="type"
                      name="type"
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                      defaultValue={LineItemType.SERVICE}
                    >
                      {Object.values(LineItemType).map((type) => (
                        <option key={type} value={type}>
                          {type.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="unitCost">Cost</Label>
                      <Input id="unitCost" name="unitCost" type="number" step="0.01" min="0" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unitPrice">Price</Label>
                      <Input id="unitPrice" name="unitPrice" type="number" step="0.01" min="0" />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="What advisors see when quoting this item."
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input name="isFavorite" type="checkbox" className="size-4 rounded border-input" />
                    Mark as favorite
                  </label>
                </div>
                <DialogFooter>
                  <Button type="submit" className="rounded-full">
                    Save item
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[18rem_1fr]">
        <Card className="border-blue-100 shadow-sm dark:border-blue-900/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="size-4 text-amber-500" />
              Favorites
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {favorites.length ? (
              favorites.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded-2xl bg-muted/50 p-3">
                  <p className="truncate text-sm font-bold">{item.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatCurrency(Number(item.unitPrice))}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Favorite high-use items to keep advisor quoting fast.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <form className="relative" action="/price-book">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={query}
              placeholder="Search by SKU, item, category, or subcategory..."
              className="h-12 rounded-full bg-card pl-11 shadow-sm"
            />
          </form>

          {items.length ? (
            <div className="space-y-5">
              {Object.entries(grouped).map(([category, subgroups]) => (
                <Card
                  key={category}
                  className="border-blue-100 shadow-sm dark:border-blue-900/60"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-3">
                      <span>{category}</span>
                      <Badge variant="outline" className="rounded-full">
                        {Object.values(subgroups).flat().length} items
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(subgroups).map(([subcategory, subItems]) => (
                      <div key={subcategory}>
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                          {subcategory}
                        </p>
                        <div className="grid gap-3 lg:grid-cols-2">
                          {subItems.map((item) => {
                            const unitCost = Number(item.unitCost)
                            const unitPrice = Number(item.unitPrice)
                            const marginValue = margin(unitCost, unitPrice)

                            return (
                              <div
                                key={item.id}
                                className="rounded-3xl border bg-card p-4 shadow-sm"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate font-extrabold">
                                      {item.name}
                                    </p>
                                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                                      {item.sku ?? "No SKU"} • {item.type.toLowerCase()}
                                    </p>
                                  </div>
                                  {item.isFavorite ? (
                                    <Star className="size-4 fill-amber-400 text-amber-400" />
                                  ) : null}
                                </div>
                                <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                                  <div className="rounded-2xl bg-muted/50 p-3">
                                    <p className="text-xs text-muted-foreground">
                                      Cost
                                    </p>
                                    <p className="font-bold">
                                      {formatCurrency(unitCost)}
                                    </p>
                                  </div>
                                  <div className="rounded-2xl bg-muted/50 p-3">
                                    <p className="text-xs text-muted-foreground">
                                      Price
                                    </p>
                                    <p className="font-bold">
                                      {formatCurrency(unitPrice)}
                                    </p>
                                  </div>
                                  <div
                                    className={cn(
                                      "rounded-2xl p-3",
                                      marginValue >= 40
                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
                                        : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200"
                                    )}
                                  >
                                    <p className="text-xs opacity-80">Margin</p>
                                    <p className="flex items-center gap-1 font-bold">
                                      <Calculator className="size-3" />
                                      {marginValue}%
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No price book items found"
              description="Try another search or add a new item to begin building the catalog."
            />
          )}
        </div>
      </div>
    </div>
  )
}
