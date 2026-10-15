import React, { useState, useRef, useEffect } from 'react'
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
  X,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Check,
  Building2,
  Calendar,
  User,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { AuthService } from '../lib/auth'

export interface VaultDocument {
  id: string
  slotId?: string
  name: string
  size: number
  type: string
  uploadedAt: string
  uploadedBy: string
  isMandatory: boolean
  category: 'mandatori' | 'pendukung'
  status: 'verified' | 'uploaded' | 'pending'
  dataUrl?: string
  blobUrl?: string
  instansi?: string
  nomorSurat?: string
  deskripsi?: string
}

interface DocSlot {
  id: string
  label: string
  helperText: string
  isMandatory: boolean
  mandatoryNote?: string
  acceptedTypes: string
  defaultDoc?: Partial<VaultDocument>
}

const DOC_SLOTS: DocSlot[] = [
  {
    id: 'p0',
    label: 'Dokumen P0',
    helperText: 'Proposal awal / feasibility study proyek & justifikasi margin',
    isMandatory: true,
    mandatoryNote: 'Wajib jika layanan GTMA dan porsi CPE > 60%',
    acceptedTypes: '.pdf,.doc,.docx,.png,.jpg',
  },
  {
    id: 'p1',
    label: 'Dokumen P1',
    helperText: 'Bill of Materials (BoM), spesifikasi teknis, & lisensi perangkat',
    isMandatory: true,
    mandatoryNote: 'Wajib untuk semua pengadaan perangkat/CPE pihak ketiga',
    acceptedTypes: '.pdf,.xlsx,.doc,.docx,.png,.jpg',
  },
  {
    id: 'ba-split',
    label: 'BA Split Harga',
    helperText: 'Berita Acara pembagian komponen harga untuk input PSB ke NCX',
    isMandatory: true,
    mandatoryNote: 'Wajib untuk kelancaran billing & audit BPK',
    acceptedTypes: '.pdf,.doc,.docx,.png,.jpg',
  },
  {
    id: 'ba-siap-operasi',
    label: 'BA Siap Operasi (BASTO)',
    helperText: 'Berita Acara serah terima operasional dari Telkom ke instansi Pemda',
    isMandatory: true,
    mandatoryNote: 'Wajib sebelum proses penagihan termin pertama',
    acceptedTypes: '.pdf,.doc,.docx,.png,.jpg',
    defaultDoc: {
      name: 'BA_Siap_Operasi_Pemkot_Semarang_2024.pdf',
      size: 1_254_000,
      type: 'application/pdf',
      uploadedAt: '15/03/2024 14:20',
      uploadedBy: 'Budi Santoso (AM)',
      nomorSurat: 'TEL.440/HK.200/WTL-JTG/2024',
      instansi: 'Pemerintah Kota Semarang',
      deskripsi: 'Berita Acara Siap Operasi layanan Astinet Dedicated Diskominfo Semarang',
    },
  },
]

const INITIAL_SUPPORTING_DOCS: VaultDocument[] = [
  {
    id: 'sup-1',
    name: 'SPK_Pengadaan_Internet_Semarang_2024.pdf',
    size: 2_150_000,
    type: 'application/pdf',
    uploadedAt: '20/02/2024 10:15',
    uploadedBy: 'Arya Wirawan (Kadiv B2G)',
    isMandatory: false,
    category: 'pendukung',
    status: 'verified',
    nomorSurat: 'SPK/027/DISKOMINFO/2024',
    instansi: 'Kota Semarang',
    deskripsi: 'Surat Perintah Kerja Pengadaan Jaringan Intra Pemerintah Daerah',
  },
  {
    id: 'sup-2',
    name: 'Kontrak_Payung_Kendal_2024.pdf',
    size: 5_420_000,
    type: 'application/pdf',
    uploadedAt: '15/01/2024 11:30',
    uploadedBy: 'Budi Santoso (AM)',
    isMandatory: false,
    category: 'pendukung',
    status: 'verified',
    nomorSurat: 'KTR.112/LG.010/B2G-KDL/2024',
    instansi: 'Kab. Kendal',
    deskripsi: 'Perjanjian Kerja Sama Induk Penyediaan Layanan Komunikasi Data',
  },
  {
    id: 'sup-3',
    name: 'SPPBJ_Layanan_Metro_Salatiga.pdf',
    size: 890_000,
    type: 'application/pdf',
    uploadedAt: '28/02/2024 16:45',
    uploadedBy: 'Budi Santoso (AM)',
    isMandatory: false,
    category: 'pendukung',
    status: 'uploaded',
    nomorSurat: '027/98/SPPBJ/SLT/2024',
    instansi: 'Kota Salatiga',
    deskripsi: 'Surat Penunjukan Penyedia Barang/Jasa e-Katalog LKPP',
  },
]

