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

export const PROJECT_DOCUMENT_TYPES: { id: ProjectDocumentType; label: string }[] = [
  { id: 'p0', label: 'P0' },
  { id: 'p1', label: 'P1' },
  { id: 'ba_split', label: 'BA Split' },
  { id: 'supporting_contract_doc', label: 'Dokumen Pendukung Kontrak' },
  { id: 'contract', label: 'Kontrak' },
  { id: 'bast', label: 'BAST' },
  { id: 'basto', label: 'BASO' },
  { id: 'other', label: 'Lain-lain' },
]

export const NGTMA_DOCUMENT_TYPES: { id: ProjectDocumentType; label: string }[] = [
  { id: 'ngtma_agreement', label: 'BA Kesepakatan NGTMA' },
  { id: 'nce_quote', label: 'Quote NCE' },
  { id: 'rpa', label: 'Dokumen RPA' },
  { id: 'contract', label: 'Kontrak' },
  { id: 'bast', label: 'BAST' },
  { id: 'invoice', label: 'Invoice' },
  { id: 'billing_evidence', label: 'Billing Evidence' },
]

export function getProjectDocumentTypes(category: string) {
  return category === 'NGTMA' ? NGTMA_DOCUMENT_TYPES : PROJECT_DOCUMENT_TYPES
}

export function getProjectDocumentLabel(documentType: ProjectDocumentType) {
  return [...PROJECT_DOCUMENT_TYPES, ...NGTMA_DOCUMENT_TYPES].find((type) => type.id === documentType)?.label ?? documentType
}

async function responseJson(response: Response) {
  const body = await response.json().catch(() => ({}))
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
      const body = await response.json().catch(() => ({}))
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
