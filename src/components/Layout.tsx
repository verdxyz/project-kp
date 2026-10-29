import React, { useState } from 'react'
import {
  FileText,
  BarChart3,
  ChevronDown,
  Wifi,
  Menu,
  X,
  Database,
  LogOut,
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
  { id: 'contracts', label: 'Kontrak & Dokumen', icon: FileText, badge: 3 },
  { id: 'analytics', label: 'Analytics & Laporan', icon: BarChart3 },
  {
    id: 'services',
    label: 'Data Layanan',
    icon: Wifi,
  },
  { id: 'customers-db', label: 'Profile Instansi', icon: Database },
]

interface SidebarProps {
  activeNav: string
  onNavChange: (id: string) => void
  onLogout: () => void | Promise<void>
}

export function Sidebar({ activeNav, onNavChange, onLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleItem = (id: string) => {
    setExpandedItem(expandedItem === id ? null : id)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#E5E5E5]">
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#1C1C1E] leading-tight truncate">B2Gov Portal</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-[#666666] hover:text-[#1C1C1E] transition-colors p-1 rounded hidden lg:flex"
          type="button"
          aria-label={collapsed ? 'Perluas menu navigasi' : 'Ciutkan menu navigasi'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Perluas menu' : 'Ciutkan menu'}
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
                  (activeNav === 'customer-profile' && item.id === 'customers-db') ||
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
                    <span className="bg-[#F3F3F1] text-[#666666] text-xs px-1.5 py-0.5 rounded-full font-semibold">
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
              <div className="ml-8 mt-1 space-y-0.5 border-l border-[#E5E5E5] pl-3">
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
                        ? 'text-[#666666] bg-[#F3F3F1]'
                        : 'text-[#666666] hover:text-[#666666] hover:bg-[#F3F3F1]'
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

      <div className="border-t border-[#E5E5E5] p-3">
        <button
          onClick={() => {
            setMobileOpen(false)
            onLogout()
          }}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#666666] transition-colors hover:bg-[#F3F3F1] hover:text-[#1C1C1E]',
            collapsed && 'justify-center px-2'
          )}
          type="button"
          aria-label="Keluar"
          title="Keluar"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>

    </div>
  )

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#FFFFFF] border border-[#E5E5E5] text-[#666666]"
        type="button"
        aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
        aria-expanded={mobileOpen}
        aria-controls="mobile-navigation"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 "
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-screen sticky top-0 flex-shrink-0 transition-all duration-300',
          'bg-[#F9F8F6] border-r border-[#E5E5E5]',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        id="mobile-navigation"
        className={cn(
          'lg:hidden fixed top-0 left-0 z-50 h-screen w-64 flex flex-col transition-transform duration-300',
          'bg-[#F9F8F6] border-r border-[#E5E5E5]',
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
}

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5] bg-[#F9F8F6]  sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-bold text-[#1C1C1E]">{title}</h1>
        {subtitle && <p className="text-xs text-[#666666] mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
