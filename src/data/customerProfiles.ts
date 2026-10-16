export type CustomerProfileTab = 'MAPS' | 'Layanan' | 'Kontrak' | 'Dokumen'

export type MapsSection =
  | 'Customer Profile'
  | 'Strategic Highlight'
  | 'Management Profile'
  | 'Institution Profile'
  | 'Benchmark Best Practices'
  | 'Customer Value Innovation'
  | 'Revenue and Wallet Shared'
  | 'Business Prospect'
  | 'Complaint and Solution'

export interface CustomerProfileService {
  name: string
  status: 'Aktif' | 'Suspend' | 'Non Aktif'
  serviceNumber: string
  address: string
}

export interface CustomerProfileContract {
  contractNumber: string
  startDate: string
  endDate: string
  status: 'Disconnect' | 'Modify' | 'Suspend' | 'Resume'
  serviceCount: number
  slg: string
}

export interface CustomerProfile {
  id: string
  name: string
  nipnas: string
  segment: string
  subSegment: string
  witel: string
  region: string
  address: string
  phone: string
  email: string
  website: string
  employeeCount: number
  organizationUnits: { label: string; count: number }[]
  pic: { name: string; role: string; phone: string; email: string }
  accountManager: { name: string; role: string; phone: string; email: string }
  engineer: { name: string; role: string; phone: string; email: string }
  vision: string
  missions: string[]
  mediumTermStrategy: string[]
  longTermStrategy: string[]
  contacts: { name: string; role: string; position: string; phone: string }[]
  ivca: { category: string; description: string }[]
  services: CustomerProfileService[]
  contracts: CustomerProfileContract[]
  innovations: { name: string; description: string; status: string }[]
  walletSpend: { product: string; amount: number; institution: string }[]
  opportunities: { projectId: string; projectCategory: string; process: string; offer: number; category: string }[]
  documents: { name: string; type: string; updatedAt: string }[]
  complaints: { date: string; issue: string; solution: string; status: string }[]
  benchmarks: string[]
  revenueSummary: { label: string; amount: number }[]
}

const customerSeeds = [
  { name: 'Provinsi Jawa Tengah', region: 'Semarang', subSegment: 'PROVINSI', pic: 'Bagas Wicaksono', employees: 12500, emailDomain: 'jatengprov.go.id', opd: 42, bodies: 9, asn: 12500, districts: 35, villages: 576, clinics: 370 },
  { name: 'Pemkot Semarang', region: 'Semarang', subSegment: 'PEMKOT', pic: 'Agus Widodo', employees: 8900, emailDomain: 'semarangkota.go.id', opd: 38, bodies: 8, asn: 8900, districts: 16, villages: 177, clinics: 37 },
  { name: 'Pemkab Demak', region: 'Demak', subSegment: 'PEMKAB', pic: 'Naufal Hidayat', employees: 3900, emailDomain: 'demakkab.go.id', opd: 31, bodies: 6, asn: 3900, districts: 14, villages: 243, clinics: 27 },
  { name: 'Pemkab Kendal', region: 'Kendal', subSegment: 'PEMKAB', pic: 'Retno Wulandari', employees: 4100, emailDomain: 'kendalkab.go.id', opd: 33, bodies: 7, asn: 4100, districts: 20, villages: 286, clinics: 30 },
  { name: 'Pemkot Salatiga', region: 'Salatiga', subSegment: 'PEMKOT', pic: 'Bambang Eko', employees: 2300, emailDomain: 'salatiga.go.id', opd: 29, bodies: 6, asn: 2300, districts: 4, villages: 23, clinics: 6 },
  { name: 'Pemkab Semarang', region: 'Semarang', subSegment: 'PEMKAB', pic: 'Aditya Pranowo', employees: 4500, emailDomain: 'semarangkab.go.id', opd: 36, bodies: 8, asn: 4500, districts: 19, villages: 235, clinics: 26 },
  { name: 'Pemkab Batang', region: 'Batang', subSegment: 'PEMKAB', pic: 'Nadia Kusumawardani', employees: 3200, emailDomain: 'batangkab.go.id', opd: 30, bodies: 6, asn: 3200, districts: 15, villages: 248, clinics: 21 },
  { name: 'Pemkab Pekalongan', region: 'Pekalongan', subSegment: 'PEMKAB', pic: 'Rizal Mahendra', employees: 4200, emailDomain: 'pekalongankab.go.id', opd: 35, bodies: 7, asn: 4200, districts: 19, villages: 285, clinics: 27 },
  { name: 'Pemkot Pekalongan', region: 'Pekalongan', subSegment: 'PEMKOT', pic: 'Intan Permatasari', employees: 2600, emailDomain: 'pekalongankota.go.id', opd: 30, bodies: 6, asn: 2600, districts: 4, villages: 27, clinics: 14 },
  { name: 'Pemkab Pemalang', region: 'Pemalang', subSegment: 'PEMKAB', pic: 'Dimas Kurniawan', employees: 4400, emailDomain: 'pemalangkab.go.id', opd: 34, bodies: 7, asn: 4400, districts: 14, villages: 211, clinics: 25 },
  { name: 'Pemkot Tegal', region: 'Tegal', subSegment: 'PEMKOT', pic: 'Citra Maharani', employees: 2500, emailDomain: 'tegalkota.go.id', opd: 29, bodies: 5, asn: 2500, districts: 4, villages: 27, clinics: 8 },
  { name: 'Pemkab Tegal', region: 'Tegal', subSegment: 'PEMKAB', pic: 'Fikri Ramadhan', employees: 4300, emailDomain: 'tegalkab.go.id', opd: 33, bodies: 7, asn: 4300, districts: 18, villages: 281, clinics: 29 },
  { name: 'Pemkab Brebes', region: 'Brebes', subSegment: 'PEMKAB', pic: 'Laras Puspitasari', employees: 4800, emailDomain: 'brebeskab.go.id', opd: 35, bodies: 7, asn: 4800, districts: 17, villages: 297, clinics: 38 },
] as const

