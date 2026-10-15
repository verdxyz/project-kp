/**
 * constants.ts — Master data, enum labels, dan konfigurasi statis
 */

import type {
  JenisLayanan, KategoriLayanan, JenisDokumen, MetodePengadaan,
  StatusLOP, TahapPipeline, SkemaToP, UrgencyLevel
} from './types'

// ═══════════════════════════════════════════════════════════════
// MASTER INSTANSI (13 Pelanggan)
// ═══════════════════════════════════════════════════════════════

export const MASTER_INSTANSI = [
  { nama: 'Pemkot Salatiga', tipe: 'pemkot' as const, wilayah: 'Salatiga' },
  { nama: 'Pemkab Semarang', tipe: 'pemkab' as const, wilayah: 'Semarang' },
  { nama: 'Pemkot Semarang', tipe: 'pemkot' as const, wilayah: 'Semarang' },
  { nama: 'Pemkab Kendal', tipe: 'pemkab' as const, wilayah: 'Kendal' },
  { nama: 'Pemkab Batang', tipe: 'pemkab' as const, wilayah: 'Batang' },
  { nama: 'Pemkab Pekalongan', tipe: 'pemkab' as const, wilayah: 'Pekalongan' },
  { nama: 'Pemkot Pekalongan', tipe: 'pemkot' as const, wilayah: 'Pekalongan' },
  { nama: 'Pemkab Pemalang', tipe: 'pemkab' as const, wilayah: 'Pemalang' },
  { nama: 'Pemkot Tegal', tipe: 'pemkot' as const, wilayah: 'Tegal' },
  { nama: 'Pemkab Tegal', tipe: 'pemkab' as const, wilayah: 'Tegal' },
  { nama: 'Pemkab Brebes', tipe: 'pemkab' as const, wilayah: 'Brebes' },
  { nama: 'Provinsi Jawa Tengah', tipe: 'provinsi' as const, wilayah: 'Semarang' },
  { nama: 'Polda Jawa Tengah', tipe: 'polda' as const, wilayah: 'Semarang' },
] as const

export const MASTER_INSTANSI_NAMES = MASTER_INSTANSI.map((agency) => agency.nama)

export const MASTER_DINAS = [
  'Dinas Komunikasi dan Informatika (Diskominfo)',
  'Badan Perencanaan Pembangunan Daerah (Bappeda)',
  'Badan Pengelolaan Keuangan dan Aset Daerah (BPKAD)',
  'Badan Pendapatan Daerah (Bapenda)',
  'Dinas Pendidikan dan Kebudayaan',
  'Dinas Kesehatan',
  'Dinas Penanaman Modal dan PTSP',
  'Dinas Kependudukan dan Pencatatan Sipil',
  'Dinas Pekerjaan Umum dan Penataan Ruang (PUPR)',
  'Dinas Perhubungan',
  'Dinas Sosial',
  'Sekretariat Daerah (Setda)',
  'Sekretariat DPRD',
  'Inspektorat Daerah',
  'Satuan Polisi Pamong Praja (Satpol PP)',
  'RSUD / Fasilitas Kesehatan Daerah',
  'Dinas Lainnya',
] as const

export const NGTMA_PRODUCTS = [
  'HSI',
  'VPN',
  'WMS',
  'Astinet',
  'IP Transit',
  'Metro Ethernet',
  'CPE',
  'Lainnya',
] as const

// ═══════════════════════════════════════════════════════════════
// JENIS LAYANAN
// ═══════════════════════════════════════════════════════════════

export const JENIS_LAYANAN_LIST: { value: JenisLayanan; label: string; defaultKategori: KategoriLayanan }[] = [
  { value: 'HSI', label: 'HSI (High Speed Internet)', defaultKategori: 'on_channel' },
  { value: 'WiFi', label: 'WiFi Managed', defaultKategori: 'on_channel' },
  { value: 'Astinet', label: 'Astinet Dedicated', defaultKategori: 'on_channel' },
  { value: 'IP Transit', label: 'IP Transit', defaultKategori: 'on_channel' },
  { value: 'VPN', label: 'VPN MPLS', defaultKategori: 'on_channel' },
  { value: 'Metro', label: 'Metro Ethernet', defaultKategori: 'on_channel' },
  { value: 'DDoS', label: 'DDoS Protection', defaultKategori: 'on_channel' },
  { value: 'OCA', label: 'OCA (Open Cloud Alliance)', defaultKategori: 'on_channel' },
  { value: 'U-fONE', label: 'U-fONE', defaultKategori: 'on_channel' },
  { value: 'Pijar', label: 'Pijar', defaultKategori: 'gtma' },
  { value: 'Netmonk', label: 'Netmonk', defaultKategori: 'gtma' },
  { value: 'CPE', label: 'CPE (Customer Premises Equipment)', defaultKategori: 'gtma' },
]

// ═══════════════════════════════════════════════════════════════
// JENIS DOKUMEN
// ═══════════════════════════════════════════════════════════════

