import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, FileText, Search, Trash2, Pencil, Plus, Upload } from 'lucide-react'
import type { CustomerProfile, CustomerProfileService } from '../../data/customerProfiles'
import { EditableRecordModal, EditableTable, type TableRow } from './CustomerProfileMaps'
import { ProjectsDB, type ProjectEntry } from '../../lib/db'
import { downloadPdf } from '../../lib/pdfGenerator'

const serviceFilters = ['Semua', 'Aktif', 'Suspend', 'Non Aktif'] as const
type ServiceFilter = (typeof serviceFilters)[number]

const serviceStatusStyles: Record<CustomerProfileService['status'], string> = {
  Aktif: 'border-[#E5E5E5] bg-[#F3F3F1] text-[#666666]',
  Suspend: 'border-[#E5E5E5] bg-[#F3F3F1] text-[#666666]',
  'Non Aktif': 'border-[#E5E5E5] bg-[#F3F3F1] text-[#666666]',
}

const contractFilters = [
  'Semua Kontrak',
  'Modify & Renewal Agreement',
  'New Install',
  'Disconnect',
  'Resume',
  'Suspend',
] as const
type ContractFilter = (typeof contractFilters)[number]

const serviceFilterStyles: Record<ServiceFilter, { selected: string; hover: string }> = {
  Semua: { selected: 'border-[#E5E5E5] bg-[#F3F3F1] text-[#666666]', hover: 'hover:border-[#E5E5E5] hover:bg-[#F3F3F1] hover:text-[#666666]' },
  Aktif: { selected: 'border-[#E5E5E5] bg-[#F3F3F1] text-[#666666]', hover: 'hover:border-[#E5E5E5] hover:bg-[#F3F3F1] hover:text-[#666666]' },
  Suspend: { selected: 'border-[#E5E5E5] bg-[#F3F3F1] text-[#666666]', hover: 'hover:border-[#E5E5E5] hover:bg-[#F3F3F1] hover:text-[#666666]' },
  'Non Aktif': { selected: 'border-[#E5E5E5] bg-[#F3F3F1] text-[#666666]', hover: 'hover:border-[#E5E5E5] hover:bg-[#F3F3F1] hover:text-[#666666]' },
}

const contractFilterStyles: Record<ContractFilter, { selected: string; hover: string }> = {
  'Semua Kontrak': { selected: 'border-[#E5E5E5] bg-[#F3F3F1] text-[#666666]', hover: 'hover:border-[#E5E5E5] hover:bg-[#F3F3F1] hover:text-[#666666]' },
  'Modify & Renewal Agreement': { selected: 'border-[#E5E5E5] bg-[#F3F3F1] text-[#666666]', hover: 'hover:border-[#E5E5E5] hover:bg-[#F3F3F1] hover:text-[#666666]' },
  'New Install': { selected: 'border-[#E5E5E5] bg-[#F3F3F1] text-[#666666]', hover: 'hover:border-[#E5E5E5] hover:bg-[#F3F3F1] hover:text-[#666666]' },
  Disconnect: { selected: 'border-[#E5E5E5] bg-[#F3F3F1] text-[#666666]', hover: 'hover:border-[#E5E5E5] hover:bg-[#F3F3F1] hover:text-[#666666]' },
  Resume: { selected: 'border-[#E5E5E5] bg-[#F3F3F1] text-[#666666]', hover: 'hover:border-[#E5E5E5] hover:bg-[#F3F3F1] hover:text-[#666666]' },
  Suspend: { selected: 'border-[#E5E5E5] bg-[#F3F3F1] text-[#666666]', hover: 'hover:border-[#E5E5E5] hover:bg-[#F3F3F1] hover:text-[#666666]' },
}

function normalizePemdaName(value: string) {
  return value.trim().toLocaleLowerCase('id-ID').replace(/\s+/g, ' ')
    .replace(/^pemkot\b/, 'pemerintah kota')
    .replace(/^kota\b/, 'pemerintah kota')
    .replace(/^pemkab\b/, 'pemerintah kabupaten')
    .replace(/^kabupaten\b/, 'pemerintah kabupaten')
    .replace(/^pemprov\b/, 'pemerintah provinsi')
    .replace(/^provinsi\b/, 'pemerintah provinsi')
}

