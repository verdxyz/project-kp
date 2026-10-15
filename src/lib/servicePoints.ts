<<<<<<< HEAD
export const SERVICE_PRODUCTS = ['HSI', 'WMS', 'Astinet', 'IP Transit', 'VPN', 'Metro Ethernet', 'POTS'] as const

export interface ProjectServicePoint {
  id?: string
  idLOP?: string
  sid: string
  productType?: string
  capacityMbps: number
  serviceGroup: 'POTS' | 'Non-POTS'
  orderNo?: string | null
  quote?: string | null
  location?: string | null
  activeDate?: string | null
  bandwidth?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface AgencyPivotRow {
  agencyName: string
  agencyType: string
  region: string
  pointCount: number
  totalBandwidthMbps: number
}

// Kept for backward compatibility
=======
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

>>>>>>> 6aa6fdd5c6590190ec52e0615772fa98f5081420
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

<<<<<<< HEAD
  async batchUpdate(
    idLOP: string,
    servicePoints: ProjectServicePoint[],
    ngtmaInfo?: { customerName?: string; dinasName?: string; subsidiaryName?: string }
  ): Promise<{ message: string; servicePoints: ProjectServicePoint[] }> {
    const response = await fetch(`/api/projects/${encodeURIComponent(idLOP)}/service-points`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ servicePoints, ngtmaInfo }),
    })
    const body = await readJson(response)
    return body
  },

=======
>>>>>>> 6aa6fdd5c6590190ec52e0615772fa98f5081420
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

<<<<<<< HEAD
  async getPivot(): Promise<AgencyPivotRow[]> {
    const response = await fetch('/api/reports/service-pivot', { credentials: 'same-origin' })
    const body = await readJson(response)
    return body.rows as AgencyPivotRow[]
=======
  async getPivot(agency?: string): Promise<ServicePivotRow[]> {
    const query = agency ? `?agency=${encodeURIComponent(agency)}` : ''
    const response = await fetch(`/api/reports/service-pivot${query}`, { credentials: 'same-origin' })
    const body = await readJson(response)
    return body.rows as ServicePivotRow[]
>>>>>>> 6aa6fdd5c6590190ec52e0615772fa98f5081420
  },
}
