import 'dotenv/config'
import { importDefaultExports, importFromDirectory, getImportStatus } from './import/hcpImportService.js'
import { closeDb } from './db/client.js'

const dir = process.argv[2]

try {
  console.log('NGC DMS — Housecall Pro import')
  console.log(dir ? `Directory: ${dir}` : 'Using default export locations (data/imports/hcp/)')

  const stats = dir ? importFromDirectory(dir) : importDefaultExports()
  const status = getImportStatus()

  console.log('\nImport complete:')
  console.log(`  Customers created: ${stats.customersCreated}, updated: ${stats.customersUpdated}`)
  console.log(`  Vehicles created:  ${stats.vehiclesCreated}`)
  console.log(`  Work orders created: ${stats.workOrdersCreated}, updated: ${stats.workOrdersUpdated}`)
  console.log(`  Pricebook created: ${stats.pricebookCreated}, updated: ${stats.pricebookUpdated}`)
  console.log(`  Skipped: ${stats.skipped}`)
  if (stats.errors.length) {
    console.log(`  Errors (${stats.errors.length}):`)
    stats.errors.slice(0, 10).forEach((e) => console.log(`    - ${e}`))
    if (stats.errors.length > 10) console.log(`    … and ${stats.errors.length - 10} more`)
  }

  console.log('\nDatabase totals:')
  console.log(`  Customers: ${status.counts.customers}`)
  console.log(`  Vehicles: ${status.counts.vehicles}`)
  console.log(`  Work orders: ${status.counts.workOrders}`)
  console.log(`  Pricebook items: ${status.counts.pricebookItems}`)
  console.log(`  Bookkeeper: ${status.bookkeeper}`)
} catch (err) {
  console.error('Import failed:', err)
  process.exitCode = 1
} finally {
  closeDb()
}
