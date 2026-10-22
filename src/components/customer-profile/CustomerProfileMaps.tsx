import { useEffect, useRef, useState } from 'react'
import {
  Check, CloudUpload, Pencil, Plus, Save, Trash2, X,
} from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import type { CustomerProfile, MapsSection } from '../../data/customerProfiles'
import { CountryPhoneInput } from './CountryPhoneInput'
import { ProjectsDB, type ProjectEntry } from '../../lib/db'

const MAPS_SECTIONS: MapsSection[] = [
  'Customer Profile',
  'Strategic Highlight',
  'Management Profile',
  'Institution Profile',
  'Benchmark Best Practices and TOWS Analysis',
  'Customer Value Innovation',
  'Revenue and Wallet Shared',
  'Business Prospect',
  'Complaint and Solution',
  'Courtesy Visit',
]

export type TableRow = Record<string, string>
export type TableColumn = { key: string; label: string; type?: 'text' | 'number' | 'date' | 'currency' | 'image' | 'select'; options?: readonly string[] }

function formatRupiah(value: number | string) {
  const amount = typeof value === 'number' ? value : Number(value.replace(/\D/g, '')) || 0
  return `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`
}

function parseRupiah(value: string) {
  return Number(value.replace(/\D/g, '')) || 0
}

function MapsSidebar({ active, onChange }: { active: MapsSection; onChange: (section: MapsSection) => void }) {
  return (
    <aside className="rounded-2xl border border-slate-700/70 bg-slate-900/80 p-3">
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-white">Progres Anda</p>
          <span className="text-[10px] font-bold text-emerald-300">6/6</span>
        </div>
        <p className="mt-2 text-xs text-slate-300"><strong className="text-base text-white">6/6</strong> Kriteria Terpenuhi.</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full w-full rounded-full bg-emerald-500" />
        </div>
        <a href="#maps-sections" className="mt-3 inline-block text-xs font-semibold text-slate-300 underline hover:text-white">Lihat Kriteria</a>
      </div>
      <nav id="maps-sections" className="mt-3 space-y-1" aria-label="Submenu MAPS">
        {MAPS_SECTIONS.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => onChange(label)}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs transition ${
              active === label ? 'bg-blue-500/15 text-slate-100' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Check size={14} className="shrink-0 text-emerald-400" />
            <span className="flex-1">{label}</span>
            <span className="text-blue-400">›</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

function PanelTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h3 className="text-base font-semibold text-slate-100">{title}</h3>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  )
}

function EditableCard({
  title,
  value,
  onSave,
  className = '',
}: {
  title: string
  value: string
  onSave: (value: string) => boolean
  className?: string
}) {
  const [draft, setDraft] = useState(value)
  const [saveStatus, setSaveStatus] = useState('')
  const save = () => {
    if (draft === value) return
    setSaveStatus(onSave(draft) ? 'Tersimpan' : 'Gagal menyimpan')
  }

  return (
    <article className={`overflow-hidden rounded-xl border border-slate-700/60 bg-slate-950/35 ${className}`}>
      <h4 className={`border-b border-slate-700/50 bg-emerald-500/10 px-3 py-2.5 text-center text-xs font-semibold text-slate-200 ${className.includes('currency-card') ? 'text-base' : ''}`}>{title}</h4>
      <textarea
        aria-label={title}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value)
          setSaveStatus('')
        }}
        onBlur={save}
        placeholder={`Buat ${title} Disini`}
        rows={Math.max(2, Math.min(6, draft.split('\n').length))}
        className={`min-h-20 w-full resize-y bg-transparent px-3 py-3 text-sm leading-relaxed text-slate-200 outline-none focus:bg-cyan-500/5 ${className.includes('currency-card') ? 'text-xl font-bold' : ''}`}
      />
      {saveStatus && <p aria-live="polite" className="px-3 pb-2 text-right text-[10px] text-slate-500">{saveStatus}</p>}
    </article>
  )
}

