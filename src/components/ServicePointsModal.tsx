import React, { useEffect, useState } from 'react'
import { Download, FileSpreadsheet, Upload, X } from 'lucide-react'
import { ServicePoints, type ProjectServicePoint } from '../lib/servicePoints'

export function ServicePointsModal({ idLOP, onClose }: { idLOP: string; onClose: () => void }) {
  const [points, setPoints] = useState<ProjectServicePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [importingGroup, setImportingGroup] = useState<'POTS' | 'Non-POTS' | null>(null)
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

  const handleImport = async (file: File, serviceGroup: 'POTS' | 'Non-POTS') => {
    setImportingGroup(serviceGroup)
    setError('')
    setMessage('')
    try {
      const result = await ServicePoints.importExcel(idLOP, file, serviceGroup)
      const destination = serviceGroup === 'POTS' ? ' ke layanan HSI (grup POTS)' : ' ke layanan Non-POTS'
      setMessage(`${result.imported} SID berhasil diimpor atau diperbarui${destination}${result.skipped ? `, ${result.skipped} baris dilewati` : ''}.`)
      await loadPoints()
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Gagal mengimpor SID.')
    } finally {
      setImportingGroup(null)
    }
  }

  const downloadTemplate = async () => {
    try {
      setError('')
      const XLSX = await import('xlsx')
      const workbook = XLSX.utils.book_new()
      const sheets = [
        {
          name: 'Non-POTS',
          headers: ['NAMA LAYANAN', 'HARGA LAYANAN', 'BANDWIDTH', 'LOKASI', 'QUOTE', 'NO ORDER', 'SID', 'TANGGAL AKTIF'],
        },
        {
          name: 'POTS',
          headers: ['NAMA LAYANAN', 'HARGA LAYANAN', 'BANDWIDTH', 'LOKASI', 'NO ORDER', 'SID', 'TANGGAL AKTIF'],
        },
      ]
      for (const { name, headers } of sheets) {
        const worksheet = XLSX.utils.aoa_to_sheet([headers])
        worksheet['!cols'] = headers.map((header) => ({ wch: Math.max(header.length + 2, 18) }))
        worksheet['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' }
        worksheet['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }) }
        XLSX.utils.book_append_sheet(workbook, worksheet, name)
      }
      XLSX.writeFile(workbook, `template-titik-layanan-${idLOP}.xlsx`)
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Gagal mengunduh template Excel.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <section className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h3 className="flex items-center gap-2 font-bold text-white"><FileSpreadsheet size={17} className="text-emerald-400" />Import & Data Titik Layanan</h3>
            <p className="mt-1 font-mono text-xs text-blue-400">{idLOP}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"><X size={18} /></button>
        </header>

        <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 p-5">
          <button type="button" onClick={downloadTemplate} className="btn-secondary flex items-center gap-2">
            <Download size={14} />Unduh Template Excel
          </button>
          {(['Non-POTS', 'POTS'] as const).map((serviceGroup) => (
            <label
              key={serviceGroup}
              className={`btn-primary relative flex cursor-pointer items-center gap-2 ${importingGroup ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <Upload size={14} />
              {importingGroup === serviceGroup ? `Mengimpor ${serviceGroup}...` : `Upload File ${serviceGroup}`}
              <input
                type="file"
                accept=".xlsx,.xls"
                disabled={importingGroup !== null}
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0]
                  event.target.value = ''
                  if (selectedFile) void handleImport(selectedFile, serviceGroup)
                }}
                className="sr-only"
              />
            </label>
          ))}
          <p className="w-full text-xs text-slate-500">Gunakan tombol sesuai jenis file. Isi Harga Layanan untuk setiap SID pada template Non-POTS maupun POTS.</p>
        </div>

        {(error || message) && (
          <p role={error ? 'alert' : 'status'} className={`px-5 pt-3 text-xs ${error ? 'text-red-400' : 'text-emerald-400'}`}>
            {error || message}
          </p>
        )}

        <div className="min-h-0 flex-1 overflow-auto p-5">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">Daftar Titik Layanan Terdaftar</h4>
            <span className="text-xs text-slate-400">{points.length} Titik</span>
          </div>
          {loading ? <p className="py-6 text-center text-xs text-slate-400">Memuat titik layanan...</p> : points.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">Belum ada titik layanan untuk proyek ini.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-950 text-slate-400">
                <tr>
                  <th className="px-3 py-2">Kondisi</th>
                  <th className="px-3 py-2">Produk</th>
                  <th className="px-3 py-2">SID</th>
                  <th className="px-3 py-2 text-right">Harga Layanan</th>
                  <th className="px-3 py-2">No. Order</th>
                  <th className="px-3 py-2">Lokasi</th>
                  <th className="px-3 py-2 text-right">Kapasitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {points.map((point) => (
                  <tr key={point.id}>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${point.serviceGroup === 'POTS' ? 'bg-violet-500/20 text-violet-300' : 'bg-blue-500/20 text-blue-300'}`}>
                        {point.serviceGroup || 'Non-POTS'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-200">{point.productType}</td>
                    <td className="px-3 py-2 font-mono text-emerald-400">{point.sid}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-emerald-300">{point.servicePrice ? `Rp ${point.servicePrice.toLocaleString('id-ID')}` : '—'}</td>
                    <td className="px-3 py-2 text-slate-300">{point.orderNo || '—'}</td>
                    <td className="px-3 py-2 text-slate-400 truncate max-w-xs">{point.location || '—'}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-300">{point.capacityMbps > 0 ? `${point.capacityMbps.toLocaleString('id-ID')} Mbps` : '—'}</td>
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
