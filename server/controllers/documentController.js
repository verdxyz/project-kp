import { randomUUID } from 'node:crypto'
import { unlink } from 'node:fs/promises'
import { pool } from '../db.js'

const DOCUMENT_TYPES = new Set([
  'p0', 'p1', 'ba_split', 'supporting_contract_doc', 'contract', 'bast', 'basto', 'other',
  'ngtma_agreement', 'nce_quote', 'rpa', 'invoice', 'billing_evidence',
])

function validDocumentType(type) {
  return DOCUMENT_TYPES.has(type)
}

export async function listDocuments(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, id_lop AS "idLOP", document_type AS "documentType",
              original_name AS "originalName", mime_type AS "mimeType",
              size_bytes::float8 AS "sizeBytes", uploaded_by AS "uploadedBy", uploaded_at AS "uploadedAt"
         FROM project_documents WHERE id_lop = $1 ORDER BY document_type`,
      [req.params.idLOP],
    )
    res.json({ documents: rows })
  } catch (error) {
    next(error)
  }
}

export async function uploadDocument(req, res, next) {
  const file = req.file
  try {
    const { idLOP, documentType } = req.params
    if (!validDocumentType(documentType)) {
      if (file) await unlink(file.path).catch(() => {})
      return res.status(400).json({ message: 'Jenis dokumen tidak valid.' })
    }
    if (!file) return res.status(400).json({ message: 'Pilih file dokumen terlebih dahulu.' })
    if (!file.size) {
      await unlink(file.path).catch(() => {})
      return res.status(400).json({ message: 'File kosong tidak dapat diunggah.' })
    }

    const client = await pool.connect()
    let oldFilePath
    try {
      await client.query('BEGIN')
      const project = await client.query(
        'SELECT id_lop FROM projects WHERE id_lop = $1 FOR UPDATE',
        [idLOP],
      )
      if (!project.rowCount) {
        await client.query('ROLLBACK')
        await unlink(file.path).catch(() => {})
        return res.status(404).json({ message: 'Proyek dengan ID LOP tersebut tidak ditemukan.' })
      }

      const previous = await client.query(
        'SELECT storage_path FROM project_documents WHERE id_lop = $1 AND document_type = $2',
        [idLOP, documentType],
      )
      oldFilePath = previous.rows[0]?.storage_path
      const result = await client.query(
        `INSERT INTO project_documents (
           id, id_lop, document_type, original_name, storage_path, mime_type, size_bytes, uploaded_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id_lop, document_type) DO UPDATE SET
           id = EXCLUDED.id, original_name = EXCLUDED.original_name,
           storage_path = EXCLUDED.storage_path, mime_type = EXCLUDED.mime_type,
           size_bytes = EXCLUDED.size_bytes, uploaded_by = EXCLUDED.uploaded_by,
           uploaded_at = now()
         RETURNING id, id_lop AS "idLOP", document_type AS "documentType",
                   original_name AS "originalName", mime_type AS "mimeType",
                   size_bytes::float8 AS "sizeBytes", uploaded_by AS "uploadedBy",
                   uploaded_at AS "uploadedAt"`,
        [randomUUID(), idLOP, documentType, file.originalname, file.path, file.mimetype, file.size, 'Admin Support'],
      )
      await client.query('COMMIT')
      if (oldFilePath && oldFilePath !== file.path) {
        await unlink(oldFilePath).catch((error) => {
          if (error.code !== 'ENOENT') console.error('Failed to remove replaced document:', error)
        })
      }
      res.status(201).json({ document: result.rows[0] })
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {})
      await unlink(file.path).catch(() => {})
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    next(error)
  }
}

export async function downloadDocument(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT original_name, storage_path, mime_type FROM project_documents WHERE id_lop = $1 AND document_type = $2',
      [req.params.idLOP, req.params.documentType],
    )
    if (!rows[0]) return res.status(404).json({ message: 'Dokumen belum diunggah.' })
    res.download(rows[0].storage_path, rows[0].original_name, { dotfiles: 'allow' }, (error) => {
      if (error && !res.headersSent) next(error)
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteDocument(req, res, next) {
  try {
    if (!validDocumentType(req.params.documentType)) return res.status(400).json({ message: 'Jenis dokumen tidak valid.' })
    const { rows } = await pool.query(
      `DELETE FROM project_documents WHERE id_lop = $1 AND document_type = $2
       RETURNING storage_path`,
      [req.params.idLOP, req.params.documentType],
    )
    if (!rows[0]) return res.status(404).json({ message: 'Dokumen tidak ditemukan.' })
    await unlink(rows[0].storage_path).catch((error) => {
      if (error.code !== 'ENOENT') throw error
    })
    res.status(204).end()
  } catch (error) {
    next(error)
  }
}
