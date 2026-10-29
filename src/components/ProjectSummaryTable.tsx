import React, { useMemo, useState } from 'react'
import {
  BarChart3,
  Building2,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Layers,
  Radio,
  Search,
} from 'lucide-react'
import type { ProjectEntry } from '../lib/db'

type ProjectSummaryItem = Pick<
  ProjectEntry,
  | 'idLOP'
  | 'projectName'
  | 'agency'
  | 'pemdaName'
  | 'servicePrice'
  | 'servicePointCount'
  | 'servicePointTotalPrice'
  | 'sid'
  | 'stage'
>

// Urutan tahapan Sales Funnel Telkom B2G
const PIPELINE_STAGES = [
  { id: 'F0', label: 'F0', color: '#1e3a8a', textColor: '#ffffff' },
  { id: 'F1', label: 'F1', color: '#1d4ed8', textColor: '#ffffff' },
  { id: 'F2', label: 'F2', color: '#2563eb', textColor: '#ffffff' },
  { id: 'F3', label: 'F3', color: '#38bdf8', textColor: '#0f172a' },
  { id: 'F4', label: 'F4', color: '#bae6fd', textColor: '#0f172a' },
  { id: 'F5', label: 'F5', color: '#e2e8f0', textColor: '#0f172a' },
] as const

type StageKey = (typeof PIPELINE_STAGES)[number]['id']

function formatIDR(amount: number) {
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(2).replace(/\.00$/, '')} M`
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')} Jt`
  return `Rp ${amount.toLocaleString('id-ID')}`
}

