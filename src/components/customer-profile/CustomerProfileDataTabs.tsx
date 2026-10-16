import { useMemo, useState } from 'react'
import { Download, FileCheck2, FileText, Search, ShieldCheck } from 'lucide-react'
import type { CustomerProfile, CustomerProfileService } from '../../data/customerProfiles'

const serviceFilters = ['Semua', 'Aktif', 'Suspend', 'Non Aktif'] as const
type ServiceFilter = (typeof serviceFilters)[number]

const serviceStatusStyles: Record<CustomerProfileService['status'], string> = {
  Aktif: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  Suspend: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
  'Non Aktif': 'border-slate-600 bg-slate-800 text-slate-400',
}

const contractStatusStyles: Record<string, string> = {
  Disconnect: 'border-red-500/20 bg-red-500/10 text-red-300',
  Modify: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
  Suspend: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
  Resume: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
}

function downloadTextFile(name: string, contents: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

function ServiceList({ customer }: { customer: CustomerProfile }) {
  const [filter, setFilter] = useState<ServiceFilter>('Semua')
  const [query, setQuery] = useState('')
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
    <section className="overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/70">
      <div className="flex flex-col gap-4 border-b border-slate-700/60 p-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Daftar Layanan</h3>
          <p className="mt-1 text-xs text-slate-500">Layanan aktif dan histori layanan pelanggan.</p>
        </div>
        <label className="relative block xl:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari layanan..." className="form-input py-2 pl-9 text-xs" />
        </label>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-slate-700/60 px-4 py-3">
        {serviceFilters.map((item) => (
          <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${filter === item ? 'bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-500/30' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            {item}<span className="ml-1.5 opacity-60">{counts[item]}</span>
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left">
          <thead><tr className="border-b border-slate-700/50 bg-slate-950/40">{['Nama Layanan', 'Status Layanan', 'No. Layanan', 'Alamat Pemasangan'].map((heading) => <th key={heading} className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-500">{heading}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-800/80">
            {services.map((service) => (
              <tr key={service.serviceNumber} className="hover:bg-slate-800/30">
                <td className="px-4 py-3 text-xs font-semibold text-slate-200">{service.name}</td>
                <td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${serviceStatusStyles[service.status]}`}>{service.status}</span></td>
                <td className="px-4 py-3 font-mono text-xs text-cyan-300">{service.serviceNumber}</td>
                <td className="px-4 py-3 text-xs text-slate-400">{service.address}</td>
              </tr>
            ))}
            {services.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-xs text-slate-500">Tidak ada layanan yang cocok dengan filter.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ContractList({ customer }: { customer: CustomerProfile }) {
  const [now] = useState(() => new Date())
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/70">
      <div className="border-b border-slate-700/60 p-4">
        <h3 className="text-sm font-bold text-white">Daftar Kontrak</h3>
        <p className="mt-1 text-xs text-slate-500">Periode kontrak, status perubahan, jumlah layanan, dan komitmen SLG.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-left">
          <thead><tr className="border-b border-slate-700/50 bg-slate-950/40">{['No. Kontrak', 'Periode Kontrak', 'Status Kontrak', 'Jumlah Layanan', 'SLG'].map((heading) => <th key={heading} className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-500">{heading}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-800/80">
            {customer.contracts.map((contract) => {
              const endDate = new Date(`${contract.endDate}T00:00:00`)
              const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / 86_400_000))
              return (
                <tr key={contract.contractNumber} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-mono text-xs text-cyan-300">{contract.contractNumber}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-slate-200">{contract.startDate} – {contract.endDate}</p>
                    <p className={`mt-1 text-[10px] ${daysRemaining <= 60 ? 'text-amber-300' : 'text-slate-500'}`}>{daysRemaining.toLocaleString('id-ID')} hari tersisa</p>
                  </td>
                  <td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${contractStatusStyles[contract.status]}`}>{contract.status}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-300">{contract.serviceCount} layanan</td>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300"><ShieldCheck size={13} />{contract.slg}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function DocumentList({ customer }: { customer: CustomerProfile }) {
  return (
    <section className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-white">Dokumen Pelanggan</h3>
        <p className="mt-1 text-xs text-slate-500">Dokumen referensi profil dan hubungan layanan.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {customer.documents.map((document) => (
          <article key={document.name} className="flex items-start gap-3 rounded-xl border border-slate-700/60 bg-slate-950/40 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300"><FileText size={17} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-200">{document.name}</p>
              <p className="mt-1 text-[10px] text-slate-500">{document.type} · Diperbarui {document.updatedAt}</p>
              <button type="button" onClick={() => downloadTextFile(document.name.replace(/\.pdf$/i, '.txt'), `${document.type}\n${customer.name}\nDokumen contoh untuk tampilan dashboard.`)} className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold text-cyan-300 hover:text-cyan-200">
                <Download size={12} />Unduh
              </button>
            </div>
          </article>
        ))}
        <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-slate-700 p-4 text-center">
          <div><FileCheck2 size={18} className="mx-auto text-slate-500" /><p className="mt-2 text-[10px] text-slate-500">File contoh · siap diganti dokumen asli</p></div>
        </div>
      </div>
    </section>
  )
}

export function CustomerProfileDataTab({ tab, customer }: { tab: 'Layanan' | 'Kontrak' | 'Dokumen'; customer: CustomerProfile }) {
  if (tab === 'Layanan') return <ServiceList customer={customer} />
  if (tab === 'Kontrak') return <ContractList customer={customer} />
  return <DocumentList customer={customer} />
}