export function EditableRecordModal({
  title,
  columns,
  initial,
  onClose,
  onSave,
}: {
  title: string
  columns: TableColumn[]
  initial: TableRow
  onClose: () => void
  onSave: (row: TableRow) => void
}) {
  const [values, setValues] = useState(initial)
  const [uploadError, setUploadError] = useState('')
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSave(values)
  }
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white">{title}</h4>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800"><X size={16} /></button>
        </div>
        {columns.map((column) => (
          <label key={column.key} className="block text-xs font-semibold text-slate-300">
            {column.label}
            {column.type === 'image'
              ? <input type="file" accept="image/png,image/jpeg" aria-label={`Upload ${column.label}`} className="form-input mt-1.5" onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  if (!['image/png', 'image/jpeg'].includes(file.type)) {
                    setUploadError('Logo harus berupa PNG, JPG, atau JPEG.')
                    return
                  }
                  const reader = new FileReader()
                  reader.onload = () => {
                    if (typeof reader.result === 'string') setValues((current) => ({ ...current, [column.key]: reader.result as string }))
                  }
                  reader.onerror = () => {
                    console.error('Gagal membaca file logo benchmark.', reader.error)
                    setUploadError('Logo gagal dibaca. Silakan pilih file lain.')
                  }
                  setUploadError('')
                  reader.readAsDataURL(file)
                }} />
              : column.type === 'select'
                ? <select value={values[column.key] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [column.key]: event.target.value }))} className="form-input mt-1.5">
                    <option value="">Pilih {column.label}</option>
                    {column.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
              : column.key === 'description' || column.key === 'notes' || column.key === 'solution' || column.key === 'objective' || column.key === 'comparator' || column.key === 'challenges'
              ? <textarea value={values[column.key] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [column.key]: event.target.value }))} placeholder={`Buat ${column.label} Disini`} rows={3} className="form-input mt-1.5" />
              : <input type={column.type === 'currency' ? 'text' : column.type ?? 'text'} inputMode={column.type === 'currency' ? 'numeric' : undefined} value={column.type === 'currency' ? formatRupiah(values[column.key] ?? '') : values[column.key] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [column.key]: column.type === 'currency' ? String(parseRupiah(event.target.value)) : event.target.value }))} placeholder={`Buat ${column.label} Disini`} className="form-input mt-1.5" />}
          </label>
        ))}
        {uploadError && <p role="alert" className="text-xs text-amber-300">{uploadError}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
          <button type="submit" disabled={Boolean(uploadError)} className="btn-primary flex items-center gap-2"><Save size={14} />Simpan</button>
        </div>
      </form>
    </div>
  )
}

export function EditableTable({
  title,
  columns,
  rows,
  onChange,
  addLabel,
  emptyMessage = 'Belum ada data.',
}: {
  title: string
  columns: TableColumn[]
  rows: TableRow[]
  onChange: (rows: TableRow[]) => void
  addLabel: string
  emptyMessage?: string
}) {
  const [editing, setEditing] = useState<{ index: number | null; row: TableRow } | null>(null)
  const openEditor = (index: number | null) => setEditing({
    index,
    row: index === null ? {} : { ...rows[index] },
  })
  const save = (row: TableRow) => {
    const updated = [...rows]
    if (editing?.index === null) updated.push(row)
    else if (editing?.index !== undefined) updated[editing.index] = row
    onChange(updated)
    setEditing(null)
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-700/60">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 px-4 py-3">
        <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
        <button type="button" onClick={() => openEditor(null)} className="btn-primary flex items-center gap-1.5 px-3 py-2 text-[10px]"><Plus size={13} />{addLabel.replace(/^\+\s*/, '')}</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left">
          <thead><tr className="border-b border-slate-700/50 bg-slate-950/50">
            {columns.map((column) => <th key={column.key} className="px-3 py-3 text-[10px] font-bold text-slate-400">{column.label}</th>)}
            <th className="px-3 py-3 text-[10px] font-bold text-slate-400">Aksi</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-800/80">
            {rows.map((row, index) => (
              <tr key={`${row[columns[0]?.key] ?? 'row'}-${index}`} className="hover:bg-slate-800/30">
                {columns.map((column) => <td key={column.key} className="max-w-sm px-3 py-3 text-xs leading-relaxed text-slate-300">{column.type === 'image' && row[column.key]
                  ? <img src={row[column.key]} alt={`${row.institution ?? title} logo`} className="h-10 w-10 rounded object-contain" />
                  : row[column.key] ? column.type === 'currency' ? formatRupiah(row[column.key]) : row[column.key] : <span className="text-slate-600">-</span>}</td>)}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <button type="button" aria-label={`Edit ${row[columns[0]?.key] ?? title}`} onClick={() => openEditor(index)} className="rounded-lg p-2 text-slate-400 hover:bg-blue-500/15 hover:text-blue-300"><Pencil size={13} /></button>
                    <button type="button" aria-label={`Hapus ${row[columns[0]?.key] ?? title}`} onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))} className="rounded-lg p-2 text-slate-400 hover:bg-blue-500/15 hover:text-blue-300"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-xs text-slate-500">{emptyMessage}</td></tr>}
          </tbody>
        </table>
      </div>
      {editing && <EditableRecordModal title={editing.index === null ? addLabel : `Edit ${title}`} columns={columns} initial={editing.row} onClose={() => setEditing(null)} onSave={save} />}
    </section>
  )
}

