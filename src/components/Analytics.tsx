import React from 'react'
import { cn, abbreviateIDR } from '../lib/utils'
import { PROJECTS, STAGE_COLORS } from '../data/mockData'

// Mini pipeline funnel by stage
export function PipelineFunnel() {
  const stages = ['F0', 'F1', 'F2', 'F3', 'WIN', 'LOSS'] as const
  const counts = stages.reduce(
    (acc, s) => {
      acc[s] = PROJECTS.filter((p) => p.stage === s).length
      return acc
    },
    {} as Record<string, number>
  )
  const totalValue = stages.reduce(
    (acc, s) => {
      acc[s] = PROJECTS.filter((p) => p.stage === s).reduce((sum, p) => sum + p.budget, 0)
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div className="card">
      <h3 className="text-sm font-bold text-white mb-1">Pipeline Funnel</h3>
      <p className="text-xs text-slate-500 mb-4">Distribusi proyek per stage</p>

      <div className="space-y-2">
        {stages.filter(s => s !== 'LOSS').map((stage) => {
          const count = counts[stage] || 0
          const val = totalValue[stage] || 0
          const color = STAGE_COLORS[stage]
          const maxCount = Math.max(...stages.map(s => counts[s] || 0))
          const pct = maxCount > 0 ? ((count / maxCount) * 100) : 0

          return (
            <div key={stage} className="flex items-center gap-3">
              <span
                className="text-xs font-bold w-8 text-right"
                style={{ color }}
              >
                {stage}
              </span>
              <div className="flex-1 h-5 rounded bg-slate-800/80 overflow-hidden relative">
                <div
                  className="h-full rounded flex items-center justify-end pr-2 transition-all duration-700"
                  style={{
                    width: `${Math.max(pct, 5)}%`,
                    background: `${color}30`,
                    borderRight: `3px solid ${color}`,
                  }}
                >
                </div>
              </div>
              <div className="flex items-center gap-2 w-28 text-right justify-end">
                <span className="text-xs font-bold text-white">{count}</span>
                <span className="text-xs text-slate-500">{val > 0 ? abbreviateIDR(val) : '—'}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* LOSS row */}
      <div className="mt-3 pt-3 border-t border-slate-700/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span className="text-xs text-red-400 font-semibold">LOSS</span>
        </div>
        <span className="text-xs text-slate-400">{counts['LOSS'] || 0} proyek kalah</span>
      </div>
    </div>
  )
}

// Donut-like service breakdown
export function ServiceBreakdown() {
  const onChannel = PROJECTS.filter(p => p.category === 'On Channel').length
  const gtma = PROJECTS.filter(p => p.category === 'GTMA').length
  const total = PROJECTS.length

  const services = [
    { name: 'Astinet', count: PROJECTS.filter(p => p.serviceType === 'Astinet').length, color: '#3b82f6' },
    { name: 'VPN IP', count: PROJECTS.filter(p => p.serviceType === 'VPN IP').length, color: '#8b5cf6' },
    { name: 'Metro Ethernet', count: PROJECTS.filter(p => p.serviceType === 'Metro Ethernet').length, color: '#06b6d4' },
    { name: 'Google Workspace', count: PROJECTS.filter(p => p.serviceType === 'Google Workspace').length, color: '#f59e0b' },
    { name: 'Mikrotik', count: PROJECTS.filter(p => p.serviceType === 'Mikrotik').length, color: '#10b981' },
  ]

  return (
    <div className="card">
      <h3 className="text-sm font-bold text-white mb-1">Service Breakdown</h3>
      <p className="text-xs text-slate-500 mb-4">Distribusi per layanan</p>

      <div className="space-y-2.5">
        {services.map((svc) => (
          <div key={svc.name} className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: svc.color }} />
            <span className="text-xs text-slate-300 flex-1">{svc.name}</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(svc.count / total) * 100}%`,
                    background: svc.color,
                  }}
                />
              </div>
              <span className="text-xs font-bold text-white w-4 text-right">{svc.count}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-700/30">
        <div className="flex-1 text-center p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-lg font-bold text-blue-400">{onChannel}</p>
          <p className="text-xs text-slate-500">On Channel</p>
        </div>
        <div className="flex-1 text-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-lg font-bold text-amber-400">{gtma}</p>
          <p className="text-xs text-slate-500">GTMA</p>
        </div>
      </div>
    </div>
  )
}

// Win Rate card
export function WinRateCard() {
  const total = PROJECTS.length
  const wins = PROJECTS.filter(p => p.stage === 'WIN').length
  const losses = PROJECTS.filter(p => p.stage === 'LOSS').length
  const winRate = total > 0 ? Math.round((wins / (wins + losses)) * 100) : 0

  const circumference = 2 * Math.PI * 36
  const strokeDasharray = `${(winRate / 100) * circumference} ${circumference}`

  return (
    <div className="card flex flex-col items-center justify-center text-center">
      <h3 className="text-sm font-bold text-white mb-3">Win Rate</h3>
      
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="#1e293b" strokeWidth="8" />
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="#10b981"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{winRate}%</span>
        </div>
      </div>

      <div className="flex gap-4 mt-3">
        <div>
          <p className="text-lg font-bold text-emerald-400">{wins}</p>
          <p className="text-xs text-slate-500">WIN</p>
        </div>
        <div className="w-px bg-slate-700" />
        <div>
          <p className="text-lg font-bold text-red-400">{losses}</p>
          <p className="text-xs text-slate-500">LOSS</p>
        </div>
        <div className="w-px bg-slate-700" />
        <div>
          <p className="text-lg font-bold text-blue-400">{total - wins - losses}</p>
          <p className="text-xs text-slate-500">In Progress</p>
        </div>
      </div>
    </div>
  )
}
