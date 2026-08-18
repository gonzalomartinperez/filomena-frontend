'use client'

export default function PseudonimoBadge({
  nombre,
  loading,
}: {
  nombre?: string
  loading?: boolean
}) {
  const isLoading = loading || !nombre
  return (
    <span className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-gray-700 shadow-sm">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isLoading ? 'animate-pulse bg-gray-300' : 'bg-emerald-500'
        }`}
        aria-hidden="true"
      />
      <span className="font-medium">Pseudónimo:</span>
      <span className="font-normal">{isLoading ? 'Cargando…' : nombre}</span>
    </span>
  )
}
