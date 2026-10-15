import React, { useState, useEffect } from 'react'
import {
  Calculator,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Users,
  TrendingDown,
  FileWarning,
  CreditCard,
  Plus,
  Trash2,
  Check,
  FileText,
  Building2,
  DollarSign,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { cn, formatIDR } from '../lib/utils'
import { TOP_OPTIONS, PROJECTS } from '../data/mockData'
import { AuthService } from '../lib/auth'

const MAX_DISCOUNT_PERCENT = 30

export interface DiscountJustification {
  id: string
  projectName: string
  agency: string
  originalPrice: number
  discountPercent: number
  discountAmount: number
  finalPrice: number
  topScheme: string
  status: 'approved' | 'need_gm_approval'
  createdAt: string
  createdBy: string
}

export interface CompetitorEntry {
  id: string
  projectName: string
  competitorName: string
  competitorPrice: number
  telkomPrice: number
  notes: string
  createdAt: string
  createdBy: string
}

const STORAGE_KEY_DISCOUNTS = 'b2g_financial_discounts_list'
const STORAGE_KEY_COMPETITORS = 'b2g_financial_competitors_list'

const DEFAULT_DISCOUNTS: DiscountJustification[] = [
  {
    id: 'DJ-001',
    projectName: 'Pengadaan Layanan Internet Dedicated Pemkot Semarang',
    agency: 'Pemkot Semarang',
    originalPrice: 2_400_000_000,
    discountPercent: 15,
    discountAmount: 360_000_000,
    finalPrice: 2_040_000_000,
    topScheme: 'Bulanan (Monthly)',
    status: 'approved',
    createdAt: '12/03/2024 14:10',
    createdBy: 'Budi Santoso (AM)',
  },
  {
    id: 'DJ-002',
    projectName: 'Pengadaan Perangkat Router & SD-WAN Pemkab Batang',
    agency: 'Pemkab Batang',
    originalPrice: 750_000_000,
    discountPercent: 35,
    discountAmount: 262_500_000,
    finalPrice: 487_500_000,
    topScheme: 'Termin (2x)',
    status: 'need_gm_approval',
    createdAt: '14/03/2024 09:45',
    createdBy: 'Arya Wirawan (Kadiv B2G)',
  },
]

const DEFAULT_COMPETITORS: CompetitorEntry[] = [
  {
    id: 'CMP-001',
    projectName: 'Pengadaan Metro Ethernet Salatiga',
    competitorName: 'Indosat Ooredoo Hutchison',
    competitorPrice: 245_000_000,
    telkomPrice: 280_000_000,
    notes: 'Kompetitor menawarkan harga 12% lebih murah dengan jaminan SLA 99.5% dan bundling WiFi publik.',
    createdAt: '10/03/2024 11:30',
    createdBy: 'Budi Santoso (AM)',
  },
]

export function FinancialModule() {
  const currentUser = AuthService.getCurrentUser()

  // Selected Project for Calculator
  const [selectedProjectId, setSelectedProjectId] = useState(PROJECTS[0]?.id || '')

  // Discount Calculator Input States
  const [originalPrice, setOriginalPrice] = useState(String(PROJECTS[0]?.budget || '2400000000'))
  const [discountPct, setDiscountPct] = useState('10')
  const [topValue, setTopValue] = useState('bulanan')
  const [discountSuccessMessage, setDiscountSuccessMessage] = useState(false)

  // Competitor Form States
  const [compProject, setCompProject] = useState(PROJECTS[0]?.projectName || '')
  const [competitorName, setCompetitorName] = useState('')
  const [competitorPrice, setCompetitorPrice] = useState('')
  const [competitorNotes, setCompetitorNotes] = useState('')
  const [competitorSuccessMessage, setCompetitorSuccessMessage] = useState(false)

  // Persistent Lists
  const [discountsList, setDiscountsList] = useState<DiscountJustification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DISCOUNTS)
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.error(e)
    }
    return DEFAULT_DISCOUNTS
  })

  const [competitorsList, setCompetitorsList] = useState<CompetitorEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMPETITORS)
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.error(e)
    }
    return DEFAULT_COMPETITORS
  })

  // Synchronize with LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DISCOUNTS, JSON.stringify(discountsList))
    } catch (e) {
      console.error(e)
    }
  }, [discountsList])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COMPETITORS, JSON.stringify(competitorsList))
    } catch (e) {
      console.error(e)
    }
  }, [competitorsList])

  // When project changes in dropdown, prefill price
  const handleProjectSelect = (projId: string) => {
    setSelectedProjectId(projId)
    const p = PROJECTS.find((item) => item.id === projId)
    if (p) {
      setOriginalPrice(String(p.budget))
      setCompProject(p.projectName)
    }
  }

  // Live Calculations
  const priceNum = parseFloat(originalPrice.replace(/[^0-9]/g, '')) || 0
  const discNum = parseFloat(discountPct) || 0
  const isDiscountExceeded = discNum > MAX_DISCOUNT_PERCENT
  const discountAmount = Math.round(priceNum * (discNum / 100))
  const finalPrice = Math.round(priceNum - discountAmount)

  const selectedProjObj = PROJECTS.find((p) => p.id === selectedProjectId)
  const topOptionObj = TOP_OPTIONS.find((t) => t.value === topValue)

  // Action: Save Discount Justification
  const handleSaveDiscount = (e: React.FormEvent) => {
    e.preventDefault()
    if (!priceNum || !selectedProjObj) return

    const newJustification: DiscountJustification = {
      id: `DJ-${Date.now().toString().slice(-4)}`,
      projectName: selectedProjObj.projectName,
      agency: selectedProjObj.agency,
      originalPrice: priceNum,
      discountPercent: discNum,
      discountAmount,
      finalPrice,
      topScheme: topOptionObj?.label || 'Bulanan (Monthly)',
      status: isDiscountExceeded ? 'need_gm_approval' : 'approved',
      createdAt: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
      createdBy: currentUser ? `${currentUser.nama} (ADMIN SUPPORT)` : 'Admin Support',
    }

    setDiscountsList([newJustification, ...discountsList])
    setDiscountSuccessMessage(true)
    setTimeout(() => setDiscountSuccessMessage(false), 3500)
  }

  // Action: Save Competitor Entry
  const handleSaveCompetitor = (e: React.FormEvent) => {
    e.preventDefault()
    const compPriceNum = parseFloat(competitorPrice.replace(/[^0-9]/g, '')) || 0
    if (!competitorName.trim() || !compPriceNum) return

    const newEntry: CompetitorEntry = {
      id: `CMP-${Date.now().toString().slice(-4)}`,
      projectName: compProject || selectedProjObj?.projectName || 'Pengadaan Pemda',
      competitorName: competitorName.trim(),
      competitorPrice: compPriceNum,
      telkomPrice: finalPrice > 0 ? finalPrice : priceNum,
      notes: competitorNotes.trim() || 'Evaluasi harga dan keunggulan teknis kompetitor',
      createdAt: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
      createdBy: currentUser ? `${currentUser.nama} (ADMIN SUPPORT)` : 'Admin Support',
    }

    setCompetitorsList([newEntry, ...competitorsList])
    setCompetitorName('')
    setCompetitorPrice('')
    setCompetitorNotes('')
    setCompetitorSuccessMessage(true)
    setTimeout(() => setCompetitorSuccessMessage(false), 3500)
  }

  const handleDeleteDiscount = (id: string) => {
    setDiscountsList(discountsList.filter((d) => d.id !== id))
  }

  const handleDeleteCompetitor = (id: string) => {
    setCompetitorsList(competitorsList.filter((c) => c.id !== id))
  }

  return (
    <div className="space-y-6">
      
      {/* ─── Top 3 Input Columns ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        
        {/* ─── Card 1: Kalkulator Diskon ─── */}
        <div className="card xl:col-span-1 bg-slate-900/90 border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Calculator size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Kalkulator Diskon Proyek</h3>
                <p className="text-xs text-slate-400">Batas diskon standar: {MAX_DISCOUNT_PERCENT}%</p>
              </div>
            </div>

            <form onSubmit={handleSaveDiscount} className="space-y-3.5">
              {/* Project Target */}
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                  Pilih Proyek Pipeline
                </label>
                <div className="relative">
                  <select
                    value={selectedProjectId}
                    onChange={(e) => handleProjectSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {PROJECTS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.agency} — {p.projectName.slice(0, 35)}...
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Original Price */}
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                  Harga Asli / Pagu (IDR)
                </label>
                <div className="flex items-center rounded-lg bg-slate-950 border border-slate-700/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 overflow-hidden transition-all shadow-inner">
                  <span className="px-3.5 py-2 text-xs font-bold text-slate-400 bg-slate-800/90 border-r border-slate-700 select-none">
                    Rp
                  </span>
                  <input
                    type="text"
                    value={priceNum > 0 ? priceNum.toLocaleString('id-ID') : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '')
                      setOriginalPrice(raw)
                    }}
                    placeholder="0"
                    className="w-full bg-transparent px-3 py-2 text-xs font-mono text-white placeholder-slate-500 outline-none"
                  />
                </div>
              </div>

              {/* Discount Percentage */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">Persentase Diskon (%)</label>
                  <span className={cn('text-[11px] font-semibold', isDiscountExceeded ? 'text-red-400' : 'text-emerald-400')}>
                    {isDiscountExceeded ? 'Melebihi Batas 30%' : 'Dalam Batas Wajar'}
                  </span>
                </div>
                <div className={cn(
                  'flex items-center rounded-lg bg-slate-950 border border-slate-700/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 overflow-hidden transition-all shadow-inner',
                  isDiscountExceeded && 'border-red-500 ring-2 ring-red-500/20'
                )}>
                  <input
                    type="number"
                    value={discountPct}
                    onChange={(e) => setDiscountPct(e.target.value)}
                    placeholder="0"
                    min="0"
                    max="100"
                    className="w-full bg-transparent px-3 py-2 text-xs font-mono text-white placeholder-slate-500 outline-none"
                  />
                  <span className="px-3.5 py-2 text-xs font-bold text-slate-400 bg-slate-800/90 border-l border-slate-700 select-none">
                    %
                  </span>
                </div>

                {isDiscountExceeded && (
                  <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-[11px] text-red-300">
                    <AlertTriangle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <span>Diskon di atas 30% wajib melampirkan lembar persetujuan GM/VP.</span>
                  </div>
                )}
              </div>

              {/* Live Calculated Output Box */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Harga Awal</span>
                  <span className="font-mono text-slate-300">{formatIDR(priceNum)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Potongan Diskon ({discNum}%)</span>
                  <span className={cn('font-mono font-semibold', isDiscountExceeded ? 'text-red-400' : 'text-amber-400')}>
                    - {formatIDR(discountAmount)}
                  </span>
                </div>
                <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center">
                  <span className="font-bold text-white text-xs">Harga Akhir Telkom</span>
                  <span className="font-bold font-mono text-emerald-400 text-sm">{formatIDR(finalPrice)}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-900/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>Simpan Hasil Justifikasi Diskon</span>
              </button>

              {discountSuccessMessage && (
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-1.5 animate-in fade-in">
                  <Check size={14} /> Hasil perhitungan berhasil disimpan ke riwayat output di bawah!
                </div>
              )}
            </form>
          </div>
        </div>

        {/* ─── Card 2: Evaluasi Kompetitor ─── */}
        <div className="card xl:col-span-1 bg-slate-900/90 border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Users size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Evaluasi & Pembanding Kompetitor</h3>
                <p className="text-xs text-slate-400">Analisis tender saat kalah harga</p>
              </div>
            </div>

            <form onSubmit={handleSaveCompetitor} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium mb-1 block">Proyek Terkait</label>
                <input
                  type="text"
                  value={compProject}
                  onChange={(e) => setCompProject(e.target.value)}
                  placeholder="Nama pengadaan pemda..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium mb-1 block">Nama Operator Kompetitor</label>
                <input
                  type="text"
                  value={competitorName}
                  onChange={(e) => setCompetitorName(e.target.value)}
                  placeholder="Contoh: Indosat Ooredoo, Biznet, Icon+"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium mb-1 block">Harga Tawaran Kompetitor (IDR)</label>
                <div className="flex items-center rounded-lg bg-slate-950 border border-slate-700/80 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 overflow-hidden transition-all shadow-inner">
                  <span className="px-3.5 py-2 text-xs font-bold text-slate-400 bg-slate-800/90 border-r border-slate-700 select-none">
                    Rp
                  </span>
                  <input
                    type="text"
                    value={competitorPrice ? parseFloat(competitorPrice.replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '')
                      setCompetitorPrice(raw)
                    }}
                    placeholder="0"
                    className="w-full bg-transparent px-3 py-2 text-xs font-mono text-white placeholder-slate-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium mb-1 block">Alasan Kekalahan & Analisis Spesifikasi</label>
                <textarea
                  rows={2}
                  value={competitorNotes}
                  onChange={(e) => setCompetitorNotes(e.target.value)}
                  placeholder="Uraikan faktor kekalahan: selisih harga, SLA, perangkat gratis, dll."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md shadow-amber-900/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <TrendingDown size={14} />
                <span>Simpan Evaluasi Kompetitor</span>
              </button>

              {competitorSuccessMessage && (
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-1.5 animate-in fade-in">
                  <Check size={14} /> Data kompetitor berhasil dicatat dan muncul di daftar riwayat!
                </div>
              )}
            </form>
          </div>
        </div>

        {/* ─── Card 3: Term of Payment (TOP) ─── */}
        <div className="card xl:col-span-1 bg-slate-900/90 border-slate-800">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <CreditCard size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Skema Pembayaran (ToP)</h3>
              <p className="text-xs text-slate-400">Pola pencairan kas daerah (DPA Pemda)</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            {[
              {
                value: 'bulanan',
                title: 'Bulanan (Monthly Recurring)',
                desc: 'Penagihan rutin setiap bulan setelah layanan aktif. Standar utama untuk Astinet Dedicated & VPN IP.',
                badge: 'Paling Umum',
                icon: '📅',
                color: 'border-blue-500/40 bg-blue-500/5',
              },
              {
                value: 'termin',
                title: 'Termin Berdasarkan Milestone',
                desc: 'Pembayaran dibagi 2x atau 3x sesuai progres fisik berita acara (BAST). Cocok untuk integrasi GTMA + CPE.',
                badge: 'Multi-Milestone',
                icon: '🏗️',
                color: 'border-amber-500/40 bg-amber-500/5',
              },
              {
                value: 'otc',
                title: 'OTC (One Time Charge)',
                desc: 'Dibayarkan 100% lunas saat serah terima perangkat/lisensi (BASTO). Khusus hardware, switch, & lisensi.',
                badge: 'Pengadaan Hardware',
                icon: '💳',
                color: 'border-violet-500/40 bg-violet-500/5',
              },
            ].map((item) => (
              <div
                key={item.value}
                onClick={() => setTopValue(item.value)}
                className={cn(
                  'p-3 rounded-xl border cursor-pointer transition-all duration-200',
                  item.color,
                  topValue === item.value
                    ? 'ring-2 ring-blue-500/60 border-blue-500 bg-blue-500/10'
                    : 'hover:border-slate-600'
                )}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-base">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-bold text-white text-xs">{item.title}</p>
                      {topValue === item.value && (
                        <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Terpilih
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ─── OUTPUT SECTION 1: DAFTAR HASIL JUSTIFIKASI DISKON ─── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="card bg-slate-900/90 border-slate-800 p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Output Riwayat Justifikasi Diskon Proyek</h3>
              <p className="text-[11px] text-slate-400">Hasil kalkulasi yang telah disimpan dan siap diaudit BPK/SPI</p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold">
            {discountsList.length} Berkas Tercatat
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="px-4 py-3">Nama Proyek & Pemda</th>
                <th className="px-4 py-3">Harga Asli</th>
                <th className="px-4 py-3">Diskon</th>
                <th className="px-4 py-3">Harga Akhir Telkom</th>
                <th className="px-4 py-3">Skema TOP</th>
                <th className="px-4 py-3">Status Kepatuhan</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {discountsList.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-white">{d.projectName}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{d.agency} • Ref: {d.id}</p>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-300 whitespace-nowrap">
                    {formatIDR(d.originalPrice)}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={cn('font-bold', d.discountPercent > 30 ? 'text-red-400' : 'text-amber-400')}>
                      {d.discountPercent}%
                    </span>
                    <span className="text-slate-500 text-[10px] block">
                      (- {formatIDR(d.discountAmount)})
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-emerald-400 whitespace-nowrap">
                    {formatIDR(d.finalPrice)}
                  </td>
                  <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap">
                    {d.topScheme}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {d.status === 'approved' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Check size={11} /> Sesuai SOP (&le; 30%)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                        <AlertTriangle size={11} /> Wajib Approval GM
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleDeleteDiscount(d.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Hapus rekaman"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ─── OUTPUT SECTION 2: DAFTAR EVALUASI KOMPETITOR ─── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="card bg-slate-900/90 border-slate-800 p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <FileWarning size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Output Riwayat Evaluasi Kompetitor & Kekalahan Tender</h3>
              <p className="text-[11px] text-slate-400">Bukti justifikasi penyebab kalah tender sebagai bahan pertanggungjawaban audit</p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold">
            {competitorsList.length} Rekaman
          </span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {competitorsList.map((comp) => {
            const selisih = comp.telkomPrice - comp.competitorPrice
            const pctSelisih = comp.telkomPrice > 0 ? Math.round((selisih / comp.telkomPrice) * 100) : 0

            return (
              <div key={comp.id} className="p-4 hover:bg-slate-800/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm">{comp.competitorName}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Kompetitor
                    </span>
                    <span className="text-slate-500 text-[11px]">Proyek: {comp.projectName}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed italic">
                    "{comp.notes}"
                  </p>
                  <p className="text-slate-500 text-[10px]">
                    Dicatat oleh {comp.createdBy} pada {comp.createdAt}
                  </p>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Tawaran Kompetitor</p>
                    <p className="text-sm font-mono font-bold text-amber-400">{formatIDR(comp.competitorPrice)}</p>
                    <p className="text-[10px] text-slate-500">
                      Telkom: {formatIDR(comp.telkomPrice)} ({pctSelisih > 0 ? `Lebih murah ${pctSelisih}%` : 'Selisih harga'})
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteCompetitor(comp.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Hapus evaluasi"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