export function ProjectSummaryTable({
  projects,
  onOpenProject,
}: {
  projects: readonly ProjectSummaryItem[]
  onOpenProject: (idLOP: string) => void
}) {
  const [search, setSearch] = useState('')
  const [expandedPemda, setExpandedPemda] = useState<string | null>(null)

  // 1. Hitung agregasi per Pemda
  const summaries = useMemo(() => {
    const map = new Map<
      string,
      {
        pemda: string
        value: number
        points: number
        totalProjects: number
        stages: Record<StageKey, number>
        projects: ProjectSummaryItem[]
      }
    >()

    for (const project of projects) {
      const pemda = project.pemdaName?.trim() || project.agency || 'Pemda Lainnya'
      let item = map.get(pemda)
      if (!item) {
        item = {
          pemda,
          value: 0,
          points: 0,
          totalProjects: 0,
          stages: { F0: 0, F1: 0, F2: 0, F3: 0, F4: 0, F5: 0 },
          projects: [],
        }
        map.set(pemda, item)
      }

      const pointTotalPrice = project.servicePointTotalPrice ?? 0
      item.value += pointTotalPrice > 0 ? pointTotalPrice : (project.servicePrice || 0)
      item.points += project.servicePointCount ?? (project.sid ? 1 : 0)
      item.totalProjects += 1
      item.projects.push(project)

      if (item.stages[project.stage as StageKey] !== undefined) {
        item.stages[project.stage as StageKey] += 1
      }
    }

    return Array.from(map.values()).sort((a, b) => b.value - a.value || a.pemda.localeCompare(b.pemda, 'id'))
  }, [projects])

  // 2. Hitung Grand Total Akumulasi (untuk top aggregate bar seperti REG-2, REG-3 pada gambar)
  const totalAllProjects = useMemo(
    () => summaries.reduce((acc, curr) => acc + curr.totalProjects, 0),
    [summaries]
  )

  const overallStages = useMemo(() => {
    const acc: Record<StageKey, number> = { F0: 0, F1: 0, F2: 0, F3: 0, F4: 0, F5: 0 }
    for (const s of summaries) {
      for (const stg of PIPELINE_STAGES) {
        acc[stg.id] += s.stages[stg.id]
      }
    }
    return acc
  }, [summaries])

  // Filter pencarian
  const filteredSummaries = useMemo(() => {
    if (!search.trim()) return summaries
    const q = search.toLowerCase()
    return summaries.filter((s) => s.pemda.toLowerCase().includes(q))
  }, [summaries, search])

  return (
    <section className="bg-white border border-[#E5E5E5] overflow-hidden rounded-2xl border border-[#E5E5E5] bg-[#F9F8F6] ">
      {/* ─── Header Section ─── */}
      <div className="border-b border-[#E5E5E5] bg-[#F3F3F1] p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F3F3F1] text-[#666666] border border-[#E5E5E5]">
                <BarChart3 size={15} />
              </span>
              <h3 className="text-base font-bold text-[#1C1C1E] tracking-wide">
                Sales Funnel Progress Pemda
              </h3>
            </div>
          </div>

          {/* Search Pemda */}
          <div className="relative w-full md:w-64">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari Pemda..."
              className="w-full rounded-xl border border-[#E5E5E5] bg-[#F9F8F6] py-1.5 pl-9 pr-3 text-xs text-[#666666] placeholder:text-[#666666] focus:border-[#E5E5E5] focus:outline-none"
            />
          </div>
        </div>

        {/* ─── Top Regional Summary Card (Persis seperti panel atas pada gambar referensi) ─── */}
        <div className="mt-4 rounded-xl border border-[#E5E5E5] bg-[#F9F8F6] p-4 ">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">
              Akumulasi Seluruh Wilayah Jateng Utara (Total: {totalAllProjects} Proyek)
            </span>
            <span className="text-xs font-semibold text-[#666666]">
              Total: {formatIDR(summaries.reduce((sum, s) => sum + s.value, 0))}
            </span>
          </div>

          {/* Overall 100% Stacked Bar */}
          <div className="flex h-8 w-full overflow-hidden rounded-lg bg-[#FFFFFF] ">
            {totalAllProjects > 0 ? (
              PIPELINE_STAGES.map((stg) => {
                const count = overallStages[stg.id]
                const pct = (count / totalAllProjects) * 100
                if (pct <= 0) return null
                return (
                  <div
                    key={stg.id}
                    style={{ width: `${pct}%`, backgroundColor: stg.color, color: stg.textColor }}
                    className="flex items-center justify-center text-[11px] font-bold transition-all hover:brightness-110 relative group"
                    title={`${stg.id}: ${count} proyek (${pct.toFixed(2)}%)`}
                  >
                    {pct >= 5 && <span>{pct.toFixed(2)}%</span>}
                  </div>
                )
              })
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-[#666666]">
                Belum ada data proyek
              </div>
            )}
          </div>

          {/* Legend F0 - F5 */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-[11px] text-[#666666]">
            {PIPELINE_STAGES.map((stg) => (
              <div key={stg.id} className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm border border-[#E5E5E5]/20" style={{ backgroundColor: stg.color }} />
                <span className="font-semibold">{stg.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Stacked Horizontal Funnel List Per Pemda ─── */}
      <div className="p-5 space-y-4">
        {filteredSummaries.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#666666]">
            Belum ada proyek atau Pemda yang sesuai dengan filter pencarian.
          </div>
        ) : (
          filteredSummaries.map((summary) => {
            const totalProj = summary.totalProjects
            const isExpanded = expandedPemda === summary.pemda

            return (
              <div
                key={summary.pemda}
                className="rounded-xl border border-[#E5E5E5] bg-[#F9F8F6] p-4 transition-all hover:border-[#E5E5E5] hover:bg-[#F9F8F6] "
              >
                {/* Header Row per Pemda: Nama Pemda, Nilai Kontrak, Total SID & Proyek */}
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F3F3F1] text-[#666666]">
                      <Building2 size={13} />
                    </span>
                    <h4 className="text-sm font-bold text-[#1C1C1E] tracking-tight">{summary.pemda}</h4>
                    <span className="rounded-full bg-[#FFFFFF] border border-[#E5E5E5] px-2 py-0.5 text-[10px] font-medium text-[#666666]">
                      {totalProj} Proyek
                    </span>
                    <span className="rounded-full bg-[#F3F3F1] border border-[#E5E5E5] px-2 py-0.5 text-[10px] font-medium text-[#666666]">
                      {summary.points} Titik SID
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold tabular-nums text-[#666666]">
                      {formatIDR(summary.value)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpandedPemda(isExpanded ? null : summary.pemda)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#E5E5E5] bg-[#FFFFFF] px-2 py-1 text-[11px] font-medium text-[#666666] hover:bg-[#F3F3F1] hover:text-[#1C1C1E] transition"
                    >
                      <span>Proyek</span>
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                  </div>
                </div>

                {/* Progress Bar Funnel Progres (Persis seperti baris Witel di referensi gambar) */}
                <div className="flex h-8 w-full overflow-hidden rounded-md bg-[#FFFFFF] ">
                  {totalProj > 0 ? (
                    PIPELINE_STAGES.map((stg) => {
                      const count = summary.stages[stg.id]
                      const pct = (count / totalProj) * 100
                      if (pct <= 0) return null

                      return (
                        <div
                          key={stg.id}
                          style={{
                            width: `${pct}%`,
                            backgroundColor: stg.color,
                            color: stg.textColor,
                          }}
                          className="flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all hover:brightness-110 relative group border-r border-[#E5E5E5]/10 last:border-0"
                          title={`${summary.pemda} - ${stg.id}: ${count} paket (${pct.toFixed(2)}%)`}
                        >
                          {pct >= 6 && <span>{pct.toFixed(2)}%</span>}
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-[#666666]">
                      0%
                    </div>
                  )}
                </div>

                {/* Legend Mini Per Pemda (Jumlah paket per tahapan) */}
                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-[#666666]">
                  {PIPELINE_STAGES.map((stg) => {
                    const count = summary.stages[stg.id]
                    return (
                      <span key={stg.id} className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: stg.color }} />
                        <span className="font-semibold text-[#666666]">{stg.id}:</span>
                        <span className={count > 0 ? 'text-[#1C1C1E] font-bold' : 'text-[#666666]'}>
                          {count}
                        </span>
                      </span>
                    )
                  })}
                </div>

                {/* Detail Proyek Dropdown saat diklik */}
                {isExpanded && (
                  <div className="mt-3 rounded-lg border border-[#E5E5E5] bg-[#F9F8F6] p-3">
                    <p className="text-[11px] font-semibold text-[#666666] mb-2">
                      Daftar Paket Proyek {summary.pemda}:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {summary.projects.map((proj) => (
                        <button
                          key={proj.idLOP}
                          type="button"
                          onClick={() => onOpenProject(proj.idLOP)}
                          className="flex items-start justify-between gap-2 rounded-lg border border-[#E5E5E5] bg-[#F9F8F6] p-2 text-left transition hover:border-[#E5E5E5] hover:bg-[#FFFFFF]"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-mono text-[10px] text-[#666666] block">{proj.idLOP}</span>
                            <span className="text-xs font-semibold text-[#1C1C1E] truncate block">
                              {proj.projectName}
                            </span>
                          </div>
                          <span className="rounded bg-[#F3F3F1] px-1.5 py-0.5 text-[10px] font-bold text-[#666666] shrink-0">
                            {proj.stage}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
