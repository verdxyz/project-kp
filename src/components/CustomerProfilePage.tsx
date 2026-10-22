import { useState } from 'react'
import { ArrowLeft, ChevronDown, Compass, FileText, Layers3, Network } from 'lucide-react'
import { CUSTOMER_PROFILES, type CustomerProfile, type CustomerProfileTab, getCustomerProfile } from '../data/customerProfiles'
import { CustomerProfileDataTab } from './customer-profile/CustomerProfileDataTabs'
import { CustomerProfileHeader } from './customer-profile/CustomerProfileHeader'
import { CustomerProfileMaps } from './customer-profile/CustomerProfileMaps'

const PROFILE_TABS: { id: CustomerProfileTab; icon: typeof Compass }[] = [
  { id: 'MAPS', icon: Compass },
  { id: 'Layanan', icon: Network },
  { id: 'Kontrak', icon: Layers3 },
  { id: 'Dokumen', icon: FileText },
]

const PROFILE_OVERRIDES_KEY = 'b2g_customer_profile_overrides'

function readProfileOverrides(): Record<string, Partial<CustomerProfile>> {
  try {
    const stored = localStorage.getItem(PROFILE_OVERRIDES_KEY)
    return stored ? JSON.parse(stored) as Record<string, Partial<CustomerProfile>> : {}
  } catch (error) {
    console.error('Gagal membaca profil instansi tersimpan.', error)
    return {}
  }
}

export function CustomerProfilePage({
  customerName,
  onBack,
  onOpenAnalytics,
}: {
  customerName?: string
  onBack: () => void
  onOpenAnalytics: (pemdaName: string, serviceName: string) => void
}) {
  const [activeTab, setActiveTab] = useState<CustomerProfileTab>('MAPS')
  const initialCustomer = CUSTOMER_PROFILES.find((profile) => profile.name === customerName)?.name
    ?? CUSTOMER_PROFILES[0].name
  const [selectedCustomer, setSelectedCustomer] = useState(initialCustomer)
  const [profileOverrides, setProfileOverrides] = useState(readProfileOverrides)
  const [saveError, setSaveError] = useState('')
  const customer = { ...getCustomerProfile(selectedCustomer), ...profileOverrides[selectedCustomer] }

  const updateCustomer = (updates: Partial<CustomerProfile>) => {
    const nextOverrides = {
      ...profileOverrides,
      [selectedCustomer]: { ...profileOverrides[selectedCustomer], ...updates },
    }
    try {
      localStorage.setItem(PROFILE_OVERRIDES_KEY, JSON.stringify(nextOverrides))
      setProfileOverrides(nextOverrides)
      setSaveError('')
      return true
    } catch (error) {
      console.error('Gagal menyimpan perubahan profil instansi.', error)
      setSaveError('Perubahan gagal disimpan. Periksa ruang penyimpanan browser lalu coba lagi.')
      return false
    }
  }

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

      <CustomerProfileHeader key={selectedCustomer} customer={customer} onUpdate={updateCustomer} />

      <div className="rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-900 to-indigo-900 px-5 py-3 text-blue-50">
        <p className="text-sm font-bold">6 Kriteria Profile Pelanggan ini Sudah Lengkap.</p>
        <p className="mt-0.5 text-xs text-blue-100">Yuk, lengkapi kriteria profile pelanggan lain untuk capai rising star.</p>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-b border-slate-700/70 bg-slate-900/80 px-2" aria-label="Navigasi profil pelanggan">
        {PROFILE_TABS.map(({ id, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setActiveTab(id)} className={`flex min-w-28 flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3 text-xs font-medium transition ${activeTab === id ? 'border-blue-500 text-blue-300' : 'border-transparent text-slate-400 hover:text-slate-100'}`}>
            <Icon size={14} />{id}
          </button>
        ))}
      </nav>

      {activeTab === 'MAPS'
        ? <CustomerProfileMaps key={selectedCustomer} customer={customer} onUpdate={updateCustomer} saveError={saveError} />
        : <CustomerProfileDataTab key={`${selectedCustomer}-${activeTab}`} tab={activeTab} customer={customer} onUpdate={updateCustomer} onOpenAnalytics={onOpenAnalytics} />}
    </div>
  )
}
