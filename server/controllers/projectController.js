import { randomUUID } from 'node:crypto'
import { unlink } from 'node:fs/promises'
import path from 'node:path'
import { pool } from '../db.js'

const PROJECT_SELECT = `
  SELECT p.id, p.id_lop AS "idLOP", p.project_name AS "projectName",
         a.name AS agency, a.agency_type AS "agencyType", a.region,
         p.budget::float8 AS budget, p.procurement_method AS "procurementMethod",
         p.stage, p.progress, p.start_date::text AS "startDate",
         p.end_date::text AS "endDate", p.pic, p.category, p.service_type AS "serviceType",
         p.total_capacity_mbps::float8 AS "totalCapacityMbps", p.sid, p.status, p.notes,
         p.subsidiary_name AS "subsidiaryName",
         p.customer_name AS "customerName",
         p.dinas_name AS "dinasName",
         p.created_at AS "createdAt", p.updated_at AS "updatedAt"
    FROM projects p
    JOIN government_agencies a ON a.id = p.agency_id
`

const STAGES = new Set(['F0', 'F1', 'F2', 'F3', 'F4', 'F5', 'Loss', 'Cancel'])
const CATEGORIES = new Set(['On Channel', 'GTMA', 'NGTMA'])
const PROCUREMENT_METHODS = new Set(['Tender/e-Katalog', 'Penunjukan Langsung'])
const STATUSES = new Set(['Active', 'At Risk', 'Completed', 'Lost', 'Cancelled'])

function validateProject(body) {
  const errors = []
  if (typeof body.idLOP !== 'string' || !body.idLOP.trim()) errors.push('ID LOP wajib diisi.')
  if (typeof body.projectName !== 'string' || !body.projectName.trim()) errors.push('Nama proyek wajib diisi.')
  if (typeof body.agency !== 'string' || !body.agency.trim()) errors.push('Instansi wajib dipilih.')
  if (!Number.isFinite(Number(body.budget)) || Number(body.budget) <= 0) errors.push('Anggaran harus lebih dari nol.')
  if (!STAGES.has(body.stage)) errors.push('Tahap proyek tidak valid.')
  if (!CATEGORIES.has(body.category)) errors.push('Kategori kontrak tidak valid.')
  if (!PROCUREMENT_METHODS.has(body.procurementMethod)) errors.push('Metode pengadaan tidak valid.')
  if (typeof body.pic !== 'string' || !body.pic.trim()) errors.push('PIC wajib diisi.')
  if (typeof body.serviceType !== 'string' || !body.serviceType.trim()) errors.push('Jenis layanan wajib diisi.')
  if (body.totalCapacityMbps !== undefined && body.totalCapacityMbps !== null && body.totalCapacityMbps !== '' &&
      (!Number.isFinite(Number(body.totalCapacityMbps)) || Number(body.totalCapacityMbps) < 0)) {
    errors.push('Kapasitas layanan harus berupa angka nol atau lebih.')
  }
  if (body.sid !== undefined && body.sid !== null && typeof body.sid !== 'string') errors.push('SID harus berupa teks.')
  if (body.category === 'NGTMA' && (typeof body.subsidiaryName !== 'string' || !body.subsidiaryName.trim())) {
    errors.push('Nama Anak Perusahaan wajib diisi untuk kategori NGTMA.')
  }
  if (body.status !== undefined && !STATUSES.has(body.status)) errors.push('Status proyek tidak valid.')
  if (errors.length) {
    const error = new Error(errors.join(' '))
    error.status = 400
    throw error
  }
}

function projectValues(body) {
  const progressByStage = { F0: 0, F1: 20, F2: 40, F3: 60, F4: 80, F5: 100, Loss: 0, Cancel: 0 }
  return [
    body.idLOP.trim(),
    body.projectName.trim(),
    body.agency.trim(),
    Number(body.budget),
    body.procurementMethod,
    body.stage,
    Math.max(0, Math.min(100, Number.isFinite(Number(body.progress)) ? Number(body.progress) : progressByStage[body.stage])),
    body.startDate || null,
    body.endDate || null,
    body.pic.trim(),
    body.category,
    body.serviceType.trim(),
    body.totalCapacityMbps === '' || body.totalCapacityMbps === undefined ? null : body.totalCapacityMbps,
    typeof body.sid === 'string' && body.sid.trim() ? body.sid.trim() : null,
    body.stage === 'F5' ? 'Completed' : body.stage === 'Loss' ? 'Lost' : body.stage === 'Cancel' ? 'Cancelled' : (body.status || 'Active'),
    typeof body.notes === 'string' ? body.notes : '',
    typeof body.subsidiaryName === 'string' && body.subsidiaryName.trim() ? body.subsidiaryName.trim() : null,
    typeof body.customerName === 'string' && body.customerName.trim() ? body.customerName.trim() : null,
    typeof body.dinasName === 'string' && body.dinasName.trim() ? body.dinasName.trim() : null,
  ]
}