function CustomerOverview({ customer, onUpdate }: { customer: CustomerProfile; onUpdate: (updates: Partial<CustomerProfile>) => boolean }) {
  const saveString = (key: 'phone' | 'email' | 'website' | 'address', value: string) => onUpdate({ [key]: value })
  return (
    <div>
      <PanelTitle title="Customer Profile" />
      <div className="grid gap-4 sm:grid-cols-2">
        <article className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-950/35">
          <h4 className="border-b border-slate-700/50 bg-emerald-500/10 px-3 py-2.5 text-center text-xs font-semibold text-slate-200">Telepon</h4>
          <div className="px-3 py-3"><CountryPhoneInput label="Telepon" value={customer.phone} onSave={(value) => saveString('phone', value)} /></div>
        </article>
        <EditableCard title="Jumlah Pegawai" value={customer.employeeCount.toLocaleString('id-ID')} onSave={(value) => onUpdate({ employeeCount: Number(value.replace(/\./g, '')) || 0 })} />
        <EditableCard title="Email" value={customer.email} onSave={(value) => saveString('email', value)} />
        <EditableCard title="Alamat Website" value={customer.website} onSave={(value) => saveString('website', value)} />
      </div>
      <div className="mt-4">
        <EditableCard
          title="Satuan Kerja"
          value={customer.organizationUnits.map((unit) => unit.label).join(', ')}
          onSave={(value) => onUpdate({
            organizationUnits: value.split(/[,\n]/).map((label) => label.trim()).filter(Boolean).map((label) => ({
              label,
              count: customer.organizationUnits.find((unit) => unit.label === label)?.count ?? 0,
            })),
          })}
        />
      </div>
    </div>
  )
}

function StrategicHighlight({ customer, onUpdate }: { customer: CustomerProfile; onUpdate: (updates: Partial<CustomerProfile>) => boolean }) {
  return (
    <div>
      <PanelTitle title="Strategic Highlight" />
      <div className="grid gap-4 lg:grid-cols-2">
        <EditableCard title="Visi" value={customer.vision} onSave={(vision) => onUpdate({ vision })} />
        <EditableCard title="Misi" value={customer.missions.join('\n')} onSave={(text) => onUpdate({ missions: text.split('\n') })} />
        <EditableCard title="Strategi Jangka Menengah" value={customer.mediumTermStrategy.join('\n')} onSave={(text) => onUpdate({ mediumTermStrategy: text.split('\n') })} />
        <EditableCard title="Strategi Jangka Panjang" value={customer.longTermStrategy.join('\n')} onSave={(text) => onUpdate({ longTermStrategy: text.split('\n') })} />
      </div>
    </div>
  )
}

