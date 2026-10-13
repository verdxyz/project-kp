import React, { useState } from 'react'
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  BarChart3,
  Settings,
  Bell,
  ChevronDown,
  Building2,
  Shield,
  Wifi,
  Layers,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Database,
  FolderPlus,
} from 'lucide-react'
import { cn } from '../lib/utils'

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  badge?: number
  children?: { id: string; label: string }[]
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    id: 'projects',
    label: 'Project Pipeline',
    icon: FolderOpen,
    badge: 10,
    children: [
      { id: 'sirup', label: 'SiRUP Monitor' },
      { id: 'pipeline', label: 'Sales Pipeline' },
    ],
  },
  { id: 'contracts', label: 'Kontrak & Dokumen', icon: FileText, badge: 3 },
  { id: 'analytics', label: 'Analytics & Laporan', icon: BarChart3 },
  {
    id: 'services',
    label: 'Layanan (On Channel)',
    icon: Wifi,
    children: [
      { id: 'services-catalog', label: 'Katalog Layanan' },
      { id: 'customers-db', label: 'Database Instansi' },
      { id: 'projects-db', label: 'Input Proyek' },
    ],
  },
  { id: 'gtma', label: 'GTMA Services', icon: Layers },
  { id: 'audit', label: 'Audit & Compliance', icon: Shield, badge: 2 },
  { id: 'settings', label: 'Pengaturan', icon: Settings },
]

import type { AuthUser } from '../lib/auth'

interface SidebarProps {
  activeNav: string
  onNavChange: (id: string) => void
  currentUser?: AuthUser | null
  onLogout?: () => void
}

export function Sidebar({ activeNav, onNavChange, currentUser, onLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItem, setExpandedItem] = useState<string | null>('projects')
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleItem = (id: string) => {
    setExpandedItem(expandedItem === id ? null : id)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-900/30">
          <TrendingUp size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-tight truncate">B2Gov Portal</p>
            <p className="text-xs text-slate-400 truncate">Telkom Indonesia</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-slate-400 hover:text-white transition-colors p-1 rounded hidden lg:flex"
        >
          <Menu size={16} />
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV_ITEMS.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => {
                if (item.children) {
                  toggleItem(item.id)
                }
                // Always call onNavChange so the page view updates
                onNavChange(item.id)
                if (!item.children) setMobileOpen(false)
              }}
              className={cn(
                'nav-item w-full',
                (activeNav === item.id ||
                  item.children?.some((c) => c.id === activeNav))
                  ? 'active'
                  : ''
              )}
            >
              <item.icon size={18} className="flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="bg-blue-600/20 text-blue-400 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                      {item.badge}
                    </span>
                  )}
                  {item.children && (
                    <ChevronDown
                      size={14}
                      className={cn(
                        'transition-transform duration-200',
                        expandedItem === item.id ? 'rotate-180' : ''
                      )}
                    />
                  )}
                </>
              )}
            </button>

            {/* Submenu */}
            {item.children && expandedItem === item.id && !collapsed && (
              <div className="ml-8 mt-1 space-y-0.5 border-l border-slate-700/50 pl-3">
                {item.children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => {
                      onNavChange(child.id)
                      setMobileOpen(false)
                    }}
                    className={cn(
                      'w-full text-left px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                      activeNav === child.id
                        ? 'text-blue-400 bg-blue-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
                    )}
                  >
                    {child.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-slate-700/50">
        <div className={cn('flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/60 transition-colors', collapsed && 'justify-center')}>
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-md',
            currentUser?.role === 'admin'
              ? 'bg-gradient-to-br from-red-500 to-rose-700 ring-1 ring-red-400/50'
              : currentUser?.role === 'am'
              ? 'bg-gradient-to-br from-blue-500 to-indigo-700 ring-1 ring-blue-400/50'
              : 'bg-gradient-to-br from-emerald-500 to-teal-700 ring-1 ring-emerald-400/50'
          )}>
            {currentUser?.avatar_initials || 'TK'}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{currentUser?.nama || 'Pengguna Telkom'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.2 rounded uppercase tracking-wider',
                  currentUser?.role === 'admin'
                    ? 'bg-red-500/20 text-red-300'
                    : currentUser?.role === 'am'
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                )}>
                  {currentUser?.role === 'admin' ? 'Administrator' : currentUser?.role === 'am' ? 'Account Manager' : 'Viewer'}
                </span>
              </div>
            </div>
          )}
          {!collapsed && onLogout && (
            <button
              onClick={onLogout}
              title="Keluar / Logout"
              className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-auto"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-screen sticky top-0 flex-shrink-0 transition-all duration-300',
          'bg-slate-900 border-r border-slate-700/50',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed top-0 left-0 z-50 h-screen w-64 flex flex-col transition-transform duration-300',
          'bg-slate-900 border-r border-slate-700/50',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}

interface TopbarProps {
  title: string
  subtitle?: string
  currentUser?: AuthUser | null
  onLogout?: () => void
}

export function Topbar({ title, subtitle, currentUser, onLogout }: TopbarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-bold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {/* User Role Tag */}
        {currentUser && (
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">{currentUser.nama.split(' ')[0]}</span>
            <span className={cn(
              'text-[10px] uppercase font-bold px-1.5 py-0.2 rounded',
              currentUser.role === 'admin'
                ? 'bg-red-500/20 text-red-300'
                : currentUser.role === 'am'
                ? 'bg-blue-500/20 text-blue-300'
                : 'bg-emerald-500/20 text-emerald-300'
            )}>
              {currentUser.role}
            </span>
          </div>
        )}

        {/* Notification Bell */}
        <button className="relative p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-all">
          <Bell size={16} />
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white">
            5
          </span>
        </button>

        {/* Telkom Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
          <Building2 size={14} className="text-red-400" />
          <span className="text-xs font-medium text-slate-300">Witel Jateng Utara</span>
        </div>

        {/* Logout Quick Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Keluar"
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/40 transition-all"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
