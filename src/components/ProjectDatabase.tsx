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

const STAGES: ProjectStage[] = ['F0', 'F1', 'F2', 'F3', 'F4', 'F5', 'Cancel']
const STAGE_PROGRESS: Record<ProjectStage, number> = {
  F0: 0, F1: 20, F2: 40, F3: 60, F4: 80, F5: 100, Loss: 0, Cancel: 0,
}
const STAGE_COLORS: Record<ProjectStage, string> = {
  F0: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  F1: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  F2: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  F3: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  F4: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  F5: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Loss: 'bg-red-500/20 text-red-400 border-red-500/30',
  Cancel: 'bg-slate-700 text-slate-300 border-slate-600',
}
const STATUSES: ProjectEntry['status'][] = ['Active', 'At Risk', 'Completed', 'Lost', 'Cancelled']
const STATUS_COLORS: Record<ProjectEntry['status'], string> = {
  Active: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'At Risk': 'bg-red-500/20 text-red-400 border-red-500/30',
  Completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Lost: 'bg-slate-700 text-slate-300 border-slate-600',
  Cancelled: 'bg-slate-700 text-slate-300 border-slate-600',
}
const CATEGORIES: ProjectEntry['category'][] = ['On Channel', 'GTMA', 'NGTMA']
const SERVICE_TYPES = ['Astinet', 'VPN IP', 'Metro Ethernet', 'SD-WAN', 'Google Workspace', 'Mikrotik', 'CPE', 'Lainnya']
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

function cursorAfterDigits(value: string, digitCount: number) {
  if (!digitCount) return 0
  let digitsSeen = 0
  for (let index = 0; index < value.length; index += 1) {
    if (/\d/.test(value[index])) digitsSeen += 1
    if (digitsSeen === digitCount) return index + 1
  }
  return value.length
}

function cursorAfterBudgetInput(value: string, integerDigits: number, hasDecimal: boolean, fractionalDigits: number) {
  if (hasDecimal) {
    const separatorIndex = value.indexOf(',')
    return separatorIndex < 0 ? value.length : Math.min(value.length, separatorIndex + 1 + fractionalDigits)
  }
  return cursorAfterDigits(value, integerDigits)
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
    agencyType: '',
    region: '',
    budget: 0,
    procurementMethod: 'Tender/e-Katalog',
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
    status: 'Active',
    notes: '',
  }
}