const STORAGE_KEY_SLOTS = 'b2g_vault_slots_data'
const STORAGE_KEY_SUPPORTING = 'b2g_vault_supporting_data'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function DocumentVault() {
  const currentUser = AuthService.getCurrentUser()

  // State for the 4 mandatory slots
  const [slotDocs, setSlotDocs] = useState<Record<string, VaultDocument>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SLOTS)
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.error(e)
    }
    // Initial default with slot ba-siap-operasi
    const initial: Record<string, VaultDocument> = {}
    DOC_SLOTS.forEach((slot) => {
      if (slot.defaultDoc) {
        initial[slot.id] = {
          id: `slot-${slot.id}`,
          slotId: slot.id,
          name: slot.defaultDoc.name || `${slot.label}.pdf`,
          size: slot.defaultDoc.size || 1_000_000,
          type: slot.defaultDoc.type || 'application/pdf',
          uploadedAt: slot.defaultDoc.uploadedAt || '15/03/2024 14:20',
          uploadedBy: slot.defaultDoc.uploadedBy || 'Account Manager',
          isMandatory: true,
          category: 'mandatori',
          status: 'verified',
          nomorSurat: slot.defaultDoc.nomorSurat,
          instansi: slot.defaultDoc.instansi,
          deskripsi: slot.defaultDoc.deskripsi,
        }
      }
    })
    return initial
  })

  // State for supporting documents
  const [supportingDocs, setSupportingDocs] = useState<VaultDocument[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUPPORTING)
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.error(e)
    }
    return INITIAL_SUPPORTING_DOCS
  })

  // Preview Modal state
  const [previewDoc, setPreviewDoc] = useState<VaultDocument | null>(null)

  // Upload modal for supporting doc
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({
    name: '',
    instansi: 'Kota Semarang',
    nomorSurat: '',
    deskripsi: '',
  })
  const [selectedAddFile, setSelectedAddFile] = useState<File | null>(null)

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SLOTS, JSON.stringify(slotDocs))
    } catch (e) {
      console.error('Storage full or error', e)
    }
  }, [slotDocs])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SUPPORTING, JSON.stringify(supportingDocs))
    } catch (e) {
      console.error('Storage full or error', e)
    }
  }, [supportingDocs])

  // Count uploaded mandatory slots
  const uploadedMandatoryCount = DOC_SLOTS.filter((s) => !!slotDocs[s.id]).length
  const totalMandatory = DOC_SLOTS.filter((s) => s.isMandatory).length
  const compliancePercent = Math.round((uploadedMandatoryCount / totalMandatory) * 100)

  // Handle upload into a slot
  const handleSlotUpload = (slot: DocSlot, file: File) => {
    const reader = new FileReader()
    const isImage = file.type.startsWith('image/')
    const isPdf = file.type === 'application/pdf'
    const isText = file.type.startsWith('text/')

    // If file is readable small preview (<= 3MB), read data URL
    if (file.size <= 3 * 1024 * 1024 && (isImage || isPdf || isText)) {
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        const newDoc: VaultDocument = {
          id: `doc-${slot.id}-${Date.now()}`,
          slotId: slot.id,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          uploadedAt: new Date().toLocaleString('id-ID', {
            dateStyle: 'short',
            timeStyle: 'short',
          }),
          uploadedBy: currentUser ? `${currentUser.nama} (ADMIN SUPPORT)` : 'Admin Support',
          isMandatory: slot.isMandatory,
          category: 'mandatori',
          status: 'uploaded',
          dataUrl,
          blobUrl: URL.createObjectURL(file),
          nomorSurat: `TEL.B2G/${slot.id.toUpperCase()}/${new Date().getFullYear()}`,
          instansi: 'Pemerintah Daerah (Witel Jateng Utara)',
          deskripsi: `${slot.label} untuk kepatuhan tender & kontrak proyek`,
        }
        setSlotDocs((prev) => ({ ...prev, [slot.id]: newDoc }))
      }
      reader.readAsDataURL(file)
    } else {
      const newDoc: VaultDocument = {
        id: `doc-${slot.id}-${Date.now()}`,
        slotId: slot.id,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        uploadedAt: new Date().toLocaleString('id-ID', {
          dateStyle: 'short',
          timeStyle: 'short',
        }),
        uploadedBy: currentUser ? `${currentUser.nama} (ADMIN SUPPORT)` : 'Admin Support',
        isMandatory: slot.isMandatory,
        category: 'mandatori',
        status: 'uploaded',
        blobUrl: URL.createObjectURL(file),
        nomorSurat: `TEL.B2G/${slot.id.toUpperCase()}/${new Date().getFullYear()}`,
        instansi: 'Pemerintah Daerah (Witel Jateng Utara)',
        deskripsi: `${slot.label} untuk kepatuhan tender & kontrak proyek`,
      }
      setSlotDocs((prev) => ({ ...prev, [slot.id]: newDoc }))
    }
  }

  // Handle remove from slot
  const handleRemoveSlot = (slotId: string) => {
    setSlotDocs((prev) => {
      const copy = { ...prev }
      delete copy[slotId]
      return copy
    })
  }

  // Handle Add Supporting Document
  const handleSaveSupportingDoc = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAddFile && !addForm.name.trim()) return

    const fileName = selectedAddFile ? selectedAddFile.name : addForm.name.trim()
    const fileSize = selectedAddFile ? selectedAddFile.size : 1_500_000
    const fileType = selectedAddFile ? selectedAddFile.type : 'application/pdf'

    const createEntry = (dataUrl?: string, blobUrl?: string) => {
      const newDoc: VaultDocument = {
        id: `sup-${Date.now()}`,
        name: fileName.endsWith('.pdf') || fileName.includes('.') ? fileName : `${fileName}.pdf`,
        size: fileSize,
        type: fileType,
        uploadedAt: new Date().toLocaleString('id-ID', {
          dateStyle: 'short',
          timeStyle: 'short',
        }),
        uploadedBy: currentUser ? `${currentUser.nama} (ADMIN SUPPORT)` : 'Admin Support',
        isMandatory: false,
        category: 'pendukung',
        status: 'uploaded',
        dataUrl,
        blobUrl,
        nomorSurat: addForm.nomorSurat || `DOC/${Math.floor(Math.random() * 900 + 100)}/B2G/${new Date().getFullYear()}`,
        instansi: addForm.instansi,
        deskripsi: addForm.deskripsi || 'Dokumen pendukung pengadaan pemerintah',
      }
      setSupportingDocs((prev) => [newDoc, ...prev])
      setShowAddModal(false)
<<<<<<< HEAD
      setAddForm({ name: '', instansi: 'Pemkot Semarang', nomorSurat: '', deskripsi: '' })
=======
      setAddForm({ name: '', instansi: 'Kota Semarang', nomorSurat: '', deskripsi: '' })
>>>>>>> 6aa6fdd5c6590190ec52e0615772fa98f5081420
      setSelectedAddFile(null)
    }

    if (selectedAddFile && selectedAddFile.size <= 3 * 1024 * 1024) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        createEntry(ev.target?.result as string, URL.createObjectURL(selectedAddFile))
      }
      reader.readAsDataURL(selectedAddFile)
    } else if (selectedAddFile) {
      createEntry(undefined, URL.createObjectURL(selectedAddFile))
    } else {
      createEntry()
    }
  }

  const handleDeleteSupportingDoc = (id: string) => {
    setSupportingDocs((prev) => prev.filter((d) => d.id !== id))
    if (previewDoc?.id === id) setPreviewDoc(null)
  }

  return (
    <div className="card space-y-6">
      {/* ─── Vault Header & Score ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 shadow-lg shadow-red-950/40">
            <Shield size={22} className="text-red-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Audit-Ready Document Vault</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                P0/P1 Repository
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Repositori dokumen mandatori untuk kepatuhan audit BPK, verifikasi legal, dan tata kelola kontrak Telkom B2G.
            </p>
          </div>
        </div>

        {/* Compliance Meter */}
        <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 px-4 py-2.5 rounded-xl self-start sm:self-auto">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">Status Kepatuhan:</span>
              <span
                className={cn(
                  'font-bold ml-2',
                  compliancePercent >= 75
                    ? 'text-emerald-400'
                    : compliancePercent >= 50
                    ? 'text-amber-400'
                    : 'text-red-400'
                )}
              >
                {compliancePercent}% ({uploadedMandatoryCount}/{totalMandatory} Slot)
              </span>
            </div>
            <div className="w-36 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
              <div
                className={cn(
                  'h-full transition-all duration-500 rounded-full',
                  compliancePercent >= 75
                    ? 'bg-emerald-500'
                    : compliancePercent >= 50
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                )}
                style={{ width: `${compliancePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── BPK Compliance Banner ─── */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs">
        <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
        <div className="text-slate-300 leading-relaxed">
          <strong className="text-red-400">Kepatuhan Berkas Tender & Legal:</strong> Dokumen bertanda{' '}
          <span className="text-red-400 font-bold">*</span> wajib diunggah sebelum proses penagihan termin (ToP) atau audit BPK.
          Klik tombol <strong className="text-blue-400">Lihat (Preview)</strong> pada tiap berkas untuk memeriksa isi dokumen langsung di layar.
        </div>
      </div>

      {/* ─── 4 Mandatory Slots Grid ─── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span>Dokumen Mandatori Proyek</span>
            <span className="text-[11px] font-normal text-slate-500">
              ({uploadedMandatoryCount} dari {DOC_SLOTS.length} terunggah)
            </span>
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DOC_SLOTS.map((slot) => {
            const uploaded = slotDocs[slot.id]
            return (
              <SlotCard
                key={slot.id}
                slot={slot}
                uploadedDoc={uploaded}
                onUpload={(file) => handleSlotUpload(slot, file)}
                onRemove={() => handleRemoveSlot(slot.id)}
                onPreview={() => uploaded && setPreviewDoc(uploaded)}
              />
            )
          })}
        </div>
      </div>

      {/* ─── Additional Documents Section ─── */}
      <div className="pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Dokumen Pendukung & Legalitas Lainnya
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              SPK, Surat Penawaran, BAST Mitra, Nota Dinas, atau Perjanjian Kerja Sama Induk
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-900/30 transition-all cursor-pointer"
          >
            <FilePlus size={14} />
            <span>Upload Dokumen Baru</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {supportingDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all group"
            >
              <div
                onClick={() => setPreviewDoc(doc)}
                className="flex items-center gap-3 min-w-0 cursor-pointer flex-1 mr-2"
                title="Klik untuk melihat dokumen"
              >
                <div className="p-2.5 rounded-lg bg-slate-800 text-blue-400 group-hover:bg-blue-500/10 group-hover:text-blue-300 transition-colors flex-shrink-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                    {doc.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                    <span>{formatFileSize(doc.size)}</span>
                    <span>•</span>
                    <span className="truncate">{doc.instansi || 'B2G'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setPreviewDoc(doc)}
                  title="Lihat Pratinjau Dokumen"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={() => handleDeleteSupportingDoc(doc.id)}
                  title="Hapus Dokumen"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── MODAL 1: DOCUMENT PREVIEW MODAL ─── */}
      {previewDoc && (
        <DocumentPreviewModal
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* ─── MODAL 2: UPLOAD SUPPORTING DOC MODAL ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <FilePlus size={18} />
                </div>
                <h3 className="text-base font-bold text-white">Upload Dokumen Pendukung</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSupportingDoc} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">File Dokumen</label>
                <input
                  type="file"
                  onChange={(e) => setSelectedAddFile(e.target.files?.[0] || null)}
                  className="w-full text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 file:cursor-pointer p-2 rounded-xl bg-slate-950 border border-slate-800"
                />
                {selectedAddFile && (
                  <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <Check size={12} /> Terpilih: {selectedAddFile.name} ({formatFileSize(selectedAddFile.size)})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Judul Dokumen / Nama Berkas</label>
                <input
                  type="text"
                  placeholder="Contoh: Surat Perjanjian Kerja SPK Diskominfo 2024"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Instansi Terkait</label>
                  <select
                    value={addForm.instansi}
                    onChange={(e) => setAddForm({ ...addForm, instansi: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
<<<<<<< HEAD
                    <option value="Pemkot Semarang">Pemkot Semarang</option>
                    <option value="Pemkab Kendal">Pemkab Kendal</option>
                    <option value="Pemkot Salatiga">Pemkot Salatiga</option>
                    <option value="Pemkab Semarang">Pemkab Semarang</option>
                    <option value="Pemkab Batang">Pemkab Batang</option>
                    <option value="Pemkot Pekalongan">Pemkot Pekalongan</option>
                    <option value="Pemkab Pekalongan">Pemkab Pekalongan</option>
                    <option value="Pemkab Pemalang">Pemkab Pemalang</option>
                    <option value="Pemkot Tegal">Pemkot Tegal</option>
                    <option value="Pemkab Tegal">Pemkab Tegal</option>
                    <option value="Pemkab Brebes">Pemkab Brebes</option>
                    <option value="Provinsi Jawa Tengah">Provinsi Jawa Tengah</option>
                    <option value="Polda Jawa Tengah">Polda Jawa Tengah</option>
=======
                    <option value="Kota Semarang">Kota Semarang</option>
                    <option value="Kab. Kendal">Kab. Kendal</option>
                    <option value="Kota Salatiga">Kota Salatiga</option>
                    <option value="Kab. Semarang">Kab. Semarang</option>
                    <option value="Kab. Batang">Kab. Batang</option>
                    <option value="Kota Pekalongan">Kota Pekalongan</option>
                    <option value="Kab. Pekalongan">Kab. Pekalongan</option>
                    <option value="Kab. Pemalang">Kab. Pemalang</option>
                    <option value="Kota Tegal">Kota Tegal</option>
                    <option value="Kab. Tegal">Kab. Tegal</option>
                    <option value="Kab. Brebes">Kab. Brebes</option>
                    <option value="Provinsi Jawa Tengah">Provinsi Jateng</option>
                    <option value="Polda Jawa Tengah">Polda Jateng</option>
>>>>>>> 6aa6fdd5c6590190ec52e0615772fa98f5081420
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Nomor Surat / Berkas</label>
                  <input
                    type="text"
                    placeholder="Contoh: 027/SPK/DISKOM/2024"
                    value={addForm.nomorSurat}
                    onChange={(e) => setAddForm({ ...addForm, nomorSurat: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan isi berkas atau tujuan upload..."
                  value={addForm.deskripsi}
                  onChange={(e) => setAddForm({ ...addForm, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-md shadow-blue-900/30"
                >
                  Simpan & Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SLOT CARD COMPONENT
// ─────────────────────────────────────────────────────────────

interface SlotCardProps {
  slot: DocSlot
  uploadedDoc?: VaultDocument
  onUpload: (file: File) => void
  onRemove: () => void
  onPreview: () => void
}

function SlotCard({ slot, uploadedDoc, onUpload, onRemove, onPreview }: SlotCardProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onUpload(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
  }

  const isUploaded = !!uploadedDoc
  const isMissing = !isUploaded && slot.isMandatory

  return (
    <div className="space-y-2 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all">
      {/* Slot Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-bold text-white">{slot.label}</h4>
            {slot.isMandatory && (
              <span className="text-red-400 text-sm font-bold" title="Wajib Audit BPK">
                *
              </span>
            )}
            {isMissing ? (
              <span className="badge text-[10px] bg-red-500/10 text-red-400 border border-red-500/30">
                <AlertCircle size={10} className="mr-1" />
                MISSING
              </span>
            ) : (
              <span className="badge text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 size={10} className="mr-1" />
                Uploaded
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{slot.helperText}</p>
          {slot.mandatoryNote && (
            <p className="text-[11px] text-amber-400/90 mt-1 flex items-center gap-1">
              <AlertCircle size={11} className="flex-shrink-0" />
              {slot.mandatoryNote}
            </p>
          )}
        </div>
        {isUploaded && (
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            title="Hapus / ganti dokumen"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={slot.acceptedTypes}
        onChange={handleFileChange}
        className="hidden"
        id={`slot-file-input-${slot.id}`}
      />

      {/* Uploaded State vs Dropzone */}
      {isUploaded && uploadedDoc ? (
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3">
          <div
            onClick={onPreview}
            className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
            title="Klik untuk membuka dokumen"
          >
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex-shrink-0">
              <FileCheck size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate hover:text-blue-400 transition-colors">
                {uploadedDoc.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                <span>{formatFileSize(uploadedDoc.size)}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {uploadedDoc.uploadedAt}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={onPreview}
              className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              title="Lihat Pratinjau Dokumen"
            >
              <Eye size={13} />
              <span>Lihat</span>
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={`slot-file-input-${slot.id}`}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'block p-4 rounded-xl border border-dashed text-center cursor-pointer transition-all',
            isDragOver
              ? 'border-blue-400 bg-blue-500/10'
              : isMissing
              ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50'
              : 'border-slate-700 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-800/40'
          )}
        >
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                'p-2 rounded-lg',
                isMissing ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-400'
              )}
            >
              <Upload size={16} />
            </div>
            <div>
              <p
                className={cn(
                  'text-xs font-semibold',
                  isMissing ? 'text-red-400' : 'text-slate-300'
                )}
              >
                {isDragOver ? 'Lepas file di sini' : 'Klik atau seret file ke sini'}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {slot.acceptedTypes.replace(/\./g, '').replace(/,/g, ', ').toUpperCase()} · Maks 25 MB
              </p>
            </div>
          </div>
        </label>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// DOCUMENT PREVIEW MODAL
// ─────────────────────────────────────────────────────────────

interface DocumentPreviewModalProps {
  doc: VaultDocument
  onClose: () => void
}

function DocumentPreviewModal({ doc, onClose }: DocumentPreviewModalProps) {
  const isImage = doc.type.startsWith('image/') || doc.name.match(/\.(png|jpg|jpeg|webp)$/i)
  const isPdf = doc.type === 'application/pdf' || doc.name.endsWith('.pdf')
  const contentUrl = doc.blobUrl || doc.dataUrl

  const handleDownload = () => {
    if (contentUrl) {
      const a = document.createElement('a')
      a.href = contentUrl
      a.download = doc.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } else {
      // Simulate download for seeded documents
      const blob = new Blob([`Dokumen Resmi B2G Telkom Indonesia\nJudul: ${doc.name}\nNomor: ${doc.nomorSurat || '-'}\nInstansi: ${doc.instansi || '-'}`], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.name.replace(/\.pdf$/, '.txt')
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleOpenNewTab = () => {
    if (contentUrl) {
      window.open(contentUrl, '_blank')
    } else {
      alert('Dokumen demo bawaan — gunakan tombol download atau periksa ringkasan di bawah.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex-shrink-0">
              {isImage ? <ImageIcon size={20} /> : <FileText size={20} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">{doc.name}</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                  {doc.status === 'verified' ? 'Terverifikasi' : 'Terunggah'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>{formatFileSize(doc.size)}</span>
                <span>•</span>
                <span>Diupload: {doc.uploadedAt}</span>
                <span>•</span>
                <span className="text-slate-300 font-medium">{doc.uploadedBy}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {contentUrl && (
              <button
                onClick={handleOpenNewTab}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden sm:flex"
                title="Buka di Tab Baru"
              >
                <ExternalLink size={16} />
              </button>
            )}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition-all cursor-pointer"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
              title="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body: Document Preview Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/40 space-y-5">
          
          {/* Metadata Infobar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <div>
              <p className="text-slate-500 text-[11px]">Nomor Berkas / Surat</p>
              <p className="text-slate-200 font-semibold mt-0.5 truncate">{doc.nomorSurat || 'TEL.440/B2G/2024'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[11px]">Instansi Terkait</p>
              <p className="text-slate-200 font-semibold mt-0.5 truncate">{doc.instansi || 'Pemerintah Kota Semarang'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[11px]">Kategori Berkas</p>
              <p className="text-slate-200 font-semibold mt-0.5">
                {doc.isMandatory ? 'Mandatori (Audit BPK)' : 'Dokumen Pendukung'}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-[11px]">Status Legalitas</p>
              <p className="text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                <CheckCircle2 size={12} />
                Sah & Terdaftar
              </p>
            </div>
          </div>

          {/* Actual File Preview Area */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden flex flex-col items-center justify-center min-h-[380px]">
            {isImage && contentUrl ? (
              <div className="p-4 flex items-center justify-center w-full">
                <img
                  src={contentUrl}
                  alt={doc.name}
                  className="max-h-[500px] w-auto max-w-full rounded-lg object-contain shadow-lg"
                />
              </div>
            ) : isPdf && contentUrl ? (
              <iframe
                src={contentUrl}
                title={doc.name}
                className="w-full h-[520px] rounded-lg border-0"
              />
            ) : (
              /* Rich Telkom Digital Document Sheet View (for demo & office docs) */
              <div className="w-full max-w-2xl bg-white text-slate-800 p-8 rounded-lg shadow-xl my-4 text-xs font-sans relative select-text border border-slate-300">
                {/* Official Telkom Kop Surat */}
                <div className="flex items-start justify-between pb-4 border-b-2 border-red-600 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center text-white font-extrabold text-xl shadow">
                      T
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm tracking-wide">
                        PT TELKOM INDONESIA (PERSERO) TBK
                      </h4>
                      <p className="text-[11px] text-slate-600 font-medium">
                        DIVISI GOVERNMENT & ENTERPRISE SERVICE — WITEL JATENG UTARA
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Jl. Pahlawan No. 10, Semarang · Call Center 1500250 · www.telkom.co.id
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 uppercase border border-red-200">
                      Dokumen Sah B2G
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">Ref: {doc.nomorSurat || 'TEL.027/SMG/2024'}</p>
                  </div>
                </div>

                {/* Document Body */}
                <div className="space-y-4 text-slate-700 leading-relaxed">
                  <div className="text-center py-2">
                    <h5 className="font-bold text-slate-900 text-sm uppercase underline tracking-wide">
                      {doc.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')}
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Nomor: {doc.nomorSurat || '440/BA-TELKOM/JTG-UTARA/2024'}
                    </p>
                  </div>

                  <p className="text-justify text-[11px]">
                    Pada hari ini telah dilakukan verifikasi dan pemeriksaan kelengkapan administrasi pengadaan
                    layanan konektivitas &amp; infrastruktur digital untuk instansi{' '}
                    <strong>{doc.instansi || 'Pemerintah Kota Semarang'}</strong> di bawah pengawasan Account Manager
                    Telkom Witel Jateng Utara.
                  </p>

                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5 text-[11px]">
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500">Nama Dokumen</span>
                      <span className="col-span-2 font-semibold text-slate-800">{doc.name}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500">Keterangan / Scope</span>
                      <span className="col-span-2 text-slate-700">{doc.deskripsi || 'Layanan Astinet & Intranet Pemda'}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500">Petugas Upload</span>
                      <span className="col-span-2 text-slate-700">{doc.uploadedBy}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500">Kepatuhan Regulasi</span>
                      <span className="col-span-2 text-emerald-700 font-semibold">
                        Sesuai Ketentuan Audit BPK &amp; Perpres Pengadaan Pemerintah
                      </span>
                    </div>
                  </div>

                  {/* Signatures Mockup */}
                  <div className="pt-6 grid grid-cols-2 text-center text-[11px] text-slate-800">
                    <div>
                      <p className="text-slate-500">Pihak Pelanggan (Pemda)</p>
                      <div className="h-14 flex items-center justify-center font-serif italic text-slate-400 text-xs">
                        [Tanda Tangan &amp; Stempel Basah]
                      </div>
                      <p className="font-bold text-slate-900">Pejabat Pembuat Komitmen (PPK)</p>
                      <p className="text-[10px] text-slate-500">{doc.instansi || 'Pemerintah Kota Semarang'}</p>
                    </div>

                    <div>
                      <p className="text-slate-500">Pihak Penyedia</p>
                      <div className="h-14 flex items-center justify-center">
                        <span className="px-2 py-1 rounded border border-emerald-600 bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                          ✓ Digital Signed Telkom e-Sign
                        </span>
                      </div>
                      <p className="font-bold text-slate-900">{doc.uploadedBy.split('(')[0]}</p>
                      <p className="text-[10px] text-slate-500">PT Telkom Indonesia (Persero) Tbk</p>
                    </div>
                  </div>
                </div>

                {/* Document Footer Watermark */}
                <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[9px] text-slate-400 uppercase tracking-widest">
                  Dokumen Resmi Diarsipkan di B2Gov Portal · Witel Jateng Utara
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/70 text-xs">
          <span className="text-slate-400">
            Terverifikasi secara sistem · Format {doc.name.split('.').pop()?.toUpperCase()}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer"
          >
            Tutup Pratinjau
          </button>
        </div>

      </div>
    </div>
  )
}
