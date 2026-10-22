export type CustomerProfileTab = 'MAPS' | 'Layanan' | 'Kontrak' | 'Dokumen'

export type MapsSection =
  | 'Customer Profile'
  | 'Strategic Highlight'
  | 'Management Profile'
  | 'Institution Profile'
  | 'Benchmark Best Practices and TOWS Analysis'
  | 'Customer Value Innovation'
  | 'Revenue and Wallet Shared'
  | 'Business Prospect'
  | 'Complaint and Solution'
  | 'Courtesy Visit'

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
  type?: 'Modify & Renewal Agreement' | 'New Install' | 'Disconnect' | 'Resume' | 'Suspend'
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
  complaints: { date: string; issue: string; channel: string; status: string; resolvedDate: string; solution: string }[]
  benchmarks: string[]
  revenueSummary: { label: string; amount: number }[]
  organizationChart: string
  institutionProducts: { name: string; status: string }[]
  marketAnalysis: { comparator: string; challenges: string; customer: string }
  benchmarkPractices: { institution: string; description: string; logo: string }[]
  towsAnalysis: { opportunity: string; threats: string; strength: string; weakness: string; strategySO: string; strategyST: string; strategyWO: string; strategyWT: string }
  visits: { date: string; objective: string; notes: string }[]
  revenueProducts: { name: string; revenue: number; subsidiary: string }[]
  walletSummary: { walletNonTelkom: string; walletTelkom: string; walletShare: string }
  financialPerformance: string
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
  'Sosialisasi Layanan',
  'Service',
  'Customer',
  'Related Industry',
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
    address: seed.name === 'Pemkot Semarang' ? 'Jl. Pemuda, Semarang, Jawa Tengah' : `Jl. Alun-Alun No. ${index + 1}, ${seed.region}, Jawa Tengah`,
    phone: seed.name === 'Pemkot Semarang' ? '+62 243 548 700' : `024-76${String(10000 + index * 137).slice(1)}`,
    email: seed.name === 'Pemkot Semarang' ? 'sekda@semarangkota.go.id' : `kominfo@${seed.emailDomain}`,
    website: seed.name === 'Pemkot Semarang' ? 'https://semarangkota.go.id' : `https://www.${seed.emailDomain}`,
    employeeCount: seed.name === 'Pemkot Semarang' ? 2354 : seed.employees,
    organizationUnits: seed.name === 'Pemkot Semarang'
      ? ['SETDA', 'Sekretariat DPRD', 'Inspektorat', 'Dinas', 'Badan', 'Satuan', 'RSUD'].map((label) => ({ label, count: 1 }))
      : [
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
    vision: seed.name === 'Pemkot Semarang'
      ? 'Kota Semarang menjadi Pusat Ekonomi yang Maju, Berkeadilan Sosial, Lestari, dan Inklusif.'
      : `Terwujudnya ${seed.region} yang maju, sejahtera, dan terhubung melalui transformasi digital.`,
    missions: [
      'Pemerataan pendidikan & kesejahteraan sosial yang produktif, berkualitas, dan berkepribadian.',
      'Kesehatan masyarakat (pencegahan, pengobatan, rehabilitasi).',
      'Pemenuhan kebutuhan dasar (pangan, sandang, papan) untuk taraf hidup layak.',
      'Perekonomian inklusif berbasis SDM digital & ekonomi kreatif global.',
      'Infrastruktur kota terhubung dengan aksesibilitas & konektivitas berkelanjutan.',
      'Lingkungan kota tangguh & berkelanjutan, termasuk pengendalian banjir dan rob.',
      'Pelayanan publik & tata kelola pemerintahan yang berkualitas, bersih, inklusif berbasis kota cerdas.',
    ],
    mediumTermStrategy: [
      'Pengendalian banjir & rob (normalisasi sungai/drainase dan pembangunan sarpras pengendalian banjir).',
      'SPALD-T (Sistem Pengelolaan Air Limbah Domestik Terpusat).',
      'Penguatan infrastruktur dan layanan pemerintahan digital.',
    ],
    longTermStrategy: [
      'RPJMD 2025–2029 disebut sebagai fondasi menuju “Visi Kota Metropolitan yang Layak Huni, Maju, dan Berkelanjutan di Tahun 2045.”',
    ],
    contacts: [
      { name: seed.pic, role: 'Pelanggan', position: 'Kepala Bidang TIK', phone: `0812-1000-${suffix}` },
      { name: contactName, role: 'Pelanggan', position: 'Pranata Komputer Ahli', phone: `0813-2000-${suffix}` },
      { name: 'Account Manager Telkom', role: 'Telkom', position: 'Account Manager', phone: '0812-9000-0101' },
    ],
    ivca: sectionCategories.map((category, categoryIndex) => ({
      category,
      description: [
        'Media Telekomunikasi (FO mobile, backbone, IP).',
        'Kemenkominfo / Diskominfo Provinsi (kebijakan SPBE, interoperabilitas layanan).\nLKPP (aturan pengadaan, e-catalog, tata kelola kontrak).\nBSSN (standar keamanan informasi, insiden siber).',
        'Kebijakan SPBE, arsitektur layanan, standar operasional.',
        'Admin jaringan (Diskominfo/Tim TIK) dan pengembangan kompetensi ASN digital.',
        'Standarisasi perangkat (gateway + AP), interoperabilitas layanan, serta keamanan jaringan.',
        'Perencanaan kebutuhan (RKBMD/RUP), penganggaran, dan tata kelola kontrak.',
        'Desain jaringan: segmentasi VLAN/SSID (pegawai/tamu/IoT).',
        'Sosialisasi “Wi-Fi Area Layanan Publik” (jika ada) melalui kanal resmi.',
        'Monitoring cloud (online/offline, port status, statistik trafik).',
        `Warga Kota ${seed.region} & Pelaku Usaha.`,
        'Smart City/Smart Governance (SPBE, layanan digital terpadu).',
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
      type: contractIndex === 1
        ? 'New Install'
        : (['Modify & Renewal Agreement', 'Resume', 'Suspend', 'Disconnect'] as const)[index % 4],
      serviceCount: contractIndex === 0 ? 2 : 3,
      slg: '99%',
    })),
    innovations: seed.name === 'Pemkot Semarang'
      ? [{ name: 'Simplifikasi Kontrak Terpusat', description: 'Simplifikasi Kontrak Terpusat, untuk Layanan TK-SD-SMP dan Value Added Astinet, plus CPE dan Produk Digital.', status: 'Berjalan' }]
      : [
        { name: 'Portal Layanan Terpadu', description: 'Integrasi akses layanan masyarakat dalam satu portal digital.', status: 'Pilot' },
        { name: 'Command Center Daerah', description: 'Dashboard pemantauan data dan layanan lintas OPD.', status: 'Perencanaan' },
      ],
    walletSpend: seed.name === 'Pemkot Semarang'
      ? [
        { product: 'Astinet Fit', amount: 3214380180, institution: 'Disdik Pemkot Semarang' },
        { product: 'HSI Pijar', amount: 796025400, institution: 'Disdik Pemkot Semarang' },
        { product: 'Astinet Fit plus HSI', amount: 4127608260, institution: 'Disdik Pemkot Semarang' },
      ]
      : [
        { product: 'Belanja Internet Paket 1', amount: 888000000 + index * 25000000, institution: `Dinas Kominfo ${seed.region}` },
        { product: 'Pengadaan Perangkat Jaringan', amount: 425000000 + index * 12000000, institution: `Pemerintah ${seed.region}` },
      ],
    opportunities: [
      { projectId: `LOP-${suffix}-2026-01`, projectCategory: 'Connectivity', process: 'F3 - Negosiasi', offer: 1850000000 + index * 35000000, category: 'New Business' },
      { projectId: `LOP-${suffix}-2026-02`, projectCategory: 'Digital Solution', process: 'F1 - Inisiasi', offer: 620000000 + index * 15000000, category: 'Upsell' },
    ],
    documents: [
      { name: '', type: 'Akta Pendirian dan Perubahan', updatedAt: '-' },
      { name: '', type: 'Nomor Wajib Pajak (NPWP)', updatedAt: '-' },
      { name: '', type: 'e-KTP Direksi Perusahaan', updatedAt: '-' },
      { name: '', type: 'Surat Izin Usaha Perdagangan (SIUP)', updatedAt: '-' },
      { name: '', type: 'Pernyataan Bahwa Data Perusahaan Valid', updatedAt: '-' },
      { name: '', type: 'Pernyataan Perusahaan Tidak Masuk Blacklist', updatedAt: '-' },
      { name: '', type: 'Hasil Direct Visit Customer', updatedAt: '-' },
    ],
    complaints: [
      { date: '26/02/2026', issue: 'MRTG dari HSI tidak ada', channel: 'Engineer on Site', status: 'Selesai', resolvedDate: '26/02/2026', solution: 'Pemeriksaan dan pemulihan monitoring MRTG.' },
      { date: '03/03/2026', issue: 'Permintaan penambahan kapasitas bandwidth.', channel: 'Account Manager', status: 'Dalam Proses', resolvedDate: '', solution: 'Kajian kebutuhan dan penjadwalan peningkatan kapasitas.' },
    ],
    benchmarks: ['SLA layanan inti terjaga di atas 99%.', 'Tersedia pemantauan jaringan dan eskalasi gangguan terpusat.', 'Peluang integrasi layanan digital lintas OPD telah diidentifikasi.'],
    revenueSummary: seed.name === 'Pemkot Semarang'
      ? [
        { label: 'Revenue Shared Telkom · Periode September 2026', amount: 0 },
        { label: 'Revenue Shared Telkom · Periode September 2025', amount: 0 },
        { label: 'Revenue Growth · September 2026', amount: 0 },
      ]
      : [
        { label: 'Revenue Shared Telkom · Periode September 2026', amount: 1250000000 + index * 85000000 },
        { label: 'Revenue Shared Telkom · Periode September 2025', amount: 1100000000 + index * 73000000 },
        { label: 'Revenue Growth', amount: 12 },
      ],
    organizationChart: '',
    institutionProducts: [
      { name: 'Astinet Fit', status: 'Aktif' },
      { name: 'Indibiz', status: 'Aktif' },
      { name: 'Pijar', status: 'Aktif' },
      { name: 'Netmonk', status: 'Aktif' },
      { name: 'Managed CPE', status: 'Aktif' },
    ],
    marketAnalysis: {
      comparator: 'ISP non-Telkom (fiber lokal/regional/nasional) sering agresif harga dan fleksibel last-mile.\nIntegrator/kontraktor TIK lokal kuat di pemasangan perangkat.\nVendor Wi-Fi/network lain mendorong harga perangkat murah.',
      challenges: 'Price pressure: lelang cenderung mendorong harga.\nSLA vs sumber gangguan: downtime bisa berasal dari listrik/perangkat lokal.\nMulti-lokasi: perlu template desain, standar konfigurasi, dan checklist instalasi.\nKeamanan & segmentasi: Wi-Fi publik/guest memerlukan isolasi dan pembatasan bandwidth.\nDokumen pengadaan harus netral dan sesuai kebutuhan.\nIntegrasi internal Pemkot membutuhkan PIC dan mekanisme eskalasi yang jelas.',
      customer: `${seed.name} merupakan akun pemerintah strategis multi-lokasi yang menuntut konektivitas stabil, aman, dan mudah dimonitor untuk SPBE & layanan publik. Telkom unggul bila membawa solusi end-to-end (connectivity + perangkat + managed service) yang audit-ready.`,
    },
    benchmarkPractices: [
      {
        institution: `DINAS PENDIDIKAN ${seed.region.toLocaleUpperCase('id-ID')}`,
        description: `Dinas Pendidikan ${seed.region} mengelola, mengawasi, dan membina sektor pendidikan di wilayah ${seed.region}.`,
        logo: '',
      },
    ],
    towsAnalysis: {
      opportunity: 'Program SPBE/Smart City mendorong peningkatan jaringan, keamanan, dan monitoring layanan digital di pemerintah daerah.',
      threats: 'Ancaman insiden siber pada jaringan pemerintah (Wi-Fi publik, phishing, malware) dapat merusak reputasi dan layanan.',
      strength: 'End-to-end capability: connectivity + instalasi + managed service + pelaporan SLA.',
      weakness: 'Persepsi harga premium dibanding provider lokal.\nLead time pengadaan/aktivasi bisa panjang.',
      strategySO: 'Tawarkan paket Managed Connectivity + Managed Wi-Fi berbasis cloud (monitoring, alert, dan laporan SLA).',
      strategyST: 'Lawan price war dengan value-based proposal: SLA terukur, MTTR, laporan downtime, dan dukungan.',
      strategyWO: 'Pecah penawaran jadi modular (Base / Standard / Premium) agar Pemda bisa memilih sesuai anggaran.',
      strategyWT: 'Pastikan kontrak jelas: scope, deliverable, acceptance, dan batas tanggung jawab (power/UPS).',
    },
    visits: [
      { date: '24/02/2026', objective: 'Anwijzing dan Pitching Layanan Internet SD-SMP', notes: '' },
    ],
    revenueProducts: [
      { name: 'Non POTS', revenue: 0, subsidiary: seed.name.toLocaleUpperCase('id-ID') },
      { name: 'POTS', revenue: 0, subsidiary: seed.name.toLocaleUpperCase('id-ID') },
    ],
    walletSummary: { walletNonTelkom: 'Rp8.138.013.840', walletTelkom: 'Rp0', walletShare: '0%' },
    financialPerformance: 'Growth dengan Kontribusi Rev 8.14 M dengan Profitability Layak',
  }
})

export function getCustomerProfile(name?: string): CustomerProfile {
  return CUSTOMER_PROFILES.find((profile) => profile.name === name) ?? CUSTOMER_PROFILES[0]
}
