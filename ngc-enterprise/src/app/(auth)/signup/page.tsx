import Link from "next/link"
import { ArrowLeft, ArrowRight, Mail, ShieldCheck, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function SignupPage() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#eff6ff_0%,#f8fafc_48%,#e0f2fe_100%)] px-6 py-10 dark:bg-[linear-gradient(135deg,#07111f_0%,#0a1626_48%,#082f49_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(37,99,235,0.18),transparent_28rem),radial-gradient(circle_at_82%_18%,rgba(14,165,233,0.14),transparent_24rem)]" />
      <div className="relative w-full max-w-lg rounded-[2rem] border border-white/80 bg-white/84 p-6 shadow-2xl shadow-blue-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75 sm:p-8">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Back to home
        </Link>
        <Badge className="mb-5 gap-2 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
          <ShieldCheck className="size-4" />
          Request access
        </Badge>
        <div className="mb-8 space-y-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-blue-600/20">
            <Sparkles className="size-5" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Bring your team into NGC Enterprise.
          </h1>
          <p className="leading-7 text-muted-foreground">
            Share your work email and we will route setup through the account
            owner. This is ready for real onboarding when auth is wired.
          </p>
        </div>
        <form className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="signup-email">Work email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="signup-email"
                className="h-11 rounded-xl bg-white/70 pl-10 dark:bg-white/5"
                placeholder="name@company.com"
                type="email"
              />
            </div>
          </div>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "h-11 w-full rounded-xl text-base"
            )}
          >
            Continue to login
            <ArrowRight className="size-4" />
          </Link>
        </form>
      </div>
    </main>
  )
}
