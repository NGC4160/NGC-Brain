"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Package,
  Route,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const features = [
  {
    title: "Shop floor",
    description:
      "Track inspections, parts, approvals, and tech handoffs from intake through completion.",
    icon: Wrench,
  },
  {
    title: "Dispatch",
    description:
      "Coordinate pickups, delivery windows, driver work, and route readiness without spreadsheet drift.",
    icon: Route,
  },
  {
    title: "CRM",
    description:
      "Keep customers, leads, estimates, invoices, and service history tied to the cart lifecycle.",
    icon: Users,
  },
  {
    title: "Inventory",
    description:
      "Connect price book items, lithium kits, parts demand, and job margin into one operating view.",
    icon: Package,
  },
]

const roles = [
  {
    title: "Owner",
    copy: "Revenue, throughput, backlog, and margin at a glance.",
    icon: BarChart3,
  },
  {
    title: "Dispatcher",
    copy: "Clear pickup and delivery coordination for every route.",
    icon: CalendarCheck,
  },
  {
    title: "Technician",
    copy: "Focused job cards with approvals, parts, notes, and photos.",
    icon: ClipboardList,
  },
  {
    title: "Driver",
    copy: "Mobile-ready stops, customer context, and delivery status.",
    icon: Route,
  },
]

const fadeIn = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

export default function MarketingPage() {
  return (
    <main className="min-h-svh overflow-hidden bg-background text-foreground">
      <section className="relative min-h-svh overflow-hidden bg-[linear-gradient(135deg,#eff6ff_0%,#f8fafc_40%,#e0f2fe_100%)] dark:bg-[linear-gradient(135deg,#07111f_0%,#0b1b31_45%,#082f49_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(37,99,235,0.20),transparent_30rem),radial-gradient(circle_at_82%_14%,rgba(14,165,233,0.16),transparent_28rem),linear-gradient(rgba(37,99,235,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.055)_1px,transparent_1px)] bg-[size:auto,auto,56px_56px,56px_56px]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background to-transparent" />

        <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-8 lg:px-10">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-full bg-white/72 px-3 py-2 text-sm font-bold text-blue-800 shadow-sm ring-1 ring-blue-100 backdrop-blur dark:bg-white/10 dark:text-blue-100 dark:ring-white/10"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            NGC Enterprise
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "rounded-full"
              )}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "rounded-full shadow-lg shadow-blue-600/20"
              )}
            >
              Request access
            </Link>
          </div>
        </nav>

        <div className="relative mx-auto flex max-w-7xl flex-col px-6 pb-20 pt-16 sm:px-8 sm:pt-20 lg:px-10 lg:pb-28 lg:pt-24">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="max-w-5xl"
          >
            <Badge className="mb-8 h-8 gap-2 bg-blue-100 px-3 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
              <ShieldCheck className="size-4" />
              Housecall-Pro-like power for shop-first operators
            </Badge>
            <h1 className="text-balance text-6xl font-black tracking-[-0.065em] text-slate-950 sm:text-8xl lg:text-[8.8rem] lg:leading-[0.86] dark:text-white">
              NGC Enterprise
            </h1>
            <p className="mt-8 max-w-3xl text-pretty text-2xl font-semibold leading-9 text-slate-700 sm:text-3xl dark:text-slate-200">
              Shop-Based Service Operations Platform — Pickup • Repair •
              Deliver • Grow
            </p>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              A clean operating layer for service teams that need the whole
              shop aligned: customer intake, work orders, scheduling, parts,
              dispatch, communications, and reporting.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-12 rounded-full px-6 text-base shadow-xl shadow-blue-600/20"
                )}
              >
                Enter the platform
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 rounded-full border-blue-200 bg-white/70 px-6 text-base backdrop-blur dark:border-blue-900 dark:bg-white/10"
                )}
              >
                Request access
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16, ease: "easeOut" }}
            className="mt-16 grid max-w-4xl gap-3 sm:grid-cols-3"
          >
            {["No mobile-service drift", "Fast job visibility", "Margin-first reporting"].map(
              (proof) => (
                <div
                  key={proof}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  <CheckCircle2 className="size-4 text-primary" />
                  {proof}
                </div>
              )
            )}
          </motion.div>
        </div>
      </section>

      <section className="px-6 py-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-120px" }}
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
              Features
            </p>
            <h2 className="mt-4 text-balance text-4xl font-black tracking-tight sm:text-5xl">
              One operating system for the service shop.
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Every module is built around real work moving through the shop:
              one job, one customer, one source of truth.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon

              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className="group rounded-[1.75rem] border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/8"
                >
                  <div className="mb-8 flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground dark:bg-blue-950">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="mt-3 leading-7 text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/45 px-6 py-24 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-120px" }}
            variants={fadeIn}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
              Roles
            </p>
            <h2 className="mt-4 text-balance text-4xl font-black tracking-tight sm:text-5xl">
              Purpose-built views for every operator.
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Owners see performance, dispatch sees movement, techs see the
              next best action, and drivers see exactly where to go.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            {roles.map((role, index) => {
              const Icon = role.icon

              return (
                <motion.div
                  key={role.title}
                  initial={{ opacity: 0, x: 18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className="rounded-[1.5rem] border bg-card p-5 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <h3 className="font-bold">{role.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {role.copy}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.55 }}
          className="mx-auto max-w-5xl rounded-[2rem] border bg-[linear-gradient(135deg,#1d4ed8,#2563eb_52%,#0ea5e9)] p-8 text-white shadow-2xl shadow-blue-900/20 sm:p-12"
        >
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <Badge className="mb-5 bg-white/16 text-white ring-1 ring-white/20">
                <BookOpen className="size-4" />
                Ready for the next shop day
              </Badge>
              <h2 className="text-balance text-4xl font-black tracking-tight sm:text-5xl">
                Turn daily service chaos into a repeatable operating rhythm.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-50">
                Start with the shell, then layer in work orders, scheduling,
                price book, communications, and reporting as the platform grows.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "lg" }),
                  "h-12 rounded-full bg-white px-6 text-base text-blue-700 hover:bg-blue-50"
                )}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 rounded-full border-white/30 bg-white/10 px-6 text-base text-white hover:bg-white/16 hover:text-white"
                )}
              >
                Request access
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  )
}
