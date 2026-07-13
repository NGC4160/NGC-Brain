import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-blue-100/80 bg-white/78 p-6 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/64">
        <Skeleton className="mb-4 h-3 w-36" />
        <Skeleton className="h-10 w-full max-w-lg" />
        <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-blue-100/80 bg-white/82 p-4 shadow-sm shadow-blue-950/5 dark:border-blue-950/70 dark:bg-slate-950/70"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="size-10 rounded-2xl" />
            </div>
            <Skeleton className="mt-6 h-9 w-32" />
            <Skeleton className="mt-3 h-4 w-40" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  )
}
