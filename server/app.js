import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import express from 'express'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import { rateLimit } from 'express-rate-limit'
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
import { getServicePivot, importServicePoints, listServicePoints } from './controllers/servicePointController.js'

const app = express()
const PgSession = connectPgSimple(session)
const uploadDir = path.resolve(process.env.STORAGE_DIR || './storage/project-documents')
await mkdir(uploadDir, { recursive: true })

app.disable('x-powered-by')
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1)
app.use(express.json({ limit: '1mb' }))
app.use(session({
  name: 'b2g.sid',
  store: new PgSession({ pool, createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000,
  },
}))

app.use('/api', (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.get('origin')
    const sameOrigin = origin === `${req.protocol}://${req.get('host')}`
    const viteDevelopmentOrigin = process.env.NODE_ENV !== 'production' && (
      origin === 'http://localhost:5173' || origin === 'http://127.0.0.1:5173'
    )
    if (origin && !sameOrigin && !viteDevelopmentOrigin) {
      return res.status(403).json({ message: 'Permintaan lintas-origin ditolak.' })
    }
  }
  next()
})

app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
}))

const allowedExtensions = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg',
])
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDir),
    filename: (_req, file, callback) => callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
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

app.post('/api/auth/login', login)
app.get('/api/auth/me', requireAdmin, currentUser)
app.post('/api/auth/logout', requireAdmin, logout)

app.get('/api/agencies', requireAdmin, async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT name, agency_type AS "agencyType", region FROM government_agencies ORDER BY name',
    )
    res.json({ agencies: rows })
  } catch (error) {
    next(error)
  }
})

app.get('/api/projects', requireAdmin, listProjects)
app.post('/api/projects', requireAdmin, saveProject)
app.get('/api/projects/:idLOP', requireAdmin, getProject)
app.put('/api/projects/:id', requireAdmin, saveProject)
app.delete('/api/projects/:idLOP', requireAdmin, deleteProject)
app.get('/api/projects/:idLOP/documents', requireAdmin, listDocuments)
app.get('/api/reports/service-pivot', requireAdmin, getServicePivot)
app.get('/api/projects/:idLOP/service-points', requireAdmin, listServicePoints)
app.post(
  '/api/projects/:idLOP/service-points/import',
  requireAdmin,
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
  requireAdmin,
  (req, res, next) => upload.single('file')(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'Ukuran file maksimal 10 MB.' })
    }
    if (error) return res.status(400).json({ message: error.message })
    next()
  }),
  uploadDocument,
)
app.get('/api/projects/:idLOP/documents/:documentType/file', requireAdmin, downloadDocument)
app.delete('/api/projects/:idLOP/documents/:documentType', requireAdmin, deleteDocument)

if (process.env.NODE_ENV === 'production') {
  const distDir = path.resolve('dist')
  app.use(express.static(distDir))
  app.get('*splat', (_req, res, next) => {
    res.sendFile(path.join(distDir, 'index.html'), (error) => {
      if (error) next(error)
    })
  })
}

app.use((error, _req, res, _next) => {
  console.error(error)
  if (res.headersSent) return
  const status = Number.isInteger(error.status) ? error.status : 500
  res.status(status).json({
    message: status < 500 ? error.message : 'Terjadi kesalahan pada server.',
  })
})

export default app
