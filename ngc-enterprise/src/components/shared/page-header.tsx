import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-[1.75rem] border border-blue-100/80 bg-white/78 p-5 shadow-sm shadow-blue-950/5 backdrop-blur dark:border-blue-950/70 dark:bg-slate-950/64 sm:flex-row sm:items-end sm:justify-between sm:p-6",
        className
      )}
    >
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-1">
          <h1 className="text-balance text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}