function ManagementProfile({ customer, onUpdate }: { customer: CustomerProfile; onUpdate: (updates: Partial<CustomerProfile>) => boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const contacts = customer.contacts.map((contact) => ({ ...contact }))
  return (
    <div>
      <PanelTitle title="Management Profile" />
      <div className="mb-5">
        <h4 className="mb-2 text-sm font-medium text-slate-300">Struktur Organisasi</h4>
        <input ref={inputRef} type="file" accept=".png,.jpeg,.jpg,.webp,.pdf" className="hidden" onChange={(event) => {
          const fileName = event.target.files?.[0]?.name
          if (fileName) onUpdate({ organizationChart: fileName })
        }} />
        <button type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
          event.preventDefault()
          const file = event.dataTransfer.files[0]
          if (file) onUpdate({ organizationChart: file.name })
        }} className="flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border border-dashed border-slate-600 px-4 py-3 text-left text-xs text-slate-400 hover:border-cyan-500/50">
          <span className="flex items-center gap-3"><CloudUpload size={18} className="text-cyan-400" />{customer.organizationChart || 'Letakkan dokumen di sini atau klik tombol unggah'}</span>
          <span className="rounded-full border border-slate-600 px-4 py-2 font-semibold text-slate-200">Unggah Dokumen</span>
        </button>
        <p className="mt-1 text-[10px] italic text-slate-500">Format PNG/JPEG/JPG/WEBP, ukuran maks. 25 MB, jumlah maks. 3.</p>
      </div>
      <EditableTable
        title="Daftar Kontak Pelanggan"
        columns={[
          { key: 'name', label: 'Nama' },
          { key: 'role', label: 'Role' },
          { key: 'position', label: 'Jabatan' },
          { key: 'phone', label: 'Telepon' },
        ]}
        rows={contacts}
        addLabel="Atur Kontak Pelanggan"
        onChange={(rows) => onUpdate({ contacts: rows.map((row) => ({ name: row.name ?? '', role: row.role ?? '', position: row.position ?? '', phone: row.phone ?? '' })) })}
      />
    </div>
  )
}

function InstitutionProfile({ customer, onUpdate }: { customer: CustomerProfile; onUpdate: (updates: Partial<CustomerProfile>) => boolean }) {
  const market = customer.marketAnalysis
  const productRows = customer.institutionProducts.map((item) => ({ ...item }))
  const renderIvcacard = (category: string) => {
    const itemIndex = customer.ivca.findIndex((item) => item.category === category)
    const item = customer.ivca[itemIndex] ?? { category, description: '' }
    return (
      <EditableCard
        key={`${customer.id}-${category}`}
        title={category}
        value={item.description}
        onSave={(description) => {
          const ivca = itemIndex === -1
            ? [...customer.ivca, { category, description }]
            : customer.ivca.map((entry, entryIndex) => entryIndex === itemIndex ? { ...entry, description } : entry)
          return onUpdate({ ivca })
        }}
      />
    )
  }
  return (
    <div className="space-y-6">
      <PanelTitle title="Institution Profile" />
      <section>
        <h4 className="mb-3 text-sm font-medium text-slate-300">Industry Value Chain Analysis (IVCA)</h4>
        <div className="grid gap-3 lg:grid-cols-6">
          <div className="lg:col-span-1">{renderIvcacard('Supporting Industry')}</div>
          <div className="lg:col-span-4">{renderIvcacard('Complement Institution')}</div>
          <div className="lg:col-span-1">{renderIvcacard('Customer')}</div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {['Firm Infrastructure', 'HR Management', 'Tech Development', 'Procurement'].map(renderIvcacard)}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {['Operation', 'Sosialisasi Layanan', 'Service'].map(renderIvcacard)}
        </div>
        <div className="mt-3">{renderIvcacard('Related Industry')}</div>
      </section>
      <EditableTable
        title="Daftar Layanan"
        columns={[{ key: 'name', label: 'Nama Produk' }, { key: 'status', label: 'Status' }]}
        rows={productRows}
        addLabel="+ Tambah Produk"
        onChange={(rows) => onUpdate({ institutionProducts: rows.map((row) => ({ name: row.name ?? '', status: row.status ?? '' })) })}
      />
      <section className="space-y-3 border-t border-slate-700/60 pt-5">
        <h4 className="text-sm font-semibold text-slate-200">Market Issues (Framework 3C)</h4>
        <EditableCard title="Comparator" value={market.comparator} onSave={(comparator) => onUpdate({ marketAnalysis: { ...market, comparator } })} />
        <EditableCard title="Key Challenges / Watch-outs" value={market.challenges} onSave={(challenges) => onUpdate({ marketAnalysis: { ...market, challenges } })} />
        <EditableCard title="Customer" value={market.customer} onSave={(customerText) => onUpdate({ marketAnalysis: { ...market, customer: customerText } })} />
      </section>
    </div>
  )
}

