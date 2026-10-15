export const SERVICE_PRODUCTS = ['HSI', 'WMS', 'Astinet', 'IP Transit', 'VPN'] as const

export interface ProjectServicePoint {
  id: string
  idLOP: string
  sid: string
  productType: string
  capacityMbps: number
  createdAt: string
  updatedAt: string
}

export interface ServicePivotRow {
  productType: (typeof SERVICE_PRODUCTS)[number]
  pointCount: number
  capacityMbps: number
}

async function readJson(response: Response) {
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || 'Operasi titik layanan gagal.')
  return body
}

export const ServicePoints = {
  async list(idLOP: string): Promise<ProjectServicePoint[]> {
    const response = await fetch(`/api/projects/${encodeURIComponent(idLOP)}/service-points`, {
      credentials: 'same-origin',
    })
    const body = await readJson(response)
    return body.servicePoints as ProjectServicePoint[]
  },

  async importExcel(idLOP: string, file: File): Promise<{ imported: number; skipped: number }> {
    const formData = new FormData()
    formData.set('file', file)
    const response = await fetch(`/api/projects/${encodeURIComponent(idLOP)}/service-points/import`, {
      method: 'POST',
      credentials: 'same-origin',
      body: formData,
    })
    return readJson(response) as Promise<{ imported: number; skipped: number }>
  },

  async getPivot(agency?: string): Promise<ServicePivotRow[]> {
    const query = agency ? `?agency=${encodeURIComponent(agency)}` : ''
    const response = await fetch(`/api/reports/service-pivot${query}`, { credentials: 'same-origin' })
    const body = await readJson(response)
    return body.rows as ServicePivotRow[]
  },
}
