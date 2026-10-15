import bcrypt from 'bcryptjs'
import { pool } from './db.js'

export async function seedGlobalAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const displayName = process.env.ADMIN_NAME?.trim()
  const password = process.env.ADMIN_PASSWORD
  if (!email || !displayName || !password) {
    throw new Error('ADMIN_EMAIL, ADMIN_NAME, and ADMIN_PASSWORD must be configured.')
  }
  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD must contain at least 12 characters.')
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await pool.query(
    `INSERT INTO global_admin (singleton, email, display_name, password_hash)
     VALUES (TRUE, $1, $2, $3)
     ON CONFLICT (singleton) DO UPDATE SET
       email = EXCLUDED.email,
       display_name = EXCLUDED.display_name,
       updated_at = now()`,
    [email, displayName, passwordHash],
  )
}

export function requireAdmin(req, res, next) {
  if (!req.session.adminId) {
    return res.status(401).json({ message: 'Autentikasi admin diperlukan.' })
  }
  next()
}

export function getAdminProfile() {
  return pool.query('SELECT email, display_name FROM global_admin WHERE singleton = TRUE')
}

export async function verifyAdmin(email, password) {
  const result = await pool.query(
    'SELECT email, display_name, password_hash FROM global_admin WHERE singleton = TRUE',
  )
  const admin = result.rows[0]
  if (!admin || admin.email !== email.trim().toLowerCase()) return null
  if (!(await bcrypt.compare(password, admin.password_hash))) return null
  return { id: 'global-admin', email: admin.email, nama: admin.display_name }
}
