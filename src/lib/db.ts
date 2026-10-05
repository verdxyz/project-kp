/**
 * db.ts — localStorage-based database for B2G Dashboard
 * Provides typed CRUD helpers for Services, Customers, and Projects.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ServiceItem {
  id: string
  name: string
  category: 'On Channel' | 'GTMA'
  serviceType: 'Astinet' | 'VPN IP' | 'Metro Ethernet' | 'SD-WAN' | 'Lainnya'
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
  agencyType: string
  region: string
  budget: number
  procurementMethod: 'Tender/e-Katalog' | 'Penunjukan Langsung'
  stage: 'F0' | 'F1' | 'F2' | 'F3' | 'WIN' | 'LOSS'
  progress: number
  startDate: string
  endDate: string
  pic: string
  category: 'On Channel' | 'GTMA'
  serviceType: string
  status: 'Active' | 'At Risk' | 'Completed' | 'Lost'
  notes?: string
  createdAt: string
  updatedAt: string
}

// ─── Keys ─────────────────────────────────────────────────────────────────────

const KEYS = {
  services: 'b2g_services',
  customers: 'b2g_customers',
  projects: 'b2g_projects',
} as const

// ─── Generic Helpers ─────────────────────────────────────────────────────────

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

// ─── Services CRUD ────────────────────────────────────────────────────────────

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

// ─── Customers CRUD ───────────────────────────────────────────────────────────

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
    if (this.getAll().length > 0) return
    items.forEach((item) => this.create(item))
  },
}

// ─── Projects CRUD ────────────────────────────────────────────────────────────

export const ProjectsDB = {
  getAll(): ProjectEntry[] {
    return loadAll<ProjectEntry>(KEYS.projects)
  },

  getById(id: string): ProjectEntry | undefined {
    return this.getAll().find((p) => p.id === id)
  },

  create(data: Omit<ProjectEntry, 'id' | 'createdAt' | 'updatedAt'>): ProjectEntry {
    const item: ProjectEntry = {
      ...data,
      id: generateId('PRJ'),
      createdAt: now(),
      updatedAt: now(),
    }
    const all = this.getAll()
    all.push(item)
    saveAll(KEYS.projects, all)
    return item
  },

  update(id: string, data: Partial<Omit<ProjectEntry, 'id' | 'createdAt'>>): ProjectEntry | null {
    const all = this.getAll()
    const idx = all.findIndex((p) => p.id === id)
    if (idx === -1) return null
    all[idx] = { ...all[idx], ...data, updatedAt: now() }
    saveAll(KEYS.projects, all)
    return all[idx]
  },

  delete(id: string): boolean {
    const all = this.getAll()
    const filtered = all.filter((p) => p.id !== id)
    if (filtered.length === all.length) return false
    saveAll(KEYS.projects, filtered)
    return true
  },

  seed(items: Omit<ProjectEntry, 'id' | 'createdAt' | 'updatedAt'>[]): void {
    if (this.getAll().length > 0) return
    items.forEach((item) => this.create(item))
  },
}
