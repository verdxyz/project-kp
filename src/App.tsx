import React, { useState } from 'react'
import { Sidebar, Topbar } from './components/Layout'
import { KPICard } from './components/KPICard'
import { ProjectTable } from './components/ProjectTable'
import { FinancialModule } from './components/FinancialModule'
import { DocumentVault } from './components/DocumentVault'
import { PipelineFunnel, ServiceBreakdown, WinRateCard } from './components/Analytics'
import { ServicesCatalog } from './components/ServicesCatalog'
import { CustomerDatabase } from './components/CustomerDatabase'
import { ProjectDatabase } from './components/ProjectDatabase'
import { PROJECTS } from './data/mockData'
import {
  FolderOpen,
  DollarSign,
  Target,
  AlertTriangle,
  Wifi,
  Layers,
  ChevronRight,
  Info,
  Zap,
  Activity,
} from 'lucide-react'
import { abbreviateIDR } from './lib/utils'
import { cn } from './lib/utils'

type TabKey = 'On Channel' | 'GTMA'

const TABS: { key: TabKey; label: string; icon: React.ElementType; description: string }[] = [
  {
    key: 'On Channel',
    label: 'On Channel',
    icon: Wifi,
    description: 'Layanan konektivitas murni: Astinet, VPN MPLS, Metro Ethernet, dan sejenisnya.',
  },
  {
    key: 'GTMA',
    label: 'GTMA',
    icon: Layers,
    description: 'Integrasi pihak ketiga & perangkat keras: Google Workspace, Mikrotik, CPE, dll.',
  },
]

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
type ViewKey = 'pipeline' | 'contracts' | 'audit' | 'services-catalog' | 'customers-db' | 'projects-db'

const VIEW_MAP: Record<string, ViewKey> = {
  dashboard: 'pipeline',
  projects: 'pipeline',
  sirup: 'pipeline',
  pipeline: 'pipeline',
  analytics: 'pipeline',
  services: 'services-catalog',
  'services-catalog': 'services-catalog',
  'customers-db': 'customers-db',
  'projects-db': 'projects-db',
  gtma: 'pipeline',
  contracts: 'contracts',
  audit: 'audit',
  settings: 'pipeline',
}