const serviceNames = ['ASTINet Dedicated', 'Wifi Managed Service', 'VPN IP MPLS', 'Metro Ethernet']
const sectionCategories = [
  'Supporting Industry',
  'Complement Institution',
  'Firm Infrastructure',
  'HR Management',
  'Tech Development',
  'Procurement',
  'Operation',
]

export const CUSTOMER_PROFILES: CustomerProfile[] = customerSeeds.map((seed, index) => {
  const suffix = String(index + 1).padStart(3, '0')
  const contactName = ['Siti Rahmawati', 'Budi Santoso', 'Dewi Anggraini'][index % 3]
  return {
    id: `CUST-JT-${suffix}`,
    name: seed.name,
    nipnas: `NIP-${String(100000 + index * 731).padStart(6, '0')}`,
    segment: 'B2B TREG',
    subSegment: seed.subSegment,
    witel: 'SEMARANG JATENG UTARA',
    region: seed.region,
    address: `Jl. Alun-Alun No. ${index + 1}, ${seed.region}, Jawa Tengah`,
    phone: `024-76${String(10000 + index * 137).slice(1)}`,
    email: `kominfo@${seed.emailDomain}`,
    website: `https://www.${seed.emailDomain}`,
    employeeCount: seed.employees,
    organizationUnits: [
      { label: 'OPD', count: seed.opd },
      { label: 'BADAN', count: seed.bodies },
      { label: 'ASN', count: seed.asn },
      { label: 'Kecamatan', count: seed.districts },
      { label: 'Desa / Kelurahan', count: seed.villages },
      { label: 'Puskesmas', count: seed.clinics },
    ],
    pic: { name: seed.pic, role: 'PIC Pelanggan', phone: `0812-1000-${suffix}`, email: `pic@${seed.emailDomain}` },
    accountManager: { name: ['Dina Kartika', 'Andi Pratama', 'Rina Kusuma'][index % 3], role: 'Account Manager', phone: '0812-9000-0101', email: 'account.manager@telkom.co.id' },
    engineer: { name: ['Fajar Nugroho', 'Yoga Prasetya', 'Maya Lestari'][index % 3], role: 'Engineer On Site', phone: '0812-9000-0202', email: 'engineer@telkom.co.id' },
    vision: `Terwujudnya ${seed.region} yang maju, sejahtera, dan terhubung melalui transformasi digital.`,
    missions: [
      'Meningkatkan kualitas pelayanan publik berbasis digital.',
      'Memperluas pemerataan infrastruktur dan literasi digital.',
      'Mendorong tata kelola pemerintahan yang transparan dan akuntabel.',
    ],
    mediumTermStrategy: ['Integrasi layanan antar-OPD', 'Penguatan jaringan dan pusat data pemerintah', 'Digitalisasi layanan prioritas masyarakat'],
    longTermStrategy: ['Mewujudkan smart region yang inklusif', 'Pengembangan ekosistem ekonomi digital daerah'],
    contacts: [
      { name: seed.pic, role: 'Pelanggan', position: 'Kepala Bidang TIK', phone: `0812-1000-${suffix}` },
      { name: contactName, role: 'Pelanggan', position: 'Pranata Komputer Ahli', phone: `0813-2000-${suffix}` },
      { name: 'Account Manager Telkom', role: 'Telkom', position: 'Account Manager', phone: '0812-9000-0101' },
    ],
    ivca: sectionCategories.map((category, categoryIndex) => ({
      category,
      description: [
        'Mitra penyedia infrastruktur telekomunikasi dan perangkat digital.',
        'Kolaborasi dengan OPD, BUMD, dan lembaga pelayanan masyarakat.',
        'Perencanaan, penganggaran, dan tata kelola program daerah.',
        'Pengembangan kompetensi ASN dan talenta digital.',
        'Adopsi cloud, keamanan siber, dan integrasi aplikasi.',
        'Pengadaan barang dan jasa melalui mekanisme pemerintah.',
        'Operasional layanan publik dan pusat kendali daerah.',
      ][categoryIndex],
    })),
    services: serviceNames.map((name, serviceIndex) => ({
      name,
      status: (serviceIndex === 3 && index % 3 === 0 ? 'Suspend' : serviceIndex === 2 && index % 4 === 0 ? 'Non Aktif' : 'Aktif') as CustomerProfileService['status'],
      serviceNumber: `SID-${suffix}-${String(serviceIndex + 1).padStart(2, '0')}`,
      address: `Kantor ${serviceIndex % 2 ? 'Dinas Kominfo' : 'Pusat Pemerintahan'}, ${seed.region}`,
    })),
    contracts: [0, 1].map((contractIndex) => ({
      contractNumber: `KTR/${seed.region.toUpperCase()}/${2025 + contractIndex}/${suffix}`,
      startDate: `${contractIndex === 0 ? '2025-01-01' : '2026-01-01'}`,
      endDate: `${contractIndex === 0 ? '2025-12-31' : '2026-12-31'}`,
      status: (['Modify', 'Resume', 'Suspend', 'Disconnect'] as const)[(index + contractIndex) % 4],
      serviceCount: contractIndex === 0 ? 2 : 3,
      slg: '99%',
    })),
    innovations: [
      { name: 'Portal Layanan Terpadu', description: 'Integrasi akses layanan masyarakat dalam satu portal digital.', status: 'Pilot' },
      { name: 'Command Center Daerah', description: 'Dashboard pemantauan data dan layanan lintas OPD.', status: 'Perencanaan' },
    ],
    walletSpend: [
      { product: 'Belanja Internet Paket 1', amount: 888000000 + index * 25000000, institution: 'PT Mitra Data Nusantara' },
      { product: 'Pengadaan Perangkat Jaringan', amount: 425000000 + index * 12000000, institution: 'CV Teknologi Daerah' },
    ],
    opportunities: [
      { projectId: `LOP-${suffix}-2026-01`, projectCategory: 'Connectivity', process: 'F3 - Negosiasi', offer: 1850000000 + index * 35000000, category: 'New Business' },
      { projectId: `LOP-${suffix}-2026-02`, projectCategory: 'Digital Solution', process: 'F1 - Inisiasi', offer: 620000000 + index * 15000000, category: 'Upsell' },
    ],
    documents: [
      { name: 'Laporan SLG 2025.pdf', type: 'Laporan SLG', updatedAt: '12 Jan 2026' },
      { name: 'Kontrak Layanan 2026.pdf', type: 'Kontrak', updatedAt: '08 Jan 2026' },
      { name: 'Struktur Organisasi.pdf', type: 'Profil Institusi', updatedAt: '05 Jan 2026' },
    ],
    complaints: [
      { date: '14 Feb 2026', issue: 'Gangguan koneksi pada kantor layanan kecamatan.', solution: 'Pengalihan jalur dan pemulihan layanan oleh tim teknis.', status: 'Selesai' },
      { date: '03 Mar 2026', issue: 'Permintaan penambahan kapasitas bandwidth.', solution: 'Kajian kebutuhan dan penjadwalan peningkatan kapasitas.', status: 'Dalam Proses' },
    ],
    benchmarks: ['SLA layanan inti terjaga di atas 99%.', 'Tersedia pemantauan jaringan dan eskalasi gangguan terpusat.', 'Peluang integrasi layanan digital lintas OPD telah diidentifikasi.'],
    revenueSummary: [
      { label: 'Revenue Telkom', amount: 1250000000 + index * 85000000 },
      { label: 'Wallet Share Potensial', amount: 2100000000 + index * 120000000 },
      { label: 'Revenue Berjalan', amount: 980000000 + index * 63000000 },
    ],
  }
})

export function getCustomerProfile(name?: string): CustomerProfile {
  return CUSTOMER_PROFILES.find((profile) => profile.name === name) ?? CUSTOMER_PROFILES[0]
}
