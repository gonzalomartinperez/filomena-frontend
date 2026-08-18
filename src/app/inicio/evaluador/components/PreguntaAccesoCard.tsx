'use client'

import Tooltip from 'app/components/tooltip/Tooltip'
import { HiClipboardList, HiChevronRight } from 'react-icons/hi'

type Props = {
  ordenPregunta: number
  descripcion?: string | null
  onOpen: () => void
}

export default function PreguntaAccesoCard({
  ordenPregunta,
  descripcion,
  onOpen,
}: Props) {
  const previewText = (descripcion ?? '').trim()

  return (
    <Tooltip
      content="Ver detalle de la pregunta (descripción, imágenes y consigna)"
      variant="info"
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Abrir Pregunta ${ordenPregunta}`}
        className="group w-full cursor-pointer rounded-2xl border bg-white p-4 text-left shadow-sm ring-1 ring-black/5 transition hover:shadow-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
      >
        <div className="mb-1 flex items-center gap-2 text-indigo-600">
          <HiClipboardList className="h-5 w-5" />
          <span className="text-sm font-semibold">{`Pregunta ${ordenPregunta}`}</span>
        </div>

        {previewText ? (
          <p className="line-clamp-2 text-[13px] leading-relaxed text-gray-600">
            {previewText}
          </p>
        ) : (
          <p className="text-[13px] text-gray-400">Sin descripción.</p>
        )}

        <div className="mt-4 flex items-center justify-end text-sm font-medium text-indigo-600">
          <span className="transition group-hover:translate-x-0.5">
            Abrir <HiChevronRight className="ml-1 inline h-4 w-4" />
          </span>
        </div>
      </button>
    </Tooltip>
  )
}