function normalizeProductType(serviceType) {
  const normalized = String(serviceType || '').toLowerCase()
  if (normalized.includes('hsi')) return 'HSI'
  if (normalized.includes('wms') || normalized.includes('wifi')) return 'WMS'
  if (normalized.includes('astinet')) return 'Astinet'
  if (normalized.includes('ip transit')) return 'IP Transit'
  if (normalized.includes('vpn')) return 'VPN'
  return String(serviceType || '').trim()
}

export async function listProjects(_req, res, next) {
  try {
    const { rows } = await pool.query(`${PROJECT_SELECT} ORDER BY p.updated_at DESC`)
    res.json({ projects: rows })
  } catch (error) {
    next(error)
  }
}

export async function getProject(req, res, next) {
  try {
    const { rows } = await pool.query(`${PROJECT_SELECT} WHERE p.id_lop = $1`, [req.params.idLOP])
    if (!rows[0]) return res.status(404).json({ message: 'Proyek tidak ditemukan.' })
    res.json({ project: rows[0] })
  } catch (error) {
    next(error)
  }
}

export async function saveProject(req, res, next) {
  const client = await pool.connect()
  try {
    validateProject(req.body)
    const values = projectValues(req.body)
    await client.query('BEGIN')
    const agency = await client.query('SELECT id FROM government_agencies WHERE name = $1', [values[2]])
    if (!agency.rows[0]) {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: 'Instansi tidak termasuk daftar master 13 pelanggan.' })
    }
    if (values[5] === 'F5') values[14] = 'Completed'
    if (values[5] === 'Loss') values[14] = 'Lost'
    if (values[5] === 'Cancel') values[14] = 'Cancelled'
    const id = req.params.id || randomUUID()
    const params = [id, values[0], values[1], agency.rows[0].id, ...values.slice(3, 19)]
    const result = await client.query(
      `INSERT INTO projects (
         id, id_lop, project_name, agency_id, budget, procurement_method, stage, progress,
         start_date, end_date, pic, category, service_type, total_capacity_mbps, sid, status, notes,
         subsidiary_name, customer_name, dinas_name
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       ON CONFLICT (id) DO UPDATE SET
         id_lop = EXCLUDED.id_lop, project_name = EXCLUDED.project_name, agency_id = EXCLUDED.agency_id,
         budget = EXCLUDED.budget, procurement_method = EXCLUDED.procurement_method, stage = EXCLUDED.stage,
         progress = EXCLUDED.progress, start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date,
         pic = EXCLUDED.pic, category = EXCLUDED.category, service_type = EXCLUDED.service_type,
         total_capacity_mbps = EXCLUDED.total_capacity_mbps, sid = EXCLUDED.sid, status = EXCLUDED.status,
         notes = EXCLUDED.notes, subsidiary_name = EXCLUDED.subsidiary_name,
         customer_name = EXCLUDED.customer_name, dinas_name = EXCLUDED.dinas_name,
         updated_at = now()
       RETURNING id_lop`,
      params,
    )
    if (!result.rowCount) {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: 'Instansi tidak tersedia.' })
    }
    if (values[13]) {
      await client.query(
        `INSERT INTO project_service_points (id, id_lop, sid, product_type, capacity_mbps)
         SELECT $1, $2, $3, $4, $5
          WHERE NOT EXISTS (SELECT 1 FROM project_service_points WHERE id_lop = $2)`,
        [randomUUID(), values[0], values[13], normalizeProductType(values[11]), values[12] ?? 0],
      )
    }
    await client.query('COMMIT')
    const project = await pool.query(`${PROJECT_SELECT} WHERE p.id_lop = $1`, [result.rows[0].id_lop])
    res.status(req.params.id ? 200 : 201).json({ project: project.rows[0] })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    if (error.code === '23505') {
      return res.status(409).json({ message: 'ID LOP sudah digunakan oleh proyek lain.' })
    }
    next(error)
  } finally {
    client.release()
  }
}

export async function deleteProject(req, res, next) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const docs = await client.query(
      'SELECT storage_path FROM project_documents WHERE id_lop = $1 FOR UPDATE',
      [req.params.idLOP],
    )
    const result = await client.query('DELETE FROM projects WHERE id_lop = $1', [req.params.idLOP])
    await client.query('COMMIT')
    if (!result.rowCount) return res.status(404).json({ message: 'Proyek tidak ditemukan.' })
    await Promise.all(docs.rows.map((doc) => unlink(doc.storage_path).catch((error) => {
      if (error.code !== 'ENOENT') throw error
    })))
    res.status(204).end()
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    next(error)
  } finally {
    client.release()
  }
}