function Benchmark({ customer, onUpdate }: { customer: CustomerProfile; onUpdate: (updates: Partial<CustomerProfile>) => boolean }) {
  const practiceRows = customer.benchmarkPractices.map((item) => ({ ...item }))
  const tows = customer.towsAnalysis
  const towsCards: { key: keyof typeof tows; title: string }[] = [
    { key: 'opportunity', title: 'Opportunity (O)' },
    { key: 'threats', title: 'Threats (T)' },
    { key: 'strength', title: 'Strength (S)' },
    { key: 'strategySO', title: 'Strategy (S-O)' },
    { key: 'strategyST', title: 'Strategy (S-T)' },
    { key: 'weakness', title: 'Weakness (W)' },
    { key: 'strategyWO', title: 'Strategy (W-O)' },
    { key: 'strategyWT', title: 'Strategy (W-T)' },
  ]
  return (
    <div className="space-y-5">
      <PanelTitle title="Benchmark Best Practices and TOWS Analysis" />
      <EditableTable
        title="Benchmark Best Practice"
        columns={[{ key: 'logo', label: 'Logo', type: 'image' }, { key: 'institution', label: 'Nama Instansi' }, { key: 'description', label: 'Deskripsi' }]}
        rows={practiceRows}
        addLabel="+ Tambah Best Practice"
        onChange={(rows) => onUpdate({ benchmarkPractices: rows.map((row) => ({ logo: row.logo ?? '', institution: row.institution ?? '', description: row.description ?? '' })) })}
      />
      <section>
        <h4 className="mb-3 text-sm font-medium text-slate-300">TOWS Analysis</h4>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="flex min-h-32 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-800/70 p-4 text-center text-xs font-semibold text-slate-300">Internal Factors <span className="mx-2 text-slate-500">／</span> External Factors</div>
          {towsCards.map(({ key, title }) => (
            <EditableCard key={key} title={title} value={tows[key]} onSave={(value) => onUpdate({ towsAnalysis: { ...tows, [key]: value } })} />
          ))}
        </div>
      </section>
    </div>
  )
}

function CustomerInnovations({ customer, onUpdate }: { customer: CustomerProfile; onUpdate: (updates: Partial<CustomerProfile>) => boolean }) {
  return (
    <div>
      <PanelTitle title="Customer Value Innovation" />
      <EditableTable
        title="Daftar Inovasi"
        columns={[{ key: 'name', label: 'Inovasi' }, { key: 'description', label: 'Deskripsi' }]}
        rows={customer.innovations.map((item) => ({ name: item.name, description: item.description, status: item.status }))}
        addLabel="+ Tambah Inovasi Baru"
        onChange={(rows) => onUpdate({ innovations: rows.map((row) => ({ name: row.name ?? '', description: row.description ?? '', status: row.status ?? '' })) })}
      />
    </div>
  )
}

