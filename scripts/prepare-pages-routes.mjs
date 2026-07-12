import { copyFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

/** Extra static copies so direct /path hits return 200 even without HashRouter */
const routes = [
  'agent-input',
  'intake',
  'resources',
  'jobs',
  'board',
  'qc',
  'inventory',
  'customers',
  'scheduling',
  'invoicing',
  'settings',
]

const dist = join(process.cwd(), 'dist')
const index = join(dist, 'index.html')

for (const route of routes) {
  const dir = join(dist, route)
  mkdirSync(dir, { recursive: true })
  copyFileSync(index, join(dir, 'index.html'))
}

console.log(`Prepared ${routes.length} GitHub Pages route fallbacks`)
