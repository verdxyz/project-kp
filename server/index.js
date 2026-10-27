import 'dotenv/config'
import path from 'node:path'
import dotenv from 'dotenv'

const envFile = dotenv.config().parsed
for (const key of ['LOCAL_DATABASE', 'ADMIN_EMAIL', 'ADMIN_NAME', 'ADMIN_PASSWORD']) {
  if (envFile?.[key]) process.env[key] = envFile[key]
}

let pool
let embeddedDatabase
let embeddedPostgresServer
let httpServer

try {
  const databaseMode = process.env.LOCAL_DATABASE
  if (databaseMode && !['embedded', 'managed'].includes(databaseMode)) {
    throw new Error('LOCAL_DATABASE must be set to embedded or managed.')
  }
  const useEmbeddedDatabase = databaseMode === 'embedded'
    || (!databaseMode && !process.env.DATABASE_URL && process.env.NODE_ENV !== 'production')
  if (useEmbeddedDatabase && process.env.NODE_ENV === 'production') {
    throw new Error('LOCAL_DATABASE=embedded is for local development only.')
  }
  if (useEmbeddedDatabase) {
    const databasePort = Number(process.env.LOCAL_DATABASE_PORT || 5433)
    process.env.DATABASE_URL = `postgres://postgres:postgres@127.0.0.1:${databasePort}/postgres`
    const [{ PGlite }, { PGLiteSocketServer }, { mkdir }] = await Promise.all([
      import('@electric-sql/pglite'),
      import('@electric-sql/pglite-socket'),
      import('node:fs/promises'),
    ])
    const dataDir = path.resolve(process.env.LOCAL_DATABASE_DIR || './storage/postgres')
    await mkdir(dataDir, { recursive: true })
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

  const [database, { runMigrations }] = await Promise.all([
    import('./db.js'),
    import('./migrate.js'),
  ])
  pool = database.pool
  // Bring existing local databases up to the current admin schema before seeding.
  await runMigrations()
  const { seedGlobalAdmin } = await import('./auth.js')
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