export default function App() {
  const [activeMenu, setActiveMenu] = useState('pipeline')
  const [activeTab, setActiveTab] = useState<TabKey>('On Channel')

  // Resolve which content view to render
  const activeView: ViewKey = VIEW_MAP[activeMenu] ?? 'pipeline'

  // Computed KPIs
  const totalBudget = PROJECTS.reduce((s, p) => s + p.budget, 0)
  const activeProjects = PROJECTS.filter((p) => p.status === 'Active').length
  const atRiskCount = PROJECTS.filter((p) => p.status === 'At Risk').length
  const totalProjects = PROJECTS.length
  const wins = PROJECTS.filter((p) => p.stage === 'WIN').length

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar activeNav={activeMenu} onNavChange={setActiveMenu} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          title={
            activeView === 'contracts'
              ? 'Kontrak & Manajemen Dokumen'
              : activeView === 'audit'
              ? 'Audit & Compliance'
              : activeView === 'services-catalog'
              ? 'Katalog Layanan On Channel'
              : activeView === 'customers-db'
              ? 'Database Instansi Pemerintah'
              : activeView === 'projects-db'
              ? 'Input & Manajemen Proyek'
              : 'B2G Project & Contract Management'
          }
          subtitle={
            activeView === 'contracts'
              ? 'Repositori kontrak, P0/P1 uploads, dan manajemen dokumen pengadaan'
              : activeView === 'audit'
              ? 'Dokumen kepatuhan BPK, audit internal, dan financial justification'
              : activeView === 'services-catalog'
              ? 'Katalog layanan internet & konektivitas Telkom — Astinet, VPN IP, Metro Ethernet, SD-WAN'
              : activeView === 'customers-db'
              ? 'Manajemen data instansi pemerintah, PIC, dan nilai kontrak'
              : activeView === 'projects-db'
              ? 'Input, update, dan tracking proyek pipeline B2G'
              : 'Telkom Indonesia · Witel Jateng Utara · Dashboard Pengadaan Pemerintah'
          }
        />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* ═══════════════════════════════════════════════ */}
          {/* VIEW: Project Pipeline (dashboard / projects)  */}
          {/* ═══════════════════════════════════════════════ */}
          {activeView === 'pipeline' && (
            <>
              {/* ─── KPI Cards ─── */}
              <section>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard
                    title="Total Proyek Aktif"
                    value={String(activeProjects)}
                    subtitle={`${totalProjects} total proyek terdaftar`}
                    trend="up"
                    trendValue="+3 bulan ini"
                    icon={FolderOpen}
                    iconColor="text-blue-400"
                    accentColor="from-blue-600/20 to-blue-900/10"
                  />
                  <KPICard
                    title="Total Pagu Anggaran"
                    value={abbreviateIDR(totalBudget)}
                    subtitle="Akumulasi seluruh pipeline"
                    trend="up"
                    trendValue="+12%"
                    icon={DollarSign}
                    iconColor="text-emerald-400"
                    accentColor="from-emerald-600/20 to-emerald-900/10"
                  />
                  <KPICard
                    title="Project WIN"
                    value={`${wins} Proyek`}
                    subtitle={`Win rate: ${Math.round((wins / (wins + PROJECTS.filter(p => p.stage === 'LOSS').length)) * 100)}%`}
                    trend="up"
                    trendValue="Target 75%"
                    icon={Target}
                    iconColor="text-violet-400"
                    accentColor="from-violet-600/20 to-violet-900/10"
                  />
                  <KPICard
                    title="At Risk"
                    value={String(atRiskCount)}
                    subtitle="Perlu tindakan segera"
                    trend="down"
                    trendValue="Monitoring!"
                    icon={AlertTriangle}
                    iconColor="text-amber-400"
                    accentColor="from-amber-600/20 to-amber-900/10"
                  />
                </div>
              </section>

              {/* ─── Analytics Row ─── */}
              <section>
                <SectionHeader
                  title="Ringkasan Pipeline"
                  subtitle="Overview distribusi proyek & performa penjualan"
                >
                  <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                    Lihat Semua <ChevronRight size={12} />
                  </button>
                </SectionHeader>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <PipelineFunnel />
                  <ServiceBreakdown />
                  <WinRateCard />
                </div>
              </section>

              {/* ─── Project Pipeline Table ─── */}
              <section>
                <SectionHeader
                  title="Government Project Pipeline (SiRUP)"
                  subtitle="Daftar pengadaan instansi pemerintah yang dikelola"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
                      <Activity size={10} className="pulse-dot" />
                      Live Sync
                    </span>
                    <span className="text-xs text-slate-500">
                      Terakhir sync: {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </SectionHeader>

                {/* Tabs */}
                <div className="flex items-start gap-2 mb-4">
                  <div className="flex gap-1 p-1 rounded-xl bg-slate-800 border border-slate-700/50">
                    {TABS.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn('tab-btn flex items-center gap-2', activeTab === tab.key && 'active')}
                        id={`tab-${tab.key.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <tab.icon size={14} />
                        {tab.label}
                        <span
                          className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                            activeTab === tab.key
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-slate-700 text-slate-500'
                          )}
                        >
                          {PROJECTS.filter((p) => p.category === tab.key).length}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Tab description */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/30 mt-1">
                    <Info size={12} className="text-blue-400 flex-shrink-0" />
                    <p className="text-xs text-slate-400">
                      {TABS.find((t) => t.key === activeTab)?.description}
                    </p>
                  </div>
                </div>

                <ProjectTable projects={PROJECTS} activeTab={activeTab} />
              </section>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* VIEW: Kontrak & Dokumen  — Document Vault + Financial Module       */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeView === 'contracts' && (
            <>
              {/* ─── Document Vault ─── */}
              <section>
                <SectionHeader
                  title="Audit-Ready Document Vault"
                  subtitle="Repositori dokumen mandatori untuk kepatuhan BPK & audit internal — P0 & P1 Upload Slots"
                />
                <DocumentVault />
              </section>

              {/* ─── Financial & Justification Module ─── */}
              <section>
                <SectionHeader
                  title="Financial & Justification Module"
                  subtitle="Kalkulator diskon, evaluasi kompetitor, dan skema pembayaran"
                >
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs text-violet-400">
                    <Zap size={11} />
                    Auto-Validate
                  </span>
                </SectionHeader>
                <FinancialModule />
              </section>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* VIEW: Audit & Compliance — Financial Module + Document Vault       */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeView === 'audit' && (
            <>
              {/* ─── Financial & Justification Module ─── */}
              <section>
                <SectionHeader
                  title="Financial & Justification Module"
                  subtitle="Kalkulator diskon, evaluasi kompetitor, dan skema pembayaran"
                >
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs text-violet-400">
                    <Zap size={11} />
                    Auto-Validate
                  </span>
                </SectionHeader>
                <FinancialModule />
              </section>

              {/* ─── Document Vault ─── */}
              <section>
                <SectionHeader
                  title="Audit-Ready Document Vault"
                  subtitle="Repositori dokumen mandatori untuk kepatuhan BPK & audit internal"
                />
                <DocumentVault />
              </section>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* VIEW: Katalog Layanan On Channel                                   */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeView === 'services-catalog' && (
            <section>
              <SectionHeader
                title="Katalog Layanan On Channel"
                subtitle="Manajemen produk layanan internet & konektivitas — tambah, edit, atau hapus layanan"
              />
              <ServicesCatalog />
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
                title="Input & Manajemen Proyek"
                subtitle="Database proyek pipeline dengan CRUD lengkap — data tersimpan di browser"
              />
              <ProjectDatabase />
            </section>
          )}

          {/* Footer Spacer */}
          <div className="h-4" />
        </main>
      </div>
    </div>
  )
}
