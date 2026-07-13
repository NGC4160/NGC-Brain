import { StaticCustomerNewPage } from "@/components/demo/static-app-pages"
import { isStaticExport } from "@/lib/static"
import Link from "next/link"
import { ArrowLeft, Save, UserPlus } from "lucide-react"

import { createCustomer } from "@/lib/actions/customers"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function NewCustomerPage() {

  if (isStaticExport()) {
    return <StaticCustomerNewPage />
  }
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CRM"
        title="Create customer"
        description="Add a customer account with optional primary contact and billing address."
        actions={
          <Link
            href="/customers"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-xl bg-white/70 dark:bg-white/5")}
          >
            <ArrowLeft className="size-4" />
            Back to customers
          </Link>
        }
      />

      <form action={createCustomer} className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="size-5 text-blue-600" />
              Account details
            </CardTitle>
            <CardDescription>Core CRM information for search and reporting.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="displayName">Customer name</Label>
              <Input id="displayName" name="displayName" required className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company</Label>
              <Input id="companyName" name="companyName" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leadSource">Lead source</Label>
              <Input id="leadSource" name="leadSource" placeholder="Referral, web, fleet..." className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="altPhone">Alt phone</Label>
              <Input id="altPhone" name="altPhone" type="tel" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" name="tags" placeholder="lithium, fleet, northshore" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" placeholder="Preferences, service context, billing notes..." />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle>Primary contact</CardTitle>
              <CardDescription>Optional contact person for multi-person accounts.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactFirstName">First name</Label>
                <Input id="contactFirstName" name="contactFirstName" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactLastName">Last name</Label>
                <Input id="contactLastName" name="contactLastName" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email</Label>
                <Input id="contactEmail" name="contactEmail" type="email" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Phone</Label>
                <Input id="contactPhone" name="contactPhone" type="tel" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contactRole">Role</Label>
                <Input id="contactRole" name="contactRole" placeholder="Owner, fleet manager, spouse..." className="h-11 rounded-xl" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle>Billing address</CardTitle>
              <CardDescription>Added only when address, city, state, and ZIP are filled.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="addressLabel">Label</Label>
                <Input id="addressLabel" name="addressLabel" placeholder="Home, Shop, Billing" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address1">Address</Label>
                <Input id="address1" name="address1" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address2">Address 2</Label>
                <Input id="address2" name="address2" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" maxLength={2} className="h-11 rounded-xl uppercase" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="postalCode">ZIP</Label>
                <Input id="postalCode" name="postalCode" className="h-11 rounded-xl" />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" className="h-11 rounded-xl shadow-sm shadow-blue-600/20">
              <Save className="size-4" />
              Create customer
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