export const JENIS_DOKUMEN_LIST: { value: JenisDokumen; label: string; keterangan: string }[] = [
  { value: 'pengajuan_harga', label: 'Pengajuan Harga', keterangan: 'Surat pengajuan harga ke pelanggan' },
  { value: 'surat_balasan', label: 'Surat Balasan / Negosiasi', keterangan: 'Balasan/negosiasi dari pelanggan' },
  { value: 'ba_kesepakatan', label: 'BA Kesepakatan', keterangan: 'Khusus penunjukan langsung' },
  { value: 'ba_split', label: 'BA Split', keterangan: 'Splitting harga untuk input PSB ke NCX' },
  { value: 'dokumen_p0', label: 'Dokumen P0', keterangan: 'Wajib jika GTMA dan CPE > 60%' },
  { value: 'dokumen_p1', label: 'Dokumen P1', keterangan: 'Wajib jika ada komponen CPE' },
  { value: 'kontrak_mitra', label: 'Kontrak Layanan Mitra', keterangan: 'Kontrak Telkom-Mitra' },
  { value: 'bast_mitra', label: 'BAST Mitra', keterangan: 'Berita Acara Serah Terima dari mitra ke Telkom' },
  { value: 'basto', label: 'BASTO', keterangan: 'Berita Acara Siap Operasi dari Telkom ke instansi' },
]

// ═══════════════════════════════════════════════════════════════
// METODE PENGADAAN
// ═══════════════════════════════════════════════════════════════

export const METODE_PENGADAAN_LIST: { value: MetodePengadaan; label: string }[] = [
  { value: 'e-katalog', label: 'E-Katalog' },
  { value: 'tender_lelang', label: 'Tender / Lelang' },
  { value: 'penunjukan_langsung', label: 'Penunjukan Langsung' },
]

// ═══════════════════════════════════════════════════════════════
// STATUS & TAHAP LABELS
// ═══════════════════════════════════════════════════════════════

export const STATUS_LOP_LABELS: Record<StatusLOP, { label: string; color: string; bg: string; border: string }> = {
  in_progress: { label: 'In Progress', color: '#3b82f6', bg: '#3b82f620', border: '#3b82f640' },
  F5: { label: 'F5 — Berhasil', color: '#10b981', bg: '#10b98120', border: '#10b98140' },
  Loss: { label: 'Loss — Kalah', color: '#ef4444', bg: '#ef444420', border: '#ef444440' },
  Cancel: { label: 'Cancel — Batal', color: '#94a3b8', bg: '#64748b20', border: '#64748b40' },
}

export const TAHAP_PIPELINE_LIST: TahapPipeline[] = ['F0', 'F1', 'F2', 'F3', 'F4', 'F5', 'Loss', 'Cancel']

export const TAHAP_PIPELINE_COLORS: Record<TahapPipeline, string> = {
  F0: '#6366f1',
  F1: '#f59e0b',
  F2: '#3b82f6',
  F3: '#8b5cf6',
  F4: '#06b6d4',
  F5: '#10b981',
  Loss: '#ef4444',
  Cancel: '#94a3b8',
}

// ═══════════════════════════════════════════════════════════════
// SKEMA PEMBAYARAN (ToP)
// ═══════════════════════════════════════════════════════════════

export const SKEMA_TOP_LIST: { value: SkemaToP; label: string; desc: string; icon: string; badge: string }[] = [
  { value: 'bulanan', label: 'Bulanan (Monthly)', desc: 'Pembayaran setiap bulan sesuai tagihan. Cocok untuk layanan recurring.', icon: '📅', badge: 'Paling Umum' },
  { value: 'termin_2x', label: 'Termin 2x', desc: 'Pembayaran 2 kali berdasarkan progress pengerjaan.', icon: '🏗️', badge: 'Proyek Menengah' },
  { value: 'termin_3x', label: 'Termin 3x', desc: 'Pembayaran 3 kali sesuai milestone proyek.', icon: '🏗️', badge: 'Proyek Besar' },
  { value: 'termin_6x', label: 'Termin 6x', desc: 'Pembayaran 6 kali untuk proyek jangka panjang.', icon: '🏗️', badge: 'Multi-Year' },
  { value: 'otc', label: 'OTC (One Time Charge)', desc: 'Pembayaran satu kali untuk pengadaan perangkat/hardware.', icon: '💳', badge: 'Hardware/CPE' },
]

// ═══════════════════════════════════════════════════════════════
// URGENCY COLORS
// ═══════════════════════════════════════════════════════════════

export const URGENCY_COLORS: Record<UrgencyLevel, { label: string; color: string; bg: string; border: string }> = {
  merah: { label: '< 30 hari', color: '#ef4444', bg: '#ef444420', border: '#ef444440' },
  kuning: { label: '30-60 hari', color: '#f59e0b', bg: '#f59e0b20', border: '#f59e0b40' },
  hijau: { label: '> 60 hari', color: '#10b981', bg: '#10b98120', border: '#10b98140' },
}

// ═══════════════════════════════════════════════════════════════
// ROLE LABELS
// ═══════════════════════════════════════════════════════════════

export const ROLE_LABELS = {
  admin: { label: 'Administrator', color: '#ef4444' },
  am: { label: 'Account Manager', color: '#3b82f6' },
  viewer: { label: 'Viewer / Manajemen', color: '#10b981' },
}

// ═══════════════════════════════════════════════════════════════
// BUSINESS RULE CONSTANTS
// ═══════════════════════════════════════════════════════════════

/** Batas nilai proyek untuk saran metode pengadaan */
export const BATAS_PENGADAAN_LANGSUNG = 200_000_000

/** Batas maksimal diskon Telkom */
export const MAX_DISKON_PERSEN = 30

/** Batas CPE untuk P0 wajib */
export const BATAS_CPE_P0 = 60

/** Batas hari untuk urgency reminder */
export const BATAS_HARI_MERAH = 30
export const BATAS_HARI_KUNING = 60
