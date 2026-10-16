import { useRef, useState } from 'react'
import {
  BadgeCheck, Building2, Check, CloudUpload, Pencil, Plus, Save, Trash2, X,
  Lightbulb, MessageSquareText, Network, Target, Users,
} from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import type { CustomerProfile, MapsSection } from '../../data/customerProfiles'

const MAPS_SECTIONS: { label: MapsSection; icon: typeof Building2; complete: boolean }[] = [
  { label: 'Customer Profile', icon: Building2, complete: true },
  { label: 'Strategic Highlight', icon: Target, complete: true },
  { label: 'Management Profile', icon: Users, complete: true },
  { label: 'Institution Profile', icon: Network, complete: true },
  { label: 'Benchmark Best Practices', icon: BadgeCheck, complete: true },
  { label: 'Customer Value Innovation', icon: Lightbulb, complete: true },
  { label: 'Revenue and Wallet Shared', icon: Network, complete: false },
  { label: 'Business Prospect', icon: Target, complete: false },
  { label: 'Complaint and Solution', icon: MessageSquareText, complete: false },
]

function MapsSidebar({ active, onChange }: { active: MapsSection; onChange: (section: MapsSection) => void }) {
  return (
    <aside className="rounded-2xl border border-slate-700/70 bg-slate-900/80 p-3">
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-white">6/6 Kriteria Terpenuhi</p>
          <span className="text-[10px] font-bold text-emerald-300">100%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-300" />
        </div>
        <p className="mt-2 text-[10px] text-slate-500">Kelengkapan profil pelanggan</p>
      </div>
      <nav className="mt-3 space-y-1" aria-label="Submenu MAPS">
        {MAPS_SECTIONS.map(({ label, icon: Icon, complete }) => (
          <button
            key={label}
            type="button"
            onClick={() => onChange(label)}
            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[11px] font-medium transition ${
              active === label ? 'bg-cyan-500/10 text-cyan-200 ring-1 ring-cyan-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Icon size={14} className="shrink-0" />
            <span className="flex-1">{label}</span>
            {complete && <Check size={13} className="shrink-0 text-emerald-400" />}
          </button>
        ))}
      </nav>
    </aside>
  )
}

function PanelTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-400">Customer Intelligence</p>
      <h3 className="mt-1 text-lg font-bold text-white">{title}</h3>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </div>
  )
}

function DataCard({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Building2 }) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-950/40 p-3">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {Icon && <Icon size={12} className="text-cyan-400" />}{label}
      </p>
      <p className="mt-1.5 break-words text-sm font-semibold text-slate-100">{value}</p>
    </div>
  )
}

