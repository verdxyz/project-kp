import { readJsonResponse } from './apiResponse'

export type ProjectDocumentType =
  | 'p0'
  | 'p1'
  | 'ba_split'
  | 'supporting_contract_doc'
  | 'contract'
  | 'bast'
  | 'basto'
  | 'other'
  | 'ngtma_agreement'
  | 'nce_quote'
  | 'rpa'
  | 'invoice'
  | 'billing_evidence'

export interface ProjectDocument {
  id: string
  idLOP: string
  documentType: ProjectDocumentType
  originalName: string
  mimeType: string
  sizeBytes: number
  uploadedBy: string
  uploadedAt: string
}

export interface ProjectDocumentTypeOption {
  id: ProjectDocumentType
  label: string
  helperText?: string
  templateUrl?: string
  aliases?: ProjectDocumentType[]
}

export const PROJECT_DOCUMENT_TYPES: ProjectDocumentTypeOption[] = [
  { id: 'p0', label: 'P0' },
  { id: 'p1', label: 'P1' },
  { id: 'ba_split', label: 'BA Split' },
  { id: 'supporting_contract_doc', label: 'Dokumen Pendukung Kontrak' },
  { id: 'contract', label: 'Kontrak' },
  { id: 'bast', label: 'BAST' },
  { id: 'basto', label: 'BASO' },
  { id: 'other', label: 'Lain-lain' },
]

export const NGTMA_DOCUMENT_TYPES: ProjectDocumentTypeOption[] = [
  {
    id: 'ngtma_agreement',
    label: 'BA Kesepakatan NGTMA',
    helperText: 'Antara GM Telkom (Segmen/Witel) dan GM AP setingkat. Tanggal BA sebelum submit lelang/sebelum SPK.',
    templateUrl: 'https://tlkm.id/RybUgR',
  },
  { id: 'nce_quote', label: 'Quote NCX' },
  {
    id: 'rpa',
    label: 'Dokumen RPA',
    helperText: 'RPA proyek NGTMA mengikuti template. Tanggal RPA sebelum submit lelang/sebelum SPK.',
    templateUrl: 'https://tlkm.id/RybUgR',
  },
  { id: 'contract', label: 'Dokumen Kontrak / SPPBJ' },
  { id: 'bast', label: 'Dokumen Delivery / BAST' },
  { id: 'billing_evidence', label: 'Billing Evidence / Invoice', aliases: ['invoice'] },
]

export function getProjectDocumentTypes(category: string): ProjectDocumentTypeOption[] {
  return category === 'NGTMA' ? NGTMA_DOCUMENT_TYPES : PROJECT_DOCUMENT_TYPES
}

export function getProjectDocumentLabel(documentType: ProjectDocumentType, category?: string) {
  const documentTypes = category === 'NGTMA'
    ? [...NGTMA_DOCUMENT_TYPES, ...PROJECT_DOCUMENT_TYPES]
    : [...PROJECT_DOCUMENT_TYPES, ...NGTMA_DOCUMENT_TYPES]
  return documentTypes.find((type) => type.id === documentType || type.aliases?.includes(documentType))?.label ?? documentType
}

async function responseJson(response: Response) {
  const body = await readJsonResponse(response)
  if (!response.ok) throw new Error(body.message || 'Operasi dokumen gagal.')
  return body
}

export const ProjectDocuments = {
  async list(idLOP: string): Promise<ProjectDocument[]> {
    const response = await fetch(`/api/projects/${encodeURIComponent(idLOP)}/documents`, {
      credentials: 'same-origin',
    })
    const body = await responseJson(response)
    return body.documents as ProjectDocument[]
  },

  async upload(idLOP: string, documentType: ProjectDocumentType, file: File): Promise<ProjectDocument> {
    const formData = new FormData()
    formData.set('file', file)
    const response = await fetch(
      `/api/projects/${encodeURIComponent(idLOP)}/documents/${documentType}`,
      { method: 'POST', credentials: 'same-origin', body: formData },
    )
    const body = await responseJson(response)
    return body.document as ProjectDocument
  },

  async download(idLOP: string, documentType: ProjectDocumentType, filename: string): Promise<void> {
    const response = await fetch(
      `/api/projects/${encodeURIComponent(idLOP)}/documents/${documentType}/file`,
      { credentials: 'same-origin' },
    )
    if (!response.ok) {
      const body = await readJsonResponse(response).catch(() => ({}))
      throw new Error(body.message || 'Gagal mengunduh dokumen.')
    }
    const objectUrl = URL.createObjectURL(await response.blob())
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = filename
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(objectUrl)
  },
}
