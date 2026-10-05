import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '../lib/utils'

interface KPICardProps {
  title: string
  value: string
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  icon: React.ElementType
  iconColor?: string
  accentColor?: string
}

export function KPICard({
  title,
  value,
  subtitle,
  trend = 'neutral',
  trendValue,
  icon: Icon,
  iconColor = 'text-blue-400',
  accentColor = 'from-blue-600/20 to-blue-900/10',
}: KPICardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'

  return (
    <div className={cn('card card-hover relative overflow-hidden')}>
      {/* Gradient accent */}
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-40', accentColor)} />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={cn('p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50', iconColor)}>
            <Icon size={20} />
          </div>
          {trendValue && (
            <div className={cn('flex items-center gap-1 text-xs font-semibold', trendColor)}>
              <TrendIcon size={12} />
              <span>{trendValue}</span>
            </div>
          )}
        </div>

        <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
        <p className="text-sm font-medium text-slate-300">{title}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}
