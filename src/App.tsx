import React, { useEffect, useState } from 'react'
import { Sidebar, Topbar } from './components/Layout'
import { ServicesCatalog } from './components/ServicesCatalog'
import { CustomerDatabase } from './components/CustomerDatabase'
import { ProjectDatabase } from './components/ProjectDatabase'
import { AnalyticsReports } from './components/AnalyticsReports'
import { CustomerProfilePage } from './components/CustomerProfilePage'
import type { AnalyticsFocus } from './components/AnalyticsReports'
import { LoginScreen } from './components/LoginScreen'
import { AuthService, type AuthUser } from './lib/auth'

// Section Header Component
function SectionHeader({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 rounded-full bg-black" />
        <div>
          <h2 className="text-base font-bold text-[#1C1C1E]">{title}</h2>
          {subtitle && <p className="text-xs text-[#666666] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

// Map nav IDs to one of view buckets
type ViewKey = 'contracts' | 'services-catalog' | 'customers-db' | 'customer-profile' | 'projects-db' | 'analytics'

const VIEW_MAP: Record<string, ViewKey> = {
  analytics: 'analytics',
  services: 'services-catalog',
  'services-catalog': 'services-catalog',
  'customers-db': 'customers-db',
  'customer-profile': 'customer-profile',
  'projects-db': 'projects-db',
  gtma: 'projects-db',
  contracts: 'contracts',
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [activeMenu, setActiveMenu] = useState('analytics')
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>()
  const [analyticsFocus, setAnalyticsFocus] = useState<AnalyticsFocus>()

  useEffect(() => {
    let mounted = true
    AuthService.restoreSession()
      .then((currentUser) => {
        if (mounted) setUser(currentUser)
      })
      .finally(() => {
        if (mounted) setAuthLoading(false)
      })
    return () => { mounted = false }
  }, [])

  if (authLoading) return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-[#E5E5E5] border-t-[#666666] rounded-full animate-spin" aria-label="Memuat sesi" />
    </div>
  )
  if (!user) return <LoginScreen onLoginSuccess={setUser} />

  // Resolve which content view to render
  const activeView: ViewKey = VIEW_MAP[activeMenu] ?? 'analytics'

  return (
    <div className="flex h-screen bg-[#F9F8F6] overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeNav={activeMenu}
        onNavChange={(menu) => {
          if (VIEW_MAP[menu] === 'analytics') setAnalyticsFocus(undefined)
          setActiveMenu(menu)
        }}
        onLogout={async () => {
          try { await AuthService.logout() } finally { setUser(null) }
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          title={
            activeView === 'contracts'
              ? 'Kontrak & Manajemen Dokumen'
              : activeView === 'services-catalog'
              ? 'Data Layanan'
              : activeView === 'customers-db'
              ? 'Profile Instansi'
              : activeView === 'customer-profile'
              ? 'Detail Pelanggan'
              : activeView === 'projects-db'
              ? activeMenu === 'gtma' ? 'GTMA Services' : 'Input & Manajemen Proyek'
              : activeView === 'analytics'
              ? 'Analytics & Laporan Proyek'
              : 'B2G Project & Contract Management'
          }
          subtitle={
            activeView === 'services-catalog'
              ? activeMenu === 'gtma'
                  ? 'Data layanan dengan kategori GTMA'
                  : 'Kelola seluruh data layanan Own Channel, GTMA, dan NGTMA'
                : activeView === 'customer-profile'
                ? 'Profil strategis, layanan, kontrak, dan dokumen pelanggan'
              : activeView === 'projects-db'
              ? activeMenu === 'gtma'
                ? 'Input proyek GTMA, SID, progres, dan dokumen yang terhubung ke laporan'
                : 'Manajemen data pengadaan, progres, dan dokumen proyek'
              : activeView === 'analytics'
              ? ''
              : ''
          }
        />

        {/* Scrollable Content */}
        <main className={`flex-1 overflow-y-auto ${activeView === 'customer-profile' ? 'px-4 py-5 xl:px-6' : 'px-6 py-5'} space-y-6`}>



          {/* VIEW: Kontrak & Dokumen */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeView === 'contracts' && (
            <section>
              <ProjectDatabase showStats={false} />
            </section>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* VIEW: Data Layanan                                                 */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeView === 'services-catalog' && (
            <section>
              <ServicesCatalog initialCategory={activeMenu === 'gtma' ? 'GTMA' : 'Semua'} />
            </section>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* VIEW: Profile Instansi                                             */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeView === 'customers-db' && (
            <section>
              <CustomerDatabase onOpenProfile={(name) => {
                setSelectedCustomerName(name)
                setActiveMenu('customer-profile')
              }} />
            </section>
          )}

          {activeView === 'customer-profile' && (
            <CustomerProfilePage
              customerName={selectedCustomerName}
              onBack={() => setActiveMenu('customers-db')}
              onOpenAnalytics={(pemdaName, serviceName) => {
                setAnalyticsFocus({ pemdaName, serviceName })
                setActiveMenu('analytics')
              }}
            />
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* VIEW: Input & Manajemen Proyek                                     */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeView === 'projects-db' && (
            <section>
              <SectionHeader
                title={activeMenu === 'gtma' ? 'GTMA Services' : 'Input & Manajemen Proyek'}
                subtitle={activeMenu === 'gtma'
                  ? 'Kelola proyek GTMA, SID, progres, dan dokumen untuk Analitik & Laporan'
                  : 'Database proyek pipeline dengan CRUD lengkap — data tersimpan di browser'}
              />
              <ProjectDatabase initialCategory={activeMenu === 'gtma' ? 'GTMA' : undefined} />
            </section>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* VIEW: Analytics & Laporan                                           */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeView === 'analytics' && (
            <section>
              <AnalyticsReports focus={analyticsFocus} onClearFocus={() => setAnalyticsFocus(undefined)} />
            </section>
          )}

          {/* Footer Spacer */}
          <div className="h-4" />
        </main>
      </div>
    </div>
  )
}
