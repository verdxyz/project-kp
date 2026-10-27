import { apiRequest } from './api'

/**
 * db.ts — Database helpers untuk B2G Dashboard
 *
 * ProjectsDB uses the backend API and PostgreSQL.
 * ServicesDB and CustomersDB use localStorage.

 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ServiceItem {
  id: string
  name: string
  category: 'On Channel' | 'GTMA' | 'NGTMA'
  serviceType: 'HSI' | 'WiFi' | 'Astinet' | 'IP Transit' | 'VPN' | 'Metro' | 'DDOS' | 'UHOS' | 'PIJAR' | 'NETMONK' | 'VPN IP' | 'Metro Ethernet' | 'SD-WAN' | 'Lainnya'
  bandwidth?: string
  sla: string
  priceMonthly: number
  priceOTC?: number
  description: string
  features: string[]
  status: 'Aktif' | 'Tidak Aktif'
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  name: string
  agencyType:
    | 'Pemerintah Kota'
    | 'Pemerintah Kabupaten'
    | 'Pemerintah Provinsi'
    | 'Kepolisian Daerah'
    | 'Legislatif'
    | 'TNI'
    | 'BUMN'
    | 'Lainnya'
  region: string
  address: string
  picName: string
  picPhone: string
  picEmail: string
  npwp?: string
  activeServices: string[]
  totalContract: number
  status: 'Aktif' | 'Prospek' | 'Tidak Aktif'
  notes: string
  createdAt: string
  updatedAt: string
}

export interface ProjectEntry {
  id: string
  idLOP: string
  projectName: string
  agency: string
  pemdaName: string
  agencyType: string
  region: string
  budget: number
  servicePrice: number
  servicePointCount?: number
  servicePointTotalPrice?: number
  procurementMethod: 'E-Katalog' | 'Pengadaan Langsung' | 'Penunjukan Langsung' | 'Tender Cepat' | 'Tender'
  stage: 'F0' | 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'Loss' | 'Cancel'
  progress: number
  startDate: string
  endDate: string
  pic: string
  category: 'On Channel' | 'GTMA' | 'NGTMA'
  serviceType: string
  totalCapacityMbps: number | null
  sid: string | null
  subsidiaryName?: string | null
  customerName?: string | null
  dinasName?: string | null
  status: 'Active' | 'At Risk' | 'Completed' | 'Lost' | 'Cancelled'
  notes?: string
  createdAt: string
  updatedAt: string
}

// ─── Project data API response ─────────────────────────────────────────

export const ProjectsDB = {
  async getAll(): Promise<ProjectEntry[]> {
    const result = await apiRequest<{ projects: ProjectEntry[] }>('/api/projects')
    return result.projects
  },
  async getById(idLOP: string): Promise<ProjectEntry | undefined> {
    try {
      const result = await apiRequest<{ project: ProjectEntry }>('/api/projects/' + encodeURIComponent(idLOP))
      return result.project
    } catch (error) {
      if (error instanceof Error && error.message === 'Proyek tidak ditemukan.') return undefined
      throw error
    }
  },
  async create(data: Omit<ProjectEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectEntry> {
    const result = await apiRequest<{ project: ProjectEntry }>('/api/projects', { method: 'POST', body: JSON.stringify(data) })
    return result.project
  },
  async update(id: string, data: Omit<ProjectEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectEntry> {
    const result = await apiRequest<{ project: ProjectEntry }>('/api/projects/' + encodeURIComponent(id), { method: 'PUT', body: JSON.stringify(data) })
    return result.project
  },
  async delete(idLOP: string): Promise<void> {
    await apiRequest<void>('/api/projects/' + encodeURIComponent(idLOP), { method: 'DELETE' })
  },
}

const KEYS = {
  services: 'b2g_services',
  customers: 'b2g_customers',
} as const

// ─── Generic localStorage Helpers ─────────────────────────────────────────────

function loadAll<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function saveAll<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
}

function now(): string {
  return new Date().toISOString()
}

// ─── Services CRUD (localStorage) ────────────────────────────────────────────

export const ServicesDB = {
  getAll(): ServiceItem[] {
    return loadAll<ServiceItem>(KEYS.services)
  },

  getById(id: string): ServiceItem | undefined {
    return this.getAll().find((s) => s.id === id)
  },

  create(data: Omit<ServiceItem, 'id' | 'createdAt' | 'updatedAt'>): ServiceItem {
    const item: ServiceItem = {
      ...data,
      id: generateId('SVC'),
      createdAt: now(),
      updatedAt: now(),
    }
    const all = this.getAll()
    all.push(item)
    saveAll(KEYS.services, all)
    return item
  },

  update(id: string, data: Partial<Omit<ServiceItem, 'id' | 'createdAt'>>): ServiceItem | null {
    const all = this.getAll()
    const idx = all.findIndex((s) => s.id === id)
    if (idx === -1) return null
    all[idx] = { ...all[idx], ...data, updatedAt: now() }
    saveAll(KEYS.services, all)
    return all[idx]
  },

  delete(id: string): boolean {
    const all = this.getAll()
    const filtered = all.filter((s) => s.id !== id)
    if (filtered.length === all.length) return false
    saveAll(KEYS.services, filtered)
    return true
  },

  seed(items: Omit<ServiceItem, 'id' | 'createdAt' | 'updatedAt'>[]): void {
    if (this.getAll().length > 0) return
    items.forEach((item) => this.create(item))
  },
}

// ─── Customers CRUD (localStorage) ────────────────────────────────────────────

export const CustomersDB = {
  getAll(): Customer[] {
    return loadAll<Customer>(KEYS.customers)
  },

  getById(id: string): Customer | undefined {
    return this.getAll().find((c) => c.id === id)
  },

  create(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer {
    const item: Customer = {
      ...data,
      id: generateId('CST'),
      createdAt: now(),
      updatedAt: now(),
    }
    const all = this.getAll()
    all.push(item)
    saveAll(KEYS.customers, all)
    return item
  },

  update(id: string, data: Partial<Omit<Customer, 'id' | 'createdAt'>>): Customer | null {
    const all = this.getAll()
    const idx = all.findIndex((c) => c.id === id)
    if (idx === -1) return null
    all[idx] = { ...all[idx], ...data, updatedAt: now() }
    saveAll(KEYS.customers, all)
    return all[idx]
  },

  delete(id: string): boolean {
    const all = this.getAll()
    const filtered = all.filter((c) => c.id !== id)
    if (filtered.length === all.length) return false
    saveAll(KEYS.customers, filtered)
    return true
  },

  seed(items: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>[]): void {
    const normalizeName = (name: string) => name.trim().toLocaleLowerCase('id-ID')
      .replace(/\bpolda jateng\b/g, 'polda jawa tengah')
    const existingNames = new Set(this.getAll().map((customer) => normalizeName(customer.name)))
    for (const item of items) {
      const name = normalizeName(item.name)
      if (existingNames.has(name)) continue
      this.create(item)
      existingNames.add(name)
    }
  },
}
