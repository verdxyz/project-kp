import { randomUUID } from 'node:crypto'
import { unlink } from 'node:fs/promises'
import XLSX from 'xlsx'
import { pool } from '../db.js'

function normalizeHeader(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, '')
}

function normalizeProduct(value, fallback = '') {
  const product = String(value || fallback).trim()
  const normalized = product.toLowerCase()
  if (normalized.includes('hsi')) return 'HSI'
  if (normalized.includes('wms') || normalized.includes('wifi')) return 'WMS'
  if (normalized.includes('astinet')) return 'Astinet'
  if (normalized.includes('iptransit')) return 'IP Transit'
  if (normalized.includes('vpn')) return 'VPN'
  return product
}

function parseCapacityMbps(value) {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null
  const match = String(value).trim().match(/^([\d.,]+)\s*(kbps|mbps|gbps)?$/i)
  if (!match) return null
  let amountText = match[1]
  if (amountText.includes(',') && amountText.includes('.')) {
    amountText = amountText.replace(/\./g, '').replace(',', '.')
  } else {
    amountText = amountText.replace(',', '.')
  }
  const amount = Number(amountText)
  if (!Number.isFinite(amount) || amount < 0) return null
  const unit = (match[2] || 'mbps').toLowerCase()
  const multiplier = unit === 'gbps' ? 1000 : unit === 'kbps' ? 0.001 : 1
  return Number((amount * multiplier).toFixed(3))
}

function findColumn(headers, aliases) {
  return headers.find((header) => aliases.includes(normalizeHeader(header)))
}

export async function listServicePoints(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, id_lop AS "idLOP", sid, product_type AS "productType",
              capacity_mbps::float8 AS "capacityMbps", created_at AS "createdAt", updated_at AS "updatedAt"
         FROM project_service_points WHERE id_lop = $1 ORDER BY product_type, sid`,
      [req.params.idLOP],
    )
    res.json({ servicePoints: rows })
  } catch (error) {
    next(error)
  }
}

export async function importServicePoints(req, res, next) {
  const file = req.file
  let client
  try {
    if (!file) return res.status(400).json({ message: 'Pilih file Excel yang berisi daftar SID.' })
    const project = await pool.query(
      'SELECT service_type FROM projects WHERE id_lop = $1',
      [req.params.idLOP],
    )
    if (!project.rows[0]) return res.status(404).json({ message: 'Proyek tidak ditemukan.' })

    const workbook = XLSX.readFile(file.path, { cellDates: false })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) return res.status(400).json({ message: 'Workbook tidak memiliki sheet.' })
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '', raw: true })
    if (!rows.length) return res.status(400).json({ message: 'Sheet Excel tidak berisi data.' })

    const headers = Object.keys(rows[0])
    const sidColumn = findColumn(headers, ['sid', 'serviceid', 'nomorsid', 'nomorserviceid'])
    if (!sidColumn) return res.status(400).json({ message: 'Kolom SID tidak ditemukan. Gunakan header SID atau Service ID.' })
    const productColumn = findColumn(headers, ['product', 'produk', 'service', 'layanan', 'producttype', 'tipeproduk', 'tipelayanan'])
    const capacityColumn = findColumn(headers, ['capacitymbps', 'totalcapacitymbps', 'kapasitasmbps', 'kapasitas', 'bandwidth'])

    const importRows = new Map()
    let skippedRows = 0
    for (const row of rows) {
      const sid = String(row[sidColumn] ?? '').trim()
      if (!sid) {
        skippedRows += 1
        continue
      }
      const capacityMbps = parseCapacityMbps(capacityColumn ? row[capacityColumn] : 0)
      if (capacityMbps === null) {
        skippedRows += 1
        continue
      }
      const productType = normalizeProduct(productColumn ? row[productColumn] : '', project.rows[0].service_type)
      if (!productType) {
        skippedRows += 1
        continue
      }
      importRows.set(sid, { sid, productType, capacityMbps })
    }
    if (!importRows.size) return res.status(400).json({ message: 'Tidak ada baris SID valid untuk diimpor.' })

    client = await pool.connect()
    await client.query('BEGIN')
    const lockedProject = await client.query(
      'SELECT id_lop FROM projects WHERE id_lop = $1 FOR UPDATE',
      [req.params.idLOP],
    )
    if (!lockedProject.rowCount) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Proyek tidak ditemukan.' })
    }

    for (const point of importRows.values()) {
      await client.query(
        `INSERT INTO project_service_points (id, id_lop, sid, product_type, capacity_mbps)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id_lop, sid) DO UPDATE SET
           product_type = EXCLUDED.product_type,
           capacity_mbps = EXCLUDED.capacity_mbps,
           updated_at = now()`,
        [randomUUID(), req.params.idLOP, point.sid, point.productType, point.capacityMbps],
      )
    }
    await client.query('COMMIT')
    res.status(200).json({ imported: importRows.size, skipped: skippedRows })
  } catch (error) {
    await client?.query('ROLLBACK').catch(() => {})
    if (error.status) return res.status(error.status).json({ message: error.message })
    if (error.code === '23505') return res.status(409).json({ message: 'SID duplikat tidak dapat disimpan.' })
    next(error)
  } finally {
    client?.release()
    if (file) await unlink(file.path).catch(() => {})
  }
}

export async function getServicePivot(req, res, next) {
  try {
    const agency = String(req.query.agency || '').trim() || null
    const { rows } = await pool.query(
      `WITH products(product_type, sort_order) AS (
         VALUES ('HSI', 1), ('WMS', 2), ('Astinet', 3), ('IP Transit', 4), ('VPN', 5)
       ), totals AS (
         SELECT sp.product_type, count(*)::int AS "pointCount",
                COALESCE(sum(sp.capacity_mbps), 0)::float8 AS "capacityMbps"
           FROM project_service_points sp
           JOIN projects p ON p.id_lop = sp.id_lop
           JOIN government_agencies a ON a.id = p.agency_id
          WHERE ($1::text IS NULL OR a.name = $1)
          GROUP BY sp.product_type
       )
       SELECT products.product_type AS "productType",
              COALESCE(totals."pointCount", 0)::int AS "pointCount",
              COALESCE(totals."capacityMbps", 0)::float8 AS "capacityMbps"
         FROM products LEFT JOIN totals USING (product_type)
        ORDER BY products.sort_order`,
      [agency],
    )
    res.json({ rows })
  } catch (error) {
    next(error)
  }
}
