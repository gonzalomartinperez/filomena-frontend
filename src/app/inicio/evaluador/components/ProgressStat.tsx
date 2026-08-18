'use client'

type Size = 'sm' | 'md'

type Props = {
  label: string
  done: number
  total: number
  size?: Size
  className?: string
  showPercent?: boolean
}

export default function ProgressStat({
  label,
  done,
  total,
  size = 'md',
  className = '',
  showPercent = true,
}: Props) {
  const safeTotal = Math.max(0, total)
  const safeDone = Math.min(Math.max(0, done), safeTotal)
  const pct = safeTotal > 0 ? Math.round((safeDone / safeTotal) * 100) : 0

  const sizes: Record<
    Size,
    { font: string; bar: string; width: string; gap: string }
  > = {
    sm: { font: 'text-[11px]', bar: 'h-1.5', width: 'w-44', gap: 'gap-1' },
    md: { font: 'text-xs', bar: 'h-2.5', width: 'w-56', gap: 'gap-1.5' },
  }
  const s = sizes[size]

  return (
    <div
      className={`inline-flex ${s.width} max-w-full flex-col ${s.gap} ${className}`}
      role="group"
      aria-label={label}
    >
      {/* Izquierda: Label + X / Y — Derecha: % */}
      <div
        className={`flex items-baseline justify-between ${s.font} text-gray-700`}
      >
        <span className="inline-flex items-baseline gap-1">
          <span className="font-medium opacity-80">{label}</span>
          <b className="font-semibold text-gray-900">{safeDone}</b>
          <span className="opacity-60">/</span>
          <b className="font-semibold text-gray-900">{safeTotal}</b>
        </span>

        {showPercent && (
          <span className="tabular-nums opacity-70" aria-label={`${pct}%`}>
            {pct}%
          </span>
        )}
      </div>

      <div
        className={`relative ${s.bar} w-full overflow-hidden rounded-full bg-gradient-to-r from-gray-100 to-gray-200`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeTotal || 100}
        aria-valuenow={safeTotal ? safeDone : 0}
        aria-label={`${label} ${safeDone} de ${safeTotal}`}
        title={`${pct}%`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
