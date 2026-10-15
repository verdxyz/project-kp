import 'dotenv/config'
import path from 'node:path'

let pool
let embeddedDatabase
let embeddedPostgresServer
let httpServer

try {
  const useEmbeddedDatabase = process.env.LOCAL_DATABASE === 'embedded'
  if (useEmbeddedDatabase && process.env.NODE_ENV === 'production') {
    throw new Error('LOCAL_DATABASE=embedded is for local development only.')
  }
  if (useEmbeddedDatabase) {
    const databasePort = Number(process.env.LOCAL_DATABASE_PORT || 5433)
    process.env.DATABASE_URL ||= `postgres://postgres:postgres@127.0.0.1:${databasePort}/postgres`
    const [{ PGlite }, { PGLiteSocketServer }] = await Promise.all([
      import('@electric-sql/pglite'),
      import('@electric-sql/pglite-socket'),
    ])
    const dataDir = path.resolve(process.env.LOCAL_DATABASE_DIR || './storage/postgres')
    embeddedDatabase = new PGlite(dataDir)
    await embeddedDatabase.waitReady
    embeddedPostgresServer = new PGLiteSocketServer({
      db: embeddedDatabase,
      host: '127.0.0.1',
      port: databasePort,
      maxConnections: 10,
    })
    await embeddedPostgresServer.start()
    console.info(`Embedded PostgreSQL listening at 127.0.0.1:${databasePort}`)
  } else if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be configured, or set LOCAL_DATABASE=embedded for local development.')
  }

  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 characters.')
  }

  const [{ seedGlobalAdmin }, database, { runMigrations }] = await Promise.all([
    import('./auth.js'),
    import('./db.js'),
    import('./migrate.js'),
  ])
  pool = database.pool
  await runMigrations()
  await seedGlobalAdmin()

  const { default: app } = await import('./app.js')
  const port = Number(process.env.PORT || 3000)
  httpServer = app.listen(port, process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'), () => {
    console.info(`B2G API listening at http://127.0.0.1:${port}`)
  })

  const shutdown = async () => {
    await new Promise((resolve) => httpServer.close(resolve))
    await pool.end()
    await embeddedPostgresServer?.stop()
    await embeddedDatabase?.close()
  }
  process.once('SIGINT', () => { void shutdown() })
  process.once('SIGTERM', () => { void shutdown() })
} catch (error) {
  console.error('Failed to start B2G server:', error)
  await pool?.end()
  await embeddedPostgresServer?.stop()
  await embeddedDatabase?.close()
  process.exitCode = 1
}
