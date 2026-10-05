export interface Project {
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
}

export const PROJECTS: Project[] = [
  {
    id: 'PRJ-001',
    idLOP: 'LOP-2024-SMG-001',
    projectName: 'Pengadaan Layanan Internet Dedicated Pemkot Semarang',
    agency: 'Pemkot Semarang',
    agencyType: 'Pemerintah Kota',
    region: 'Semarang',
    budget: 2_400_000_000,
    procurementMethod: 'Tender/e-Katalog',
    stage: 'F2',
    progress: 45,
    startDate: '2024-01-10',
    endDate: '2024-06-30',
    pic: 'Budi Santoso',
    category: 'On Channel',
    serviceType: 'Astinet',
    status: 'Active',
  },
  {
    id: 'PRJ-002',
    idLOP: 'LOP-2024-KDL-002',
    projectName: 'VPN MPLS Seluruh OPD Pemkab Kendal',
    agency: 'Pemkab Kendal',
    agencyType: 'Pemerintah Kabupaten',
    region: 'Kendal',
    budget: 890_000_000,
    procurementMethod: 'Tender/e-Katalog',
    stage: 'F3',
    progress: 72,
    startDate: '2024-02-01',
    endDate: '2024-07-15',
    pic: 'Sari Dewi',
    category: 'On Channel',
    serviceType: 'VPN IP',
    status: 'Active',
  },
  {
    id: 'PRJ-003',
    idLOP: 'LOP-2024-SLT-003',
    projectName: 'Metro Ethernet Pemkot Salatiga',
    agency: 'Pemkot Salatiga',
    agencyType: 'Pemerintah Kota',
    region: 'Salatiga',
    budget: 450_000_000,
    procurementMethod: 'Tender/e-Katalog',
    stage: 'WIN',
    progress: 100,
    startDate: '2024-01-20',
    endDate: '2024-04-20',
    pic: 'Ahmad Fauzi',
    category: 'On Channel',
    serviceType: 'Metro Ethernet',
    status: 'Completed',
  },
  {
    id: 'PRJ-004',
    idLOP: 'LOP-2024-PLJ-004',
    projectName: 'Google Workspace Enterprise Polda Jateng',
    agency: 'Polda Jateng',
    agencyType: 'Kepolisian Daerah',
    region: 'Semarang',
    budget: 3_200_000_000,
    procurementMethod: 'Tender/e-Katalog',
    stage: 'F1',
    progress: 20,
    startDate: '2024-03-01',
    endDate: '2024-09-30',
    pic: 'Rina Kusuma',
    category: 'GTMA',
    serviceType: 'Google Workspace',
    status: 'At Risk',
  },
  {
    id: 'PRJ-005',
    idLOP: 'LOP-2024-SMG-005',
    projectName: 'Penunjukan Langsung Internet UPTD Disdukcapil',
    agency: 'Pemkot Semarang',
    agencyType: 'Pemerintah Kota',
    region: 'Semarang',
    budget: 120_000_000,
    procurementMethod: 'Penunjukan Langsung',
    stage: 'WIN',
    progress: 100,
    startDate: '2024-02-15',
    endDate: '2024-03-15',
    pic: 'Deni Wirawan',
    category: 'On Channel',
    serviceType: 'Astinet',
    status: 'Completed',
  },
  {
    id: 'PRJ-006',
    idLOP: 'LOP-2024-GBG-006',
    projectName: 'Mikrotik RouterBoard & Support Pemkab Grobogan',
    agency: 'Pemkab Grobogan',
    agencyType: 'Pemerintah Kabupaten',
    region: 'Grobogan',
    budget: 560_000_000,
    procurementMethod: 'Tender/e-Katalog',
    stage: 'F2',
    progress: 50,
    startDate: '2024-03-10',
    endDate: '2024-08-10',
    pic: 'Hendra Pratama',
    category: 'GTMA',
    serviceType: 'Mikrotik',
    status: 'Active',
  },
  {
    id: 'PRJ-007',
    idLOP: 'LOP-2024-MGL-007',
    projectName: 'Layanan Astinet Dedicated DPRD Magelang',
    agency: 'DPRD Magelang',
    agencyType: 'Legislatif',
    region: 'Magelang',
    budget: 85_000_000,
    procurementMethod: 'Penunjukan Langsung',
    stage: 'F3',
    progress: 80,
    startDate: '2024-04-01',
    endDate: '2024-05-01',
    pic: 'Fitri Handayani',
    category: 'On Channel',
    serviceType: 'Astinet',
    status: 'Active',
  },
  {
    id: 'PRJ-008',
    idLOP: 'LOP-2024-BLR-008',
    projectName: 'SD-WAN Dinas Kesehatan Pemkab Blora',
    agency: 'Pemkab Blora',
    agencyType: 'Pemerintah Kabupaten',
    region: 'Blora',
    budget: 1_750_000_000,
    procurementMethod: 'Tender/e-Katalog',
    stage: 'F0',
    progress: 5,
    startDate: '2024-04-15',
    endDate: '2024-10-15',
    pic: 'Yudi Prasetyo',
    category: 'On Channel',
    serviceType: 'VPN IP',
    status: 'Active',
  },
  {
    id: 'PRJ-009',
    idLOP: 'LOP-2024-KBM-009',
    projectName: 'Google Workspace BPKAD Pemkab Kebumen',
    agency: 'Pemkab Kebumen',
    agencyType: 'Pemerintah Kabupaten',
    region: 'Kebumen',
    budget: 280_000_000,
    procurementMethod: 'Tender/e-Katalog',
    stage: 'LOSS',
    progress: 0,
    startDate: '2024-01-05',
    endDate: '2024-03-05',
    pic: 'Maya Sari',
    category: 'GTMA',
    serviceType: 'Google Workspace',
    status: 'Lost',
  },
  {
    id: 'PRJ-010',
    idLOP: 'LOP-2024-PWR-010',
    projectName: 'Metro Ethernet Antar OPD Pemkot Purworejo',
    agency: 'Pemkot Purworejo',
    agencyType: 'Pemerintah Kota',
    region: 'Purworejo',
    budget: 630_000_000,
    procurementMethod: 'Tender/e-Katalog',
    stage: 'F1',
    progress: 25,
    startDate: '2024-04-20',
    endDate: '2024-10-20',
    pic: 'Bambang Eko',
    category: 'On Channel',
    serviceType: 'Metro Ethernet',
    status: 'Active',
  },
]

export interface CompetitorRecord {
  id: string
  projectId: string
  competitorName: string
  price: number
  notes: string
  date: string
}

export const COMPETITORS: CompetitorRecord[] = [
  {
    id: 'CMP-001',
    projectId: 'PRJ-009',
    competitorName: 'Indosat Ooredoo Hutchison',
    price: 245_000_000,
    notes: 'Menawarkan harga lebih rendah 12% dengan jaminan SLA 99.5%. Bundle Google Workspace + VPN.',
    date: '2024-03-01',
  },
]

export const STAGE_LABELS = ['F0', 'F1', 'F2', 'F3', 'WIN'] as const
export type Stage = typeof STAGE_LABELS[number] | 'LOSS'

export const STAGE_COLORS: Record<string, string> = {
  F0: '#6366f1',
  F1: '#f59e0b',
  F2: '#3b82f6',
  F3: '#8b5cf6',
  WIN: '#10b981',
  LOSS: '#ef4444',
}

export const TOP_OPTIONS = [
  { value: 'bulanan', label: 'Bulanan (Monthly)' },
  { value: 'termin', label: 'Termin' },
  { value: 'otc', label: 'OTC (One Time Charge)' },
]
