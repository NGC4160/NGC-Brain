import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type StatCardProps = {
  label: string
  value: ReactNode
  helper?: ReactNode
  icon?: LucideIcon
  trend?: string
  className?: string
}

export function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "border-blue-100/80 bg-white/82 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70",
        className
      )}
    >
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-muted-foreground">{label}</p>
          {Icon ? (
            <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-900/70">
              <Icon className="size-5" />
            </span>
          ) : null}
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            {value}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {trend ? (
              <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/70">
                {trend}
              </span>
            ) : null}
            {helper ? <span className="text-muted-foreground">{helper}</span> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
