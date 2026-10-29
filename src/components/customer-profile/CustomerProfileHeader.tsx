import { useState } from 'react'
import { Building2, Download, Mail, MapPin, Phone, UserRound } from 'lucide-react'
import type { CustomerProfile } from '../../data/customerProfiles'
import { CountryPhoneInput } from './CountryPhoneInput'

async function downloadSlaReport(customer: CustomerProfile) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF()
  const margin = 16
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  let cursorY = 18

  const addText = (text: string, options: { bold?: boolean; size?: number; gap?: number } = {}) => {
    const { bold = false, size = 10, gap = 2 } = options
    pdf.setFont('helvetica', bold ? 'bold' : 'normal')
    pdf.setFontSize(size)
    const lines = pdf.splitTextToSize(text, pageWidth - margin * 2)
    const lineHeight = size * 0.48
    if (cursorY + lines.length * lineHeight > pageHeight - margin) {
      pdf.addPage()
      cursorY = margin
    }
    pdf.text(lines, margin, cursorY)
    cursorY += lines.length * lineHeight + gap
  }

  addText('LAPORAN SLG - PROFIL MAPS', { bold: true, size: 16, gap: 3 })
  addText(`${customer.name} | NIPNAS: ${customer.nipnas} | Tanggal: ${new Date().toLocaleDateString('id-ID')}`, { size: 9, gap: 6 })

  const addSection = (title: string, entries: string[]) => {
    addText(title, { bold: true, size: 12, gap: 2 })
    entries.forEach((entry) => addText(entry, { size: 9, gap: 1 }))
    cursorY += 4
  }

  addSection('1. Customer Profile', [
    `Telepon: ${customer.phone}`,
    `Email: ${customer.email}`,
    `Website: ${customer.website}`,
    `Jumlah pegawai: ${customer.employeeCount.toLocaleString('id-ID')}`,
    `Alamat: ${customer.address}`,
    `Satuan kerja: ${customer.organizationUnits.map((unit) => unit.label).join(', ')}`,
  ])
  addSection('2. Strategic Highlight', [
    `Visi: ${customer.vision}`,
    `Misi: ${customer.missions.join('; ')}`,
    `Strategi jangka menengah: ${customer.mediumTermStrategy.join('; ')}`,
    `Strategi jangka panjang: ${customer.longTermStrategy.join('; ')}`,
  ])
  addSection('3. Management Profile', [
    `Kontak: ${customer.contacts.map((contact) => `${contact.name} - ${contact.position} - ${contact.phone}`).join('; ')}`,
    `PIC Pelanggan: ${customer.pic.name} - ${customer.pic.role} - ${customer.pic.phone} - ${customer.pic.email}`,
    `Account Manager: ${customer.accountManager.name} - ${customer.accountManager.phone} - ${customer.accountManager.email}`,
    `Engineer On Site: ${customer.engineer.name} - ${customer.engineer.phone} - ${customer.engineer.email}`,
  ])
  addSection('4. Institution Profile (IVCA)', customer.ivca.map((item) => `${item.category}: ${item.description}`))
  addSection('5. Benchmark Best Practices', customer.benchmarkPractices.map((item) => `${item.institution}: ${item.description}`))
  addSection('5.1 TOWS Analysis', [
    `Opportunity: ${customer.towsAnalysis.opportunity}`,
    `Threats: ${customer.towsAnalysis.threats}`,
    `Strength: ${customer.towsAnalysis.strength}`,
    `Weakness: ${customer.towsAnalysis.weakness}`,
    `Strategy S-O: ${customer.towsAnalysis.strategySO}`,
    `Strategy S-T: ${customer.towsAnalysis.strategyST}`,
    `Strategy W-O: ${customer.towsAnalysis.strategyWO}`,
    `Strategy W-T: ${customer.towsAnalysis.strategyWT}`,
  ])
  addSection('6. Customer Value Innovation', customer.innovations.map((item) => `${item.name}: ${item.description}`))

  pdf.save(`Laporan-MAPS-${customer.region.replace(/\s+/g, '-')}.pdf`)
}