function RevenueWallet({ customer, onUpdate }: { customer: CustomerProfile; onUpdate: (updates: Partial<CustomerProfile>) => boolean }) {
  const walletRows = customer.walletSpend.map((item) => ({ product: item.product, amount: String(item.amount), institution: item.institution }))
  return (
    <div className="space-y-5">
      <PanelTitle title="Revenue and Wallet Shared" />
      <section>
        <h4 className="mb-3 text-sm font-medium text-slate-300">Revenue Shared</h4>
        <div className="grid gap-3 md:grid-cols-3">
          {customer.revenueSummary.map((item, index) => (
            <EditableCard
              key={item.label}
              title={item.label}
              value={formatRupiah(item.amount)}
              className="currency-card"
              onSave={(amount) => onUpdate({ revenueSummary: customer.revenueSummary.map((entry, entryIndex) => entryIndex === index ? { ...entry, amount: parseRupiah(amount) } : entry) })}
            />
          ))}
        </div>
      </section>
      <EditableTable
        title="Daftar Produk"
        columns={[{ key: 'name', label: 'Produk' }, { key: 'revenue', label: 'Revenue', type: 'currency' }, { key: 'subsidiary', label: 'Subsidiaries' }]}
        rows={customer.revenueProducts.map((item) => ({ name: item.name, revenue: String(item.revenue), subsidiary: item.subsidiary }))}
        addLabel="+ Tambah Produk"
        onChange={(rows) => onUpdate({ revenueProducts: rows.map((row) => ({ name: row.name ?? '', revenue: parseRupiah(row.revenue ?? ''), subsidiary: row.subsidiary ?? '' })) })}
      />
      <EditableTable
        title="Wallet Shared — Daftar Belanja Pelanggan di luar Telkom"
        columns={[{ key: 'product', label: 'Produk' }, { key: 'amount', label: 'Nominal Belanja', type: 'currency' }, { key: 'institution', label: 'Perusahaan/Institusi' }]}
        rows={walletRows}
        addLabel="+ Tambah Daftar Belanja"
        onChange={(rows) => onUpdate({ walletSpend: rows.map((row) => ({ product: row.product ?? '', amount: parseRupiah(row.amount ?? ''), institution: row.institution ?? '' })) })}
      />
      <section className="rounded-xl border border-slate-700/60 p-4">
        <h4 className="text-sm font-semibold text-slate-200">Wallet Shared Telkom</h4>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { title: 'Total Belanja Pelanggan (Non Telkom)', key: 'walletNonTelkom' as const },
            { title: 'Total Belanja Pelanggan (Telkom)', key: 'walletTelkom' as const },
            { title: 'Presentasi Wallet Shared Telkom', key: 'walletShare' as const },
          ].map(({ title, key }) => (
            <EditableCard key={key} title={title} value={customer.walletSummary[key]} onSave={(value) => onUpdate({ walletSummary: { ...customer.walletSummary, [key]: value } })} />
          ))}
        </div>
        <div className="mt-5 flex flex-col items-center justify-center gap-5 sm:flex-row">
          <div className="flex h-56 w-56 items-center justify-center rounded-full border-[28px] border-violet-400/90">
            <div className="text-center">
              <p className="text-xs text-slate-400">Total Belanja</p>
              <p className="text-lg font-bold text-white">{customer.walletSummary.walletNonTelkom}</p>
            </div>
          </div>
          <p className="text-xs text-slate-300"><span className="mr-2 inline-block h-3 w-3 rounded-full bg-violet-400" />{customer.name}</p>
        </div>
        <EditableCard className="mt-4" title="Kinerja Finansial" value={customer.financialPerformance} onSave={(financialPerformance) => onUpdate({ financialPerformance })} />
      </section>
    </div>
  )
}

function normalizeAgencyName(value: string) {
  return value.trim().toLocaleLowerCase('id-ID').replace(/\s+/g, ' ')
    .replace(/^pemkot\b/, 'pemerintah kota')
    .replace(/^kota\b/, 'pemerintah kota')
    .replace(/^pemkab\b/, 'pemerintah kabupaten')
    .replace(/^kabupaten\b/, 'pemerintah kabupaten')
    .replace(/^pemprov\b/, 'pemerintah provinsi')
    .replace(/^provinsi\b/, 'pemerintah provinsi')
}

