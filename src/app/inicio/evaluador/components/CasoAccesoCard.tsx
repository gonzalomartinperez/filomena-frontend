'use client'

import Tooltip from 'app/components/tooltip/Tooltip'
import { HiCollection, HiChevronRight } from 'react-icons/hi'

type Props = {
  ordenCaso: number
  tituloCaso: string
  ordenPreguntaActual: number
  onOpen: () => void
}

export default function CasoAccesoCard({
  ordenCaso,
  tituloCaso,
  ordenPreguntaActual,
  onOpen,
}: Props) {
  return (
    <Tooltip
      content="Ver caso (descripciones e imágenes acumuladas)"
      variant="info"
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label="Abrir caso acumulado"
        className="group w-full cursor-pointer rounded-2xl border bg-white p-4 text-left shadow-sm ring-1 ring-black/5 transition hover:shadow-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
      >
        <div className="mb-1 flex items-center gap-2 text-indigo-600">
          <HiCollection className="h-5 w-5" />
          <span className="text-sm font-semibold">Caso</span>
        </div>

        <h3 className="text-[15px] font-semibold text-gray-900">
          {`Caso ${ordenCaso}: ${tituloCaso}`}
        </h3>
        <p className="mt-0.5 text-xs text-gray-600">{`Hasta Pregunta ${ordenPreguntaActual}`}</p>

        <div className="mt-4 flex items-center justify-end text-sm font-medium text-indigo-600">
          <span className="transition group-hover:translate-x-0.5">
            Abrir <HiChevronRight className="ml-1 inline h-4 w-4" />
          </span>
        </div>
      </button>
    </Tooltip>
  )
}