function ContactCard({
  title,
  contact,
  icon: Icon,
  accent,
  onChange,
}: {
  title: string
  contact: CustomerProfile['pic']
  icon: typeof UserRound
  accent: string
  onChange: (contact: CustomerProfile['pic']) => void
}) {
  const update = (key: keyof CustomerProfile['pic'], value: string) => onChange({ ...contact, [key]: value })
  return (
    <article className="rounded-2xl border border-[#E5E5E5] bg-[#F9F8F6] p-4  ">
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${accent}`}><Icon size={15} /></span>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">{title}</p>
      </div>
      <input aria-label={`${title} nama`} defaultValue={contact.name} onBlur={(event) => update('name', event.target.value)} placeholder={`Buat ${title} Disini`} className="w-full bg-transparent text-sm font-bold text-[#1C1C1E] outline-none" />
      <input aria-label={`${title} jabatan`} defaultValue={contact.role} onBlur={(event) => update('role', event.target.value)} placeholder={`Buat Jabatan ${title} Disini`} className="mt-0.5 w-full bg-transparent text-[11px] text-[#666666] outline-none" />
      <div className="mt-3 space-y-1.5 text-[11px] text-[#666666]">
        <label className="flex items-center gap-2"><Phone size={11} /><CountryPhoneInput label={`${title} telepon`} value={contact.phone} onSave={(phone) => update('phone', phone)} /></label>
        <label className="flex items-center gap-2"><Mail size={11} /><input aria-label={`${title} email`} defaultValue={contact.email} onBlur={(event) => update('email', event.target.value)} placeholder={`Buat Email ${title} Disini`} className="min-w-0 flex-1 bg-transparent outline-none" /></label>
      </div>
    </article>
  )
}

export function CustomerProfileHeader({
  customer,
  onUpdate,
}: {
  customer: CustomerProfile
  onUpdate: (updates: Partial<CustomerProfile>) => boolean
}) {
  const [downloadError, setDownloadError] = useState('')

  const handleDownload = async () => {
    try {
      setDownloadError('')
      await downloadSlaReport(customer)
    } catch (error) {
      console.error('Gagal mengunduh laporan SLG MAPS.', error)
      setDownloadError('Laporan gagal dibuat. Silakan coba lagi.')
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white">
      <div className="h-1 bg-[#111111]" />
      <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(560px,1fr)] xl:p-6">
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E5E5] bg-[#F3F3F1] text-[#666666]"><Building2 size={19} /></span>
            <span className="rounded-full border border-[#E5E5E5] bg-[#F3F3F1] px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#666666]">NIPNAS · VIP</span>
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-[#1C1C1E] sm:text-3xl">{customer.name.toLocaleUpperCase('id-ID')}</h2>
          <p className="mt-1 font-mono text-xs text-[#666666]">{customer.nipnas}</p>

          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
            {[
              ['BUD', customer.segment],
              ['Segmen', customer.segment],
              ['Sub Segmen', customer.subSegment],
              ['Witel', customer.witel],
            ].map(([label, value]) => (
              <label key={label}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#666666]">{label}</p>
                <input
                  defaultValue={value}
                  placeholder={`Buat ${label} Disini`}
                  onBlur={(event) => {
                    if (label === 'Segmen' || label === 'BUD') onUpdate({ segment: event.target.value })
                    else if (label === 'Sub Segmen') onUpdate({ subSegment: event.target.value })
                    else onUpdate({ witel: event.target.value })
                  }}
                  className="mt-1 w-full bg-transparent text-xs font-semibold text-[#666666] outline-none"
                />
              </label>
            ))}
            <div className="col-span-2 sm:col-span-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#666666]">Alamat Lengkap</p>
              <label className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed text-[#666666]"><MapPin size={13} className="mt-0.5 shrink-0 text-[#666666]" /><textarea defaultValue={customer.address} onBlur={(event) => onUpdate({ address: event.target.value })} placeholder="Buat Alamat Lengkap Disini" rows={2} className="w-full resize-y bg-transparent outline-none" /></label>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleDownload()}
            className="mt-5 inline-flex w-fit items-center gap-2 rounded-xl border border-[#E5E5E5] bg-[#F3F3F1] px-3 py-2 text-xs font-semibold text-[#666666] transition hover:border-[#E5E5E5] hover:bg-[#F3F3F1]"
          >
            <Download size={14} /> Unduh Dokumen Laporan MAPS
          </button>
          {downloadError && <p role="alert" className="mt-2 text-xs text-[#666666]">{downloadError}</p>}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <ContactCard title="PIC Pelanggan" contact={customer.pic} icon={UserRound} accent="bg-[#F3F3F1] text-[#666666]" onChange={(pic) => onUpdate({ pic })} />
          <ContactCard title="Account Manager" contact={customer.accountManager} icon={UserRound} accent="bg-[#F3F3F1] text-[#666666]" onChange={(accountManager) => onUpdate({ accountManager })} />
          <ContactCard title="Engineer On Site" contact={customer.engineer} icon={UserRound} accent="bg-[#F3F3F1] text-[#666666]" onChange={(engineer) => onUpdate({ engineer })} />
        </div>
      </div>
    </section>
  )
}
