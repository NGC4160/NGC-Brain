"use client"

import { Suspense, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { motion } from "framer-motion"
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const demoAccounts = [
  {
    label: "Owner",
    email: "owner@ngcgolfcarts.com",
    password: "demo-owner",
  },
  {
    label: "Dispatcher",
    email: "dispatch@ngcgolfcarts.com",
    password: "demo-dispatch",
  },
  {
    label: "Tech",
    email: "tech@ngcgolfcarts.com",
    password: "demo-tech",
  },
  {
    label: "Driver",
    email: "driver@ngcgolfcarts.com",
    password: "demo-driver",
  },
]

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard"
  const urlError = searchParams.get("error")
  const [email, setEmail] = useState(demoAccounts[0].email)
  const [password, setPassword] = useState(demoAccounts[0].password)
  const [selectedDemo, setSelectedDemo] = useState(demoAccounts[0].label)
  const [error, setError] = useState<string | null>(
    urlError ? "We could not sign you in. Please try again." : null
  )
  const [loading, setLoading] = useState(false)

  const selectedRole = useMemo(
    () => demoAccounts.find((account) => account.label === selectedDemo),
    [selectedDemo]
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        setError("Those credentials did not match an NGC Enterprise user.")
        return
      }

      router.push(result?.url ?? callbackUrl)
      router.refresh()
    } catch {
      setError(
        "Demo sign-in is not wired to NextAuth yet. The app shell is using a temporary local session."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-[linear-gradient(135deg,#eff6ff_0%,#f8fafc_42%,#e0f2fe_100%)] text-foreground dark:bg-[linear-gradient(135deg,#07111f_0%,#0a1626_48%,#082f49_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(37,99,235,0.18),transparent_28rem),radial-gradient(circle_at_85%_12%,rgba(14,165,233,0.14),transparent_24rem),linear-gradient(rgba(37,99,235,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.06)_1px,transparent_1px)] bg-[size:auto,auto,48px_48px,48px_48px]" />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background/90 to-transparent" />

      <div className="relative mx-auto grid min-h-svh w-full max-w-7xl grid-cols-1 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="flex min-h-[46svh] flex-col justify-between px-6 py-8 sm:px-10 lg:min-h-svh lg:px-12">
          <Link
            href="/"
            className="flex w-fit items-center gap-3 rounded-full bg-white/70 px-3 py-2 text-sm font-semibold text-blue-800 shadow-sm ring-1 ring-blue-100 backdrop-blur dark:bg-white/10 dark:text-blue-100 dark:ring-white/10"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            NGC Enterprise
          </Link>

          <div className="max-w-3xl py-16 lg:py-0">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="space-y-8"
            >
              <Badge className="h-8 gap-2 bg-blue-100 px-3 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                <ShieldCheck className="size-4" />
                Shop-first service command center
              </Badge>
              <div className="space-y-5">
                <h1 className="max-w-3xl text-balance text-5xl font-black tracking-[-0.055em] text-slate-950 sm:text-7xl lg:text-8xl dark:text-white">
                  NGC Enterprise
                </h1>
                <p className="max-w-2xl text-pretty text-xl font-medium leading-8 text-slate-600 sm:text-2xl dark:text-slate-300">
                  Pickup, repair, deliver, and grow every shop job from one
                  calm operations platform.
                </p>
              </div>
              <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
                {["Live shop board", "Role-based work", "Revenue visibility"].map(
                  (item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-2xl bg-white/65 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-blue-100 backdrop-blur dark:bg-white/10 dark:text-slate-200 dark:ring-white/10"
                    >
                      <CheckCircle2 className="size-4 text-primary" />
                      {item}
                    </div>
                  )
                )}
              </div>
            </motion.div>
          </div>

          <div className="hidden items-center gap-3 text-sm text-slate-500 lg:flex dark:text-slate-400">
            <Wrench className="size-4 text-primary" />
            Built for shop-based service operations.
          </div>
        </section>

        <section className="flex items-center justify-center px-6 pb-10 sm:px-10 lg:px-12 lg:py-12">
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
            className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white/82 p-5 shadow-2xl shadow-blue-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/72 dark:shadow-black/30 sm:p-7"
          >
            <div className="mb-7 space-y-2">
              <p className="text-sm font-semibold text-primary">
                Welcome back
              </p>
              <h2 className="text-2xl font-bold tracking-tight">
                Sign in to the shop
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Choose a demo role or enter your NGC Enterprise credentials.
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <Button
                  key={account.label}
                  type="button"
                  variant={selectedDemo === account.label ? "default" : "outline"}
                  className={cn(
                    "h-10 justify-start rounded-xl",
                    selectedDemo !== account.label && "bg-white/60 dark:bg-white/5"
                  )}
                  onClick={() => {
                    setSelectedDemo(account.label)
                    setEmail(account.email)
                    setPassword(account.password)
                    setError(null)
                  }}
                >
                  {account.label}
                </Button>
              ))}
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    autoComplete="email"
                    className="h-11 rounded-xl bg-white/70 pl-10 dark:bg-white/5"
                    inputMode="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="owner@ngcgolfcarts.com"
                    required
                    type="email"
                    value={email}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    autoComplete="current-password"
                    className="h-11 rounded-xl bg-white/70 pl-10 dark:bg-white/5"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter password"
                    required
                    type="password"
                    value={password}
                  />
                </div>
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-200">
                  {error}
                </div>
              ) : (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm leading-6 text-blue-700 dark:border-blue-950 dark:bg-blue-950/40 dark:text-blue-200">
                  {selectedRole?.label} demo fills a ready-to-test shop role.
                </div>
              )}

              <Button
                className="h-11 w-full rounded-xl text-base font-semibold"
                disabled={loading}
                type="submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Open NGC Enterprise
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Need an account?{" "}
              <Link href="/signup" className="font-semibold text-primary">
                Request access
              </Link>
            </p>
          </motion.div>
        </section>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-background">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
