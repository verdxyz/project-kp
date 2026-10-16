import { Building2, Download, Mail, MapPin, Phone, UserRound } from 'lucide-react'
import type { CustomerProfile } from '../../data/customerProfiles'

function downloadSlaReport(customer: CustomerProfile) {
  const report = [
    `LAPORAN SERVICE LEVEL AGREEMENT`,
    `Instansi: ${customer.name}`,
    `NIPNAS: ${customer.nipnas}`,
    `Periode: Tahun 2026`,
    `Target SLG: 99%`,
    `Status: Dalam pemenuhan`,
  ].join('\n')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([report], { type: 'text/plain;charset=utf-8' }))
  link.download = `Laporan-SLG-${customer.region.replace(/\s+/g, '-')}.txt`
  link.click()
  URL.revokeObjectURL(link.href)
}

function ContactCard({
  title,
  contact,
  icon: Icon,
  accent,
}: {
  title: string
  contact: CustomerProfile['pic']
  icon: typeof UserRound
  accent: string
}) {
  return (
    <article className="rounded-2xl border border-slate-700/70 bg-slate-950/50 p-4 shadow-lg shadow-black/10">
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${accent}`}><Icon size={15} /></span>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
      </div>
      <p className="truncate text-sm font-bold text-white">{contact.name}</p>
      <p className="mt-0.5 truncate text-[11px] text-slate-500">{contact.role}</p>
      <div className="mt-3 space-y-1.5 text-[11px] text-slate-400">
        <p className="flex items-center gap-2 truncate"><Phone size={11} />{contact.phone}</p>
        <p className="flex items-center gap-2 truncate"><Mail size={11} />{contact.email}</p>
      </div>
    </article>
  )
}

export function CustomerProfileHeader({ customer }: { customer: CustomerProfile }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-700/70 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 shadow-xl shadow-black/20">
      <div className="h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500" />
      <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(560px,1fr)] xl:p-6">
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300"><Building2 size={19} /></span>
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-amber-300">NIPNAS · VIP</span>
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">{customer.name.toLocaleUpperCase('id-ID')}</h2>
          <p className="mt-1 font-mono text-xs text-cyan-300">{customer.nipnas}</p>

          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
            {[
              ['BUD', 'Business Unit Daerah'],
              ['Segmen', customer.segment],
              ['Sub Segmen', customer.subSegment],
              ['Witel', customer.witel],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
                <p className="mt-1 text-xs font-semibold text-slate-200">{value}</p>
              </div>
            ))}
            <div className="col-span-2 sm:col-span-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Alamat Lengkap</p>
              <p className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed text-slate-300"><MapPin size={13} className="mt-0.5 shrink-0 text-cyan-400" />{customer.address}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => downloadSlaReport(customer)}
            className="mt-5 inline-flex w-fit items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:border-cyan-400/60 hover:bg-cyan-500/20"
          >
            <Download size={14} /> Unduh Dokumen Laporan SLG
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <ContactCard title="PIC Pelanggan" contact={customer.pic} icon={UserRound} accent="bg-blue-500/15 text-blue-300" />
          <ContactCard title="Account Manager" contact={customer.accountManager} icon={UserRound} accent="bg-violet-500/15 text-violet-300" />
          <ContactCard title="Engineer On Site" contact={customer.engineer} icon={UserRound} accent="bg-emerald-500/15 text-emerald-300" />
        </div>
      </div>
    </section>
  )
}
