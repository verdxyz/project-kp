import React, { useState, useMemo, useEffect } from 'react'
import {
  BarChart3,
  Filter,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  FolderOpen,
  DollarSign,
  Eye,
  FileSpreadsheet,
  Layers,
  Wifi,
  User,
  Building2,
  Calendar,
  X,
  ChevronRight,
  Percent,
  Activity,
  FileText,
  Download,
  Check,
  ChevronDown,
  Search,
} from 'lucide-react'
import { cn, formatIDR, abbreviateIDR } from '../lib/utils'
import { ProjectsDB, type ProjectEntry } from '../lib/db'
import { MASTER_INSTANSI_NAMES } from '../lib/constants'
import { ProjectDocumentsModal } from './ProjectDatabase'
import { getProjectDocumentLabel, ProjectDocuments, type ProjectDocument } from '../lib/projectDocuments'
import { ServicePoints, type AgencyPivotRow } from '../lib/servicePoints'
import { ProjectSummaryTable } from './ProjectSummaryTable'

// Normalized Project interface
export interface UnifiedProject {
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
  procurementMethod: string
  stage: ProjectEntry['stage']
  progress: number
  startDate: string
  endDate: string
  pic: string
  category: ProjectEntry['category']
  serviceType: string
  totalCapacityMbps: number | null
  sid: string | null
  subsidiaryName?: string | null
  dinasName?: string | null
  status: ProjectEntry['status']
  notes?: string
}

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; desc: string }> = {
  F0: { label: 'F0 — Inisiasi & Kebutuhan', color: '#818cf8', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', desc: 'Identifikasi potensi kebutuhan pemda & penangkapan SiRUP' },
  F1: { label: 'F1 — Pengajuan Penawaran', color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/30', desc: 'Penyusunan proposal harga, BoM, dan spesifikasi teknis' },
  F2: { label: 'F2 — Proses Tender / Katalog', color: '#3b82f6', bg: 'bg-blue-500/10', border: 'border-blue-500/30', desc: 'Submit e-Katalog LKPP / negosiasi teknis & harga' },
  F3: { label: 'F3 — Penetapan & Kontrak', color: '#a855f7', bg: 'bg-purple-500/10', border: 'border-purple-500/30', desc: 'Penerbitan SPPBJ, SPK, dan penandatanganan kontrak' },
  F4: { label: 'F4 — Implementasi', color: '#06b6d4', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', desc: 'Implementasi layanan dan penyelesaian pekerjaan' },
  F5: { label: 'F5 — Berhasil', color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', desc: 'Proyek berhasil, aktivasi layanan, dan BASTO' },
  Loss: { label: 'Loss — Kalah', color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/30', desc: 'Proyek kalah dalam proses pengadaan' },
  Cancel: { label: 'Cancel — Batal', color: '#94a3b8', bg: 'bg-slate-500/10', border: 'border-slate-500/30', desc: 'Proyek dibatalkan' },
}

const STAGE_OPTIONS = [
  { value: 'ALL', label: 'Semua Tahap' },
  { value: 'F0', label: 'F0 (Inisiasi)' },
  { value: 'F1', label: 'F1 (Penawaran)' },
  { value: 'F2', label: 'F2 (Tender/Katalog)' },
  { value: 'F3', label: 'F3 (Kontrak)' },
  { value: 'F4', label: 'F4 (Implementasi)' },
  { value: 'F5', label: 'F5 (Berhasil)' },
  { value: 'Loss', label: 'Loss (Kalah)' },
  { value: 'Cancel', label: 'Cancel (Batal)' },
]

export function AnalyticsReports() {
  const [allProjects, setAllProjects] = useState<UnifiedProject[]>([])
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [agencyPivot, setAgencyPivot] = useState<AgencyPivotRow[]>([])
  const [pivotLoading, setPivotLoading] = useState(true)
  const [pivotError, setPivotError] = useState('')

  useEffect(() => {
    ProjectsDB.getAll()
      .then((projects) => setAllProjects(projects))
      .catch((error: unknown) => setLoadError(error instanceof Error ? error.message : 'Gagal memuat data proyek.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let active = true
    setPivotLoading(true)
    ServicePoints.getPivot()
      .then((rows) => {
        if (!active) return
        setAgencyPivot(rows)
        setPivotError('')
      })
      .catch((error: unknown) => {
        if (!active) return
        setPivotError(error instanceof Error ? error.message : 'Gagal memuat ringkasan pivot per instansi.')
      })
      .finally(() => {
        if (active) setPivotLoading(false)
      })
    return () => { active = false }
  }, [])

  // Pivot Agency Multi-Select Filter States
  const [selectedPivotAgencies, setSelectedPivotAgencies] = useState<string[]>([])
  const [isAgencyDropdownOpen, setIsAgencyDropdownOpen] = useState(false)
  const [pivotAgencySearch, setPivotAgencySearch] = useState('')

  const togglePivotAgency = (name: string) => {
    setSelectedPivotAgencies((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    )
  }

  const displayedPivot = useMemo(() => {
    if (selectedPivotAgencies.length === 0) return agencyPivot
    return agencyPivot.filter((item) => selectedPivotAgencies.includes(item.agencyName))
  }, [agencyPivot, selectedPivotAgencies])

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStage, setSelectedStage] = useState('ALL')
  const [selectedAgency, setSelectedAgency] = useState('Semua Instansi')
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ProjectEntry['category']>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | ProjectEntry['status']>('ALL')

  // Selected project for Detail Modal
  const [detailProject, setDetailProject] = useState<UnifiedProject | null>(null)
  const [documentsFor, setDocumentsFor] = useState<{ idLOP: string; category: ProjectEntry['category'] } | null>(null)

  // Filter Logic
  const filteredProjects = useMemo(() => {
    return allProjects.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = p.projectName.toLowerCase().includes(q)
        const matchAgency = p.agency.toLowerCase().includes(q)
        const matchPic = p.pic.toLowerCase().includes(q)
        const matchLOP = p.idLOP.toLowerCase().includes(q)
        const matchService = p.serviceType.toLowerCase().includes(q)
        if (!matchName && !matchAgency && !matchPic && !matchLOP && !matchService) return false
      }

      // Stage
      if (selectedStage !== 'ALL' && p.stage !== selectedStage) return false

      if (selectedAgency !== 'Semua Instansi' && p.agency !== selectedAgency) return false

      // Category
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false

      // Status
      if (selectedStatus !== 'ALL' && p.status !== selectedStatus) return false

      return true
    })
  }, [allProjects, searchQuery, selectedStage, selectedAgency, selectedCategory, selectedStatus])

  // Computed summary metrics based on filtered set
  const totalValue = filteredProjects.reduce((sum, p) => sum + p.budget, 0)
  const avgProgress = filteredProjects.length > 0
    ? Math.round(filteredProjects.reduce((sum, p) => sum + p.progress, 0) / filteredProjects.length)
    : 0
  const winCount = filteredProjects.filter((p) => p.stage === 'F5').length
  const lossCount = filteredProjects.filter((p) => p.stage === 'Loss').length
  const winRate = winCount + lossCount > 0 ? Math.round((winCount / (winCount + lossCount)) * 100) : 0
  const atRiskCount = filteredProjects.filter((p) => p.status === 'At Risk').length

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedStage('ALL')
    setSelectedAgency('Semua Instansi')
    setSelectedCategory('ALL')
    setSelectedStatus('ALL')
  }

  const handleSummaryProjectOpen = (idLOP: string) => {
    const project = allProjects.find((item) => item.idLOP === idLOP)
    if (project) setDetailProject(project)
  }

  const handleExportExcel = async () => {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()

    // ── SHEET 1: Data Pipeline Proyek ──
    const projectHeader = [
      'No',
      'ID LOP',
      'Nama Proyek',
      'Instansi',
      'Tipe Instansi',
      'Wilayah',
      'Kategori',
      'Jenis Layanan',
      'Tahap',
      'Progres (%)',
      'Pagu Anggaran (IDR)',
      'Status Proyek',
      'PIC Telkom / Dinas',
      'Tanggal Mulai',
      'Target Selesai',
      'SID',
      'Anak Perusahaan',
      'Catatan',
    ]

    const projectDataRows = filteredProjects.map((p, idx) => [
      idx + 1,
      p.idLOP,
      p.projectName,
      p.agency,
      p.agencyType,
      p.region,
      p.category,
      p.serviceType,
      p.stage,
      p.progress / 100, // formatting as percentage in excel
      p.budget,
      p.status,
      p.pic,
      p.startDate || '-',
      p.endDate || '-',
      p.sid || '-',
      p.subsidiaryName || '-',
      p.notes || '-',
    ])

    const wsProjects = XLSX.utils.aoa_to_sheet([
      ['PT TELKOM INDONESIA (PERSERO) Tbk - WITEL JATENG UTARA'],
      ['LAPORAN PIPELINE PENGADAAN B2G (GOVERNMENT ENTERPRISE)'],
      [`Tanggal Unduh: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })} | Total Data: ${filteredProjects.length} Proyek`],
      [], // Empty row
      projectHeader,
      ...projectDataRows,
    ])

    // Format column widths for projects
    wsProjects['!cols'] = [
      { wch: 6 },  // No
      { wch: 18 }, // ID LOP
      { wch: 38 }, // Nama Proyek
      { wch: 32 }, // Instansi
      { wch: 14 }, // Tipe Instansi
      { wch: 16 }, // Wilayah
      { wch: 14 }, // Kategori
      { wch: 20 }, // Layanan
      { wch: 10 }, // Tahap
      { wch: 14 }, // Progres
      { wch: 22 }, // Anggaran
      { wch: 14 }, // Status
      { wch: 22 }, // PIC
      { wch: 15 }, // Tgl Mulai
      { wch: 15 }, // Tgl Selesai
      { wch: 18 }, // SID
      { wch: 20 }, // Anak Perusahaan
      { wch: 30 }, // Catatan
    ]

    // ── SHEET 2: Pivot Summary Instansi ──
    const pivotHeader = [
      'No',
      'Instansi Pemerintahan',
      'Tipe Instansi',
      'Wilayah',
      'Total Titik Layanan (SID)',
      'Total Bandwidth (Mbps)',
      'Status Layanan',
    ]

    const pivotDataRows = displayedPivot.map((item, idx) => [
      idx + 1,
      item.agencyName,
      item.agencyType,
      item.region,
      item.pointCount,
      item.totalBandwidthMbps,
      item.pointCount > 0 ? 'Aktif Terpasang' : 'Belum Ada Titik',
    ])

    const totalPoints = displayedPivot.reduce((sum, item) => sum + item.pointCount, 0)
    const totalBw = displayedPivot.reduce((sum, item) => sum + item.totalBandwidthMbps, 0)

    const wsPivot = XLSX.utils.aoa_to_sheet([
      ['RINGKASAN PIVOT TITIK LAYANAN & BANDWIDTH PER INSTANSI'],
      [`Filter Aktif: ${selectedPivotAgencies.length > 0 ? selectedPivotAgencies.join(', ') : 'Semua Instansi'}`],
      [`Waktu Generate: ${new Date().toLocaleString('id-ID')}`],
      [], // Empty row
      pivotHeader,
      ...pivotDataRows,
      [], // Empty row before summary
      ['', 'TOTAL KESELURUHAN (FILTERED)', '', '', totalPoints, totalBw, ''],
    ])

    wsPivot['!cols'] = [
      { wch: 6 },  // No
      { wch: 36 }, // Instansi
      { wch: 14 }, // Tipe
      { wch: 18 }, // Wilayah
      { wch: 26 }, // Total Titik
      { wch: 26 }, // Total Bandwidth
      { wch: 18 }, // Status
    ]

    // Append sheets to workbook
    XLSX.utils.book_append_sheet(wb, wsProjects, 'Pipeline Proyek')
    XLSX.utils.book_append_sheet(wb, wsPivot, 'Pivot Titik & Bandwidth')

    // Write file with proper .xlsx format
    const dateStr = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `Laporan_B2G_Telkom_${dateStr}.xlsx`)
  }

  return (
    <div className="space-y-6">
      {loadError && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{loadError}</div>}
      {loading && <div className="text-sm text-slate-400">Memuat laporan proyek...</div>}
      {!loading && <ProjectSummaryTable projects={allProjects} onOpenProject={handleSummaryProjectOpen} />}
      {/* ─── Header & Quick Actions ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Analytics & Laporan Pipeline Pengadaan</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Live Evaluation
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoring progres pekerjaan per tahap (F0–F5), status Loss/Cancel, serta kinerja proyek instansi pemerintah.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-600 text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <FileSpreadsheet size={15} className="text-white" />
            <span>Export Laporan Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* ─── PIVOT SUMMARY PER INSTANSI (REVISI 3) ─── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xl p-5 sm:p-6 overflow-hidden">
        <header className="flex flex-col gap-3 pb-4 border-b border-slate-200 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <h3 className="text-base font-bold text-slate-900">Pivot Summary: Titik Layanan & Bandwidth per Instansi</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Menampilkan total akumulasi bandwidth (Mbps) dan jumlah titik layanan (SID) per instansi pemerintah daerah.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Menampilkan {displayedPivot.length} dari {agencyPivot.length} Instansi
            </span>
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold text-emerald-700 transition-colors cursor-pointer"
              title="Unduh seluruh data & pivot ke file Excel (.xlsx)"
            >
              <Download size={13} />
              <span>Unduh Excel</span>
            </button>
          </div>
        </header>

        {/* ─── INSTANSI MULTI-SELECT FILTER BAR ─── */}
        <div className="pt-4 pb-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Filter Dropdown Popover Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAgencyDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-800 transition-colors shadow-sm cursor-pointer"
                id="btn-filter-instansi-pivot"
              >
                <Filter size={14} className="text-blue-600" />
                <span>
                  {selectedPivotAgencies.length === 0
                    ? 'Pilih Instansi (Semua Ditampilkan)'
                    : `Filter: ${selectedPivotAgencies.length} Instansi Dipilih`}
                </span>
                <ChevronDown size={14} className={cn("text-slate-400 transition-transform", isAgencyDropdownOpen && "rotate-180")} />
              </button>

              {/* Popover Card */}
              {isAgencyDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsAgencyDropdownOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3.5 z-30 space-y-2.5 text-xs animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="font-bold text-slate-800">Filter Instansi Pemerintahan</span>
                      <button
                        type="button"
                        onClick={() => setIsAgencyDropdownOpen(false)}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Search box inside popover */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Cari instansi (misal: Salatiga)..."
                        value={pivotAgencySearch}
                        onChange={(e) => setPivotAgencySearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500"
                      />
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    {/* Quick Action buttons */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedPivotAgencies(MASTER_INSTANSI_NAMES as unknown as string[])}
                        className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                      >
                        Pilih Semua ({MASTER_INSTANSI_NAMES.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPivotAgencies([])}
                        className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                      >
                        Tampilkan Semua (Reset)
                      </button>
                    </div>

                    {/* Checkbox List */}
                    <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                      {MASTER_INSTANSI_NAMES
                        .filter((name) => name.toLowerCase().includes(pivotAgencySearch.toLowerCase()))
                        .map((name) => {
                          const isSelected = selectedPivotAgencies.includes(name)
                          const isPemkot = name.startsWith('Pemkot')
                          return (
                            <label
                              key={name}
                              className={cn(
                                "flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors select-none",
                                isSelected ? "bg-blue-50/90 text-blue-900 font-semibold" : "hover:bg-slate-50 text-slate-700"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                    isSelected
                                      ? "bg-blue-600 border-blue-600 text-white"
                                      : "border-slate-300 bg-white"
                                  )}
                                >
                                  {isSelected && <Check size={11} strokeWidth={3} />}
                                </div>
                                <span className="text-xs">{name}</span>
                              </div>
                              <span className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase",
                                isPemkot ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                              )}>
                                {isPemkot ? 'Kota' : 'Kab'}
                              </span>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => togglePivotAgency(name)}
                                className="sr-only"
                              />
                            </label>
                          )
                        })}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {selectedPivotAgencies.length > 0 ? `${selectedPivotAgencies.length} instansi dipilih` : 'Semua instansi aktif'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAgencyDropdownOpen(false)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                      >
                        Terapkan
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-medium mr-1 text-[11px]">Filter Cepat:</span>
              <button
                type="button"
                onClick={() => setSelectedPivotAgencies([])}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer",
                  selectedPivotAgencies.length === 0
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                )}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setSelectedPivotAgencies(MASTER_INSTANSI_NAMES.filter((n) => n.startsWith('Pemkot')) as unknown as string[])}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer",
                  selectedPivotAgencies.length > 0 && selectedPivotAgencies.every((n) => n.startsWith('Pemkot'))
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                )}
              >
                Hanya Pemkot
              </button>
              <button
                type="button"
                onClick={() => setSelectedPivotAgencies(MASTER_INSTANSI_NAMES.filter((n) => n.startsWith('Pemkab')) as unknown as string[])}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer",
                  selectedPivotAgencies.length > 0 && selectedPivotAgencies.every((n) => n.startsWith('Pemkab'))
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                )}
              >
                Hanya Pemkab
              </button>
            </div>
          </div>

          {/* Active Filter Chips / Pills */}
          {selectedPivotAgencies.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500 font-medium">Instansi Terpilih ({selectedPivotAgencies.length}):</span>
              {selectedPivotAgencies.map((agency) => (
                <span
                  key={agency}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium"
                >
                  {agency}
                  <button
                    type="button"
                    onClick={() => togglePivotAgency(agency)}
                    className="hover:text-blue-900 cursor-pointer rounded-full hover:bg-blue-200/60 p-0.5"
                    title={`Hapus ${agency}`}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => setSelectedPivotAgencies([])}
                className="text-[11px] text-red-500 hover:text-red-700 font-semibold ml-1 cursor-pointer"
              >
                Reset Semua
              </button>
            </div>
          )}
        </div>

        {pivotError && (
          <p role="alert" className="mt-2 p-3 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs">
            {pivotError}
          </p>
        )}

        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-100 text-[11px] uppercase tracking-wider text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Instansi Pemerintahan</th>
                <th className="px-5 py-3.5">Tipe Instansi</th>
                <th className="px-5 py-3.5">Wilayah</th>
                <th className="px-5 py-3.5 text-right">Total Titik Layanan</th>
                <th className="px-5 py-3.5 text-right">Total Bandwidth (Mbps)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {pivotLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500 font-medium">
                    Memuat ringkasan titik & kapasitas layanan per instansi...
                  </td>
                </tr>
              ) : displayedPivot.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    <p className="font-semibold text-slate-700">Tidak ada instansi yang dipilih</p>
                    <p className="text-xs text-slate-400 mt-1">Gunakan filter instansi di atas atau klik "Tampilkan Semua"</p>
                    <button
                      type="button"
                      onClick={() => setSelectedPivotAgencies([])}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 font-semibold hover:bg-blue-100 cursor-pointer"
                    >
                      Tampilkan Semua Instansi
                    </button>
                  </td>
                </tr>
              ) : (
                displayedPivot.map((item) => {
                  const isPemkot = item.agencyName.startsWith('Pemkot')
                  const isPemkab = item.agencyName.startsWith('Pemkab')
                  return (
                    <tr key={item.agencyName} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {item.agencyName}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${
                            isPemkot
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : isPemkab
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {item.agencyType}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{item.region}</td>
                      <td className="px-5 py-3.5 text-right tabular-nums font-semibold text-slate-800">
                        {item.pointCount.toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums font-bold text-blue-700">
                        {item.totalBandwidthMbps > 0
                          ? `${item.totalBandwidthMbps.toLocaleString('id-ID', { maximumFractionDigits: 3 })} Mbps`
                          : '0 Mbps'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-900">
              <tr>
                <td colSpan={3} className="px-5 py-3.5 text-right font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Total ({displayedPivot.length} Instansi)
                </td>
                <td className="px-5 py-3.5 text-right tabular-nums text-sm font-extrabold text-slate-900">
                  {pivotLoading ? '—' : displayedPivot.reduce((sum, r) => sum + r.pointCount, 0).toLocaleString('id-ID')}
                </td>
                <td className="px-5 py-3.5 text-right tabular-nums text-sm font-extrabold text-blue-800">
                  {pivotLoading ? '—' : `${displayedPivot.reduce((sum, r) => sum + r.totalBandwidthMbps, 0).toLocaleString('id-ID', { maximumFractionDigits: 3 })} Mbps`}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* ─── Metric Highlight Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Anggaran */}
        <div className="card bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Akumulasi Nilai Proyek</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-white">{abbreviateIDR(totalValue)}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Dari <strong className="text-slate-300">{filteredProjects.length}</strong> proyek terpilih
          </p>
        </div>

        {/* Card 2: Rata-rata Progres */}
        <div className="card bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Rata-rata Progres</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Activity size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-extrabold text-white">{avgProgress}%</p>
            <span className="text-[11px] text-slate-400">tahapan selesai</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2.5 overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${avgProgress}%` }} />
          </div>
        </div>

        {/* Card 3: Win Rate */}
        <div className="card bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Tender Win Rate</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-white">{winRate}%</p>
          <p className="text-[11px] text-slate-500 mt-1">
            <span className="text-emerald-400 font-bold">{winCount} Menang</span> • <span className="text-red-400 font-bold">{lossCount} Kalah</span>
          </p>
        </div>

        {/* Card 4: Proyek At-Risk */}
        <div className="card bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Proyek Berisiko</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <AlertTriangle size={16} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-red-400">{atRiskCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Perlu mitigasi diskon & P0/P1</p>
        </div>
      </div>

      {/* ─── FILTER CONTROL BAR ─── */}
      <div className="card bg-slate-900/90 border-slate-800 p-4 space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Filter size={14} className="text-blue-400" />
            <span>Filter & Penelusuran Laporan</span>
          </div>

          {(searchQuery || selectedStage !== 'ALL' || selectedAgency !== 'Semua Instansi' || selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Reset Semua Filter</span>
            </button>
          )}
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* 1. Search Box */}
          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari proyek, instansi, PIC..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* 2. Stage Filter */}
          <div>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
            >
              {STAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Customer Agency Filter */}
          <div>
            <select
              value={selectedAgency}
              onChange={(e) => setSelectedAgency(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Semua Instansi">Semua Instansi</option>
              {MASTER_INSTANSI_NAMES.map((agency) => (
                <option key={agency} value={agency}>
                  {agency}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="On Channel">Own Channel (Konektivitas)</option>
              <option value="GTMA">GTMA (CPE / Third-Party)</option>
              <option value="NGTMA">NGTMA</option>
            </select>
          </div>

          {/* 5. Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Semua Status Risiko</option>
              <option value="Active">Active (Berjalan Normal)</option>
              <option value="At Risk">At Risk (Perhatian Khusus)</option>
              <option value="Completed">Completed (Selesai)</option>
              <option value="Lost">Lost (Kalah)</option>
              <option value="Cancelled">Cancelled (Batal)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── MAIN REPORT & PROGRESS TABLE ─── */}
      <div className="card bg-slate-900/90 border-slate-800 p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Daftar Proyek & Evaluasi Progres</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
              Menampilkan {filteredProjects.length} dari {allProjects.length} data
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px]">
                <th className="px-4 py-3">ID LOP & Nama Proyek</th>
                <th className="px-4 py-3">Instansi & Wilayah</th>
                <th className="px-4 py-3">Nilai Anggaran</th>
                <th className="px-4 py-3">Tahapan (Funnel)</th>
                <th className="px-4 py-3 w-40">Progres Pengerjaan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">Memuat proyek...</td></tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <FolderOpen size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Tidak ada proyek yang sesuai dengan kriteria filter.</p>
                    <button
                      onClick={handleResetFilters}
                      className="mt-2 text-xs text-blue-400 hover:underline inline-block"
                    >
                      Reset filter
                    </button>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => {
                  const stageMeta = STAGE_CONFIG[p.stage] || STAGE_CONFIG['F0']
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Project Name & ID */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {p.projectName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                          <button type="button" onClick={() => setDocumentsFor({ idLOP: p.idLOP, category: p.category })} className="text-blue-400 hover:text-blue-300">
                            {p.idLOP}
                          </button>
                          <span>•</span>
                          <span className="text-slate-500">{p.serviceType}</span>
                        </div>
                      </td>

                      {/* Agency & Region */}
                      <td className="px-4 py-3.5">
                        <div className="text-slate-200 font-medium">{p.agency}</div>
                        <div className="text-[11px] text-slate-500">{p.region}</div>
                      </td>

                      {/* Budget (formatIDR with proper Rp space) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-emerald-400">{formatIDR(p.budget)}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">{p.category}</div>
                      </td>

                      {/* Stage Badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${stageMeta.bg} ${stageMeta.border}`}
                          style={{ color: stageMeta.color }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: stageMeta.color }}
                          />
                          {p.stage}
                        </span>
                      </td>

                      {/* Progress Bar & Value */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-semibold text-white">{p.progress}%</span>
                          <span className="text-slate-500 text-[10px]">
                            {p.stage === 'Loss' ? 'Kalah' : p.stage === 'Cancel' ? 'Batal' : p.progress === 100 ? 'Selesai' : 'In Progress'}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-300',
                              p.stage === 'Loss'
                                ? 'bg-red-500'
                                : p.stage === 'Cancel'
                                ? 'bg-slate-500'
                                : p.progress >= 70
                                ? 'bg-emerald-500'
                                : p.progress >= 40
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                            )}
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded border uppercase',
                            p.status === 'Active'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : p.status === 'At Risk'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : p.status === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          )}
                        >
                          {p.status}
                        </span>
                      </td>

                      {/* Action: Lihat Detail & Progress */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setDetailProject(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-xs font-medium transition-all cursor-pointer shadow-sm"
                        >
                          <Eye size={13} />
                          <span>Detail & Progress</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL: DETAIL & PROGRESS TRACKER ─── */}
      {detailProject && (
        <ProjectDetailModal
          project={detailProject}
          onClose={() => setDetailProject(null)}
        />
      )}
      {documentsFor && (
        <ProjectDocumentsModal
          idLOP={documentsFor.idLOP}
          category={documentsFor.category}
          onClose={() => setDocumentsFor(null)}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PROJECT DETAIL & PROGRESS MODAL COMPONENT
// ─────────────────────────────────────────────────────────────

interface ProjectDetailModalProps {
  project: UnifiedProject
  onClose: () => void
}

function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
  const STAGES_LIST: Extract<ProjectEntry['stage'], `F${number}`>[] = ['F0', 'F1', 'F2', 'F3', 'F4', 'F5']
  const isTerminalFailure = project.stage === 'Loss' || project.stage === 'Cancel'
  const currentStageIndex = isTerminalFailure ? -1 : STAGES_LIST.indexOf(project.stage as typeof STAGES_LIST[number])
  const [documents, setDocuments] = useState<ProjectDocument[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(true)
  const [documentsError, setDocumentsError] = useState('')
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    ProjectDocuments.list(project.idLOP)
      .then((result) => { if (active) setDocuments(result) })
      .catch((error: unknown) => {
        if (active) setDocumentsError(error instanceof Error ? error.message : 'Gagal memuat dokumen proyek.')
      })
      .finally(() => { if (active) setDocumentsLoading(false) })
    return () => { active = false }
  }, [project.idLOP])

  const handleDocumentDownload = async (document: ProjectDocument) => {
    setDownloadingDocumentId(document.id)
    setDocumentsError('')
    try {
      await ProjectDocuments.download(project.idLOP, document.documentType, document.originalName)
    } catch (error) {
      setDocumentsError(error instanceof Error ? error.message : 'Gagal mengunduh dokumen.')
    } finally {
      setDownloadingDocumentId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-blue-400 font-semibold">{project.idLOP}</span>
              <span className={cn(
                'text-[10px] uppercase font-bold px-2 py-0.5 rounded border',
                project.stage === 'F5'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : project.stage === 'Loss'
                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                  : project.stage === 'Cancel'
                  ? 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                  : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              )}>
                {project.stage}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white truncate mt-0.5">{project.projectName}</h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs bg-slate-950/40">

          {/* 1. Funnel Pipeline Step Tracker */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <TrendingUp size={14} className="text-blue-400" />
                Pipeline Stage Progression
              </h4>
              <span className="text-slate-400 font-mono font-bold">{project.progress}% Selesai</span>
            </div>

            {isTerminalFailure ? (
              <div className={cn(
                'p-3 rounded-lg border',
                project.stage === 'Loss'
                  ? 'bg-red-500/10 border-red-500/30 text-red-300'
                  : 'bg-slate-500/10 border-slate-500/30 text-slate-300',
              )}>
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle size={14} /> {project.stage === 'Loss' ? 'Proyek Kalah (Loss)' : 'Proyek Dibatalkan (Cancel)'}
                </p>
                <p className="text-[11px] mt-1 opacity-80">
                  {project.notes || (project.stage === 'Loss' ? 'Proyek kalah dalam proses pengadaan.' : 'Proyek dibatalkan.')}
                </p>
              </div>
            ) : (
              <div className="relative pt-2">
                <div className="grid grid-cols-6 gap-2 text-center">
                  {STAGES_LIST.map((stg, idx) => {
                    const isDone = idx < currentStageIndex || project.stage === 'F5'
                    const isCurrent = idx === currentStageIndex && project.stage !== 'F5'

                    return (
                      <div key={stg} className="flex flex-col items-center">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-all shadow',
                            isDone
                              ? 'bg-emerald-500 text-white'
                              : isCurrent
                              ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 animate-pulse'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          )}
                        >
                          {isDone ? <CheckCircle2 size={15} /> : stg}
                        </div>
                        <span className={cn('text-[10px] font-semibold', isCurrent ? 'text-blue-400' : isDone ? 'text-emerald-400' : 'text-slate-500')}>
                          {stg}
                        </span>
                        <span className="text-[9px] text-slate-500 line-clamp-1">
                          {['Inisiasi', 'Proposal', 'Tender', 'Kontrak', 'Implementasi', 'Berhasil'][idx]}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. Key Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">Instansi Pelanggan</span>
              <span className="text-slate-200 font-semibold mt-0.5 block truncate">{project.pemdaName || project.agency}</span>
              {project.dinasName && <span className="mt-1 block truncate text-[10px] text-slate-400">{project.dinasName}</span>}
              <span className="text-slate-500 text-[10px]">{project.agencyType}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">Nilai Pagu Anggaran</span>
              <span className="text-emerald-400 font-bold text-sm mt-0.5 block">{formatIDR(project.budget)}</span>
              <span className="text-slate-500 text-[10px]">{abbreviateIDR(project.budget)}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">Harga Layanan / Nilai Kontrak</span>
              <span className="text-emerald-400 font-bold text-sm mt-0.5 block">{formatIDR(project.servicePrice)}</span>
              {(project.servicePointTotalPrice ?? 0) > 0 && (
                <span className="mt-0.5 block text-[10px] text-slate-500">
                  Total harga SID: {formatIDR(project.servicePointTotalPrice ?? 0)}
                </span>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">Kategori & Layanan</span>
              <span className="text-slate-200 font-semibold mt-0.5 block truncate">{project.serviceType}</span>
              <span className="text-blue-400 text-[10px]">{project.category}</span>
              {project.subsidiaryName && <span className="mt-1 block truncate text-[10px] text-slate-400">Anak perusahaan: {project.subsidiaryName}</span>}
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">Kapasitas & SID</span>
              <span className="text-slate-200 font-semibold mt-0.5 block">
                {project.totalCapacityMbps === null ? '—' : `${project.totalCapacityMbps} Mbps`}
              </span>
              <span className="text-slate-500 text-[10px]">{project.sid || 'SID belum diisi'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">Metode Pengadaan</span>
              <span className="text-slate-200 font-semibold mt-0.5 block">{project.procurementMethod}</span>
              <span className="text-slate-500 text-[10px]">
                {project.budget <= 200_000_000 ? 'Rekomendasi Penunjukan Langsung' : 'e-Katalog / Lelang Tender'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">Account Manager (PIC)</span>
              <span className="text-slate-200 font-semibold mt-0.5 block truncate">{project.pic}</span>
              <span className="text-slate-500 text-[10px]">Witel Jateng Utara</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">Periode Kontrak</span>
              <span className="text-slate-200 font-semibold mt-0.5 block truncate">
                {project.startDate || '—'} s/d {project.endDate || '—'}
              </span>
              <span className="text-slate-500 text-[10px]">Tahun Anggaran 2024/2026</span>
            </div>
          </div>

          {/* Project documents */}
          <section className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <FileText size={14} className="text-blue-400" />
                Dokumen Proyek
              </h4>
              <span className="text-[10px] text-slate-500">{documents.length} file</span>
            </div>
            {documentsError && <p role="alert" className="text-xs text-red-400">{documentsError}</p>}
            {documentsLoading ? (
              <p className="text-xs text-slate-400">Memuat dokumen...</p>
            ) : documents.length === 0 ? (
              <p className="text-xs text-slate-500">Belum ada dokumen yang diunggah untuk proyek ini.</p>
            ) : (
              <ul className="divide-y divide-slate-800">
                {documents.map((document) => (
                  <li key={document.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-blue-400">
                        {getProjectDocumentLabel(document.documentType, project.category)}
                      </p>
                      <p className="truncate text-xs text-slate-200" title={document.originalName}>{document.originalName}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDocumentDownload(document)}
                      disabled={downloadingDocumentId === document.id}
                      title={`Unduh ${document.originalName}`}
                      aria-label={`Unduh ${document.originalName}`}
                      className="rounded-lg p-2 text-blue-400 hover:bg-blue-500/10 disabled:opacity-50"
                    >
                      <Download size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/70 text-xs">
          <span className="text-slate-400 font-mono">Status: {project.status}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  )
}
