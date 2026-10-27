import path from 'node:path'
import { randomUUID } from 'node:crypto'
import express from 'express'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import { pool } from './db.js'
import { requireAdmin } from './auth.js'
import { login, currentUser, logout } from './controllers/authController.js'
import {
  listProjects, getProject, saveProject, deleteProject,
} from './controllers/projectController.js'
import {
  listDocuments, uploadDocument, downloadDocument, deleteDocument,
} from './controllers/documentController.js'
import {
  getServicePivot,
  importServicePoints,
  listServicePoints,
  batchUpdateServicePoints,
} from './controllers/servicePointController.js'

const app = express()

app.disable('x-powered-by')
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1)
app.use(express.json({ limit: '1mb' }))

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error('SESSION_SECRET must contain at least 32 characters.')
}
const PgSession = connectPgSimple(session)
app.use(session({
  store: new PgSession({ pool, tableName: 'user_sessions', createTableIfMissing: true }),
  name: 'b2g.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000,
  },
}))

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
})
const allowedOrigins = new Set(
  (process.env.ALLOWED_APP_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean),
)
app.use('/api', (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.get('origin')?.replace(/\/$/, '')
    const forwardedHost = req.get('x-forwarded-host')?.split(',')[0].trim()
    const requestHost = forwardedHost || req.get('host')
    const sameOrigin = origin === `${req.protocol}://${requestHost}`
    const localDevelopmentOrigin = process.env.NODE_ENV !== 'production'
      && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '')
    if (origin && !sameOrigin && !allowedOrigins.has(origin) && !localDevelopmentOrigin) {
      return res.status(403).json({ message: 'Permintaan lintas-origin ditolak.' })
    }
  }
  next()
})

app.post('/api/auth/login', loginLimiter, login)
app.get('/api/auth/me', requireAdmin, currentUser)
app.post('/api/auth/logout', logout)

const allowedExtensions = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg',
])
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowedExtensions.has(path.extname(file.originalname).toLowerCase())) {
      return callback(new Error('Format file tidak didukung. Gunakan PDF, Office, atau gambar.'))
    }
    callback(null, true)
  },
})

app.get('/api/health', async (_req, res, next) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok' })
  } catch (error) {
    next(error)
  }
})

app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth/')) return next()
  return requireAdmin(req, res, next)
})

app.get('/api/agencies', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT name, agency_type AS "agencyType", region FROM government_agencies ORDER BY name',
    )
    res.json({ agencies: rows })
  } catch (error) {
    next(error)
  }
})

app.get('/api/projects', listProjects)
app.post('/api/projects', saveProject)
app.get('/api/projects/:idLOP', getProject)
app.put('/api/projects/:id', saveProject)
app.delete('/api/projects/:idLOP', deleteProject)
app.get('/api/projects/:idLOP/documents', listDocuments)
app.get('/api/reports/service-pivot', getServicePivot)
app.get('/api/projects/:idLOP/service-points', listServicePoints)
app.put('/api/projects/:idLOP/service-points', batchUpdateServicePoints)
app.post(
  '/api/projects/:idLOP/service-points/import',
  (req, res, next) => upload.single('file')(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'Ukuran file maksimal 10 MB.' })
    }
    if (error) return res.status(400).json({ message: error.message })
    next()
  }),
  importServicePoints,
)
app.post(
  '/api/projects/:idLOP/documents/:documentType',
  (req, res, next) => upload.single('file')(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'Ukuran file maksimal 10 MB.' })
    }
    if (error) return res.status(400).json({ message: error.message })
    next()
  }),
  uploadDocument,
)
app.get('/api/projects/:idLOP/documents/:documentType/file', downloadDocument)
app.delete('/api/projects/:idLOP/documents/:documentType', deleteDocument)

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Endpoint API tidak ditemukan.' })
})

if (process.env.NODE_ENV === 'production') {
  const distDir = path.resolve('dist')
  app.use(express.static(distDir))
  app.get('*splat', (_req, res, next) => {
    res.sendFile(path.join(distDir, 'index.html'), (error) => {
      if (error) next(error)
    })
  })
} else {
  app.get('/', (_req, res) => {
    res.redirect('http://localhost:5173')
  })
}

app.use((error, _req, res, _next) => {
  console.error(error)
  if (res.headersSent) return
  const status = Number.isInteger(error.status) ? error.status : 500
  res.status(status).json({
    message: status < 500 || process.env.NODE_ENV !== 'production'
      ? error.message
      : 'Terjadi kesalahan pada server.',
  })
})

export default app
