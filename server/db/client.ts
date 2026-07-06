import Database from 'better-sqlite3'
import { readFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../..')
const DB_PATH = process.env.DATABASE_PATH ?? join(ROOT, 'data/ngc.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    mkdirSync(dirname(DB_PATH), { recursive: true })
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    migrate(db)
  }
  return db
}

function migrate(database: Database.Database) {
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8')
  database.exec(schema)
}

export function closeDb() {
  db?.close()
  db = null
}

export { DB_PATH }
