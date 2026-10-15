import React, { useEffect, useState } from 'react'
import { Download, FileSpreadsheet, Upload, X } from 'lucide-react'
import { ServicePoints, type ProjectServicePoint } from '../lib/servicePoints'

export function ServicePointsModal({ idLOP, onClose }: { idLOP: string; onClose: () => void }) {
  const [points, setPoints] = useState<ProjectServicePoint[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadPoints = async () => {
    setPoints(await ServicePoints.list(idLOP))
  }

  useEffect(() => {
    let active = true
    ServicePoints.list(idLOP)
      .then((result) => { if (active) setPoints(result) })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Gagal memuat SID.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [idLOP])

  const handleImport = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!file) return
    setImporting(true)
    setError('')
    setMessage('')
    try {
      const result = await ServicePoints.importExcel(idLOP, file)
      setMessage(`${result.imported} SID diimpor atau diperbarui${result.skipped ? `, ${result.skipped} baris dilewati` : ''}.`)
      setFile(null)
      await loadPoints()
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Gagal mengimpor SID.')
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = async () => {
    const XLSX = await import('xlsx')
<<<<<<< HEAD
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['SID', 'Produk', 'Kapasitas (Mbps)', 'No Order', 'Quote', 'Lokasi', 'Tanggal Aktif']
    ])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data SID')
    XLSX.writeFile(workbook, `template-titik-layanan-${idLOP}.xlsx`)
=======
    const worksheet = XLSX.utils.aoa_to_sheet([['SID', 'Produk', 'Kapasitas (Mbps)']])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data SID')
    XLSX.writeFile(workbook, 'template-import-SID.xlsx')
>>>>>>> 6aa6fdd5c6590190ec52e0615772fa98f5081420
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
<<<<<<< HEAD
      <section className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h3 className="flex items-center gap-2 font-bold text-white"><FileSpreadsheet size={17} className="text-emerald-400" />Import & Data Titik Layanan</h3>
=======
      <section className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h3 className="flex items-center gap-2 font-bold text-white"><FileSpreadsheet size={17} className="text-emerald-400" />Import SID</h3>
>>>>>>> 6aa6fdd5c6590190ec52e0615772fa98f5081420
            <p className="mt-1 font-mono text-xs text-blue-400">{idLOP}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"><X size={18} /></button>
        </header>

        <form onSubmit={handleImport} className="flex flex-wrap items-end gap-3 border-b border-slate-800 p-5">
          <button type="button" onClick={downloadTemplate} className="btn-secondary flex items-center gap-2">
<<<<<<< HEAD
            <Download size={14} />Unduh Template Excel
          </button>
          <label className="min-w-0 flex-1 text-xs font-semibold text-slate-300">
            File Excel Titik Layanan
=======
            <Download size={14} />Unduh Template
          </button>
          <label className="min-w-0 flex-1 text-xs font-semibold text-slate-300">
            File Excel
>>>>>>> 6aa6fdd5c6590190ec52e0615772fa98f5081420
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="mt-1.5 block w-full text-xs text-slate-400 file:mr-3 file:rounded-md file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-100"
            />
          </label>
          <button type="submit" disabled={!file || importing} className="btn-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
<<<<<<< HEAD
            <Upload size={14} />{importing ? 'Mengimpor...' : 'Import Excel'}
          </button>
          <p className="w-full text-xs text-slate-500">Mendukung input batch: SID, Produk (POTS/Non-POTS), Kapasitas (Mbps), No Order, Quote, Lokasi, dan Tanggal Aktif.</p>
=======
            <Upload size={14} />{importing ? 'Mengimpor...' : 'Import SID'}
          </button>
          <p className="w-full text-xs text-slate-500">Isi satu SID per baris. Produk boleh dikosongkan untuk memakai tipe layanan proyek; kapasitas menggunakan Mbps.</p>
>>>>>>> 6aa6fdd5c6590190ec52e0615772fa98f5081420
        </form>

        {(error || message) && (
          <p role={error ? 'alert' : 'status'} className={`px-5 pt-3 text-xs ${error ? 'text-red-400' : 'text-emerald-400'}`}>
            {error || message}
          </p>
        )}

        <div className="min-h-0 flex-1 overflow-auto p-5">
          <div className="mb-3 flex items-center justify-between">
<<<<<<< HEAD
            <h4 className="text-sm font-semibold text-white">Daftar Titik Layanan Terdaftar</h4>
            <span className="text-xs text-slate-400">{points.length} Titik</span>
          </div>
          {loading ? <p className="py-6 text-center text-xs text-slate-400">Memuat titik layanan...</p> : points.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">Belum ada titik layanan untuk proyek ini.</p>
=======
            <h4 className="text-sm font-semibold text-white">Titik layanan</h4>
            <span className="text-xs text-slate-400">{points.length} SID</span>
          </div>
          {loading ? <p className="py-6 text-center text-xs text-slate-400">Memuat SID...</p> : points.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">Belum ada SID untuk proyek ini.</p>
>>>>>>> 6aa6fdd5c6590190ec52e0615772fa98f5081420
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-950 text-slate-400">
                <tr>
<<<<<<< HEAD
                  <th className="px-3 py-2">Kondisi</th>
                  <th className="px-3 py-2">Produk</th>
                  <th className="px-3 py-2">SID</th>
                  <th className="px-3 py-2">No. Order</th>
                  <th className="px-3 py-2">Lokasi</th>
                  <th className="px-3 py-2 text-right">Kapasitas</th>
=======
                  <th className="px-3 py-2">SID</th>
                  <th className="px-3 py-2">Produk</th>
                  <th className="px-3 py-2 text-right">Kapasitas (Mbps)</th>
>>>>>>> 6aa6fdd5c6590190ec52e0615772fa98f5081420
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {points.map((point) => (
                  <tr key={point.id}>
<<<<<<< HEAD
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${point.serviceGroup === 'POTS' ? 'bg-violet-500/20 text-violet-300' : 'bg-blue-500/20 text-blue-300'}`}>
                        {point.serviceGroup || 'Non-POTS'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-200">{point.productType}</td>
                    <td className="px-3 py-2 font-mono text-emerald-400">{point.sid}</td>
                    <td className="px-3 py-2 text-slate-300">{point.orderNo || '—'}</td>
                    <td className="px-3 py-2 text-slate-400 truncate max-w-xs">{point.location || '—'}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-300">{point.capacityMbps > 0 ? `${point.capacityMbps.toLocaleString('id-ID')} Mbps` : '—'}</td>
=======
                    <td className="px-3 py-2 font-mono text-slate-200">{point.sid}</td>
                    <td className="px-3 py-2 text-slate-300">{point.productType}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-300">{point.capacityMbps.toLocaleString('id-ID')}</td>
>>>>>>> 6aa6fdd5c6590190ec52e0615772fa98f5081420
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}
