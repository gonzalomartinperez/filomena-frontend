'use client'

export default function CodigoExamenBadge({ codigo }: { codigo?: string }) {
  if (!codigo) return null
  return (
    <span className="rounded-full border px-3 py-1 text-xs text-gray-700">
      Código: {codigo}
    </span>
  )
}
