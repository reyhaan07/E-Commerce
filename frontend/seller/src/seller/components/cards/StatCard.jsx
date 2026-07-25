import React, { useId } from 'react'
import { FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi'

// Tiny dependency-free sparkline (area + line) for the stat cards.
function Sparkline({ data = [], color = '#6366f1', width = 88, height = 32 }) {
  const pts = data.filter(n => Number.isFinite(n))
  if (pts.length < 2) return null
  const min = Math.min(...pts)
  const max = Math.max(...pts)
  const span = max - min || 1
  const stepX = width / (pts.length - 1)
  const coords = pts.map((v, i) => [i * stepX, height - ((v - min) / span) * (height - 4) - 2])
  const line = coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`
  const gid = useId()
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden="true" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${gid})`} />
      <path d={line} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r="2.6" fill={color} />
    </svg>
  )
}

export default function StatCard({
  title, value, delta, deltaType = 'up', icon, iconBg, iconColor, subtitle, spark, accent,
}) {
  const isUp = deltaType === 'up'
  const trendColor = isUp ? 'var(--success)' : 'var(--danger)'
  const sparkColor = accent || iconColor || 'var(--accent)'

  return (
    <div className="stat-card animate-fade-in group">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          {title}
        </p>
        <div
          className="stat-icon shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{ background: iconBg || 'var(--accent-soft)', color: iconColor || 'var(--accent)' }}
        >
          {icon}
        </div>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-3xl font-extrabold tracking-tight truncate tnum" style={{ color: 'var(--text-primary)' }}>
            {value}
          </p>
          {delta && (
            <div className="inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded-md text-xs font-bold"
              style={{ color: trendColor, background: isUp ? 'var(--success-soft)' : 'var(--danger-soft)' }}>
              {isUp ? <FiArrowUpRight size={13} /> : <FiArrowDownRight size={13} />}
              <span className="tnum">{delta}</span>
            </div>
          )}
        </div>
        {spark && spark.length > 1 && (
          <div className="shrink-0 opacity-90">
            <Sparkline data={spark} color={sparkColor.startsWith('var(') ? undefined : sparkColor} />
          </div>
        )}
      </div>

      {subtitle && (
        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
      )}
    </div>
  )
}
