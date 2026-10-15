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
<<<<<<< HEAD
      `SELECT id, id_lop AS "idLOP", sid,
              product_type AS "productType",
              capacity_mbps::float8 AS "capacityMbps",
              service_group AS "serviceGroup",
              order_no AS "orderNo",
              quote,
              location,
              active_date::text AS "activeDate",
              bandwidth,
              created_at AS "createdAt", updated_at AS "updatedAt"
         FROM project_service_points WHERE id_lop = $1 ORDER BY created_at ASC, id ASC`,
=======
      `SELECT id, id_lop AS "idLOP", sid, product_type AS "productType",
              capacity_mbps::float8 AS "capacityMbps", created_at AS "createdAt", updated_at AS "updatedAt"
         FROM project_service_points WHERE id_lop = $1 ORDER BY product_type, sid`,
>>>>>>> 6aa6fdd5c6590190ec52e0615772fa98f5081420
      [req.params.idLOP],
    )
    res.json({ servicePoints: rows })
  } catch (error) {
    next(error)
  }
}

<<<<<<< HEAD
export async function batchUpdateServicePoints(req, res, next) {
  const { idLOP } = req.params
  const { servicePoints = [], ngtmaInfo } = req.body
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const project = await client.query('SELECT id_lop, category FROM projects WHERE id_lop = $1 FOR UPDATE', [idLOP])
    if (!project.rows[0]) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Proyek tidak ditemukan.' })
    }

    if (ngtmaInfo) {
      await client.query(
        `UPDATE projects
            SET customer_name = COALESCE($1, customer_name),
                dinas_name = COALESCE($2, dinas_name),
                subsidiary_name = COALESCE($3, subsidiary_name),
                updated_at = now()
          WHERE id_lop = $4`,
        [ngtmaInfo.customerName || null, ngtmaInfo.dinasName || null, ngtmaInfo.subsidiaryName || null, idLOP],
      )
    }

    await client.query('DELETE FROM project_service_points WHERE id_lop = $1', [idLOP])

    for (const point of servicePoints) {
      const isPOTS = String(point.serviceGroup || '').toUpperCase() === 'POTS'
      const sid = String(point.sid || '').trim()
      const orderNo = String(point.orderNo || '').trim()
      if (!sid && !orderNo && !point.location && !point.productType) continue

      const actualSid = sid || (orderNo ? `ORD-${orderNo}` : `SID-${randomUUID().slice(0, 8)}`)
      const productType = isPOTS ? 'POTS' : (point.productType ? normalizeProduct(point.productType) : 'Non-POTS')
      const capacityMbps = isPOTS ? 0 : (parseCapacityMbps(point.capacityMbps ?? point.bandwidth) ?? 0)

      await client.query(
        `INSERT INTO project_service_points (
           id, id_lop, sid, product_type, capacity_mbps, service_group, order_no, quote, location, active_date, bandwidth
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          randomUUID(),
          idLOP,
          actualSid,
          productType,
          capacityMbps,
          isPOTS ? 'POTS' : 'Non-POTS',
          orderNo || null,
          point.quote ? String(point.quote).trim() : null,
          point.location ? String(point.location).trim() : null,
          point.activeDate || null,
          point.bandwidth ? String(point.bandwidth).trim() : (capacityMbps ? `${capacityMbps} Mbps` : null),
        ],
      )
    }

    await client.query('COMMIT')

    const { rows } = await pool.query(
      `SELECT id, id_lop AS "idLOP", sid,
              product_type AS "productType",
              capacity_mbps::float8 AS "capacityMbps",
              service_group AS "serviceGroup",
              order_no AS "orderNo",
              quote,
              location,
              active_date::text AS "activeDate",
              bandwidth,
              created_at AS "createdAt", updated_at AS "updatedAt"
         FROM project_service_points WHERE id_lop = $1 ORDER BY created_at ASC, id ASC`,
      [idLOP],
    )
    res.json({ message: 'Data titik layanan berhasil diperbarui.', servicePoints: rows })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    next(error)
  } finally {
    client.release()
  }
}

=======
>>>>>>> 6aa6fdd5c6590190ec52e0615772fa98f5081420
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
<<<<<<< HEAD
    const orderColumn = findColumn(headers, ['noorder', 'nomororder', 'orderno', 'order'])
    const quoteColumn = findColumn(headers, ['quote', 'noquote', 'nomorquote'])
    const locationColumn = findColumn(headers, ['lokasi', 'location', 'alamat'])
    const activeDateColumn = findColumn(headers, ['tanggalaktif', 'tglaktif', 'activedate', 'startdate'])
=======
>>>>>>> 6aa6fdd5c6590190ec52e0615772fa98f5081420

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
<<<<<<< HEAD
      const orderNo = orderColumn ? String(row[orderColumn] ?? '').trim() : ''
      const quote = quoteColumn ? String(row[quoteColumn] ?? '').trim() : ''
      const location = locationColumn ? String(row[locationColumn] ?? '').trim() : ''
      const activeDate = activeDateColumn ? String(row[activeDateColumn] ?? '').trim() : null
      const isPOTS = productType.toLowerCase() === 'pots'

      importRows.set(sid, {
        sid,
        productType: isPOTS ? 'POTS' : productType,
        capacityMbps: isPOTS ? 0 : capacityMbps,
        serviceGroup: isPOTS ? 'POTS' : 'Non-POTS',
        orderNo: orderNo || null,
        quote: quote || null,
        location: location || null,
        activeDate: activeDate || null,
        bandwidth: capacityMbps ? `${capacityMbps} Mbps` : null,
      })
=======
      if (!productType) {
        skippedRows += 1
        continue
      }
      importRows.set(sid, { sid, productType, capacityMbps })
>>>>>>> 6aa6fdd5c6590190ec52e0615772fa98f5081420
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
<<<<<<< HEAD
        `INSERT INTO project_service_points (
           id, id_lop, sid, product_type, capacity_mbps, service_group, order_no, quote, location, active_date, bandwidth
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id_lop, sid) DO UPDATE SET
           product_type = EXCLUDED.product_type,
           capacity_mbps = EXCLUDED.capacity_mbps,
           service_group = EXCLUDED.service_group,
           order_no = COALESCE(EXCLUDED.order_no, project_service_points.order_no),
           quote = COALESCE(EXCLUDED.quote, project_service_points.quote),
           location = COALESCE(EXCLUDED.location, project_service_points.location),
           active_date = COALESCE(EXCLUDED.active_date, project_service_points.active_date),
           bandwidth = COALESCE(EXCLUDED.bandwidth, project_service_points.bandwidth),
           updated_at = now()`,
        [
          randomUUID(),
          req.params.idLOP,
          point.sid,
          point.productType,
          point.capacityMbps,
          point.serviceGroup,
          point.orderNo,
          point.quote,
          point.location,
          point.activeDate,
          point.bandwidth,
        ],
=======
        `INSERT INTO project_service_points (id, id_lop, sid, product_type, capacity_mbps)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id_lop, sid) DO UPDATE SET
           product_type = EXCLUDED.product_type,
           capacity_mbps = EXCLUDED.capacity_mbps,
           updated_at = now()`,
        [randomUUID(), req.params.idLOP, point.sid, point.productType, point.capacityMbps],
>>>>>>> 6aa6fdd5c6590190ec52e0615772fa98f5081420
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

<<<<<<< HEAD
export async function getServicePivot(_req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT 
         a.name AS "agencyName",
         a.agency_type AS "agencyType",
         a.region,
         COUNT(sp.id)::int AS "pointCount",
         COALESCE(SUM(sp.capacity_mbps), 0)::float8 AS "totalBandwidthMbps"
       FROM government_agencies a
       LEFT JOIN projects p ON p.agency_id = a.id
       LEFT JOIN project_service_points sp ON sp.id_lop = p.id_lop
       GROUP BY a.id, a.name, a.agency_type, a.region
       ORDER BY 
         CASE 
           WHEN a.name LIKE 'Pemkot%' THEN 1 
           WHEN a.name LIKE 'Pemkab%' THEN 2 
           ELSE 3 
         END,
         a.name ASC`,
=======
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
>>>>>>> 6aa6fdd5c6590190ec52e0615772fa98f5081420
    )
    res.json({ rows })
  } catch (error) {
    next(error)
  }
}