function BusinessProspect({ customer }: { customer: CustomerProfile }) {
  const [projects, setProjects] = useState<ProjectEntry[]>([])
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ProjectsDB.getAll()
      .then((items) => {
        if (active) setProjects(items)
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Gagal memuat data Sales Funnel.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const opportunities = projects.filter((project) =>
    [project.pemdaName, project.agency, project.customerName]
      .filter((name): name is string => Boolean(name))
      .some((name) => normalizeAgencyName(name) === normalizeAgencyName(customer.name)),
  )

  return (
    <div>
      <PanelTitle title="Business Prospect" subtitle="Daftar business opportunity di pipeline proyek." />
      <section className="overflow-hidden rounded-xl border border-slate-700/60">
        <div className="border-b border-slate-700/60 px-4 py-3">
          <h4 className="text-sm font-semibold text-slate-200">Daftar Business Opportunity</h4>
        </div>
        {loadError && <p role="alert" className="bg-amber-500/5 px-4 py-2 text-xs text-amber-300">{loadError}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead><tr className="border-b border-slate-700/50 bg-slate-950/50">
              {['Proyek / LOP ID', 'Nama Proyek', 'Kategori Proyek', 'Tahap', 'Nilai Penawaran', 'Kategori Solusi'].map((heading) => <th key={heading} className="px-3 py-3 text-[10px] font-bold text-slate-400">{heading}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-slate-800/80">
              {opportunities.map((project) => (
                <tr key={project.id} className="hover:bg-slate-800/30">
                  <td className="px-3 py-3 font-mono text-xs text-cyan-300">{project.idLOP}</td>
                  <td className="px-3 py-3 text-xs text-slate-200">{project.projectName}</td>
                  <td className="px-3 py-3 text-xs text-slate-300">{project.category}</td>
                  <td className="px-3 py-3 text-xs text-slate-300">{project.stage}</td>
                  <td className="px-3 py-3 text-xs font-semibold text-slate-200">{formatRupiah(project.budget)}</td>
                  <td className="px-3 py-3 text-xs text-slate-300">{project.serviceType}</td>
                </tr>
              ))}
              {!loading && opportunities.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-500">Belum ada business opportunity untuk instansi ini di Sales Funnel.</td></tr>}
              {loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-500">Memuat data Sales Funnel...</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function ComplaintSolution({ customer, onUpdate }: { customer: CustomerProfile; onUpdate: (updates: Partial<CustomerProfile>) => boolean }) {
  return (
    <div>
      <PanelTitle title="Complaint and Solution" />
      <EditableTable
        title="Daftar Keluhan"
        columns={[
          { key: 'date', label: 'Tgl. Keluhan', type: 'date' },
          { key: 'issue', label: 'Keluhan' },
          { key: 'channel', label: 'Channel' },
          { key: 'status', label: 'Status' },
          { key: 'resolvedDate', label: 'Tgl. Disolusikan', type: 'date' },
          { key: 'solution', label: 'Solusi' },
        ]}
        rows={customer.complaints.map((item) => ({ date: item.date, issue: item.issue, channel: item.channel, status: item.status, resolvedDate: item.resolvedDate, solution: item.solution }))}
        addLabel="+ Tambah Keluhan"
        onChange={(rows) => onUpdate({ complaints: rows.map((row) => ({ date: row.date ?? '', issue: row.issue ?? '', channel: row.channel ?? '', status: row.status ?? '', resolvedDate: row.resolvedDate ?? '', solution: row.solution ?? '' })) })}
      />
    </div>
  )
}

function CourtesyVisit({ customer, onUpdate }: { customer: CustomerProfile; onUpdate: (updates: Partial<CustomerProfile>) => boolean }) {
  return (
    <div>
      <PanelTitle title="Courtesy Visit" />
      <EditableTable
        title="Daftar Visit"
        columns={[{ key: 'date', label: 'Tanggal', type: 'date' }, { key: 'objective', label: 'Main Objective' }, { key: 'notes', label: 'Catatan' }]}
        rows={customer.visits.map((item) => ({ ...item }))}
        addLabel="+ Tambah Courtesy Visit"
        onChange={(rows) => onUpdate({ visits: rows.map((row) => ({ date: row.date ?? '', objective: row.objective ?? '', notes: row.notes ?? '' })) })}
      />
    </div>
  )
}

export function CustomerProfileMaps({
  customer,
  onUpdate,
  saveError,
}: {
  customer: CustomerProfile
  onUpdate: (updates: Partial<CustomerProfile>) => boolean
  saveError: string
}) {
  const [activeSection, setActiveSection] = useState<MapsSection>('Customer Profile')
  const sectionContent: Record<MapsSection, ReactNode> = {
    'Customer Profile': <CustomerOverview customer={customer} onUpdate={onUpdate} />,
    'Strategic Highlight': <StrategicHighlight customer={customer} onUpdate={onUpdate} />,
    'Management Profile': <ManagementProfile customer={customer} onUpdate={onUpdate} />,
    'Institution Profile': <InstitutionProfile customer={customer} onUpdate={onUpdate} />,
    'Benchmark Best Practices and TOWS Analysis': <Benchmark customer={customer} onUpdate={onUpdate} />,
    'Customer Value Innovation': <CustomerInnovations customer={customer} onUpdate={onUpdate} />,
    'Revenue and Wallet Shared': <RevenueWallet customer={customer} onUpdate={onUpdate} />,
    'Business Prospect': <BusinessProspect customer={customer} />,
    'Complaint and Solution': <ComplaintSolution customer={customer} onUpdate={onUpdate} />,
    'Courtesy Visit': <CourtesyVisit customer={customer} onUpdate={onUpdate} />,
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[270px_minmax(0,1fr)]">
      <MapsSidebar active={activeSection} onChange={setActiveSection} />
      <section className="min-h-[440px] rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 sm:p-6">
        {saveError && <p role="alert" className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">{saveError}</p>}
        {sectionContent[activeSection]}
      </section>
    </div>
  )
}
