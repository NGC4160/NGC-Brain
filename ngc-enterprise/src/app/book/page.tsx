"use client"

import { StaticBookPage } from "@/components/demo/static-app-pages"
import { isStaticExport } from "@/lib/static"
import { useState } from "react"
import Link from "next/link"
import { CalendarCheck, MapPin, Truck, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function BookingPage() {
  const [submitted, setSubmitted] = useState(false)

  if (isStaticExport()) {
    return <StaticBookPage />
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#f8fafc_55%)] px-4 py-16">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
            N
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Request received
          </h1>
          <p className="mt-3 text-muted-foreground">
            We’ll confirm your drop-off or pickup window shortly. Shop hours Mon–Fri 8 AM – 5 PM.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            Back to home
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#f8fafc_55%)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-2 lg:items-start lg:py-20">
        <section className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            NGC Enterprise
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Book drop-off or request pickup
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            Shop-based service — bring it in, or we’ll pick it up. Repair happens in our bays, then you pick up or we deliver.
          </p>
          <ul className="space-y-3 text-sm text-foreground/80">
            <li className="flex items-center gap-3">
              <Wrench className="size-4 text-primary" /> Diagnostic from $179 (applies toward repair)
            </li>
            <li className="flex items-center gap-3">
              <Truck className="size-4 text-primary" /> Free pickup/delivery within 40 mi Northshore
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="size-4 text-primary" /> 71363 Thelma Ln, Suite E, Covington, LA
            </li>
            <li className="flex items-center gap-3">
              <CalendarCheck className="size-4 text-primary" /> Mon–Fri 8 AM – 5 PM
            </li>
          </ul>
        </section>

        <form
          className="space-y-4 rounded-2xl border border-border/70 bg-background/90 p-6 shadow-sm backdrop-blur"
          onSubmit={(e) => {
            e.preventDefault()
            setSubmitted(true)
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required placeholder="Jordan Smith" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" required placeholder="985-555-0100" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service">Service type</Label>
            <select
              id="service"
              name="service"
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              defaultValue="diagnostic"
            >
              <option value="diagnostic">Diagnostic</option>
              <option value="lithium">Lithium conversion</option>
              <option value="repair">General repair</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mode">How should we get the cart?</Label>
            <select
              id="mode"
              name="mode"
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              defaultValue="dropoff"
            >
              <option value="dropoff">I’ll drop it off</option>
              <option value="pickup">Request pickup</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="details">Cart / issue details</Label>
            <Textarea
              id="details"
              name="details"
              placeholder="Make, model, year, and what’s going on…"
              rows={4}
            />
          </div>
          <Button type="submit" className="w-full">
            Submit booking request
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Embeddable widget endpoint — wire to create Lead + Work Order in production.
          </p>
        </form>
      </div>
    </main>
  )
}