function serviceKey(value: string) {
  const normalized = value.toLocaleLowerCase('id-ID')
  if (normalized.includes('astinet')) return 'astinet'
  if (normalized.includes('wifi')) return 'wifi'
  if (normalized.includes('vpn')) return 'vpn'
  if (normalized.includes('metro')) return 'metro'
  return normalized.replace(/[^a-z0-9]/g, '')
}

function getContractType(contract: CustomerProfile['contracts'][number]): Exclude<ContractFilter, 'Semua Kontrak'> {
  if (contract.type) return contract.type
  return contract.status === 'Modify' ? 'Modify & Renewal Agreement' : contract.status
}

function ServiceList({
  customer,
  onUpdate,
  onOpenAnalytics,
}: {
  customer: CustomerProfile
  onUpdate: (updates: Partial<CustomerProfile>) => boolean
  onOpenAnalytics: (pemdaName: string, serviceName: string) => void
}) {
  const [displayDate] = useState(() => new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }))
  const [filter, setFilter] = useState<ServiceFilter>('Semua')
  const [query, setQuery] = useState('')
  const [projects, setProjects] = useState<ProjectEntry[]>([])
  const [projectLoadError, setProjectLoadError] = useState('')
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [editingService, setEditingService] = useState<{ originalNumber?: string; row: TableRow } | null>(null)

  useEffect(() => {
    let active = true
    ProjectsDB.getAll()
      .then((items) => {
        if (active) setProjects(items)
      })
      .catch((error: unknown) => {
        if (active) setProjectLoadError(error instanceof Error ? error.message : 'Gagal memuat ID LOP layanan.')
      })
      .finally(() => {
        if (active) setProjectsLoading(false)
      })
    return () => { active = false }
  }, [])

  const services = customer.services.filter((service) => {
    const matchesFilter = filter === 'Semua' || service.status === filter
    const matchesQuery = `${service.name} ${service.serviceNumber} ${service.address}`.toLowerCase().includes(query.toLowerCase())
    return matchesFilter && matchesQuery
  })
  const counts = useMemo(() => ({
    Semua: customer.services.length,
    Aktif: customer.services.filter((service) => service.status === 'Aktif').length,
    Suspend: customer.services.filter((service) => service.status === 'Suspend').length,
    'Non Aktif': customer.services.filter((service) => service.status === 'Non Aktif').length,
  }), [customer.services])

  return (
    <section className="overflow-hidden rounded-xl border border-[#E5E5E5]">
      <div className="flex flex-col gap-3 border-b border-[#E5E5E5] p-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#666666]">Daftar Layanan</h3>
          <p className="mt-1 text-xs text-[#666666]">Periode data tertampil: 01 Januari 2023 - {displayDate}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative block xl:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari Nama Layanan/Service ID" className="form-input py-2 pl-9 text-xs" />
          </label>
          <button type="button" onClick={() => setEditingService({ row: {} })} className="btn-primary flex items-center gap-1.5 px-3 py-2 text-[10px]"><Plus size={13} />Tambah Layanan Baru</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-[#E5E5E5] px-4 py-3">
        {serviceFilters.map((item) => (
          <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold transition-colors ${filter === item ? serviceFilterStyles[item].selected : `border-[#E5E5E5] text-[#666666] ${serviceFilterStyles[item].hover}`}`}>
            {item === 'Semua' ? 'Semua Kontrak' : item}<span className="ml-1.5 rounded-full bg-[#F3F3F1] px-1.5">{counts[item]}</span>
          </button>
        ))}
      </div>
      {projectLoadError && <p role="alert" className="border-b border-[#E5E5E5] bg-[#F3F3F1] px-4 py-2 text-xs text-[#666666]">{projectLoadError}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left">
          <thead><tr className="border-b border-[#E5E5E5] bg-[#F9F8F6]">{['Nama Layanan', 'Status Layanan', 'No. Layanan', 'ID LOP', 'Alamat Pemasangan', 'Aksi'].map((heading) => <th key={heading} className="px-4 py-3 text-[10px] font-semibold text-[#666666]">{heading}</th>)}</tr></thead>
          <tbody className="divide-y divide-[#E5E5E5]">
            {services.map((service) => {
              const pemda = normalizePemdaName(customer.name)
              const linkedProjects = projects.filter((project) => {
                const names = [project.pemdaName, project.agency, project.customerName].filter((name): name is string => Boolean(name))
                return names.some((name) => normalizePemdaName(name) === pemda)
                  && serviceKey(project.serviceType).includes(serviceKey(service.name))
              })
              return (
                <tr key={service.serviceNumber} className="hover:bg-[#FFFFFF]">
                  <td className="px-4 py-3 text-xs font-semibold text-[#666666]">
                    <button type="button" disabled={!linkedProjects.length || projectsLoading} onClick={() => onOpenAnalytics(customer.name, service.name)} className="text-left enabled:hover:text-[#666666] enabled:hover:underline">{service.name}</button>
                  </td>
                  <td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${serviceStatusStyles[service.status]}`}>{service.status}</span></td>
                  <td className="px-4 py-3 font-mono text-xs text-[#666666]">{service.serviceNumber}</td>
                  <td className="px-4 py-3">
                    {projectsLoading ? <span className="text-xs text-[#666666]">Memuat...</span> : linkedProjects.length ? linkedProjects.map((project) => (
                      <button key={project.idLOP} type="button" onClick={() => onOpenAnalytics(customer.name, service.name)} className="mr-2 font-mono text-xs text-[#666666] hover:underline">{project.idLOP}</button>
                    )) : <span className="text-xs text-[#666666]">-</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#666666]">{service.address}</td>
                  <td className="px-4 py-3"><button type="button" aria-label={`Edit ${service.name}`} className="text-[#666666] hover:text-[#666666]" onClick={() => setEditingService({ originalNumber: service.serviceNumber, row: { name: service.name, status: service.status, serviceNumber: service.serviceNumber, address: service.address } })}><Pencil size={14} /></button><button type="button" aria-label={`Hapus ${service.name}`} className="ml-2 text-[#666666] hover:text-[#666666]" onClick={() => onUpdate({ services: customer.services.filter((item) => item.serviceNumber !== service.serviceNumber) })}><Trash2 size={14} /></button></td>
                </tr>
              )
            })}
            {!services.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-xs text-[#666666]">Tidak ada layanan yang cocok dengan filter.</td></tr>}
          </tbody>
        </table>
      </div>
      {editingService && <EditableRecordModal
        title={editingService.originalNumber ? 'Edit Layanan' : 'Tambah Layanan Baru'}
        columns={[
          { key: 'name', label: 'Nama Layanan' },
          { key: 'status', label: 'Status Layanan' },
          { key: 'serviceNumber', label: 'No. Layanan' },
          { key: 'address', label: 'Alamat Pemasangan' },
        ]}
        initial={editingService.row}
        onClose={() => setEditingService(null)}
        onSave={(row) => {
          const service: CustomerProfileService = {
            name: row.name ?? '',
            status: ['Aktif', 'Suspend', 'Non Aktif'].includes(row.status) ? row.status as CustomerProfileService['status'] : 'Aktif',
            serviceNumber: row.serviceNumber ?? '',
            address: row.address ?? '',
          }
          const updated = editingService.originalNumber
            ? customer.services.map((item) => item.serviceNumber === editingService.originalNumber ? service : item)
            : [...customer.services, service]
          onUpdate({ services: updated })
          setEditingService(null)
        }}
      />}
    </section>
  )
}

function ContractList({ customer, onUpdate }: { customer: CustomerProfile; onUpdate: (updates: Partial<CustomerProfile>) => boolean }) {
  const [filter, setFilter] = useState<ContractFilter>('Semua Kontrak')
  const visibleContracts = customer.contracts.filter((contract) =>
    filter === 'Semua Kontrak' || getContractType(contract) === filter,
  )
  const counts = {
    'Semua Kontrak': customer.contracts.length,
    'Modify & Renewal Agreement': customer.contracts.filter((contract) => getContractType(contract) === 'Modify & Renewal Agreement').length,
    'New Install': customer.contracts.filter((contract) => getContractType(contract) === 'New Install').length,
    Disconnect: customer.contracts.filter((contract) => getContractType(contract) === 'Disconnect').length,
    Resume: customer.contracts.filter((contract) => getContractType(contract) === 'Resume').length,
    Suspend: customer.contracts.filter((contract) => getContractType(contract) === 'Suspend').length,
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 border-b border-[#E5E5E5] px-1 py-2">
        {contractFilters.map((item) => (
          <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold transition-colors ${filter === item ? contractFilterStyles[item].selected : `border-[#E5E5E5] text-[#666666] ${contractFilterStyles[item].hover}`}`}>
            {item}<span className="ml-1.5 rounded-full bg-[#F3F3F1] px-1.5">{counts[item]}</span>
          </button>
        ))}
      </div>
      <EditableTable
        title="Daftar Kontrak Pelanggan"
        columns={[
          { key: 'contractNumber', label: 'No. Kontrak' },
          { key: 'type', label: 'Jenis Kontrak', type: 'select', options: contractFilters.slice(1) },
          { key: 'startDate', label: 'Tanggal Mulai', type: 'date' },
          { key: 'endDate', label: 'Tanggal Selesai', type: 'date' },
          { key: 'status', label: 'Status Kontrak', type: 'select', options: ['Disconnect', 'Modify', 'Suspend', 'Resume'] },
          { key: 'serviceCount', label: 'Jumlah Layanan', type: 'number' },
          { key: 'slg', label: 'SLG' },
        ]}
        rows={visibleContracts.map((item) => ({ ...item, type: getContractType(item), serviceCount: String(item.serviceCount) }))}
        addLabel="+ Tambah Kontrak"
        onChange={(rows) => {
          const hiddenContracts = customer.contracts.filter((contract) => filter !== 'Semua Kontrak' && getContractType(contract) !== filter)
          const updatedVisible = rows.map((row) => ({
            contractNumber: row.contractNumber ?? '',
            startDate: row.startDate ?? '',
            endDate: row.endDate ?? '',
            status: ['Disconnect', 'Modify', 'Suspend', 'Resume'].includes(row.status) ? row.status as CustomerProfile['contracts'][number]['status'] : 'Modify',
            type: contractFilters.slice(1).includes(row.type as Exclude<ContractFilter, 'Semua Kontrak'>) ? row.type as Exclude<ContractFilter, 'Semua Kontrak'> : 'Modify & Renewal Agreement',
            serviceCount: Number(row.serviceCount) || 0,
            slg: row.slg ?? '',
          }))
          onUpdate({ contracts: [...hiddenContracts, ...updatedVisible] })
        }}
      />
    </div>
  )
}

function DocumentCards({ customer, onUpdate }: { customer: CustomerProfile; onUpdate: (updates: Partial<CustomerProfile>) => boolean }) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const updateDocument = (index: number, updates: Partial<CustomerProfile['documents'][number]>) => {
    onUpdate({ documents: customer.documents.map((item, rowIndex) => rowIndex === index ? { ...item, ...updates } : item) })
  }
  const documentTypes = [
    'Akta Pendirian dan Perubahan',
    'Nomor Wajib Pajak (NPWP)',
    'e-KTP Direksi Perusahaan',
    'Surat Izin Usaha Perdagangan (SIUP)',
    'Pernyataan Bahwa Data Perusahaan Valid',
    'Pernyataan Perusahaan Tidak Masuk Blacklist',
    'Hasil Direct Visit Customer',
  ]
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#666666]">Daftar Dokumen Pelanggan</h3>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {customer.documents.map((documentItem, index) => (
          <article key={`${documentItem.type}-${index}`} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <input defaultValue={documentItem.type || documentTypes[index] || 'Dokumen'} onBlur={(event) => updateDocument(index, { type: event.target.value })} placeholder={`Buat ${documentTypes[index] ?? 'Judul dokumen'} Disini`} className="min-w-0 flex-1 bg-transparent text-sm text-[#666666] outline-none" />
              <div className="flex gap-2">
                <button type="button" aria-label="Edit dokumen" onClick={() => setEditingIndex(index)} className="text-[#666666] hover:text-[#666666]"><Pencil size={14} /></button>
                <button type="button" aria-label="Hapus dokumen" onClick={() => onUpdate({ documents: customer.documents.filter((_, rowIndex) => rowIndex !== index) })} className="text-[#666666] hover:text-[#666666]"><Trash2 size={14} /></button>
              </div>
            </div>
            <DocumentUploadCard
              category={documentItem.type}
              name={documentItem.name}
              onSelect={(name) => updateDocument(index, { name, updatedAt: new Date().toLocaleDateString('id-ID') })}
            />
            <p className="text-[10px] italic text-[#666666]">Format PDF, ukuran maks. 25 MB, jumlah maks. 1.</p>
            {documentItem.name && <button type="button" onClick={() => {
              const contents = `${documentItem.type}\n${customer.name}\nDokumen contoh untuk tampilan dashboard.`
              const url = URL.createObjectURL(new Blob([contents], { type: 'text/plain;charset=utf-8' }))
              const link = window.document.createElement('a')
              link.href = url
              link.download = documentItem.name.replace(/\.pdf$/i, '.txt')
              link.click()
              URL.revokeObjectURL(url)
            }} className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#666666]"><Download size={12} />Unduh</button>}
          </article>
        ))}
      </div>
      {editingIndex !== null && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditingIndex(null) }}>
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-[#E5E5E5] bg-[#F9F8F6] p-5">
            <h4 className="text-sm font-bold text-[#1C1C1E]">Edit Dokumen</h4>
            <label className="block text-xs text-[#666666]">Nama Dokumen<input defaultValue={customer.documents[editingIndex].name} onBlur={(event) => updateDocument(editingIndex, { name: event.target.value })} placeholder="Buat Nama Dokumen Disini" className="form-input mt-1.5" /></label>
            <label className="block text-xs text-[#666666]">Jenis Dokumen<input defaultValue={customer.documents[editingIndex].type} onBlur={(event) => updateDocument(editingIndex, { type: event.target.value })} placeholder="Buat Jenis Dokumen Disini" className="form-input mt-1.5" /></label>
            <button type="button" onClick={() => setEditingIndex(null)} className="btn-primary float-right">Selesai</button>
          </div>
        </div>
      )}
    </section>
  )
}

function DocumentUploadCard({
  category,
  name,
  onSelect,
}: {
  category: string
  name: string
  onSelect: (name: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={(event) => {
        const file = event.target.files?.[0]
        if (file) onSelect(file.name)
      }} />
      <button type="button" onClick={() => inputRef.current?.click()} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-lg border border-dashed border-[#E5E5E5] px-4 py-3 text-left text-xs text-[#666666] hover:border-[#E5E5E5]">
        <span className="flex items-center gap-3"><FileText size={18} className="text-[#666666]" />{name || `Letakkan dokumen ${category} di sini atau klik tombol unggah`}</span>
        <span className="rounded-full border border-[#E5E5E5] px-4 py-2 font-semibold text-[#666666]"><Upload size={13} className="inline" /> Unggah Dokumen</span>
      </button>
    </>
  )
}

export function CustomerProfileDataTab({
  tab,
  customer,
  onUpdate,
  onOpenAnalytics,
}: {
  tab: 'Layanan' | 'Kontrak' | 'Dokumen'
  customer: CustomerProfile
  onUpdate: (updates: Partial<CustomerProfile>) => boolean
  onOpenAnalytics: (pemdaName: string, serviceName: string) => void
}) {
  if (tab === 'Layanan') return <ServiceList customer={customer} onUpdate={onUpdate} onOpenAnalytics={onOpenAnalytics} />
  if (tab === 'Kontrak') return <ContractList customer={customer} onUpdate={onUpdate} />
  return <DocumentCards customer={customer} onUpdate={onUpdate} />
}
