import React, { useState } from 'react'
import { Sidebar, Topbar } from './components/Layout'
import { ServicesCatalog } from './components/ServicesCatalog'
import { CustomerDatabase } from './components/CustomerDatabase'
import { ProjectDatabase } from './components/ProjectDatabase'
import { AnalyticsReports } from './components/AnalyticsReports'
import { CustomerProfilePage } from './components/CustomerProfilePage'

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
  const [activeMenu, setActiveMenu] = useState('analytics')
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>()

  // Resolve which content view to render
  const activeView: ViewKey = VIEW_MAP[activeMenu] ?? 'analytics'

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeNav={activeMenu}
        onNavChange={setActiveMenu}
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
            activeView === 'contracts'
              ? 'Repositori kontrak, P0/P1 uploads, dan manajemen dokumen pengadaan'
              : activeView === 'services-catalog'
              ? activeMenu === 'gtma'
                ? 'Data layanan dengan kategori GTMA'
                : 'Kelola seluruh data layanan Own Channel, GTMA, dan NGTMA'
              : activeView === 'customers-db'
              ? 'Pilih instansi untuk melihat detail profil pelanggan'
              : activeView === 'customer-profile'
              ? 'Profil strategis, layanan, kontrak, dan dokumen pelanggan'
              : activeView === 'projects-db'
              ? activeMenu === 'gtma'
                ? 'Input proyek GTMA, SID, progres, dan dokumen yang terhubung ke laporan'
                : 'Manajemen data pengadaan, progres, dan dokumen proyek'
              : activeView === 'analytics'
              ? 'Analisis progres pekerjaan per tahap dan performa proyek'
              : 'Telkom Indonesia · Witel Jateng Utara · Dashboard Pengadaan Pemerintah'
          }
        />

        {/* Scrollable Content */}
        <main className={`flex-1 overflow-y-auto ${activeView === 'customer-profile' ? 'px-4 py-5 xl:px-6' : 'px-6 py-5'} space-y-6`}>



          {/* VIEW: Kontrak & Dokumen */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeView === 'contracts' && (
            <section>
              <SectionHeader
                title="Dokumen Kontrak per Proyek"
                subtitle="Unggah dan unduh dokumen yang terhubung langsung dengan ID LOP"
              />
              <ProjectDatabase showStats={false} />
            </section>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* VIEW: Data Layanan                                                 */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeView === 'services-catalog' && (
            <section>
              <SectionHeader
                title="Data Layanan"
                subtitle="Kelola layanan Own Channel, GTMA, dan NGTMA"
              />
              <ServicesCatalog initialCategory={activeMenu === 'gtma' ? 'GTMA' : 'Semua'} />
            </section>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* VIEW: Profile Instansi                                             */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeView === 'customers-db' && (
            <section>
              <SectionHeader
                title="Profile Instansi"
                subtitle="Kelola data pelanggan dan prospek instansi pemerintah"
              />
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
              <AnalyticsReports />
            </section>
          )}

          {/* Footer Spacer */}
          <div className="h-4" />
        </main>
      </div>
    </div>
  )
}
