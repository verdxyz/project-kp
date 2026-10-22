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

export function parseCapacityMbps(value) {
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

function parseServicePrice(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null
  let amount = String(value).trim().replace(/^rp\s*/i, '').replace(/\s/g, '')
  if (amount.includes(',')) amount = amount.replace(/\./g, '').replace(',', '.')
  else amount = amount.replace(/\./g, '')
  const parsed = Number(amount)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function findColumn(headers, aliases) {
  return headers.find((header) => aliases.includes(normalizeHeader(header)))
}

export function normalizeActiveDate(value, sid) {
  if (value === null || value === undefined || value === '') return null
  const invalidDate = () => {
    const error = new Error(`Tanggal Aktif untuk SID ${sid} tidak valid ("${value}"). Gunakan tanggal Excel atau format DD/MM/YYYY.`)
    error.status = 400
    throw error
  }
  const formatDate = (year, month, day) => {
    const date = new Date(Date.UTC(year, month - 1, day))
    if (
      date.getUTCFullYear() !== year
      || date.getUTCMonth() !== month - 1
      || date.getUTCDate() !== day
    ) return null
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value)
    const formatted = date && formatDate(date.y, date.m, date.d)
    return formatted || invalidDate()
  }
  const text = String(value).trim()
  const isoDate = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (isoDate) {
    const formatted = formatDate(Number(isoDate[1]), Number(isoDate[2]), Number(isoDate[3]))
    return formatted || invalidDate()
  }
  const localDate = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (localDate) {
    const formatted = formatDate(Number(localDate[3]), Number(localDate[2]), Number(localDate[1]))
    return formatted || invalidDate()
  }
  if (/^\d+(?:[.,]\d+)?$/.test(text)) return invalidDate()
  const parsed = Date.parse(text)
  return Number.isNaN(parsed) ? invalidDate() : new Date(parsed).toISOString().slice(0, 10)
}

export async function listServicePoints(req, res, next) {
  try {
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
              service_price::float8 AS "servicePrice",
              created_at AS "createdAt", updated_at AS "updatedAt"
         FROM project_service_points WHERE id_lop = $1 ORDER BY updated_at DESC, created_at DESC, id DESC`,
      [req.params.idLOP],
    )
    res.json({ servicePoints: rows })
  } catch (error) {
    next(error)
  }
}

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
      if (!sid) {
        const error = new Error('SID wajib diisi untuk setiap titik layanan.')
        error.status = 400
        throw error
      }

      const actualSid = sid
      const productType = isPOTS ? 'HSI' : (point.productType ? normalizeProduct(point.productType) : 'Non-POTS')
      const capacityMbps = isPOTS ? 0 : (parseCapacityMbps(point.capacityMbps ?? point.bandwidth) ?? 0)
      const servicePrice = parseServicePrice(point.servicePrice)
      if (servicePrice === null) {
        const error = new Error('Harga layanan wajib diisi dan harus lebih dari nol untuk setiap SID.')
        error.status = 400
        throw error
      }

      await client.query(
        `INSERT INTO project_service_points (
           id, id_lop, sid, product_type, capacity_mbps, service_group, order_no, quote, location, active_date, bandwidth, service_price
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
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
          servicePrice,
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
              service_price::float8 AS "servicePrice",
              created_at AS "createdAt", updated_at AS "updatedAt"
         FROM project_service_points WHERE id_lop = $1 ORDER BY updated_at DESC, created_at DESC, id DESC`,
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

    const requestedGroup = String(req.body?.serviceGroup || '').trim()
    if (requestedGroup && !['POTS', 'Non-POTS'].includes(requestedGroup)) {
      return res.status(400).json({ message: 'Jenis file harus POTS atau Non-POTS.' })
    }
    const workbook = XLSX.readFile(file.path, { cellDates: false })
    const sheetName = requestedGroup
      ? workbook.SheetNames.find((name) => normalizeHeader(name) === normalizeHeader(requestedGroup)) || workbook.SheetNames[0]
      : workbook.SheetNames[0]
    if (!sheetName) return res.status(400).json({ message: 'Workbook tidak memiliki sheet.' })
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '', raw: true })
    if (!rows.length) return res.status(400).json({ message: 'Sheet Excel tidak berisi data.' })

    const headers = Object.keys(rows[0])
    const sidColumn = findColumn(headers, ['sid', 'serviceid', 'nomorsid', 'nomorserviceid'])
    if (!sidColumn) return res.status(400).json({ message: 'Kolom SID tidak ditemukan. Gunakan header SID atau Service ID.' })
    const productColumn = findColumn(headers, ['product', 'produk', 'service', 'layanan', 'producttype', 'tipeproduk', 'tipelayanan', 'namalayanan'])
    const capacityColumn = findColumn(headers, [
      'capacitymbps',
      'totalcapacitymbps',
      'kapasitasmbps',
      'kapasitas',
      'bandwidth',
      'bandwith',
    ])
    const orderColumn = findColumn(headers, ['noorder', 'nomororder', 'orderno', 'order'])
    const quoteColumn = findColumn(headers, ['quote', 'noquote', 'nomorquote'])
    const locationColumn = findColumn(headers, ['lokasi', 'location', 'alamat'])
    const activeDateColumn = findColumn(headers, ['tanggalaktif', 'tglaktif', 'activedate', 'startdate'])
    const servicePriceColumn = findColumn(headers, ['hargalayanan', 'price', 'amount', 'nilaikontrak'])
    if (!servicePriceColumn) return res.status(400).json({ message: 'Kolom Harga Layanan wajib tersedia pada template POTS maupun Non-POTS.' })

    const importRows = new Map()
    let skippedRows = 0
    let duplicateRows = 0
    let invalidRows = 0
    for (const row of rows) {
      const sid = String(row[sidColumn] ?? '').trim()
      if (!sid) {
        if (Object.values(row).some((value) => String(value ?? '').trim() !== '')) {
          invalidRows += 1
        } else {
          skippedRows += 1
        }
        continue
      }
      const productType = normalizeProduct(productColumn ? row[productColumn] : '', project.rows[0].service_type)
      const isPOTS = requestedGroup ? requestedGroup === 'POTS' : productType.toLowerCase() === 'pots'
      const parsedCapacityMbps = parseCapacityMbps(capacityColumn ? row[capacityColumn] : 0)
      const capacityMbps = isPOTS ? (parsedCapacityMbps ?? 0) : parsedCapacityMbps
      const servicePrice = parseServicePrice(row[servicePriceColumn])
      if ((!isPOTS && capacityMbps === null) || servicePrice === null) {
        invalidRows += 1
        continue
      }
      const orderNo = orderColumn ? String(row[orderColumn] ?? '').trim() : ''
      const quote = quoteColumn ? String(row[quoteColumn] ?? '').trim() : ''
      const location = locationColumn ? String(row[locationColumn] ?? '').trim() : ''
      const activeDate = activeDateColumn ? normalizeActiveDate(row[activeDateColumn], sid) : null

      if (importRows.has(sid)) duplicateRows += 1
      importRows.set(sid, {
        sid,
        productType: isPOTS ? 'HSI' : productType,
        capacityMbps,
        serviceGroup: isPOTS ? 'POTS' : 'Non-POTS',
        orderNo: orderNo || null,
        quote: quote || null,
        location: location || null,
        activeDate: activeDate || null,
        bandwidth: capacityMbps ? `${capacityMbps} Mbps` : null,
        servicePrice,
      })
    }
    if (invalidRows) {
      return res.status(400).json({
        message: `${invalidRows} baris SID memiliki Harga Layanan atau Kapasitas yang tidak valid. Data lama tidak diubah; perbaiki file lalu unggah kembali.`,
      })
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

    const removed = requestedGroup
      ? await client.query(
        'DELETE FROM project_service_points WHERE id_lop = $1 AND service_group = $2',
        [req.params.idLOP, requestedGroup],
      )
      : { rowCount: 0 }

    for (const point of importRows.values()) {
      await client.query(
        `INSERT INTO project_service_points (
           id, id_lop, sid, product_type, capacity_mbps, service_group, order_no, quote, location, active_date, bandwidth, service_price
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id_lop, sid) DO UPDATE SET
           product_type = EXCLUDED.product_type,
           capacity_mbps = EXCLUDED.capacity_mbps,
           service_group = EXCLUDED.service_group,
           order_no = EXCLUDED.order_no,
           quote = EXCLUDED.quote,
           location = EXCLUDED.location,
           active_date = EXCLUDED.active_date,
           bandwidth = EXCLUDED.bandwidth,
           service_price = EXCLUDED.service_price,
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
          point.servicePrice,
        ],
      )
    }
    await client.query('COMMIT')
    res.status(200).json({
      imported: importRows.size,
      replaced: removed.rowCount,
      skipped: skippedRows,
      duplicateRows,
    })
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
    )
    res.json({ rows })
  } catch (error) {
    next(error)
  }
}