function agencyFields(name: string) {
  const agency = AGENCY_BY_NAME.get(name)
  return { agencyType: agency?.tipe ?? 'Lainnya', region: agency?.wilayah ?? '' }
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
  const [selectedCatalogServiceId, setSelectedCatalogServiceId] = useState('')
  const [budgetInput, setBudgetInput] = useState(() => formatBudget(initial.budget))
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
    if (form.budget <= 0) nextErrors.budget = 'Anggaran harus lebih dari 0'
    if (!form.pic.trim()) nextErrors.pic = 'PIC wajib diisi'
    if (form.totalCapacityMbps !== null && form.totalCapacityMbps < 0) {
      nextErrors.totalCapacityMbps = 'Kapasitas tidak boleh negatif'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (validate()) void onSave(form, files)
  }

  const matchingServices = services.filter((service) => service.category === (fixedCategory ?? form.category))
  const availablePICs = customers.filter((customer) => customer.picName.trim())
  const documentTypes = getProjectDocumentTypes(form.category)

  const selectFile = (documentType: ProjectDocumentType, file?: File) => {
    setFiles((current) => {
      const next = { ...current }
      if (file) next[documentType] = file
      else delete next[documentType]
      return next
    })
  }

  const handleServiceSelection = (value: string) => {
    if (value.startsWith('catalog:')) {
      const service = matchingServices.find((item) => item.id === value.slice('catalog:'.length))
      if (!service) return
      const budget = Math.round((service.priceMonthly + (service.priceOTC ?? 0)) * 100) / 100
      setSelectedCatalogServiceId(service.id)
      setBudgetInput(formatBudget(budget))
      setForm((current) => ({
        ...current,
        serviceType: service.serviceType,
        totalCapacityMbps: bandwidthToMbps(service.bandwidth),
        budget,
      }))
      return
    }

    setSelectedCatalogServiceId('')
    if (value.startsWith('manual:')) set('serviceType', value.slice('manual:'.length))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-900/95 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
              <FolderPlus size={16} className="text-violet-400" />
            </div>
            <h3 className="text-base font-bold text-white">{mode === 'add' ? 'Input Proyek Baru' : 'Edit Proyek'}</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {saveError && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{saveError}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="ID LOP *" error={errors.idLOP}>
              <input value={form.idLOP} onChange={(event) => set('idLOP', event.target.value)} placeholder="LOP-2026-SMG-001" className="form-input" />
            </Field>
            {!fixedCategory && (
              <Field label="Kategori Kontrak">
                <Select value={form.category} onChange={(value) => {
                  setSelectedCatalogServiceId('')
                  set('category', value as ProjectEntry['category'])
                }}>
                  {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                </Select>
              </Field>
            )}
          </div>
          <Field label="Nama Proyek *" error={errors.projectName}>
            <input value={form.projectName} onChange={(event) => set('projectName', event.target.value)} className="form-input" />
          </Field>
          {form.category === 'NGTMA' && (
            <Field label="Nama Anak Perusahaan *" error={errors.subsidiaryName}>
              <input
                value={form.subsidiaryName ?? ''}
                onChange={(event) => set('subsidiaryName', event.target.value)}
                placeholder="Nama anak perusahaan untuk pembagian pendapatan"
                className="form-input"
              />
            </Field>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Instansi Pelanggan *" error={errors.agency}>
              <Select
                value={form.agency}
                onChange={(agency) => setForm((current) => ({ ...current, agency, ...agencyFields(agency) }))}
              >
                <option value="">Pilih instansi pelanggan</option>
                {MASTER_INSTANSI.map((agency) => <option key={agency.nama}>{agency.nama}</option>)}
              </Select>
            </Field>
            <Field label="Tipe Layanan">
              <Select
                value={selectedCatalogServiceId ? `catalog:${selectedCatalogServiceId}` : `manual:${form.serviceType}`}
                onChange={handleServiceSelection}
              >
                {matchingServices.length > 0 && (
                  <optgroup label="Data Layanan">
                    {matchingServices.map((service) => (
                      <option key={service.id} value={`catalog:${service.id}`}>
                        {service.name} ({service.serviceType})
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Tipe Manual">
                  {!SERVICE_TYPES.includes(form.serviceType) && <option value={`manual:${form.serviceType}`}>{form.serviceType}</option>}
                  {SERVICE_TYPES.map((type) => <option key={type} value={`manual:${type}`}>{type}</option>)}
                </optgroup>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Total Kapasitas Layanan (Mbps)" error={errors.totalCapacityMbps}>
              <input
                type="number"
                min="0"
                step="0.001"
                value={form.totalCapacityMbps ?? ''}
                onChange={(event) => set('totalCapacityMbps', event.target.value === '' ? null : Number(event.target.value))}
                className="form-input"
              />
            </Field>
            <Field label="Nomor SID (Service ID)">
              <input value={form.sid ?? ''} onChange={(event) => set('sid', event.target.value || null)} className="form-input" />
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Pagu Anggaran (Rp) *" error={errors.budget}>
              <input
                type="text"
                inputMode="decimal"
                value={budgetInput}
                onChange={(event) => {
                  const input = event.currentTarget
                  const beforeCursor = input.value.slice(0, input.selectionStart ?? input.value.length)
                  const decimalIndex = beforeCursor.indexOf(',')
                  const hasDecimal = decimalIndex >= 0
                  const integerDigits = (hasDecimal ? beforeCursor.slice(0, decimalIndex) : beforeCursor).replace(/\D/g, '').length
                  const fractionalDigits = hasDecimal ? beforeCursor.slice(decimalIndex + 1).replace(/\D/g, '').length : 0
                  const formatted = formatBudgetInput(input.value)
                  setBudgetInput(formatted)
                  set('budget', parseBudgetInput(formatted))
                  const cursor = cursorAfterBudgetInput(formatted, integerDigits, hasDecimal, fractionalDigits)
                  requestAnimationFrame(() => input.setSelectionRange(cursor, cursor))
                }}
                className="form-input"
              />
            </Field>
            <Field label="Metode Pengadaan">
              <Select
                value={form.procurementMethod}
                onChange={(value) => set('procurementMethod', value as ProjectEntry['procurementMethod'])}
              >
                <option>Tender/e-Katalog</option>
                <option>Penunjukan Langsung</option>
              </Select>
            </Field>
          </div>
          <Field label="Tahap Proyek">
            <div className="flex flex-wrap gap-2">
              {STAGES.map((stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => handleStageChange(stage)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold border',
                    form.stage === stage ? STAGE_COLORS[stage] : 'bg-slate-800 border-slate-700 text-slate-500',
                  )}
                >
                  {stage}
                </button>
              ))}
            </div>
          </Field>
          <Field label={`Progress (${form.progress}%)`}>
            <input type="range" min={0} max={100} value={form.progress} onChange={(event) => set('progress', Number(event.target.value))} className="w-full accent-blue-500" />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="PIC *" error={errors.pic}>
              <Select value={form.pic} onChange={(value) => set('pic', value)}>
                <option value="">Pilih PIC dari Database Instansi</option>
                {form.pic && !availablePICs.some((customer) => customer.picName === form.pic) && (
                  <option value={form.pic}>{form.pic} (data proyek sebelumnya)</option>
                )}
                {availablePICs.map((customer) => (
                  <option key={customer.id} value={customer.picName}>{customer.picName} ({customer.name})</option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(value) => set('status', value as ProjectEntry['status'])}>
                {STATUSES.map((status) => <option key={status}>{status}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Tanggal Mulai">
              <input type="date" value={form.startDate} onChange={(event) => set('startDate', event.target.value)} className="form-input" />
            </Field>
            <Field label="Tanggal Selesai">
              <input type="date" value={form.endDate} onChange={(event) => set('endDate', event.target.value)} className="form-input" />
            </Field>
          </div>
          <Field label="Catatan">
            <textarea value={form.notes ?? ''} onChange={(event) => set('notes', event.target.value)} rows={2} className="form-input resize-none" />
          </Field>

          {mode === 'edit' && (
            <section className="space-y-3 border-t border-slate-800 pt-4">
              <div>
                <h4 className="text-sm font-semibold text-white">Dokumen berdasarkan ID LOP</h4>
                <p className="text-xs text-slate-500 mt-1">File PDF, Office, atau gambar; maksimal 10 MB per dokumen.</p>
                {form.category === 'NGTMA' && (
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                    Dokumen ini wajib sebagai evidence Kontrak Management dan dapat dilengkapi bertahap saat edit. Kirim melalui NDE ke Segmen dengan tembusan GPO untuk pencatatan performa dan input pada aplikasi Web NGTMA.
                  </p>
                )}
              </div>
              {documentError && <p role="alert" className="text-xs text-red-400">{documentError}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {documentTypes.map((documentType) => {
                  const existing = documents.find((document) => (
                    document.documentType === documentType.id || documentType.aliases?.includes(document.documentType)
                  ))
                  return (
                    <label key={documentType.id} className="block p-3 rounded-xl border border-slate-700/70 bg-slate-950/40">
                      <span className="block text-xs font-semibold text-slate-300 mb-2">{documentType.label}</span>
                      {documentType.helperText && <span className="mb-2 block text-[11px] text-amber-300">{documentType.helperText}</span>}
                      {documentType.templateUrl && (
                        <a href={documentType.templateUrl} target="_blank" rel="noreferrer" className="mb-2 inline-block text-[11px] text-blue-400 hover:text-blue-300">
                          Unduh template
                        </a>
                      )}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                        onChange={(event) => selectFile(documentType.id, event.target.files?.[0])}
                        className="block w-full text-xs text-slate-400 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-700 file:px-2 file:py-1 file:text-xs file:text-slate-200"
                      />
                      <span className="block text-[11px] text-slate-500 mt-1 truncate">
                        {files[documentType.id]?.name ?? (existing ? `Tersimpan: ${existing.originalName}` : 'Belum diunggah')}
                      </span>
                    </label>
                  )
                })}
              </div>
            </section>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={saving}>Batal</button>
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={saving}>
              <Check size={15} />{saving ? 'Menyimpan...' : mode === 'add' ? 'Simpan Proyek' : 'Update Proyek'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 flex items-center gap-1 text-xs text-red-400"><AlertCircle size={11} />{error}</p>}
    </div>
  )
}

function Select({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <select value={value} onChange={(event) => onChange(event.target.value)} className="form-input appearance-none pr-8">
        {children}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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
      <section className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-white">Dokumen Proyek</h3>
            <p className="mt-1 font-mono text-xs text-blue-400">{idLOP}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </header>
        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
        {loading ? <p className="py-6 text-sm text-slate-400">Memuat dokumen...</p> : (
          <ul className="mt-3 divide-y divide-slate-800">
            {getProjectDocumentTypes(category).map((type) => {
              const document = documents.find((item) => item.documentType === type.id)
                ?? documents.find((item) => type.aliases?.includes(item.documentType))
              return (
                <li key={type.id} className="space-y-2 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200">{type.label}</p>
                      <p className="truncate text-xs text-slate-500">
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
                        className="rounded-lg p-2 text-blue-400 hover:bg-blue-500/10 disabled:opacity-50"
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

export function ProjectDatabase({ initialCategory }: { initialCategory?: ProjectEntry['category'] }) {
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
      project.idLOP.toLowerCase().includes(search.toLowerCase())) &&
    (filterStage === 'Semua' || project.stage === filterStage) &&
    (filterAgency === 'Semua Instansi' || project.agency === filterAgency) &&
    (initialCategory ? project.category === initialCategory : filterCategory === 'Semua' || project.category === filterCategory)
  ))
  const totalBudget = filtered.reduce((total, project) => total + project.budget, 0)
  const wins = filtered.filter((project) => project.stage === 'F5').length
  const atRisk = filtered.filter((project) => project.status === 'At Risk').length

  const handleSave = async (form: ProjectForm, files: SelectedFiles) => {
    if (!modal) return
    setSaving(true)
    setPageError('')
    try {
      const mode = modal.mode
      const projectForm = initialCategory ? { ...form, category: initialCategory } : form
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
      if (mode === 'add') setModal({ mode: 'edit', editId: saved.id })
      setModal(null)
      await load()
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
        agencyType: editing.agencyType,
        region: editing.region,
        budget: editing.budget,
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
        status: editing.status,
        notes: editing.notes ?? '',
      }
    : blankForm(initialCategory)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Proyek', value: filtered.length, color: 'text-blue-400' },
          { label: 'Total Anggaran', value: formatIDR(totalBudget), color: 'text-emerald-400' },
          { label: 'Tahap F5', value: wins, color: 'text-violet-400' },
          { label: 'At Risk', value: atRisk, color: 'text-red-400' },
        ].map((stat) => (
          <div key={stat.label} className="card-glass rounded-xl px-5 py-4">
            <p className="text-xs text-slate-500">{stat.label}</p>
            <p className={cn('mt-0.5 text-xl font-bold', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {pageError && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{pageError}</div>}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-48 flex-1">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari ID LOP, proyek, instansi..." className="form-input" />
        </div>
        <select value={filterAgency} onChange={(event) => setFilterAgency(event.target.value)} className="form-input w-auto">
          <option>Semua Instansi</option>
          {MASTER_INSTANSI.map((agency) => <option key={agency.nama}>{agency.nama}</option>)}
        </select>
        <select value={filterStage} onChange={(event) => setFilterStage(event.target.value)} className="form-input w-auto">
          <option>Semua</option>
          {STAGES.map((stage) => <option key={stage}>{stage}</option>)}
        </select>
        {!initialCategory && (
          <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)} className="form-input w-auto">
            <option>Semua</option>
            {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
          </select>
        )}
        <button type="button" onClick={() => { setPageError(''); setModal({ mode: 'add' }) }} className="btn-primary flex items-center gap-2">
          <Plus size={15} />Input Proyek
        </button>
      </div>

      <div className="card-glass overflow-x-auto rounded-2xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              {['Proyek / ID LOP', 'Instansi', 'Kategori / SID', 'Anggaran', 'Tahap', 'Kapasitas', 'Status', 'Aksi'].map((heading) => (
                <th key={heading} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center text-sm text-slate-400">Memuat proyek...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-sm text-slate-500">Belum ada proyek untuk filter ini</td></tr>
            ) : filtered.map((project) => (
              <tr key={project.id} className="group border-b border-slate-700/30 hover:bg-slate-800/30">
                <td className="px-4 py-3">
                  <button type="button" onClick={() => setDocumentsFor({ idLOP: project.idLOP, category: project.category })} className="flex items-center gap-1 font-mono text-xs text-blue-400 hover:text-blue-300">
                    <FileText size={12} />{project.idLOP}
                  </button>
                  <p className="mt-1 max-w-xs truncate text-sm font-semibold text-white">{project.projectName}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-xs text-slate-300"><Building2 size={11} />{project.agency}</span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-300">
                  <div>{project.category}</div>
                  {project.subsidiaryName && <div className="mt-1 text-slate-400">{project.subsidiaryName}</div>}
                  <div className="mt-1 text-slate-500">{project.sid || 'SID belum diisi'}</div>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-emerald-400">{formatIDR(project.budget)}</td>
                <td className="px-4 py-3"><span className={cn('rounded-full border px-2.5 py-1 text-[10px] font-bold', STAGE_COLORS[project.stage])}>{project.stage}</span></td>
                <td className="px-4 py-3 text-xs text-slate-300">{project.totalCapacityMbps === null ? '—' : `${project.totalCapacityMbps} Mbps`}</td>
                <td className="px-4 py-3"><span className={cn('rounded-full border px-2.5 py-1 text-[10px] font-bold', STATUS_COLORS[project.status])}>{project.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button type="button" aria-label={`Import SID ${project.idLOP}`} title="Import SID" onClick={() => setServicePointsFor(project.idLOP)} className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400"><FileSpreadsheet size={13} /></button>
                    <button type="button" aria-label={`Edit ${project.idLOP}`} onClick={() => { setPageError(''); setModal({ mode: 'edit', editId: project.id }) }} className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-500/20 hover:text-blue-400"><Edit3 size={13} /></button>
                    <button type="button" aria-label={`Hapus ${project.idLOP}`} onClick={() => setDeleteConfirm(project.idLOP)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-400"><Trash2 size={13} /></button>
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
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <h4 className="text-sm font-bold text-white">Hapus Proyek</h4>
            <p className="my-4 text-sm text-slate-300">Hapus proyek {deleteConfirm} beserta dokumennya?</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Batal</button>
              <button type="button" onClick={() => void handleDelete(deleteConfirm)} className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
