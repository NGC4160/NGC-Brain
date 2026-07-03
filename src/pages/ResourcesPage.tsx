import { useMemo, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { ResourceCard } from '@/components/resources/ResourceCard'
import { resourceCategories } from '@/config/app.config'
import { Search } from 'lucide-react'

export function ResourcesPage() {
  const { resources, toggleResourcePin } = useApp()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [makeFilter, setMakeFilter] = useState('all')

  const makes = useMemo(() => {
    const set = new Set(resources.map((r) => r.make).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [resources])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return resources.filter((r) => {
      if (category !== 'all' && r.category !== category) return false
      if (makeFilter !== 'all' && r.make !== makeFilter) return false
      if (!q) return true
      return (
        r.title.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)) ||
        r.make?.toLowerCase().includes(q) ||
        r.model?.toLowerCase().includes(q)
      )
    })
  }, [resources, search, category, makeFilter])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Manuals & Files
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Service manuals, wiring diagrams, parts catalogs, and shop SOPs
        </p>
      </div>

      <div className="card flex flex-wrap gap-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search by title, tag, make, model…"
            className="input-field pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field w-auto min-w-[160px]"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">All categories</option>
          {resourceCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          className="input-field w-auto min-w-[140px]"
          value={makeFilter}
          onChange={(e) => setMakeFilter(e.target.value)}
        >
          <option value="all">All makes</option>
          {makes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card py-12 text-center text-sm text-slate-400">
          No resources match your filters. Try a different search or add entries in{' '}
          <code className="text-xs">src/data/resources.json</code>.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onTogglePin={toggleResourcePin}
            />
          ))}
        </div>
      )}

      <section className="card bg-slate-50 dark:bg-slate-900/50">
        <h2 className="font-semibold text-slate-900 dark:text-white">
          Adding new manuals
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Edit <code className="rounded bg-slate-200 px-1 dark:bg-slate-800">src/data/resources.json</code>{' '}
          to add links without touching app code. See{' '}
          <code className="rounded bg-slate-200 px-1 dark:bg-slate-800">docs/ADDING_RESOURCES.md</code>{' '}
          for the full guide.
        </p>
      </section>
    </div>
  )
}
