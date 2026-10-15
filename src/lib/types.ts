/**
 * types.ts — Seluruh TypeScript interfaces untuk Dashboard B2G Telkom
 * 12 entitas database sesuai ERD Tahap 2
 */

// ═══════════════════════════════════════════════════════════════
// ENUMS & UNION TYPES
// ═══════════════════════════════════════════════════════════════

export type TipeInstansi = 'pemkot' | 'pemkab' | 'provinsi' | 'polda'
export type StatusInstansi = 'aktif' | 'prospek' | 'tidak_aktif'

export type MetodePengadaan = 'e-katalog' | 'tender_lelang' | 'penunjukan_langsung'
export type StatusSirup = 'belum_diproses' | 'sudah_jadi_lop' | 'tidak_relevan'
export type SumberData = 'manual' | 'csv_import'

export type StatusLOP = 'in_progress' | 'F5' | 'Loss' | 'Cancel'
export type TahapPipeline = 'F0' | 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'Loss' | 'Cancel'
export type KategoriKontrak = 'on_channel' | 'gtma' | 'ngtma'
export type SkemaToP = 'bulanan' | 'termin_2x' | 'termin_3x' | 'termin_6x' | 'otc'

export type JenisLayanan =
  | 'HSI' | 'WiFi' | 'Astinet' | 'IP Transit' | 'VPN'
  | 'Metro' | 'DDoS' | 'OCA' | 'U-fONE' | 'Pijar'
  | 'Netmonk' | 'CPE'

export type KategoriLayanan = 'on_channel' | 'gtma' | 'ngtma'
export type Penyedia = 'telkom' | 'anak_perusahaan' | 'mitra'

export type JenisDokumen =
  | 'pengajuan_harga' | 'surat_balasan' | 'ba_kesepakatan'
  | 'ba_split' | 'dokumen_p0' | 'dokumen_p1'
  | 'kontrak_mitra' | 'bast_mitra' | 'basto'
export type StatusDokumen = 'belum' | 'sudah' | 'tidak_diperlukan'

export type StatusLegal = 'sirkulir' | 'review_legal' | 'selesai'

export type HasilTender = 'menang' | 'kalah' | 'dibatalkan' | 'proses'

export type StatusAlurMitra = 'draft' | 'signed' | 'aktif'
export type StatusBASTStep = 'belum' | 'proses' | 'selesai'

export type TipeReminder = 'sid_expiry' | 'kontrak_expiry' | 'cek_sirup'
export type UrgencyLevel = 'merah' | 'kuning' | 'hijau'

// ═══════════════════════════════════════════════════════════════
// ENTITY INTERFACES
// ═══════════════════════════════════════════════════════════════

/** 1. Instansi — Master data 13 pelanggan */
export interface Instansi {
  id: string
  nama: string
  tipe: TipeInstansi
  wilayah: string
  alamat: string
  pic_nama: string
  pic_telepon: string
  pic_email: string
  status: StatusInstansi
  catatan: string
  created_at: string
  updated_at: string
}

/** 3. Potensi SiRUP — Data pengadaan dari SiRUP LKPP */
export interface PotensiSirup {
  id: string
  instansi_id: string
  nama_opd: string
  nama_paket: string
  pagu_anggaran: number
  metode_pengadaan: MetodePengadaan
  waktu_pelaksanaan: string
  tahun_anggaran: string
  status: StatusSirup
  flag_des_jan: boolean
  lop_id: string | null
  sumber_data: SumberData
  created_at: string
  updated_at: string
}

/** 4. LOP — List of Project (Tabel inti) */
export interface LOP {
  id: string
  id_lop: string            // Format G26xxxx
  potensi_sirup_id: string | null
  instansi_id: string
  nama_opd: string
  nama_proyek: string
  nilai_proyek: number
  am_id: string
  skema_pengadaan: MetodePengadaan
  saran_skema: string       // Computed
  tanggal_mulai: string
  tanggal_selesai: string
  status: StatusLOP
  tahap_pipeline: TahapPipeline
  kategori_kontrak: KategoriKontrak
  alasan_kalah: string      // Wajib jika status = kalah
  kompetitor_nama: string
  kompetitor_harga: number | null
  top_skema: SkemaToP
  diskon_persen: number      // Max 30
  diskon_layanan: string
  persen_konektivitas: number // Computed
  persen_cpe: number          // Computed
  persen_mitra: number        // Computed
  p0_wajib: boolean           // Computed
  p1_wajib: boolean           // Computed
  catatan: string
  created_at: string
  updated_at: string
}

/** 5. LOP Stage History — Riwayat perubahan pipeline */
export interface LOPStageHistory {
  id: string
  lop_id: string
  dari_tahap: string
  ke_tahap: string
  diubah_oleh: string        // pengguna_id
  catatan: string
  tanggal: string
}

/** 6. Tender Info — Proses submit tender */
export interface TenderInfo {
  id: string
  lop_id: string
  tanggal_submit: string
  tanggal_pengumuman: string
  hasil: HasilTender
  catatan: string
  created_at: string
}

/** 7. Layanan LOP — Detail layanan per proyek (1:N) */
export interface LayananLOP {
  id: string
  lop_id: string
  jenis_layanan: JenisLayanan
  kategori: KategoriLayanan
  nilai: number
  sid: string                 // Service ID, nullable
  penyedia: Penyedia
  nama_mitra: string
  masa_berlaku_mulai: string
  masa_berlaku_selesai: string
  catatan: string
  created_at: string
}

/** 8. Dokumen Proyek — Checklist dokumen per proyek */
export interface DokumenProyek {
  id: string
  lop_id: string
  jenis_dokumen: JenisDokumen
  status: StatusDokumen
  file_nama: string
  file_ukuran: number | null
  file_url: string
  tanggal_upload: string
  diupload_oleh: string
  catatan: string
}

/** 9. Kontrak — Data kontrak per proyek (1:1) */
export interface Kontrak {
  id: string
  lop_id: string
  nomor_kontrak: string
  tanggal_kontrak: string
  tanggal_berakhir: string
  status_legal: StatusLegal
  catatan: string
  created_at: string
}

/** 10. Mitra — Master data mitra/anak perusahaan */
export interface Mitra {
  id: string
  nama: string
  jenis_layanan: string
  pic_nama: string
  pic_telepon: string
  status: 'aktif' | 'tidak_aktif'
  created_at: string
}

/** 11. Alur Mitra — Tracker alur kerja dengan mitra */
export interface AlurMitra {
  id: string
  lop_id: string
  mitra_id: string
  status_kontrak_mitra: StatusAlurMitra
  tanggal_kontrak_mitra: string
  status_bast: StatusBASTStep
  tanggal_bast: string
  status_basto: StatusBASTStep
  tanggal_basto: string
  catatan: string
}

/** 12. Reminder — Pengingat/notifikasi */
export interface Reminder {
  id: string
  tipe: TipeReminder
  referensi_id: string
  lop_id: string
  judul: string
  tanggal_target: string
  urgency: UrgencyLevel       // Computed
  sudah_dibaca: boolean
  created_at: string
}

// ═══════════════════════════════════════════════════════════════
// AUTH STATE
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// PAGE / NAV TYPES
// ═══════════════════════════════════════════════════════════════

export type PageKey =
  | 'analytics'
  | 'contracts'
  | 'services'
  | 'services-catalog'
  | 'customers-db'
  | 'projects-db'
  | 'gtma'
