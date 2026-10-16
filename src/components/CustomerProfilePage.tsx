import { useState } from 'react'
import { ArrowLeft, ChevronDown, Compass, FileText, Layers3, Network } from 'lucide-react'
import { CUSTOMER_PROFILES, type CustomerProfileTab, getCustomerProfile } from '../data/customerProfiles'
import { CustomerProfileDataTab } from './customer-profile/CustomerProfileDataTabs'
import { CustomerProfileHeader } from './customer-profile/CustomerProfileHeader'
import { CustomerProfileMaps } from './customer-profile/CustomerProfileMaps'

const PROFILE_TABS: { id: CustomerProfileTab; icon: typeof Compass }[] = [
  { id: 'MAPS', icon: Compass },
  { id: 'Layanan', icon: Network },
  { id: 'Kontrak', icon: Layers3 },
  { id: 'Dokumen', icon: FileText },
]

export function CustomerProfilePage({ customerName, onBack }: { customerName?: string; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<CustomerProfileTab>('MAPS')
  const initialCustomer = CUSTOMER_PROFILES.find((profile) => profile.name === customerName)?.name
    ?? CUSTOMER_PROFILES[0].name
  const [selectedCustomer, setSelectedCustomer] = useState(initialCustomer)
  const customer = getCustomerProfile(selectedCustomer)

  return (
    <div className="space-y-5 pb-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white">
          <ArrowLeft size={14} /> Kembali ke Database Instansi
        </button>
        <label className="relative flex min-w-56 items-center">
          <span className="sr-only">Pilih instansi</span>
          <select value={selectedCustomer} onChange={(event) => setSelectedCustomer(event.target.value)} className="form-input appearance-none py-2 pr-9 text-xs">
            {CUSTOMER_PROFILES.map((profile) => <option key={profile.id} value={profile.name}>{profile.name}</option>)}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 text-slate-400" />
        </label>
      </div>

      <CustomerProfileHeader customer={customer} />

      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-700/70 bg-slate-900/80 p-1.5" aria-label="Navigasi profil pelanggan">
        {PROFILE_TABS.map(({ id, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setActiveTab(id)} className={`flex min-w-28 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition ${activeTab === id ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}>
            <Icon size={14} />{id}
          </button>
        ))}
      </nav>

      {activeTab === 'MAPS'
        ? <CustomerProfileMaps customer={customer} />
        : <CustomerProfileDataTab tab={activeTab} customer={customer} />}
    </div>
  )
}
