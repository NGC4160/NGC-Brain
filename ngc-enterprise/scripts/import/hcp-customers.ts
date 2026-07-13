/**
 * Housecall Pro CSV import stubs.
 *
 * Usage:
 *   npx tsx scripts/import/hcp-customers.ts ./path/to/customers.csv
 *
 * Map HCP export columns → NGC Enterprise Customer / WorkOrder / PriceBookItem.
 * TODO: wire full mapping UI from Settings → Import/Export.
 */

import { readFileSync } from "fs"

function parseCsv(content: string): string[][] {
  return content
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(",").map((cell) => cell.replace(/^"|"$/g, "").trim()))
}

async function main() {
  const file = process.argv[2]
  if (!file) {
    console.error("Usage: npx tsx scripts/import/hcp-customers.ts <customers.csv>")
    process.exit(1)
  }

  const rows = parseCsv(readFileSync(file, "utf8"))
  const [header, ...data] = rows
  console.log(`Parsed ${data.length} HCP customer rows`)
  console.log("Headers:", header.join(", "))
  console.log(
    "Dry-run only — implement Prisma upserts for displayName, email, phone, addresses.",
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
