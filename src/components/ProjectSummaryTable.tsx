import { ArrowUpRight } from 'lucide-react'
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

const PIPELINE_STAGES = ['F0', 'F1', 'F2', 'F3', 'F4', 'F5'] as const

export function ProjectSummaryTable({
  projects,
  onOpenProject,
}: {
  projects: readonly ProjectSummaryItem[]
  onOpenProject: (idLOP: string) => void
}) {
  const summaries = Array.from(
    projects.reduce((groups, project) => {
      const pemda = project.pemdaName?.trim() || project.agency
      const summary = groups.get(pemda) ?? {
        pemda,
        value: 0,
        points: 0,
        stages: Object.fromEntries(PIPELINE_STAGES.map((stage) => [stage, 0])) as Record<
          (typeof PIPELINE_STAGES)[number],
          number
        >,
        projects: [] as ProjectSummaryItem[],
      }
      const pointTotalPrice = project.servicePointTotalPrice ?? 0
      summary.value += pointTotalPrice > 0
        ? pointTotalPrice
        : project.servicePrice
      summary.points += project.servicePointCount ?? (project.sid ? 1 : 0)
      if (PIPELINE_STAGES.includes(project.stage as (typeof PIPELINE_STAGES)[number])) {
        summary.stages[project.stage as (typeof PIPELINE_STAGES)[number]] += 1
      }
      summary.projects.push(project)
      groups.set(pemda, summary)
      return groups
    }, new Map<string, {
      pemda: string
      value: number
      points: number
      stages: Record<(typeof PIPELINE_STAGES)[number], number>
      projects: ProjectSummaryItem[]
    }>()),
  ).map(([, summary]) => summary).sort((a, b) => a.pemda.localeCompare(b.pemda, 'id'))

  return (
    <section className="card-glass overflow-hidden rounded-2xl">
      <div className="border-b border-slate-700/50 px-5 py-4">
        <h3 className="text-sm font-bold text-white">Summary Analitik Per Pemda</h3>
        <p className="mt-1 text-xs text-slate-400">Nilai layanan, jumlah SID terdaftar, dan posisi proyek F0–F5.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left">
          <thead>
            <tr className="border-b border-slate-700/50 bg-slate-950/40">
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Nama Pemda</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Total Nilai Proyek / Kontrak</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Total Titik Layanan</th>
              {PIPELINE_STAGES.map((stage) => (
                <th key={stage} className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500">{stage}</th>
              ))}
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Detail Layanan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {summaries.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">Belum ada proyek untuk dirangkum.</td></tr>
            ) : summaries.map((summary) => (
              <tr key={summary.pemda} className="align-top hover:bg-slate-800/30">
                <td className="px-4 py-3 text-sm font-semibold text-white">{summary.pemda}</td>
                <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-emerald-400">
                  Rp {summary.value.toLocaleString('id-ID')}
                </td>
                <td className="px-4 py-3 text-right text-sm tabular-nums text-slate-200">{summary.points}</td>
                {PIPELINE_STAGES.map((stage) => (
                  <td key={stage} className="px-3 py-3 text-center text-sm tabular-nums text-slate-300">{summary.stages[stage]}</td>
                ))}
                <td className="px-4 py-3">
                  <ul className="space-y-1.5">
                    {summary.projects.map((project) => (
                      <li key={project.idLOP}>
                        <button
                          type="button"
                          onClick={() => onOpenProject(project.idLOP)}
                          className="inline-flex max-w-xs items-center gap-1 truncate text-left text-xs text-blue-400 hover:text-blue-300 hover:underline"
                          title={`${project.projectName} (${project.idLOP})`}
                        >
                          <ArrowUpRight size={12} className="shrink-0" />
                          <span className="truncate">{project.projectName}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
