'use client'
import { useMemo } from 'react'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function SaveIndicator({
  status,
  onRetry,
  compact = true,
}: {
  status: SaveStatus
  onRetry?: () => void
  compact?: boolean
}) {
  const label = useMemo(() => {
    switch (status) {
      case 'saving':
        return 'Guardando…'
      case 'saved':
        return 'Guardado'
      case 'error':
        return 'No se pudo guardar'
      default:
        return 'Autosave al salir del campo'
    }
  }, [status])

  const dotClass =
    status === 'saving'
      ? 'bg-indigo-500 animate-pulse'
      : status === 'saved'
        ? 'bg-emerald-500'
        : status === 'error'
          ? 'bg-rose-500'
          : 'bg-gray-300'

  return (
    <div
      className={`flex items-center gap-2 ${compact ? 'text-[10px]' : 'text-xs'} text-gray-500`}
      aria-live="polite"
      aria-atomic="true"
    >
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      <span>{label}</span>
      {status === 'error' && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="ml-2 underline decoration-dotted hover:text-gray-700"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}
