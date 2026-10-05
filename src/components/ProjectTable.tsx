import React, { useState } from 'react'
import {
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  Eye,
  MoreHorizontal,
  CheckCircle,
  Circle,
  AlertCircle,
  Download,
  RefreshCw,
} from 'lucide-react'
import { cn, abbreviateIDR } from '../lib/utils'
import type { Project } from '../data/mockData'
import { STAGE_LABELS, STAGE_COLORS } from '../data/mockData'

interface ProjectTableProps {
  projects: Project[]
  activeTab: 'On Channel' | 'GTMA'
}

function StageStepper({ stage, status }: { stage: Project['stage']; status: Project['status'] }) {
  if (stage === 'LOSS') {
    return (
      <span className="badge" style={{ background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440' }}>
        <AlertCircle size={10} />
        LOSS
      </span>
    )
  }

  const stageIndex = STAGE_LABELS.indexOf(stage as any)

  return (
    <div className="flex items-center gap-0.5 min-w-[160px]">
      {STAGE_LABELS.map((s, i) => {
        const isCompleted = i < stageIndex
        const isCurrent = i === stageIndex
        const isUpcoming = i > stageIndex
        const color = STAGE_COLORS[s]

        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-0.5">
              <div
                className={cn(
                  'stepper-dot text-white',
                  isCurrent && 'pulse-dot ring-2 ring-offset-1 ring-offset-slate-800'
                )}
                style={{
                  background: isCompleted
                    ? color
                    : isCurrent
                    ? color
                    : '#1e293b',
                  border: isUpcoming ? '1.5px solid #334155' : `1.5px solid ${color}`,
                  boxShadow: isCurrent ? `0 0 8px ${color}60` : 'none',
                }}
                title={s}
              >
                {isCompleted ? (
                  <CheckCircle size={10} className="text-white" />
                ) : isCurrent ? (
                  <span style={{ fontSize: '7px', fontWeight: 800, color: 'white' }}>{s}</span>
                ) : (
                  <span style={{ fontSize: '7px', fontWeight: 600, color: '#475569' }}>{s}</span>
                )}
              </div>
            </div>
            {i < STAGE_LABELS.length - 1 && (
              <div
                className="h-0.5 flex-1"
                style={{
                  background: isCompleted ? color : '#1e293b',
                  minWidth: 8,
                  borderRadius: 2,
                }}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function StatusBadge({ status }: { status: Project['status'] }) {
  const styles: Record<Project['status'], { bg: string; text: string; border: string; dot: string }> = {
    Active: { bg: '#10b98120', text: '#10b981', border: '#10b98140', dot: '#10b981' },
    'At Risk': { bg: '#f59e0b20', text: '#f59e0b', border: '#f59e0b40', dot: '#f59e0b' },
    Completed: { bg: '#3b82f620', text: '#3b82f6', border: '#3b82f640', dot: '#3b82f6' },
    Lost: { bg: '#ef444420', text: '#ef4444', border: '#ef444440', dot: '#ef4444' },
  }
  const s = styles[status]
  return (
    <span
      className="badge"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {status}
    </span>
  )
}

function ProcurementBadge({ method, budget }: { method: Project['procurementMethod']; budget: number }) {
  const isHighBudget = budget > 200_000_000
  return (
    <span
      className="badge text-[10px]"
      style={
        isHighBudget
          ? { background: '#6366f120', color: '#818cf8', border: '1px solid #6366f140' }
          : { background: '#06b6d420', color: '#22d3ee', border: '1px solid #06b6d440' }
      }
    >
      {method}
    </span>
  )
}

type SortKey = 'projectName' | 'agency' | 'budget' | 'stage' | 'status'

export function ProjectTable({ projects, activeTab }: ProjectTableProps) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('budget')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedRow, setSelectedRow] = useState<string | null>(null)

  const filtered = projects
    .filter((p) => p.category === activeTab)
    .filter(
      (p) =>
        p.projectName.toLowerCase().includes(search.toLowerCase()) ||
        p.agency.toLowerCase().includes(search.toLowerCase()) ||
        p.idLOP.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let aVal: any = a[sortKey]
      let bVal: any = b[sortKey]
      if (sortKey === 'stage') {
        const order = ['F0', 'F1', 'F2', 'F3', 'WIN', 'LOSS']
        aVal = order.indexOf(a.stage)
        bVal = order.indexOf(b.stage)
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      sortDir === 'asc' ? (
        <ChevronUp size={12} className="text-blue-400" />
      ) : (
        <ChevronDown size={12} className="text-blue-400" />
      )
    ) : (
      <ChevronDown size={12} className="text-slate-600" />
    )

  return (
    <div className="card overflow-hidden p-0">
      {/* Table Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cari proyek, instansi, ID LOP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-8 text-xs w-64"
            />
          </div>
          <button className="btn-secondary text-xs">
            <Filter size={12} />
            Filter
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-xs">
            <Download size={12} />
            Export
          </button>
          <button className="btn-secondary text-xs">
            <RefreshCw size={12} />
            Sync SiRUP
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              {[
                { key: 'projectName', label: 'Nama Proyek' },
                { key: 'agency', label: 'Instansi' },
                { key: 'budget', label: 'Pagu Anggaran' },
                { key: null, label: 'Metode Pengadaan' },
                { key: 'stage', label: 'Progress / Stage' },
                { key: 'status', label: 'Status' },
                { key: null, label: 'ID LOP' },
                { key: null, label: '' },
              ].map(({ key, label }) => (
                <th
                  key={label}
                  onClick={() => key && handleSort(key as SortKey)}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap',
                    key && 'cursor-pointer hover:text-slate-200 select-none'
                  )}
                >
                  <div className="flex items-center gap-1">
                    {label}
                    {key && <SortIcon col={key as SortKey} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500 text-sm">
                  <Circle size={32} className="mx-auto mb-2 text-slate-700" />
                  Tidak ada proyek yang ditemukan
                </td>
              </tr>
            ) : (
              filtered.map((project, idx) => (
                <tr
                  key={project.id}
                  onClick={() => setSelectedRow(selectedRow === project.id ? null : project.id)}
                  className={cn(
                    'border-b border-slate-700/30 cursor-pointer transition-all duration-150',
                    idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-800/20',
                    selectedRow === project.id
                      ? 'bg-blue-900/20 border-blue-700/30'
                      : 'hover:bg-slate-700/20'
                  )}
                >
                  {/* Project Name */}
                  <td className="px-4 py-3">
                    <div className="max-w-[220px]">
                      <p className="text-sm font-semibold text-white leading-tight line-clamp-2">
                        {project.projectName}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{project.serviceType}</p>
                    </div>
                  </td>

                  {/* Agency */}
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-200 whitespace-nowrap">{project.agency}</p>
                      <p className="text-xs text-slate-500">{project.agencyType}</p>
                    </div>
                  </td>

                  {/* Budget */}
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold text-emerald-400 whitespace-nowrap">
                      {abbreviateIDR(project.budget)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {project.budget > 200_000_000 ? '> Rp 200 Jt' : '≤ Rp 200 Jt'}
                    </p>
                  </td>

                  {/* Procurement Method */}
                  <td className="px-4 py-3">
                    <ProcurementBadge method={project.procurementMethod} budget={project.budget} />
                  </td>

                  {/* Stage Stepper */}
                  <td className="px-4 py-3">
                    <StageStepper stage={project.stage} status={project.status} />
                    <p className="text-[10px] text-slate-500 mt-1">PIC: {project.pic}</p>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={project.status} />
                  </td>

                  {/* ID LOP */}
                  <td className="px-4 py-3">
                    <code className="text-xs text-violet-400 bg-violet-900/20 px-2 py-0.5 rounded font-mono whitespace-nowrap">
                      {project.idLOP}
                    </code>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 transition-all"
                        title="Lihat Detail"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-all"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700/50 bg-slate-800/20">
        <p className="text-xs text-slate-500">
          Menampilkan <span className="text-slate-300 font-medium">{filtered.length}</span> dari{' '}
          <span className="text-slate-300 font-medium">{projects.filter(p => p.category === activeTab).length}</span> proyek
        </p>
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((p) => (
            <button
              key={p}
              className={cn(
                'w-7 h-7 rounded text-xs font-medium transition-all',
                p === 1 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
