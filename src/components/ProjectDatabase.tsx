import React, { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  Building2,
  Check,
  ChevronDown,
  Download,
  Edit3,
  FileSpreadsheet,
  FileText,
  FolderPlus,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { CustomersDB, ProjectsDB, ServicesDB, type Customer, type ProjectEntry, type ServiceItem } from '../lib/db'
import { ServicePointsModal } from './ServicePointsModal'
import { MASTER_INSTANSI } from '../lib/constants'
import {
  getProjectDocumentTypes,
  ProjectDocuments,
  type ProjectDocument,
  type ProjectDocumentType,
} from '../lib/projectDocuments'

type ProjectStage = ProjectEntry['stage']
type ProjectForm = Omit<ProjectEntry, 'id' | 'createdAt' | 'updatedAt'>
type SelectedFiles = Partial<Record<ProjectDocumentType, File>>

const STAGES: ProjectStage[] = ['F0', 'F1', 'F2', 'F3', 'F4', 'F5', 'Cancel', 'Loss']
const STAGE_PROGRESS: Record<ProjectStage, number> = {
  F0: 0, F1: 20, F2: 40, F3: 60, F4: 80, F5: 100, Loss: 0, Cancel: 0,
}
const STAGE_COLORS: Record<ProjectStage, string> = {
  F0: 'bg-[#F3F3F1] text-[#666666] border-[#E5E5E5]',
  F1: 'bg-[#F3F3F1] text-[#666666] border-[#E5E5E5]',
  F2: 'bg-[#F3F3F1] text-[#666666] border-[#E5E5E5]',
  F3: 'bg-[#F3F3F1] text-[#666666] border-[#E5E5E5]',
  F4: 'bg-[#F3F3F1] text-[#666666] border-[#E5E5E5]',
  F5: 'bg-[#F3F3F1] text-[#666666] border-[#E5E5E5]',
  Loss: 'bg-[#F3F3F1] text-[#666666] border-[#E5E5E5]',
  Cancel: 'bg-[#F3F3F1] text-[#666666] border-[#E5E5E5]',
}
const STATUSES: ProjectEntry['status'][] = ['Active', 'At Risk', 'Completed', 'Lost', 'Cancelled']
const STATUS_COLORS: Record<ProjectEntry['status'], string> = {
  Active: 'bg-[#F3F3F1] text-[#666666] border-[#E5E5E5]',
  'At Risk': 'bg-[#F3F3F1] text-[#666666] border-[#E5E5E5]',
  Completed: 'bg-[#F3F3F1] text-[#666666] border-[#E5E5E5]',
  Lost: 'bg-[#F3F3F1] text-[#666666] border-[#E5E5E5]',
  Cancelled: 'bg-[#F3F3F1] text-[#666666] border-[#E5E5E5]',
}
const CATEGORIES: ProjectEntry['category'][] = ['On Channel', 'GTMA', 'NGTMA']
const AGENCY_BY_NAME = new Map<string, (typeof MASTER_INSTANSI)[number]>(
  MASTER_INSTANSI.map((agency) => [agency.nama, agency]),
)

function formatIDR(amount: number) {
  if (!amount) return 'Rp 0'
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(2).replace('.00', '')} M`
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(0)} Jt`
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function formatBudget(amount: number) {
  return amount ? amount.toLocaleString('id-ID', { maximumFractionDigits: 2 }) : ''
}

function formatBudgetInput(value: string) {
  const cleaned = value.replace(/[^\d,]/g, '')
  const [integerPart, fractionalPart] = cleaned.split(',', 2)
  const groupedInteger = integerPart ? Number(integerPart).toLocaleString('id-ID') : ''
  return fractionalPart === undefined ? groupedInteger : `${groupedInteger},${fractionalPart.slice(0, 2)}`
}

function parseBudgetInput(value: string) {
  const [integerPart, fractionalPart] = value.replace(/\./g, '').split(',', 2)
  const amount = Number(`${integerPart || '0'}${fractionalPart ? `.${fractionalPart}` : ''}`)
  return Number.isFinite(amount) ? amount : 0
}

function bandwidthToMbps(bandwidth?: string) {
  const match = bandwidth?.trim().match(/([\d.,]+)\s*(kbps|mbps|gbps)\b/i)
  if (!match) return null
  const amount = Number(match[1].replace(',', '.'))
  if (!Number.isFinite(amount)) return null
  const unit = match[2].toLowerCase()
  const multiplier = unit === 'gbps' ? 1000 : unit === 'kbps' ? 0.001 : 1
  return Number((amount * multiplier).toFixed(3))
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function blankForm(category: ProjectEntry['category'] = 'On Channel'): ProjectForm {
  return {
    idLOP: '',
    projectName: '',
    agency: '',
    pemdaName: '',
    agencyType: '',
    region: '',
    budget: 0,
    servicePrice: 0,
    procurementMethod: 'E-Katalog',
    stage: 'F0',
    progress: 0,
    startDate: '',
    endDate: '',
    pic: '',
    category,
    serviceType: 'Astinet',
    totalCapacityMbps: null,
    sid: null,
    subsidiaryName: '',
    customerName: '',
    dinasName: '',
    status: 'Active',
    notes: '',
  }
}

function agencyFields(name: string) {
  const agency = AGENCY_BY_NAME.get(name)
  return {
    pemdaName: name,
    agencyType: agency?.tipe ?? 'Lainnya',
    region: agency?.wilayah ?? '',
  }
}

interface ProjectModalProps {
  mode: 'add' | 'edit'
  initial: ProjectForm
  fixedCategory?: ProjectEntry['category']
  onSave: (form: ProjectForm, files: SelectedFiles) => Promise<void>
  onClose: () => void
  saving: boolean
  saveError: string
}

function ProjectModal({ mode, initial, fixedCategory, onSave, onClose, saving, saveError }: ProjectModalProps) {
  const [form, setForm] = useState(initial)
  const [files, setFiles] = useState<SelectedFiles>({})
  const [services] = useState<ServiceItem[]>(() => ServicesDB.getAll())
  const [customers] = useState<Customer[]>(() => CustomersDB.getAll())
  const [servicePriceInput, setServicePriceInput] = useState(() => formatBudget(initial.servicePrice))
  const [documents, setDocuments] = useState<ProjectDocument[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [documentError, setDocumentError] = useState('')

  useEffect(() => {
    let active = true
    if (mode === 'edit' && initial.idLOP) {
      ProjectDocuments.list(initial.idLOP)
        .then((list) => { if (active) setDocuments(list) })
        .catch((error: unknown) => {
          if (active) setDocumentError(error instanceof Error ? error.message : 'Gagal memuat dokumen.')
        })
    }
    return () => { active = false }
  }, [initial.idLOP, mode])

  const set = <K extends keyof ProjectForm>(field: K, value: ProjectForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleStageChange = (stage: ProjectStage) => {
    const status: ProjectEntry['status'] =
      stage === 'F5' ? 'Completed' : stage === 'Loss' ? 'Lost' : stage === 'Cancel' ? 'Cancelled' : 'Active'
    setForm((current) => ({
      ...current,
      stage,
      progress: STAGE_PROGRESS[stage],
      status,
    }))
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!form.idLOP.trim()) nextErrors.idLOP = 'ID LOP wajib diisi agar dokumen dapat ditautkan'
    if (!form.projectName.trim()) nextErrors.projectName = 'Nama proyek wajib diisi'
    if (form.category === 'NGTMA' && !form.subsidiaryName?.trim()) {
      nextErrors.subsidiaryName = 'Nama anak perusahaan wajib diisi untuk NGTMA'
    }
    if (!form.agency) nextErrors.agency = 'Instansi wajib dipilih'
    if (!form.pemdaName.trim()) nextErrors.pemdaName = 'Nama Pemda wajib diisi'
    if (mode === 'edit' && (!form.servicePrice || form.servicePrice < 0)) {
      nextErrors.servicePrice = 'Harga layanan tidak boleh negatif'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (validate()) void onSave(form, files)
  }

  const matchingServices = services.filter((service) => service.category === (fixedCategory ?? form.category))
  const availablePICs = customers.filter((customer) => (
    customer.name.trim().toLocaleLowerCase() === form.agency.trim().toLocaleLowerCase()
    && customer.picName.trim()
  ))
  const showPICDropdown = availablePICs.length > 0
  const documentTypes = getProjectDocumentTypes(form.category)

  const selectFile = (documentType: ProjectDocumentType, file?: File) => {
    setFiles((current) => {
      const next = { ...current }
      if (file) next[documentType] = file
      else delete next[documentType]
      return next
    })
  }



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 " onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-[#F9F8F6] border border-[#E5E5E5] rounded-2xl overflow-hidden shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5] bg-[#F9F8F6] z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F3F3F1] border border-[#E5E5E5] flex items-center justify-center">
              <FolderPlus size={16} className="text-[#666666]" />
            </div>
            <h3 className="text-base font-bold text-[#1C1C1E]">{mode === 'add' ? 'Input Proyek Baru' : 'Edit Proyek'}</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#FFFFFF] text-[#666666]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0"><div className="flex-1 overflow-y-auto p-6 space-y-5">{saveError && <div role="alert" className="rounded-xl border border-[#E5E5E5] bg-[#F3F3F1] p-3 text-xs text-[#666666]">{saveError}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="ID LOP" error={errors.idLOP}>
              <input value={form.idLOP} onChange={(event) => set('idLOP', event.target.value)} placeholder="LOP-2026-SMG-001" className="form-input" />
            </Field>
            {!fixedCategory && (
              <Field label="Kategori Kontrak">
                <Select value={form.category} onChange={(value) => {
                  set('category', value as ProjectEntry['category'])
                }}>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category === 'On Channel' ? 'Own Channel' : category}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          </div>
          <Field label="Nama Proyek" error={errors.projectName}>
            <input value={form.projectName} onChange={(event) => set('projectName', event.target.value)} className="form-input" />
          </Field>
          {mode === 'edit' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nama Pemda" error={errors.pemdaName}>
                <input
                  value={form.pemdaName}
                  onChange={(event) => set('pemdaName', event.target.value)}
                  placeholder="Contoh: Pemkot Pekalongan"
                  className="form-input"
                />
              </Field>
            <Field label="Nama Dinas">
              <input
                value={form.dinasName ?? ''}
                onChange={(event) => set('dinasName', event.target.value)}
                placeholder="Contoh: Kominfo atau Dukcapil"
                className="form-input"
              />
            </Field>
            </div>
          )}
          {mode === 'add' && (
            <Field label="Nama Dinas">
              <input
                value={form.dinasName ?? ''}
                onChange={(event) => set('dinasName', event.target.value)}
                placeholder="Contoh: Kominfo atau Dukcapil"
                className="form-input"
              />
            </Field>
          )}
          {mode === 'edit' && (
            <Field label="Harga Layanan" error={errors.servicePrice}>
              <div className="flex items-center gap-2">
                <span className="flex h-[38px] items-center rounded-lg border border-[#E5E5E5] bg-[#FFFFFF] px-3 text-xs font-semibold text-[#666666] select-none">
                  Rp
                </span>
                <input
                  inputMode="decimal"
                  value={servicePriceInput}
                  onChange={(event) => {
                    const formatted = formatBudgetInput(event.target.value)
                    setServicePriceInput(formatted)
                    set('servicePrice', parseBudgetInput(formatted))
                  }}
                  placeholder="Contoh: 10.000.000"
                  className="form-input flex-1"
                />
              </div>
            </Field>
          )}
          {form.category === 'NGTMA' && (
            <div className="p-4 rounded-xl bg-[#F3F3F1] border border-[#E5E5E5] space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#666666] uppercase tracking-wider">
                  Field Khusus Kategori NGTMA
                </span>
              </div>
              <Field label="Nama Anak Perusahaan Telkom" error={errors.subsidiaryName}>
                <input
                  value={form.subsidiaryName ?? ''}
                  onChange={(event) => set('subsidiaryName', event.target.value)}
                  placeholder="Nama anak perusahaan (contoh: Telkom Akses / Infomedia)"
                  className="form-input"
                />
              </Field>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Instansi" error={errors.agency}>
              <Select
                value={form.agency}
                onChange={(agency) => setForm((current) => ({
                  ...current,
                  agency,
                  ...agencyFields(agency),
                  ...(mode === 'add' ? { customerName: agency } : {}),
                  ...(current.agency !== agency ? { pic: '' } : {}),
                }))}
              >
                <option value="">Pilih instansi pelanggan</option>
                {MASTER_INSTANSI.map((agency) => <option key={agency.nama}>{agency.nama}</option>)}
              </Select>
            </Field>
            <Field label="Metode Pengadaan">
              <Select
                value={form.procurementMethod}
                onChange={(value) => set('procurementMethod', value as ProjectEntry['procurementMethod'])}
              >
                <option>E-Katalog</option>
                <option>Pengadaan Langsung</option>
                <option>Penunjukan Langsung</option>
                <option>Tender Cepat</option>
                <option>Tender</option>
              </Select>
            </Field>
          </div>
          {mode === 'edit' && (
            <>
              <Field label="Tahap Proyek">
                <div className="flex flex-wrap gap-2">
                  {STAGES.map((stage) => (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => handleStageChange(stage)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-bold border',
                        form.stage === stage ? STAGE_COLORS[stage] : 'bg-[#FFFFFF] border-[#E5E5E5] text-[#666666]',
                      )}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label={`Progress (${form.progress}%)`}>
                <input type="range" min={0} max={100} value={form.progress} onChange={(event) => set('progress', Number(event.target.value))} className="w-full accent-[#111111]" />
              </Field>
            </>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="PIC" error={errors.pic}>
              {showPICDropdown ? (
                <Select value={form.pic} onChange={(value) => set('pic', value)}>
                  <option value="">Pilih PIC dari Database Instansi</option>
                  {form.pic && !availablePICs.some((customer) => customer.picName === form.pic) && (
                    <option value={form.pic}>{form.pic} (data proyek sebelumnya)</option>
                  )}
                  {availablePICs.map((customer) => (
                    <option key={customer.id} value={customer.picName}>{customer.picName} ({customer.name})</option>
                  ))}
                </Select>
              ) : (
                <input
                  value={form.pic}
                  onChange={(event) => set('pic', event.target.value)}
                  placeholder="Nama PIC / penanggung jawab"
                  className="form-input"
                />
              )}
            </Field>
            {mode === 'add' && (
              <Field label="Nama Pelanggan">
                <input
                  value={form.customerName ?? ''}
                  onChange={(event) => set('customerName', event.target.value)}
                  placeholder="Masukkan nama pelanggan"
                  className="form-input"
                />
              </Field>
            )}
            {mode === 'edit' && (
              <Field label="Status">
                <Select value={form.status} onChange={(value) => set('status', value as ProjectEntry['status'])}>
                  {STATUSES.map((status) => <option key={status}>{status}</option>)}
                </Select>
              </Field>
            )}
          </div>
          {mode === 'edit' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Tanggal Mulai">
                <input type="date" value={form.startDate} onChange={(event) => set('startDate', event.target.value)} className="form-input" />
              </Field>
              <Field label="Tanggal Selesai">
                <input type="date" value={form.endDate} onChange={(event) => set('endDate', event.target.value)} className="form-input" />
              </Field>
            </div>
          )}
          <Field label="Catatan">
            <textarea value={form.notes ?? ''} onChange={(event) => set('notes', event.target.value)} rows={2} className="form-input resize-none" />
          </Field>

          {mode === 'edit' && (
            <section className="space-y-3 border-t border-[#E5E5E5] pt-4">
              <div>
                <h4 className="text-sm font-semibold text-[#1C1C1E]">Dokumen berdasarkan ID LOP</h4>
                <p className="text-xs text-[#666666] mt-1">File PDF, Office, atau gambar; maksimal 10 MB per dokumen.</p>
                {form.category === 'NGTMA' && (
                  <p className="mt-2 text-[11px] leading-relaxed text-[#666666]">
                    Dokumen ini wajib sebagai evidence Kontrak Management dan dapat dilengkapi bertahap saat edit. Kirim melalui NDE ke Segmen dengan tembusan GPO untuk pencatatan performa dan input pada aplikasi Web NGTMA.
                  </p>
                )}
              </div>
              {documentError && <p role="alert" className="text-xs text-[#666666]">{documentError}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {documentTypes.map((documentType) => {
                  const existing = documents.find((document) => (
                    document.documentType === documentType.id || documentType.aliases?.includes(document.documentType)
                  ))
                  return (
                    <label key={documentType.id} className="block p-3 rounded-xl border border-[#E5E5E5] bg-[#F9F8F6]">
                      <span className="block text-xs font-semibold text-[#666666] mb-2">{documentType.label}</span>
                      {documentType.helperText && <span className="mb-2 block text-[11px] text-[#666666]">{documentType.helperText}</span>}
                      {documentType.templateUrl && (
                        <a href={documentType.templateUrl} target="_blank" rel="noreferrer" className="mb-2 inline-block text-[11px] text-[#666666] hover:text-[#666666]">
                          Unduh template
                        </a>
                      )}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                        onChange={(event) => selectFile(documentType.id, event.target.files?.[0])}
                        className="block w-full text-xs text-[#666666] file:mr-2 file:rounded-lg file:border-0 file:bg-[#F3F3F1] file:px-2 file:py-1 file:text-xs file:text-[#666666]"
                      />
                      <span className="block text-[11px] text-[#666666] mt-1 truncate">
                        {files[documentType.id]?.name ?? (existing ? `Tersimpan: ${existing.originalName}` : 'Belum diunggah')}
                      </span>
                    </label>
                  )
                })}
              </div>
            </section>
          )}

          </div><div className="sticky bottom-0 flex gap-3 px-6 py-4 border-t border-[#E5E5E5] bg-[#F9F8F6] z-10"><button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={saving}>Batal</button><button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={saving}><Check size={15} />{saving ? "Menyimpan..." : mode === "add" ? "Simpan Proyek" : "Update Proyek"}</button></div></form>
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#666666] mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 flex items-center gap-1 text-xs text-[#666666]"><AlertCircle size={11} />{error}</p>}
    </div>
  )
}

function Select({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <select value={value} onChange={(event) => onChange(event.target.value)} className="form-input appearance-none pr-8">
        {children}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] pointer-events-none" />
    </div>
  )
}

export function ProjectDocumentsModal({ idLOP, category, onClose }: {
  idLOP: string
  category: ProjectEntry['category']
  onClose: () => void
}) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<ProjectDocumentType | null>(null)

  useEffect(() => {
    ProjectDocuments.list(idLOP)
      .then(setDocuments)
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Gagal memuat dokumen.'))
      .finally(() => setLoading(false))
  }, [idLOP])

  const handleDownload = async (document: ProjectDocument) => {
    setDownloading(document.documentType)
    setError('')
    try {
      await ProjectDocuments.download(idLOP, document.documentType, document.originalName)
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Gagal mengunduh dokumen.')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <section className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#E5E5E5] bg-[#F9F8F6] p-5 ">
        <header className="flex items-start justify-between border-b border-[#E5E5E5] pb-4">
          <div>
            <h3 className="font-bold text-[#1C1C1E]">Dokumen Proyek</h3>
            <p className="mt-1 font-mono text-xs text-[#666666]">{idLOP}</p>
          </div>
          <button type="button" onClick={onClose} className="text-[#666666] hover:text-[#1C1C1E]"><X size={18} /></button>
        </header>
        {error && <p className="mt-3 text-xs text-[#666666]">{error}</p>}
        {loading ? <p className="py-6 text-sm text-[#666666]">Memuat dokumen...</p> : (
          <ul className="mt-3 divide-y divide-[#E5E5E5]">
            {getProjectDocumentTypes(category).map((type) => {
              const document = documents.find((item) => item.documentType === type.id)
                ?? documents.find((item) => type.aliases?.includes(item.documentType))
              return (
                <li key={type.id} className="space-y-2 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#666666]">{type.label}</p>
                      <p className="truncate text-xs text-[#666666]">
                        {document ? `${document.originalName} · ${formatBytes(document.sizeBytes)}` : 'Belum diunggah'}
                      </p>
                    </div>
                    {document && (
                      <button
                        type="button"
                        onClick={() => void handleDownload(document)}
                        disabled={downloading === type.id}
                        title={`Unduh ${document.originalName}`}
                        aria-label={`Unduh ${document.originalName}`}
                        className="rounded-lg p-2 text-[#666666] hover:bg-[#F3F3F1] disabled:opacity-50"
                      >
                        <Download size={16} />
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

export function ProjectDatabase({
  initialCategory,
  showStats = true,
}: {
  initialCategory?: ProjectEntry['category']
  showStats?: boolean
}) {
  const [projects, setProjects] = useState<ProjectEntry[]>([])
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState('Semua')
  const [filterAgency, setFilterAgency] = useState('Semua Instansi')
  const [filterCategory, setFilterCategory] = useState(initialCategory ?? 'Semua')
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; editId?: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [documentsFor, setDocumentsFor] = useState<{ idLOP: string; category: ProjectEntry['category'] } | null>(null)
  const [servicePointsFor, setServicePointsFor] = useState<string | null>(null)
  const [pageError, setPageError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setProjects(await ProjectsDB.getAll())
      setPageError('')
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Gagal memuat proyek.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const filtered = projects.filter((project) => (
    (project.projectName.toLowerCase().includes(search.toLowerCase()) ||
      project.agency.toLowerCase().includes(search.toLowerCase()) ||
      project.pemdaName.toLowerCase().includes(search.toLowerCase()) ||
      (project.dinasName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      project.idLOP.toLowerCase().includes(search.toLowerCase())) &&
    (filterStage === 'Semua' || project.stage === filterStage) &&
    (filterAgency === 'Semua Instansi' || project.agency === filterAgency) &&
    (initialCategory ? project.category === initialCategory : filterCategory === 'Semua' || project.category === filterCategory)
  ))
  const totalServicePrice = filtered.reduce((total, project) => total + project.servicePrice, 0)
  const wins = filtered.filter((project) => project.stage === 'F5').length
  const atRisk = filtered.filter((project) => project.status === 'At Risk').length

  const handleSave = async (form: ProjectForm, files: SelectedFiles) => {
    if (!modal) return
    setSaving(true)
    setPageError('')
    try {
      const mode = modal.mode
      const baseForm = {
        ...form,
        budget: form.budget && form.budget > 0 ? form.budget : form.servicePrice,
      }
      const projectForm = initialCategory ? { ...baseForm, category: initialCategory } : baseForm
      const saved = mode === 'add'
        ? await ProjectsDB.create(projectForm)
        : await ProjectsDB.update(modal.editId!, projectForm)

      setProjects((current) => mode === 'add'
        ? [saved, ...current]
        : current.map((project) => project.id === saved.id ? saved : project))
      for (const documentType of getProjectDocumentTypes(projectForm.category)) {
        const file = files[documentType.id]
        if (file) await ProjectDocuments.upload(saved.idLOP, documentType.id, file)
      }
      setModal(null)
      await load()
      if (mode === 'add') setServicePointsFor(saved.idLOP)
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Gagal menyimpan proyek atau dokumen.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (idLOP: string) => {
    try {
      await ProjectsDB.delete(idLOP)
      setDeleteConfirm(null)
      await load()
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Gagal menghapus proyek.')
    }
  }

  const editing = modal?.mode === 'edit'
    ? projects.find((project) => project.id === modal.editId)
    : undefined
  const initial: ProjectForm = editing
    ? {
        idLOP: editing.idLOP,
        projectName: editing.projectName,
        agency: editing.agency,
        pemdaName: editing.pemdaName || editing.agency,
        agencyType: editing.agencyType,
        region: editing.region,
        budget: editing.budget,
        servicePrice: editing.servicePrice,
        procurementMethod: editing.procurementMethod,
        stage: editing.stage,
        progress: editing.progress,
        startDate: editing.startDate ?? '',
        endDate: editing.endDate ?? '',
        pic: editing.pic,
        category: editing.category,
        serviceType: editing.serviceType,
        totalCapacityMbps: editing.totalCapacityMbps,
        sid: editing.sid,
        subsidiaryName: editing.subsidiaryName ?? '',
        customerName: editing.customerName ?? '',
        dinasName: editing.dinasName ?? '',
        status: editing.status,
        notes: editing.notes ?? '',
      }
    : blankForm(initialCategory)

  return (
    <div className="space-y-6">
      {showStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Proyek', value: filtered.length, color: 'text-[#666666]' },
            { label: 'Total Harga Layanan', value: formatIDR(totalServicePrice), color: 'text-[#666666]' },
            { label: 'Tahap F5', value: wins, color: 'text-[#666666]' },
            { label: 'At Risk', value: atRisk, color: 'text-[#666666]' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-[#E5E5E5] rounded-xl px-5 py-4">
              <p className="text-xs text-[#666666]">{stat.label}</p>
              <p className={cn('mt-0.5 text-xl font-bold', stat.color)}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {pageError && <div role="alert" className="rounded-xl border border-[#E5E5E5] bg-[#F3F3F1] p-3 text-sm text-[#666666]">{pageError}</div>}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-48 flex-1">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari ID LOP, proyek, instansi..." className="form-input" />
        </div>
        <select value={filterAgency} onChange={(event) => setFilterAgency(event.target.value)} className="form-input w-auto">
          <option>Semua Instansi</option>
          {MASTER_INSTANSI.map((agency) => <option key={agency.nama}>{agency.nama}</option>)}
        </select>
        <select value={filterStage} onChange={(event) => setFilterStage(event.target.value)} className="form-input w-auto">
          <option value="Semua">Semua Tahap</option>
          {STAGES.map((stage) => <option key={stage}>{stage}</option>)}
        </select>
        {!initialCategory && (
          <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)} className="form-input w-auto">
            <option value="Semua">Semua Kategori</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category === 'On Channel' ? 'Own Channel' : category}
              </option>
            ))}
          </select>
        )}
        <button type="button" onClick={() => { setPageError(''); setModal({ mode: 'add' }) }} className="btn-primary flex items-center gap-2">
          <Plus size={15} />Input Proyek
        </button>
      </div>

      <div className="bg-white border border-[#E5E5E5] overflow-x-auto rounded-2xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E5E5E5]">
              {['Proyek', 'Nama Pemda', 'Kategori', 'Harga Layanan', 'Tahap', 'Kapasitas', 'Aksi'].map((heading) => (
                <th key={heading} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#666666]">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center text-sm text-[#666666]">Memuat proyek...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-sm text-[#666666]">Belum ada proyek untuk filter ini</td></tr>
            ) : filtered.map((project) => (
              <tr key={project.id} className="group border-b border-[#E5E5E5] hover:bg-[#FFFFFF]">
                <td className="px-4 py-3">
                  <button type="button" onClick={() => setDocumentsFor({ idLOP: project.idLOP, category: project.category })} className="flex items-center gap-1 font-mono text-xs text-[#666666] hover:text-[#666666]">
                    <FileText size={12} />{project.idLOP}
                  </button>
                  <p className="mt-1 max-w-xs truncate text-sm font-semibold text-[#1C1C1E]">{project.projectName}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-xs text-[#666666]"><Building2 size={11} />{project.pemdaName || project.agency}</span>
                  {project.dinasName && <span className="mt-1 block text-[11px] text-[#666666]">{project.dinasName}</span>}
                </td>
                <td className="px-4 py-3 text-xs text-[#666666]">
                  <div>{project.category === 'On Channel' ? 'Own Channel' : project.category}</div>
                  {project.subsidiaryName && <div className="mt-1 text-[#666666]">{project.subsidiaryName}</div>}
                  {project.sid && <div className="mt-1 text-[#666666]">{project.sid}</div>}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-[#666666]">{formatIDR(project.servicePrice)}</td>
                <td className="px-4 py-3"><span className={cn('rounded-full border px-2.5 py-1 text-[10px] font-bold', STAGE_COLORS[project.stage])}>{project.stage}</span></td>
                <td className="px-4 py-3 text-xs text-[#666666]">{project.totalCapacityMbps === null ? '—' : `${project.totalCapacityMbps} Mbps`}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button type="button" aria-label={`Import SID ${project.idLOP}`} title="Import SID" onClick={() => setServicePointsFor(project.idLOP)} className="rounded-lg p-1.5 text-[#666666] hover:bg-[#F3F3F1] hover:text-[#666666]"><FileSpreadsheet size={13} /></button>
                    <button type="button" aria-label={`Edit ${project.idLOP}`} onClick={() => { setPageError(''); setModal({ mode: 'edit', editId: project.id }) }} className="rounded-lg p-1.5 text-[#666666] hover:bg-[#F3F3F1] hover:text-[#666666]"><Edit3 size={13} /></button>
                    <button type="button" aria-label={`Hapus ${project.idLOP}`} onClick={() => setDeleteConfirm(project.idLOP)} className="rounded-lg p-1.5 text-[#666666] hover:bg-[#F3F3F1] hover:text-[#666666]"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <ProjectModal
          mode={modal.mode}
          initial={initial}
          fixedCategory={initialCategory}
          onSave={handleSave}
          onClose={() => setModal(null)}
          saving={saving}
          saveError={pageError}
        />
      )}
      {documentsFor && (
        <ProjectDocumentsModal
          idLOP={documentsFor.idLOP}
          category={documentsFor.category}
          onClose={() => setDocumentsFor(null)}
        />
      )}
      {servicePointsFor && <ServicePointsModal idLOP={servicePointsFor} onClose={() => setServicePointsFor(null)} />}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDeleteConfirm(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-[#E5E5E5] bg-[#F9F8F6] p-6">
            <h4 className="text-sm font-bold text-[#1C1C1E]">Hapus Proyek</h4>
            <p className="my-4 text-sm text-[#666666]">Hapus proyek {deleteConfirm} beserta dokumennya?</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Batal</button>
              <button type="button" onClick={() => void handleDelete(deleteConfirm)} className="flex-1 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-[#1C1C1E]">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
