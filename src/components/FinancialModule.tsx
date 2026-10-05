import React, { useState } from 'react'
import {
  Calculator,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Users,
  TrendingDown,
  FileWarning,
  CreditCard,
} from 'lucide-react'
import { cn, formatIDR } from '../lib/utils'
import { TOP_OPTIONS } from '../data/mockData'

const MAX_DISCOUNT_PERCENT = 30

export function FinancialModule() {
  // Discount Calculator State
  const [originalPrice, setOriginalPrice] = useState('')
  const [discountPct, setDiscountPct] = useState('')
  const [topValue, setTopValue] = useState('')

  // Competitor State
  const [competitorName, setCompetitorName] = useState('')
  const [competitorPrice, setCompetitorPrice] = useState('')
  const [competitorNotes, setCompetitorNotes] = useState('')
  const [competitorSaved, setCompetitorSaved] = useState(false)

  const priceNum = parseFloat(originalPrice.replace(/[^0-9]/g, '')) || 0
  const discNum = parseFloat(discountPct) || 0
  const isDiscountExceeded = discNum > MAX_DISCOUNT_PERCENT
  const discountAmount = priceNum * (discNum / 100)
  const finalPrice = priceNum - discountAmount
  const savings = discountAmount

  const handleSaveCompetitor = () => {
    if (competitorName && competitorPrice) {
      setCompetitorSaved(true)
      setTimeout(() => setCompetitorSaved(false), 3000)
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Discount Calculator */}
      <div className="card xl:col-span-1">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Calculator size={16} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Kalkulator Diskon</h3>
            <p className="text-xs text-slate-500">Max diskon: {MAX_DISCOUNT_PERCENT}%</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Original Price */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">
              Harga Original (IDR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">Rp</span>
              <input
                type="text"
                value={originalPrice}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '')
                  setOriginalPrice(raw ? parseInt(raw).toLocaleString('id-ID') : '')
                }}
                placeholder="0"
                className="input-field pl-8 text-sm font-mono"
                id="original-price"
              />
            </div>
          </div>

          {/* Discount % */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">
              Persentase Diskon (%)
            </label>
            <div className="relative">
              <input
                type="number"
                value={discountPct}
                onChange={(e) => setDiscountPct(e.target.value)}
                placeholder="0"
                min="0"
                max="100"
                className={cn('input-field pr-8 text-sm font-mono', isDiscountExceeded && 'error')}
                id="discount-pct"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">%</span>
            </div>

            {/* Validation Warning */}
            {isDiscountExceeded && (
              <div className="flex items-start gap-2 mt-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
                <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-400">Diskon Melebihi Batas!</p>
                  <p className="text-xs text-red-300/70 mt-0.5">
                    Diskon maksimal adalah <strong>{MAX_DISCOUNT_PERCENT}%</strong>. Diperlukan persetujuan GM untuk diskon lebih dari batas ini.
                  </p>
                </div>
              </div>
            )}

            {discNum > 0 && discNum <= MAX_DISCOUNT_PERCENT && (
              <div className="flex items-center gap-1.5 mt-2">
                <CheckCircle size={12} className="text-emerald-400" />
                <p className="text-xs text-emerald-400 font-medium">Diskon dalam batas wajar</p>
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="border-t border-slate-700/50 pt-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Harga Original</span>
              <span className="text-xs font-mono text-slate-300">
                {priceNum > 0 ? formatIDR(priceNum) : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Potongan Diskon</span>
              <span className={cn('text-xs font-mono font-semibold', isDiscountExceeded ? 'text-red-400' : 'text-amber-400')}>
                {discountAmount > 0 ? `- ${formatIDR(discountAmount)}` : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-slate-700/30">
              <span className="text-xs font-bold text-white">Harga Final</span>
              <span className="text-sm font-bold font-mono text-emerald-400">
                {finalPrice > 0 ? formatIDR(finalPrice) : '—'}
              </span>
            </div>
          </div>

          {/* Progress bar for discount usage */}
          {discNum > 0 && (
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Penggunaan Diskon</span>
                <span className={isDiscountExceeded ? 'text-red-400' : 'text-slate-400'}>
                  {discNum}/{MAX_DISCOUNT_PERCENT}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', isDiscountExceeded ? 'bg-red-500' : 'bg-emerald-500')}
                  style={{ width: `${Math.min((discNum / MAX_DISCOUNT_PERCENT) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Competitor Evaluation */}
      <div className="card xl:col-span-1">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Users size={16} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Evaluasi Kompetitor</h3>
            <p className="text-xs text-slate-500">Rekam harga saat tender kalah</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">
              Nama Kompetitor
            </label>
            <input
              type="text"
              value={competitorName}
              onChange={(e) => setCompetitorName(e.target.value)}
              placeholder="Indosat Ooredoo, Biznet, dll."
              className="input-field text-sm"
              id="competitor-name"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">
              Harga Penawaran Kompetitor (IDR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">Rp</span>
              <input
                type="text"
                value={competitorPrice}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '')
                  setCompetitorPrice(raw ? parseInt(raw).toLocaleString('id-ID') : '')
                }}
                placeholder="0"
                className="input-field pl-8 text-sm font-mono"
                id="competitor-price"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">
              Catatan & Alasan Kekalahan
            </label>
            <textarea
              value={competitorNotes}
              onChange={(e) => setCompetitorNotes(e.target.value)}
              placeholder="Uraikan alasan kekalahan tender, kelebihan kompetitor, spesifikasi yang ditawarkan, dll."
              rows={4}
              className="input-field text-sm resize-none"
              id="competitor-notes"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveCompetitor}
              className="btn-primary flex-1 justify-center text-xs"
            >
              <TrendingDown size={12} />
              Simpan Evaluasi
            </button>
          </div>

          {competitorSaved && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle size={14} className="text-emerald-400" />
              <p className="text-xs text-emerald-400 font-medium">Evaluasi kompetitor berhasil disimpan!</p>
            </div>
          )}

          {/* Existing record preview */}
          <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/30">
            <p className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
              <FileWarning size={12} className="text-amber-400" />
              Riwayat Terakhir (PRJ-009)
            </p>
            <p className="text-xs text-slate-300 font-medium">Indosat Ooredoo Hutchison</p>
            <p className="text-xs text-amber-400 font-mono font-semibold mt-0.5">Rp 245.000.000</p>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              Menawarkan harga lebih rendah 12% dengan jaminan SLA 99.5%...
            </p>
          </div>
        </div>
      </div>

      {/* Term of Payment */}
      <div className="card xl:col-span-1">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <CreditCard size={16} className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Term of Payment</h3>
            <p className="text-xs text-slate-500">Skema pembayaran proyek</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">
              Pilih Skema Pembayaran
            </label>
            <div className="relative">
              <select
                value={topValue}
                onChange={(e) => setTopValue(e.target.value)}
                className="input-field text-sm appearance-none pr-8 cursor-pointer"
                id="top-select"
              >
                <option value="" disabled className="bg-slate-900">
                  -- Pilih TOP --
                </option>
                {TOP_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-slate-900">
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* TOP Description Cards */}
          <div className="space-y-2">
            {[
              {
                value: 'bulanan',
                title: 'Bulanan (Monthly)',
                desc: 'Pembayaran dilakukan setiap bulan sesuai tagihan. Cocok untuk layanan recurring seperti internet dedicated.',
                icon: '📅',
                color: 'border-blue-500/30 bg-blue-500/5',
                badge: 'Paling Umum',
                badgeColor: 'bg-blue-500/20 text-blue-400',
              },
              {
                value: 'termin',
                title: 'Termin',
                desc: 'Pembayaran dibagi dalam beberapa termin berdasarkan progress pengerjaan proyek.',
                icon: '🏗️',
                color: 'border-amber-500/30 bg-amber-500/5',
                badge: 'Proyek Besar',
                badgeColor: 'bg-amber-500/20 text-amber-400',
              },
              {
                value: 'otc',
                title: 'OTC (One Time Charge)',
                desc: 'Pembayaran dilakukan satu kali di awal atau akhir. Biasanya untuk pengadaan perangkat/hardware.',
                icon: '💳',
                color: 'border-violet-500/30 bg-violet-500/5',
                badge: 'Hardware/CPE',
                badgeColor: 'bg-violet-500/20 text-violet-400',
              },
            ].map((item) => (
              <div
                key={item.value}
                onClick={() => setTopValue(item.value)}
                className={cn(
                  'p-3 rounded-lg border cursor-pointer transition-all duration-200',
                  item.color,
                  topValue === item.value
                    ? 'ring-2 ring-blue-500/50 border-blue-500/50'
                    : 'hover:border-slate-600'
                )}
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-bold text-white">{item.title}</p>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-semibold', item.badgeColor)}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                  {topValue === item.value && (
                    <CheckCircle size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
