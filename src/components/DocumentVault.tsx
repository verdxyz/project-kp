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
import { downloadPdf } from '../lib/pdfGenerator'

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
      setAddForm({ name: '', instansi: 'Pemkot Semarang', nomorSurat: '', deskripsi: '' })
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5E5E5]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl    border border-[#E5E5E5]  ">
            <Shield size={22} className="text-[#666666]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#1C1C1E]">Audit-Ready Document Vault</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#F3F3F1] text-[#666666] border border-[#E5E5E5]">
                P0/P1 Repository
              </span>
            </div>
            <p className="text-xs text-[#666666] mt-0.5">
              Repositori dokumen mandatori untuk kepatuhan audit BPK, verifikasi legal, dan tata kelola kontrak Telkom B2G.
            </p>
          </div>
        </div>

        {/* Compliance Meter */}
        <div className="flex items-center gap-4 bg-[#F9F8F6] border border-[#E5E5E5] px-4 py-2.5 rounded-xl self-start sm:self-auto">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[#666666]">Status Kepatuhan:</span>
              <span
                className={cn(
                  'font-bold ml-2',
                  compliancePercent >= 75
                    ? 'text-[#666666]'
                    : compliancePercent >= 50
                    ? 'text-[#666666]'
                    : 'text-[#666666]'
                )}
              >
                {compliancePercent}% ({uploadedMandatoryCount}/{totalMandatory} Slot)
              </span>
            </div>
            <div className="w-36 h-2 bg-[#FFFFFF] rounded-full overflow-hidden border border-[#E5E5E5]">
              <div
                className={cn(
                  'h-full transition-all duration-500 rounded-full',
                  compliancePercent >= 75
                    ? 'bg-[#F3F3F1]'
                    : compliancePercent >= 50
                    ? 'bg-[#F3F3F1]'
                    : 'bg-[#F3F3F1]'
                )}
                style={{ width: `${compliancePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── BPK Compliance Banner ─── */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F3F3F1] border border-[#E5E5E5] text-xs">
        <AlertCircle size={16} className="text-[#666666] flex-shrink-0 mt-0.5" />
        <div className="text-[#666666] leading-relaxed">
          <strong className="text-[#666666]">Kepatuhan Berkas Tender & Legal:</strong> Dokumen bertanda{' '}
          <span className="text-[#666666] font-bold">*</span> wajib diunggah sebelum proses penagihan termin (ToP) atau audit BPK.
          Klik tombol <strong className="text-[#666666]">Lihat (Preview)</strong> pada tiap berkas untuk memeriksa isi dokumen langsung di layar.
        </div>
      </div>

      {/* ─── 4 Mandatory Slots Grid ─── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-[#666666] uppercase tracking-wider flex items-center gap-2">
            <span>Dokumen Mandatori Proyek</span>
            <span className="text-[11px] font-normal text-[#666666]">
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
      <div className="pt-4 border-t border-[#E5E5E5]">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h4 className="text-xs font-bold text-[#666666] uppercase tracking-wider">
              Dokumen Pendukung & Legalitas Lainnya
            </h4>
            <p className="text-[11px] text-[#666666] mt-0.5">
              SPK, Surat Penawaran, BAST Mitra, Nota Dinas, atau Perjanjian Kerja Sama Induk
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-[#F3F3F1] text-[#1C1C1E] text-xs font-semibold   transition-all cursor-pointer"
          >
            <FilePlus size={14} />
            <span>Upload Dokumen Baru</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {supportingDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 rounded-xl bg-[#F9F8F6] border border-[#E5E5E5] hover:border-[#E5E5E5] transition-all group"
            >
              <div
                onClick={() => setPreviewDoc(doc)}
                className="flex items-center gap-3 min-w-0 cursor-pointer flex-1 mr-2"
                title="Klik untuk melihat dokumen"
              >
                <div className="p-2.5 rounded-lg bg-[#FFFFFF] text-[#666666] group-hover:bg-[#F3F3F1] group-hover:text-[#666666] transition-colors flex-shrink-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#1C1C1E] truncate group-hover:text-[#666666] transition-colors">
                    {doc.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#666666]">
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
                  className="p-1.5 rounded-lg text-[#666666] hover:text-[#666666] hover:bg-[#F3F3F1] transition-colors"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={() => handleDeleteSupportingDoc(doc.id)}
                  title="Hapus Dokumen"
                  className="p-1.5 rounded-lg text-[#666666] hover:text-[#666666] hover:bg-[#F3F3F1] transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70  animate-in fade-in duration-200">
          <div className="bg-[#F9F8F6] border border-[#E5E5E5] rounded-2xl w-full max-w-lg p-6  relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E5E5E5]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#F3F3F1] text-[#666666]">
                  <FilePlus size={18} />
                </div>
                <h3 className="text-base font-bold text-[#1C1C1E]">Upload Dokumen Pendukung</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#666666] hover:text-[#1C1C1E] p-1 rounded-lg hover:bg-[#FFFFFF] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSupportingDoc} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#666666] font-medium mb-1.5">File Dokumen</label>
                <input
                  type="file"
                  onChange={(e) => setSelectedAddFile(e.target.files?.[0] || null)}
                  className="w-full text-[#666666] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-black file:text-[#1C1C1E] hover:file:bg-[#F3F3F1] file:cursor-pointer p-2 rounded-xl bg-[#F9F8F6] border border-[#E5E5E5]"
                />
                {selectedAddFile && (
                  <p className="text-[11px] text-[#666666] mt-1 flex items-center gap-1">
                    <Check size={12} /> Terpilih: {selectedAddFile.name} ({formatFileSize(selectedAddFile.size)})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[#666666] font-medium mb-1.5">Judul Dokumen / Nama Berkas</label>
                <input
                  type="text"
                  placeholder="Contoh: Surat Perjanjian Kerja SPK Diskominfo 2024"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F9F8F6] border border-[#E5E5E5] rounded-xl text-[#1C1C1E] placeholder:text-[#666666] focus:outline-none focus:border-[#E5E5E5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#666666] font-medium mb-1.5">Instansi Terkait</label>
                  <select
                    value={addForm.instansi}
                    onChange={(e) => setAddForm({ ...addForm, instansi: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F9F8F6] border border-[#E5E5E5] rounded-xl text-[#1C1C1E] focus:outline-none focus:border-[#E5E5E5]"
                  >
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
                  </select>
                </div>
                <div>
                  <label className="block text-[#666666] font-medium mb-1.5">Nomor Surat / Berkas</label>
                  <input
                    type="text"
                    placeholder="Contoh: 027/SPK/DISKOM/2024"
                    value={addForm.nomorSurat}
                    onChange={(e) => setAddForm({ ...addForm, nomorSurat: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F9F8F6] border border-[#E5E5E5] rounded-xl text-[#1C1C1E] placeholder:text-[#666666] focus:outline-none focus:border-[#E5E5E5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#666666] font-medium mb-1.5">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan isi berkas atau tujuan upload..."
                  value={addForm.deskripsi}
                  onChange={(e) => setAddForm({ ...addForm, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F9F8F6] border border-[#E5E5E5] rounded-xl text-[#1C1C1E] placeholder:text-[#666666] focus:outline-none focus:border-[#E5E5E5] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5E5]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-[#666666] hover:text-[#1C1C1E] hover:bg-[#FFFFFF] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-black hover:bg-[#F3F3F1] text-[#1C1C1E] font-semibold transition-all  "
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
    <div className="space-y-2 p-4 rounded-xl bg-[#F9F8F6] border border-[#E5E5E5] hover:border-[#E5E5E5] transition-all">
      {/* Slot Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-bold text-[#1C1C1E]">{slot.label}</h4>
            {slot.isMandatory && (
              <span className="text-[#666666] text-sm font-bold" title="Wajib Audit BPK">
                *
              </span>
            )}
            {isMissing ? (
              <span className="badge text-[10px] bg-[#F3F3F1] text-[#666666] border border-[#E5E5E5]">
                <AlertCircle size={10} className="mr-1" />
                MISSING
              </span>
            ) : (
              <span className="badge text-[10px] bg-[#F3F3F1] text-[#666666] border border-[#E5E5E5]">
                <CheckCircle2 size={10} className="mr-1" />
                Uploaded
              </span>
            )}
          </div>
          <p className="text-xs text-[#666666] mt-0.5">{slot.helperText}</p>
          {slot.mandatoryNote && (
            <p className="text-[11px] text-[#666666] mt-1 flex items-center gap-1">
              <AlertCircle size={11} className="flex-shrink-0" />
              {slot.mandatoryNote}
            </p>
          )}
        </div>
        {isUploaded && (
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg text-[#666666] hover:text-[#666666] hover:bg-[#F3F3F1] transition-all cursor-pointer"
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
        <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E5E5E5] flex items-center justify-between gap-3">
          <div
            onClick={onPreview}
            className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
            title="Klik untuk membuka dokumen"
          >
            <div className="p-2.5 rounded-lg bg-[#F3F3F1] border border-[#E5E5E5] text-[#666666] flex-shrink-0">
              <FileCheck size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#1C1C1E] truncate hover:text-[#666666] transition-colors">
                {uploadedDoc.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#666666]">
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
              className="px-2.5 py-1.5 rounded-lg bg-[#F3F3F1] hover:bg-black text-[#666666] hover:text-[#1C1C1E] border border-[#E5E5E5] text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
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
              ? 'border-[#E5E5E5] bg-[#F3F3F1]'
              : isMissing
              ? 'border-[#E5E5E5] bg-[#F3F3F1] hover:border-[#E5E5E5]'
              : 'border-[#E5E5E5] bg-[#F9F8F6] hover:border-[#E5E5E5] hover:bg-[#FFFFFF]'
          )}
        >
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                'p-2 rounded-lg',
                isMissing ? 'bg-[#F3F3F1] text-[#666666]' : 'bg-[#FFFFFF] text-[#666666]'
              )}
            >
              <Upload size={16} />
            </div>
            <div>
              <p
                className={cn(
                  'text-xs font-semibold',
                  isMissing ? 'text-[#666666]' : 'text-[#666666]'
                )}
              >
                {isDragOver ? 'Lepas file di sini' : 'Klik atau seret file ke sini'}
              </p>
              <p className="text-[10px] text-[#666666] mt-0.5">
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
      // Generate PDF for seeded documents
      downloadPdf(
        doc.name,
        doc.name.replace(/\.[^/.]+$/, ''),
        [
          `Nomor Dokumen/Surat: ${doc.nomorSurat || '-'}`,
          `Instansi: ${doc.instansi || '-'}`,
          `Kategori: ${doc.category === 'mandatori' ? 'Dokumen Mandatori' : 'Dokumen Pendukung'}`,
          `Status: ${doc.status === 'verified' ? 'Terverifikasi' : 'Tersimpan'}`,
          `Diupload oleh: ${doc.uploadedBy || 'Sistem B2G'}`,
          '',
          'Keterangan:',
          'Dokumen resmi arsip pengadaan B2G Telkom Indonesia.',
        ]
      )
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80  animate-in fade-in duration-200">
      <div className="bg-[#F9F8F6] border border-[#E5E5E5] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col  overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5] bg-[#F9F8F6]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-[#F3F3F1] border border-[#E5E5E5] text-[#666666] flex-shrink-0">
              {isImage ? <ImageIcon size={20} /> : <FileText size={20} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[#1C1C1E] truncate">{doc.name}</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#F3F3F1] text-[#666666] border border-[#E5E5E5] flex-shrink-0">
                  {doc.status === 'verified' ? 'Terverifikasi' : 'Terunggah'}
                </span>
              </div>
              <p className="text-xs text-[#666666] mt-0.5 flex items-center gap-2">
                <span>{formatFileSize(doc.size)}</span>
                <span>•</span>
                <span>Diupload: {doc.uploadedAt}</span>
                <span>•</span>
                <span className="text-[#666666] font-medium">{doc.uploadedBy}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {contentUrl && (
              <button
                onClick={handleOpenNewTab}
                className="p-2 rounded-lg text-[#666666] hover:text-[#1C1C1E] hover:bg-[#FFFFFF] transition-colors hidden sm:flex"
                title="Buka di Tab Baru"
              >
                <ExternalLink size={16} />
              </button>
            )}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F3F3F1] text-[#1C1C1E] text-xs font-medium border border-[#E5E5E5] transition-all cursor-pointer"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#666666] hover:text-[#1C1C1E] hover:bg-[#FFFFFF] transition-colors ml-1 cursor-pointer"
              title="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body: Document Preview Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F9F8F6] space-y-5">
          
          {/* Metadata Infobar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#F9F8F6] border border-[#E5E5E5] text-xs">
            <div>
              <p className="text-[#666666] text-[11px]">Nomor Berkas / Surat</p>
              <p className="text-[#666666] font-semibold mt-0.5 truncate">{doc.nomorSurat || 'TEL.440/B2G/2024'}</p>
            </div>
            <div>
              <p className="text-[#666666] text-[11px]">Instansi Terkait</p>
              <p className="text-[#666666] font-semibold mt-0.5 truncate">{doc.instansi || 'Pemerintah Kota Semarang'}</p>
            </div>
            <div>
              <p className="text-[#666666] text-[11px]">Kategori Berkas</p>
              <p className="text-[#666666] font-semibold mt-0.5">
                {doc.isMandatory ? 'Mandatori (Audit BPK)' : 'Dokumen Pendukung'}
              </p>
            </div>
            <div>
              <p className="text-[#666666] text-[11px]">Status Legalitas</p>
              <p className="text-[#666666] font-semibold mt-0.5 flex items-center gap-1">
                <CheckCircle2 size={12} />
                Sah & Terdaftar
              </p>
            </div>
          </div>

          {/* Actual File Preview Area */}
          <div className="rounded-xl border border-[#E5E5E5] bg-[#F9F8F6] overflow-hidden flex flex-col items-center justify-center min-h-[380px]">
            {isImage && contentUrl ? (
              <div className="p-4 flex items-center justify-center w-full">
                <img
                  src={contentUrl}
                  alt={doc.name}
                  className="max-h-[500px] w-auto max-w-full rounded-lg object-contain "
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
              <div className="w-full max-w-2xl bg-white text-[#1C1C1E] p-8 rounded-lg  my-4 text-xs font-sans relative select-text border border-[#E5E5E5]">
                {/* Official Telkom Kop Surat */}
                <div className="flex items-start justify-between pb-4 border-b-2 border-[#E5E5E5] mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center text-[#1C1C1E] font-extrabold text-xl ">
                      T
                    </div>
                    <div>
                      <h4 className="font-extrabold text-[#1C1C1E] text-sm tracking-wide">
                        PT TELKOM INDONESIA (PERSERO) TBK
                      </h4>
                      <p className="text-[11px] text-[#666666] font-medium">
                        DIVISI GOVERNMENT & ENTERPRISE SERVICE — WITEL JATENG UTARA
                      </p>
                      <p className="text-[10px] text-[#666666]">
                        Jl. Pahlawan No. 10, Semarang · Call Center 1500250 · www.telkom.co.id
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F3F3F1] text-[#1C1C1E] uppercase border border-[#E5E5E5]">
                      Dokumen Sah B2G
                    </span>
                    <p className="text-[10px] text-[#666666] mt-1">Ref: {doc.nomorSurat || 'TEL.027/SMG/2024'}</p>
                  </div>
                </div>

                {/* Document Body */}
                <div className="space-y-4 text-[#1C1C1E] leading-relaxed">
                  <div className="text-center py-2">
                    <h5 className="font-bold text-[#1C1C1E] text-sm uppercase underline tracking-wide">
                      {doc.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')}
                    </h5>
                    <p className="text-[11px] text-[#666666] mt-0.5">
                      Nomor: {doc.nomorSurat || '440/BA-TELKOM/JTG-UTARA/2024'}
                    </p>
                  </div>

                  <p className="text-justify text-[11px]">
                    Pada hari ini telah dilakukan verifikasi dan pemeriksaan kelengkapan administrasi pengadaan
                    layanan konektivitas &amp; infrastruktur digital untuk instansi{' '}
                    <strong>{doc.instansi || 'Pemerintah Kota Semarang'}</strong> di bawah pengawasan Account Manager
                    Telkom Witel Jateng Utara.
                  </p>

                  <div className="bg-[#F3F3F1] p-3.5 rounded-lg border border-[#E5E5E5] space-y-1.5 text-[11px]">
                    <div className="grid grid-cols-3">
                      <span className="text-[#666666]">Nama Dokumen</span>
                      <span className="col-span-2 font-semibold text-[#1C1C1E]">{doc.name}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-[#666666]">Keterangan / Scope</span>
                      <span className="col-span-2 text-[#1C1C1E]">{doc.deskripsi || 'Layanan Astinet & Intranet Pemda'}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-[#666666]">Petugas Upload</span>
                      <span className="col-span-2 text-[#1C1C1E]">{doc.uploadedBy}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-[#666666]">Kepatuhan Regulasi</span>
                      <span className="col-span-2 text-[#1C1C1E] font-semibold">
                        Sesuai Ketentuan Audit BPK &amp; Perpres Pengadaan Pemerintah
                      </span>
                    </div>
                  </div>

                  {/* Signatures Mockup */}
                  <div className="pt-6 grid grid-cols-2 text-center text-[11px] text-[#1C1C1E]">
                    <div>
                      <p className="text-[#666666]">Pihak Pelanggan (Pemda)</p>
                      <div className="h-14 flex items-center justify-center font-serif italic text-[#666666] text-xs">
                        [Tanda Tangan &amp; Stempel Basah]
                      </div>
                      <p className="font-bold text-[#1C1C1E]">Pejabat Pembuat Komitmen (PPK)</p>
                      <p className="text-[10px] text-[#666666]">{doc.instansi || 'Pemerintah Kota Semarang'}</p>
                    </div>

                    <div>
                      <p className="text-[#666666]">Pihak Penyedia</p>
                      <div className="h-14 flex items-center justify-center">
                        <span className="px-2 py-1 rounded border border-[#E5E5E5] bg-[#F3F3F1] text-[#1C1C1E] text-[10px] font-bold">
                          ✓ Digital Signed Telkom e-Sign
                        </span>
                      </div>
                      <p className="font-bold text-[#1C1C1E]">{doc.uploadedBy.split('(')[0]}</p>
                      <p className="text-[10px] text-[#666666]">PT Telkom Indonesia (Persero) Tbk</p>
                    </div>
                  </div>
                </div>

                {/* Document Footer Watermark */}
                <div className="mt-8 pt-3 border-t border-[#E5E5E5] text-center text-[9px] text-[#666666] uppercase tracking-widest">
                  Dokumen Resmi Diarsipkan di B2Gov Portal · Witel Jateng Utara
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#E5E5E5] bg-[#F9F8F6] text-xs">
          <span className="text-[#666666]">
            Terverifikasi secara sistem · Format {doc.name.split('.').pop()?.toUpperCase()}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#F3F3F1] text-[#1C1C1E] font-medium transition-colors cursor-pointer"
          >
            Tutup Pratinjau
          </button>
        </div>

      </div>
    </div>
  )
}
