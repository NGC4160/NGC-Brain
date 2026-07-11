import { ExternalLink, Pin, PinOff } from 'lucide-react'
import type { Resource } from '@/types'
import { resourceCategories } from '@/config/app.config'
import { cn } from '@/lib/utils'

interface ResourceCardProps {
  resource: Resource
  onTogglePin?: (id: string) => void
  compact?: boolean
}

function getCategoryLabel(categoryId: string): string {
  return resourceCategories.find((c) => c.id === categoryId)?.label ?? categoryId
}

function resolveResourceUrl(url: string): string {
  if (/^https?:\/\//i.test(url) || url.startsWith('mailto:') || url.startsWith('tel:')) {
    return url
  }
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  const path = url.replace(/^\//, '')
  return `${normalizedBase}${path}`
}

export function ResourceCard({ resource, onTogglePin, compact }: ResourceCardProps) {
  return (
    <div
      className={cn(
        'card flex flex-col gap-3',
        compact && 'p-4',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {getCategoryLabel(resource.category)}
          </span>
          <h3 className="mt-2 font-semibold text-slate-900 dark:text-white">
            {resource.title}
          </h3>
          {!compact && resource.description && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {resource.description}
            </p>
          )}
        </div>
        {onTogglePin && (
          <button
            type="button"
            onClick={() => onTogglePin(resource.id)}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800"
            title={resource.pinned ? 'Unpin' : 'Pin to dashboard'}
          >
            {resource.pinned ? (
              <PinOff className="h-4 w-4" />
            ) : (
              <Pin className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {(resource.make || resource.model) && (
        <p className="text-xs text-slate-500">
          {[resource.make, resource.model, resource.yearRange].filter(Boolean).join(' · ')}
        </p>
      )}

      {resource.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {resource.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] text-brand-700 dark:bg-brand-950 dark:text-brand-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <a
        href={resolveResourceUrl(resource.url)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
      >
        Open
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  )
}
