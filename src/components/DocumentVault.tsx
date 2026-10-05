import React, { useState, useRef } from 'react'
import {
  Upload,
  FileCheck,
  FilePlus,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Shield,
  Eye,
  Clock,
  File,
} from 'lucide-react'
import { cn } from '../lib/utils'

interface DocSlot {
  id: string
  label: string
  helperText: string
  isMandatory: boolean
  mandatoryNote?: string
  acceptedTypes?: string
}

const DOC_SLOTS: DocSlot[] = [
  {
    id: 'p0',
    label: 'Dokumen P0',
    helperText: 'Proposal awal / feasibility study proyek',
    isMandatory: true,
    mandatoryNote: 'Wajib jika CPE > 60%',
    acceptedTypes: '.pdf,.doc,.docx',
  },
  {
    id: 'p1',
    label: 'Dokumen P1',
    helperText: 'Bill of Materials & spesifikasi teknis perangkat',
    isMandatory: true,
    mandatoryNote: 'Wajib untuk semua pengadaan perangkat/CPE',
    acceptedTypes: '.pdf,.xlsx,.doc,.docx',
  },
  {
    id: 'ba-split',
    label: 'BA Split',
    helperText: 'Berita Acara pembagian scope pekerjaan',
    isMandatory: true,
    mandatoryNote: 'Wajib untuk audit BPK',
    acceptedTypes: '.pdf,.doc,.docx',
  },
  {
    id: 'ba-siap-operasi',
    label: 'BA Siap Operasi',
    helperText: 'Berita Acara serah terima & siap operasi',
    isMandatory: true,
    mandatoryNote: 'Wajib untuk audit BPK',
    acceptedTypes: '.pdf,.doc,.docx',
  },
]

interface UploadedFile {
  name: string
  size: number
  uploadedAt: string
  status: 'uploaded' | 'pending' | 'rejected'
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function DropZone({ slot }: { slot: DocSlot }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(
    // Seed some pre-uploaded files for demo
    slot.id === 'ba-siap-operasi'
      ? {
          name: 'BA_Siap_Operasi_SMG_2024.pdf',
          size: 1_204_000,
          uploadedAt: '2024-03-15 14:22',
          status: 'uploaded',
        }
      : null
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      simulateUpload(file)
    }
  }

  const simulateUpload = (file: File) => {
    setUploadedFile({
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toLocaleString('id-ID', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
      status: 'uploaded',
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) simulateUpload(file)
  }

  const handleRemove = () => {
    setUploadedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const isUploaded = uploadedFile !== null
  const isMissing = !isUploaded && slot.isMandatory

  return (
    <div className="space-y-2">
      {/* Slot Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-bold text-white">{slot.label}</h4>
            {slot.isMandatory && (
              <span className="text-red-400 text-sm font-bold" title="Wajib untuk Audit BPK">
                *
              </span>
            )}
            {isMissing ? (
              <span className="badge text-[10px]" style={{ background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440' }}>
                <AlertCircle size={9} />
                MISSING
              </span>
            ) : (
              <span className="badge text-[10px]" style={{ background: '#10b98120', color: '#10b981', border: '1px solid #10b98140' }}>
                <CheckCircle2 size={9} />
                Uploaded
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{slot.helperText}</p>
          {slot.mandatoryNote && (
            <p className="text-xs text-amber-400/80 mt-0.5 flex items-center gap-1">
              <AlertCircle size={10} className="flex-shrink-0" />
              {slot.mandatoryNote}
            </p>
          )}
        </div>
        {isUploaded && (
          <button
            onClick={handleRemove}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Hapus dokumen"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Drop Zone / Uploaded State */}
      <input
        ref={fileInputRef}
        type="file"
        accept={slot.acceptedTypes}
        onChange={handleFileChange}
        className="hidden"
        id={`file-input-${slot.id}`}
      />

      {isUploaded ? (
        <div className="drop-zone uploaded p-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <FileCheck size={18} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{uploadedFile.name}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-slate-400">{formatFileSize(uploadedFile.size)}</span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock size={10} />
                  {uploadedFile.uploadedAt}
                </span>
              </div>
            </div>
            <button
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
              title="Preview"
            >
              <Eye size={14} />
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={`file-input-${slot.id}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={cn('drop-zone block cursor-pointer', isDragOver && 'drag-over', isMissing && 'border-red-500/40')}
        >
          <div className="flex flex-col items-center gap-2">
            <div className={cn('p-3 rounded-xl border', isMissing ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-800 border-slate-700')}>
              <Upload size={20} className={isMissing ? 'text-red-400' : 'text-slate-400'} />
            </div>
            <div>
              <p className={cn('text-xs font-semibold', isMissing ? 'text-red-400' : 'text-slate-300')}>
                {isDragOver ? 'Lepas file di sini...' : 'Klik atau seret file ke sini'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {slot.acceptedTypes?.replace(/\./g, '').replace(/,/g, ', ').toUpperCase()} · Maks 25 MB
              </p>
            </div>
          </div>
        </label>
      )}
    </div>
  )
}

export function DocumentVault() {
  const uploadedCount = DOC_SLOTS.filter((_, i) => i === 3).length // Only last one is pre-uploaded

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Shield size={18} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Audit-Ready Document Vault</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Repositori dokumen wajib untuk kepatuhan audit BPK &amp; internal
            </p>
          </div>
        </div>

        {/* Compliance Score */}
        <div className="text-right">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <AlertCircle size={14} className="text-amber-400" />
            <span className="text-xs font-semibold text-amber-400">
              1/4 Dokumen Wajib
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Compliance: 25%</p>
        </div>
      </div>

      {/* BPK Compliance Alert */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 mb-5">
        <Shield size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-red-400">Perhatian: Dokumen Wajib Audit BPK</p>
          <p className="text-xs text-red-300/70 mt-0.5 leading-relaxed">
            Semua dokumen yang ditandai dengan <span className="text-red-400 font-bold">*</span> bersifat{' '}
            <strong>WAJIB</strong> dan harus diunggah sebelum proyek dapat dilanjutkan ke tahap berikutnya.
            Ketidaklengkapan dokumen dapat menjadi temuan audit BPK.
          </p>
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {DOC_SLOTS.map((slot) => (
          <DropZone key={slot.id} slot={slot} />
        ))}
      </div>

      {/* Additional Documents Section */}
      <div className="mt-5 pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dokumen Pendukung Lainnya</h4>
          <button className="btn-secondary text-xs">
            <FilePlus size={12} />
            Tambah Dokumen
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { name: 'SPK_Semarang_2024.pdf', size: '2.1 MB', date: '2024-02-20', icon: File },
            { name: 'Kontrak_Induk.pdf', size: '5.4 MB', date: '2024-01-15', icon: File },
            { name: 'SPPBJ_Final.pdf', size: '890 KB', date: '2024-02-28', icon: File },
          ].map((doc) => (
            <div
              key={doc.name}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-slate-600 transition-all cursor-pointer group"
            >
              <doc.icon size={14} className="text-slate-400 group-hover:text-blue-400 transition-colors flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-300 truncate">{doc.name}</p>
                <p className="text-xs text-slate-500">{doc.size}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-dashed border-slate-700/50 cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group">
            <FilePlus size={14} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
            <span className="text-xs text-slate-600 group-hover:text-blue-400 transition-colors">Tambah</span>
          </div>
        </div>
      </div>
    </div>
  )
}
