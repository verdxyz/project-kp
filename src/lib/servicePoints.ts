import { apiRequest } from './api'

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
  servicePrice?: number | null
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
export interface ServicePivotRow {
  productType: (typeof SERVICE_PRODUCTS)[number]
  pointCount: number
  capacityMbps: number
}

// ─── Service point API response ─────────────────────────────────────────

export const ServicePoints = {
  async list(idLOP: string): Promise<ProjectServicePoint[]> {
    const result = await apiRequest<{ servicePoints: ProjectServicePoint[] }>('/api/projects/' + encodeURIComponent(idLOP) + '/service-points')
    return result.servicePoints
  },

  async batchUpdate(
    idLOP: string,
    servicePoints: ProjectServicePoint[],
    ngtmaInfo?: { customerName?: string; dinasName?: string; subsidiaryName?: string },
  ): Promise<{ message: string; servicePoints: ProjectServicePoint[] }> {
    return apiRequest<{ message: string; servicePoints: ProjectServicePoint[] }>('/api/projects/' + encodeURIComponent(idLOP) + '/service-points', {
      method: 'PUT', body: JSON.stringify({ servicePoints, ngtmaInfo }),
    })
  },

  async importExcel(
    idLOP: string,
    file: File,
    serviceGroup?: 'POTS' | 'Non-POTS',
  ): Promise<{ imported: number; replaced: number; skipped: number; duplicateRows?: number }> {
    const form = new FormData()
    form.append('file', file)
    if (serviceGroup) form.append('serviceGroup', serviceGroup)
    return apiRequest<{ imported: number; replaced: number; skipped: number; duplicateRows?: number }>('/api/projects/' + encodeURIComponent(idLOP) + '/service-points/import', {
      method: 'POST', body: form,
    })
  },

  async getPivot(): Promise<AgencyPivotRow[]> {
    const result = await apiRequest<{ rows: AgencyPivotRow[] }>('/api/reports/service-pivot')
    return result.rows.filter((row) => row.pointCount > 0)
  },
}
