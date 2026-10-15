import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './db.js'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const migrationsDir = path.join(currentDir, 'migrations')

export async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  const files = (await readdir(migrationsDir))
    .filter((filename) => filename.endsWith('.sql'))
    .sort()

  for (const filename of files) {
    const { rowCount } = await pool.query(
      'SELECT filename FROM schema_migrations WHERE filename = $1',
      [filename],
    )
    if (rowCount) continue

    const sql = await readFile(path.join(migrationsDir, filename), 'utf8')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename])
      await client.query('COMMIT')
      console.info(`Applied database migration ${filename}`)
    } catch (error) {
      await client.query('ROLLBACK')
      throw new Error(`Failed to apply database migration ${filename}`, { cause: error })
    } finally {
      client.release()
    }
  }
}