function CustomerOverview({ customer }: { customer: CustomerProfile }) {
  return (
    <div>
      <PanelTitle title="Customer Profile" subtitle="Informasi utama dan cakupan organisasi pelanggan." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <DataCard label="Telepon" value={customer.phone} />
        <DataCard label="Email" value={customer.email} />
        <DataCard label="Website" value={customer.website} />
        <DataCard label="Jumlah Pegawai" value={`${customer.employeeCount.toLocaleString('id-ID')} pegawai`} />
        <DataCard label="Alamat" value={customer.address} icon={Building2} />
      </div>
      <div className="mt-5 overflow-hidden rounded-xl border border-slate-700/60">
        <div className="flex items-center justify-between border-b border-slate-700/60 bg-slate-800/60 px-4 py-3">
          <h4 className="text-xs font-bold text-white">Satuan Kerja</h4>
          <span className="text-[10px] text-slate-500">{customer.organizationUnits.length} kategori</span>
        </div>
        <div className="grid grid-cols-2 gap-px bg-slate-700/50 sm:grid-cols-3">
          {customer.organizationUnits.map(({ label, count }) => (
            <div key={label} className="bg-slate-900 p-4">
              <p className="text-[10px] text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-white">{count.toLocaleString('id-ID')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StrategicHighlight({ customer }: { customer: CustomerProfile }) {
  return (
    <div>
      <PanelTitle title="Strategic Highlight" subtitle="Arah strategis dan prioritas pembangunan daerah." />
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">Visi</p>
        <p className="mt-2 text-base font-semibold leading-relaxed text-white">“{customer.vision}”</p>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ListPanel title="Misi" items={customer.missions} />
        <ListPanel title="Strategi Jangka Menengah" items={customer.mediumTermStrategy} />
        <div className="lg:col-span-2"><ListPanel title="Strategi Jangka Panjang" items={customer.longTermStrategy} /></div>
      </div>
    </div>
  )
}

function ListPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-xl border border-slate-700/60 bg-slate-950/35 p-4">
      <h4 className="text-xs font-bold text-white">{title}</h4>
      <ul className="mt-3 space-y-2">
        {items.map((item) => <li key={item} className="flex gap-2 text-xs leading-relaxed text-slate-300"><Check size={13} className="mt-0.5 shrink-0 text-emerald-400" />{item}</li>)}
      </ul>
    </section>
  )
}

function ManagementProfile({ customer }: { customer: CustomerProfile }) {
  const [fileName, setFileName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div>
      <PanelTitle title="Management Profile" subtitle="Struktur organisasi dan kontak utama pelanggan." />
      <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.ppt,.pptx" className="hidden" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          setFileName(event.dataTransfer.files[0]?.name ?? '')
        }}
        className="flex min-h-36 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-600 bg-slate-950/30 px-5 text-center transition hover:border-cyan-500/50 hover:bg-cyan-500/5"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300"><CloudUpload size={20} /></span>
        <span className="mt-3 text-xs font-semibold text-slate-200">{fileName || 'Drag and drop Struktur Organisasi di sini'}</span>
        <span className="mt-1 text-[10px] text-slate-500">Klik untuk memilih file · PDF, PNG, JPG, PPT</span>
      </button>
      <DataTable
        title="Daftar Kontak Pelanggan"
        columns={['Nama', 'Role', 'Jabatan', 'Telepon']}
        rows={customer.contacts.map((contact) => [contact.name, contact.role, contact.position, contact.phone])}
      />
    </div>
  )
}

function InstitutionProfile({ customer }: { customer: CustomerProfile }) {
  return (
    <div>
      <PanelTitle title="Institution Profile" subtitle="Industry Value Chain Analysis (IVCA)." />
      <DataTable title="Industry Value Chain Analysis (IVCA)" columns={['Kategori', 'Analisis Rantai Nilai']} rows={customer.ivca.map((item) => [item.category, item.description])} />
    </div>
  )
}

function Benchmark({ customer }: { customer: CustomerProfile }) {
  return (
    <div>
      <PanelTitle title="Benchmark Best Practices" subtitle="Ringkasan praktik baik dan area pengembangan." />
      <div className="grid gap-3 md:grid-cols-3">
        {customer.benchmarks.map((item, index) => (
          <article key={item} className="rounded-2xl border border-slate-700/60 bg-slate-950/40 p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-sm font-bold text-emerald-300">0{index + 1}</span>
            <p className="mt-4 text-sm leading-relaxed text-slate-200">{item}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

type EditableField = { key: string; label: string; type?: 'text' | 'number' }

function EditableRecordModal({
  title,
  fields,
  initial,
  onClose,
  onSave,
}: {
  title: string
  fields: EditableField[]
  initial: Record<string, string>
  onClose: () => void
  onSave: (record: Record<string, string>) => void
}) {
  const [values, setValues] = useState(initial)
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSave(values)
  }
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white">{title}</h4>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"><X size={16} /></button>
        </div>
        {fields.map((field) => (
          <label key={field.key} className="block text-xs font-semibold text-slate-300">
            {field.label}
            <input
              type={field.type ?? 'text'}
              min={field.type === 'number' ? 0 : undefined}
              value={values[field.key] ?? ''}
              onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
              required
              className="form-input mt-1.5"
            />
          </label>
        ))}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
          <button type="submit" className="btn-primary flex items-center gap-2"><Save size={14} />Simpan</button>
        </div>
      </form>
    </div>
  )
}

function CustomerInnovations({ customer }: { customer: CustomerProfile }) {
  const [innovations, setInnovations] = useState(customer.innovations)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const saveInnovation = (record: Record<string, string>) => {
    if (editingIndex === null) return
    setInnovations((current) => current.map((item, index) => index === editingIndex
      ? { name: record.name, description: record.description, status: item.status }
      : item))
    setEditingIndex(null)
  }

  return (
    <div>
      <PanelTitle title="Customer Value Innovation" subtitle="Daftar inisiatif inovasi nilai pelanggan." />
      <section className="overflow-hidden rounded-xl border border-slate-700/60">
        <div className="flex items-center justify-between border-b border-slate-700/60 bg-slate-800/50 px-4 py-3">
          <h4 className="text-xs font-bold text-white">Daftar Inovasi</h4>
          <span className="text-[10px] text-slate-500">{innovations.length} inovasi</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead><tr className="border-b border-slate-700/50 bg-slate-950/50">{['Nama Inovasi', 'Deskripsi', 'Aksi'].map((heading) => <th key={heading} className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-500">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-800/80">
              {innovations.map((item, index) => (
                <tr key={`${item.name}-${index}`} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-xs font-semibold text-slate-200">{item.name}</td>
                  <td className="px-4 py-3 text-xs leading-relaxed text-slate-300">{item.description}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button type="button" aria-label={`Edit ${item.name}`} onClick={() => setEditingIndex(index)} className="rounded-lg bg-slate-800 p-2 text-slate-400 hover:bg-blue-500/15 hover:text-blue-300"><Pencil size={13} /></button>
                      <button type="button" aria-label={`Hapus ${item.name}`} onClick={() => setInnovations((current) => current.filter((_, rowIndex) => rowIndex !== index))} className="rounded-lg bg-slate-800 p-2 text-slate-400 hover:bg-red-500/15 hover:text-red-300"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {innovations.length === 0 && <tr><td colSpan={3} className="px-4 py-10 text-center text-xs text-slate-500">Belum ada data inovasi.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      {editingIndex !== null && (
        <EditableRecordModal
          title="Edit Inovasi"
          fields={[{ key: 'name', label: 'Nama Inovasi' }, { key: 'description', label: 'Deskripsi' }]}
          initial={{ name: innovations[editingIndex].name, description: innovations[editingIndex].description }}
          onClose={() => setEditingIndex(null)}
          onSave={saveInnovation}
        />
      )}
    </div>
  )
}

function RevenueWallet({ customer }: { customer: CustomerProfile }) {
  const [walletSpend, setWalletSpend] = useState(customer.walletSpend)
  const [editingWalletIndex, setEditingWalletIndex] = useState<number | null>(null)
  const revenueCards = [
    { label: 'Revenue Shared Telkom · 2026', amount: 0 },
    { label: 'Revenue Shared Telkom · 2025', amount: 0 },
    { label: 'Revenue Growth', amount: 0 },
  ]

  const saveWalletSpend = (record: Record<string, string>) => {
    if (editingWalletIndex === null) return
    const updated = {
      product: record.product,
      amount: Number(record.amount),
      institution: record.institution,
    }
    setWalletSpend((current) => editingWalletIndex === current.length
      ? [...current, updated]
      : current.map((item, index) => index === editingWalletIndex ? updated : item))
    setEditingWalletIndex(null)
  }

  return (
    <div>
      <PanelTitle title="Revenue and Wallet Shared" subtitle="Potensi dan realisasi nilai bisnis pelanggan." />
      <div className="grid gap-3 sm:grid-cols-3">
        {revenueCards.map((item, index) => (
          <div key={item.label} className={`rounded-2xl border p-4 ${index === 0 ? 'border-cyan-500/20 bg-cyan-500/5' : 'border-slate-700/60 bg-slate-950/40'}`}>
            <p className="text-xs text-slate-400">{item.label}</p>
            <p className="mt-2 text-xl font-bold text-white">Rp {item.amount.toLocaleString('id-ID')}</p>
          </div>
        ))}
      </div>
      <DataTable title="Daftar Produk" columns={['Produk', 'Revenue', 'Subsidiaries']} rows={[]} emptyMessage="Belum ada data revenue produk." />
      <section className="mt-5 overflow-hidden rounded-xl border border-slate-700/60">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 bg-slate-800/50 px-4 py-3">
          <div>
            <h4 className="text-xs font-bold text-white">Wallet Shared</h4>
            <p className="mt-1 text-[10px] text-slate-400">Daftar belanja pelanggan di luar Telkom</p>
          </div>
          <button type="button" onClick={() => setEditingWalletIndex(walletSpend.length)} className="btn-primary flex items-center gap-1.5 px-3 py-2 text-[10px]"><Plus size={13} />Tambah Daftar Belanja</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[660px] text-left">
            <thead><tr className="border-b border-slate-700/50 bg-slate-950/50">{['Produk', 'Nominal Belanja', 'Perusahaan/Institusi', 'Aksi'].map((heading) => <th key={heading} className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-500">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-800/80">
              {walletSpend.map((item, index) => (
                <tr key={`${item.product}-${index}`} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-xs font-semibold text-slate-200">{item.product}</td>
                  <td className="px-4 py-3 text-xs tabular-nums text-slate-300">Rp {item.amount.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-xs text-slate-300">{item.institution}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button type="button" aria-label={`Edit ${item.product}`} onClick={() => setEditingWalletIndex(index)} className="rounded-lg bg-slate-800 p-2 text-slate-400 hover:bg-blue-500/15 hover:text-blue-300"><Pencil size={13} /></button>
                      <button type="button" aria-label={`Hapus ${item.product}`} onClick={() => setWalletSpend((current) => current.filter((_, rowIndex) => rowIndex !== index))} className="rounded-lg bg-slate-800 p-2 text-slate-400 hover:bg-red-500/15 hover:text-red-300"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {walletSpend.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-xs text-slate-500">Belum ada daftar belanja pelanggan di luar Telkom.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      {editingWalletIndex !== null && (
        <EditableRecordModal
          title={editingWalletIndex === walletSpend.length ? 'Tambah Daftar Belanja' : 'Edit Daftar Belanja'}
          fields={[{ key: 'product', label: 'Produk' }, { key: 'amount', label: 'Nominal Belanja (Rp)', type: 'number' }, { key: 'institution', label: 'Perusahaan/Institusi' }]}
          initial={walletSpend[editingWalletIndex]
            ? { product: walletSpend[editingWalletIndex].product, amount: String(walletSpend[editingWalletIndex].amount), institution: walletSpend[editingWalletIndex].institution }
            : { product: '', amount: '', institution: '' }}
          onClose={() => setEditingWalletIndex(null)}
          onSave={saveWalletSpend}
        />
      )}
    </div>
  )
}

function BusinessProspect({ customer }: { customer: CustomerProfile }) {
  return <><PanelTitle title="Business Prospect" subtitle="Peluang proyek dan pipeline bisnis." /><DataTable title="Daftar Business Opportunity" columns={['Proyek / LOP ID', 'Kategori Proyek', 'Proses', 'Nilai Penawaran', 'Kategori']} rows={customer.opportunities.map((item) => [item.projectId, item.projectCategory, item.process, `Rp ${item.offer.toLocaleString('id-ID')}`, item.category])} /></>
}

function ComplaintSolution({ customer }: { customer: CustomerProfile }) {
  return <><PanelTitle title="Complaint and Solution" subtitle="Riwayat kendala pelanggan dan tindak lanjut." /><DataTable title="Daftar Komplain dan Solusi" columns={['Tanggal', 'Kendala', 'Solusi / Tindak Lanjut', 'Status']} rows={customer.complaints.map((item) => [item.date, item.issue, item.solution, item.status])} /></>
}

function DataTable({ title, columns, rows, emptyMessage }: { title: string; columns: string[]; rows: string[][]; emptyMessage?: string }) {
  return (
    <section className="mt-5 overflow-hidden rounded-xl border border-slate-700/60">
      <div className="border-b border-slate-700/60 bg-slate-800/50 px-4 py-3"><h4 className="text-xs font-bold text-white">{title}</h4></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] text-left">
          <thead><tr className="border-b border-slate-700/50 bg-slate-950/50">{columns.map((column) => <th key={column} className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-500">{column}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-800/80">
            {rows.map((row, rowIndex) => <tr key={`${row[0]}-${rowIndex}`} className="hover:bg-slate-800/30">{row.map((cell, cellIndex) => <td key={`${cellIndex}-${cell}`} className="px-4 py-3 text-xs leading-relaxed text-slate-300">{cell}</td>)}</tr>)}
            {rows.length === 0 && emptyMessage && <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-xs text-slate-500">{emptyMessage}</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function CustomerProfileMaps({ customer }: { customer: CustomerProfile }) {
  const [activeSection, setActiveSection] = useState<MapsSection>('Customer Profile')
  let content: ReactNode
  switch (activeSection) {
    case 'Customer Profile': content = <CustomerOverview customer={customer} />; break
    case 'Strategic Highlight': content = <StrategicHighlight customer={customer} />; break
    case 'Management Profile': content = <ManagementProfile customer={customer} />; break
    case 'Institution Profile': content = <InstitutionProfile customer={customer} />; break
    case 'Benchmark Best Practices': content = <Benchmark customer={customer} />; break
    case 'Customer Value Innovation': content = <CustomerInnovations customer={customer} />; break
    case 'Revenue and Wallet Shared': content = <RevenueWallet customer={customer} />; break
    case 'Business Prospect': content = <BusinessProspect customer={customer} />; break
    case 'Complaint and Solution': content = <ComplaintSolution customer={customer} />; break
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
      <MapsSidebar active={activeSection} onChange={setActiveSection} />
      <section className="min-h-[440px] rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 sm:p-6">
        {content}
      </section>
    </div>
  )
}
