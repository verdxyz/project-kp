import React, { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import { Sidebar, Topbar } from './components/Layout'
import { ServicesCatalog } from './components/ServicesCatalog'
import { CustomerDatabase } from './components/CustomerDatabase'
import { ProjectDatabase } from './components/ProjectDatabase'
import { AnalyticsReports } from './components/AnalyticsReports'
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
        <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-400 to-blue-700" />
        <div>
          <h2 className="text-base font-bold text-white">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

// Map nav IDs to one of view buckets
type ViewKey = 'contracts' | 'services-catalog' | 'customers-db' | 'projects-db' | 'analytics' | 'maps'

const VIEW_MAP: Record<string, ViewKey> = {
  analytics: 'analytics',
  maps: 'maps',
  services: 'services-catalog',
  'services-catalog': 'services-catalog',
  'customers-db': 'customers-db',
  'projects-db': 'projects-db',
  gtma: 'projects-db',
  contracts: 'contracts',
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [activeMenu, setActiveMenu] = useState('analytics')

  useEffect(() => {
    let mounted = true
    AuthService.restoreSession()
      .then((user) => {
        if (mounted) setCurrentUser(user)
      })
      .catch((error: unknown) => {
        console.error('Failed to restore admin session:', error)
        if (mounted) setCurrentUser(null)
      })
      .finally(() => {
        if (mounted) setAuthReady(true)
      })
    return () => { mounted = false }
  }, [])

  const handleLogout = async () => {
    try {
      await AuthService.logout()
      setCurrentUser(null)
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

  // If user is not authenticated, show Login Screen
  if (!authReady) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Memeriksa sesi admin...</div>
  }
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={setCurrentUser} />
  }

  // Resolve which content view to render
  const activeView: ViewKey = VIEW_MAP[activeMenu] ?? 'analytics'

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeNav={activeMenu}
        onNavChange={setActiveMenu}
        currentUser={currentUser}
        onLogout={handleLogout}
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
              ? 'Database Instansi Pemerintah'
              : activeView === 'projects-db'
              ? activeMenu === 'gtma' ? 'GTMA Services' : 'Input & Manajemen Proyek'
              : activeView === 'analytics'
              ? 'Analytics & Laporan Proyek'
              : activeView === 'maps'
              ? 'Maps'
              : 'B2G Project & Contract Management'
          }
          subtitle={
            activeView === 'contracts'
              ? 'Repositori kontrak, P0/P1 uploads, dan manajemen dokumen pengadaan'
              : activeView === 'services-catalog'
              ? activeMenu === 'gtma'
                ? 'Data layanan dengan kategori GTMA'
                : 'Kelola seluruh data layanan On Channel, GTMA, dan NGTMA'
              : activeView === 'customers-db'
              ? 'Manajemen data instansi pemerintah, PIC, dan nilai kontrak'
              : activeView === 'projects-db'
              ? activeMenu === 'gtma'
                ? 'Input proyek GTMA, SID, progres, dan dokumen yang terhubung ke laporan'
                : 'Manajemen data pengadaan, progres, dan dokumen proyek'
              : activeView === 'analytics'
              ? 'Analisis progres pekerjaan per tahap dan performa proyek'
              : activeView === 'maps'
              ? 'Integrasi Maps disiapkan bersama tim pengembang terkait'
              : 'Telkom Indonesia · Witel Jateng Utara · Dashboard Pengadaan Pemerintah'
          }
        />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-6">



          {/* VIEW: Kontrak & Dokumen */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeView === 'contracts' && (
            <section>
              <SectionHeader
                title="Dokumen Kontrak per Proyek"
                subtitle="Unggah dan unduh dokumen yang terhubung langsung dengan ID LOP"
              />
              <ProjectDatabase />
            </section>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* VIEW: Data Layanan                                                 */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeView === 'services-catalog' && (
            <section>
              <SectionHeader
                title="Data Layanan"
                subtitle="Kelola layanan On Channel, GTMA, dan NGTMA"
              />
              <ServicesCatalog initialCategory={activeMenu === 'gtma' ? 'GTMA' : 'Semua'} />
            </section>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* VIEW: Database Instansi Pemerintah                                 */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeView === 'customers-db' && (
            <section>
              <SectionHeader
                title="Database Instansi Pemerintah"
                subtitle="Kelola data pelanggan dan prospek instansi pemerintah"
              />
              <CustomerDatabase />
            </section>
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
              <AnalyticsReports />
            </section>
          )}

          {activeView === 'maps' && (
            <section>
              <SectionHeader title="Maps" subtitle="Integrasi peta akan dikembangkan bersama tim terkait" />
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/60 text-center">
                <MapPin size={28} className="mb-3 text-slate-500" />
                <p className="text-sm font-semibold text-slate-300">Peta belum terhubung</p>
              </div>
            </section>
          )}

          {/* Footer Spacer */}
          <div className="h-4" />
        </main>
      </div>
    </div>
  )
}
