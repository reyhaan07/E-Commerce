import React, { useId } from 'react'
import { FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi'

const TINTS = {
  indigo: ['var(--accent-soft)', 'var(--accent)'],
  green:  ['var(--success-soft)', 'var(--success)'],
  orange: ['var(--warning-soft)', 'var(--warning)'],
  red:    ['var(--danger-soft)', 'var(--danger)'],
  blue:   ['var(--info-soft)', 'var(--info)'],
  violet: ['var(--violet-soft)', 'var(--violet)'],
  amber:  ['var(--amber-soft)', 'var(--amber)'],
}

// Tiny dependency-free sparkline (area + line).
function Sparkline({ data = [], color = 'var(--accent)', width = 54, height = 30 }) {
  const pts = data.filter(n => Number.isFinite(n))
  if (pts.length < 2) return null
  const min = Math.min(...pts), max = Math.max(...pts)
  const span = max - min || 1
  const stepX = width / (pts.length - 1)
  const coords = pts.map((v, i) => [i * stepX, height - ((v - min) / span) * (height - 6) - 3])
  const line = coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`
  const gid = useId().replace(/:/g, '')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`sg-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${gid})`} />
      <path d={line} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r="2.4" fill={color} />
    </svg>
  )
}

// KPI card: tinted icon + label, big value, delta with coloured arrow, and an
// optional sparkline or custom footer node.
export default function StatCard({
  title, value, delta, deltaType = 'up', deltaLabel, icon, tint = 'indigo',
  subtitle, spark, footer,
}) {
  const [bg, color] = TINTS[tint] || TINTS.indigo
  const isUp = deltaType === 'up'
  const trend = isUp ? 'var(--success)' : 'var(--danger)'

  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-center gap-2.5">
        <div className="stat-icon" style={{ background: bg, color }}>{icon}</div>
        <p className="text-[13px] font-semibold" style={{ color: 'var(--text-muted)' }}>{title}</p>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[23px] leading-none font-bold tracking-tight tnum truncate" style={{ color: 'var(--text-primary)' }}>{value}</p>
          {delta ? (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-0.5 text-xs font-bold" style={{ color: trend }}>
                {isUp ? <FiArrowUpRight size={13} /> : <FiArrowDownRight size={13} />}{delta}
              </span>
              {deltaLabel && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{deltaLabel}</span>}
            </div>
          ) : subtitle ? (
            <p className="text-xs mt-2 truncate" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
          ) : null}
        </div>
        {spark && spark.length > 1 && <div className="shrink-0 hidden sm:block"><Sparkline data={spark} color={color} /></div>}
      </div>

      {footer && <div className="mt-0.5">{footer}</div>}
    </div>
  )
}
