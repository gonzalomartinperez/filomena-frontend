'use client'

import {
  HiUser,
  HiCheckCircle,
  HiXCircle,
  HiChevronRight,
} from 'react-icons/hi'
import Tooltip from 'app/components/tooltip/Tooltip'
import { Estudiante } from '../types/modelos'
import { Button } from 'app/components/buttons/GeneralButton'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'

type Props = {
  onBack: () => void
  estudiantes: Estudiante[]
  onSelect?: (u: Estudiante) => void
  corregidosIds?: Set<number>
}

export default function PseudonimosList({
  onBack,
  estudiantes,
  onSelect,
  corregidosIds,
}: Props) {
  const card =
    'group flex w-full cursor-pointer items-center gap-4 rounded-2xl border bg-white p-4 text-left shadow-sm ring-1 ring-black/5 transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="alternative" icon={faArrowLeft} onClick={onBack}>
          Volver a preguntas
        </Button>
      </div>

      {estudiantes.length === 0 ? (
        <p className="text-sm text-gray-500">
          No hay estudiantes para este examen.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {estudiantes.map((e) => {
            const nick = e.pseudonimo || '—'
            const isCorregido = corregidosIds?.has(e.id) ?? false
            const EstadoIcon = isCorregido ? HiCheckCircle : HiXCircle
            const estadoClass = isCorregido ? 'text-green-600' : 'text-red-500'
            const hint = isCorregido ? 'Corregido' : 'Pendiente de corrección'

            return (
              <li key={e.id}>
                <button
                  type="button"
                  aria-label={`Seleccionar pseudónimo ${nick}`}
                  onClick={() => onSelect?.(e)}
                  className={card}
                >
                  <Tooltip content="Estudiante" variant="info">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-gray-100 text-gray-700 shadow-sm">
                      <HiUser size={24} />
                    </span>
                  </Tooltip>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-medium text-gray-900">
                      {nick}
                    </p>
                    <p className="text-xs text-gray-500">{hint}</p>
                  </div>

                  <div className="flex min-w-[64px] items-center justify-end gap-3">
                    <Tooltip
                      variant={isCorregido ? 'success' : 'warning'}
                      title="Estado del estudiante"
                      content={
                        isCorregido ? 'Corregido' : 'Pendiente de corrección'
                      }
                    >
                      <span
                        className="inline-flex items-center"
                        aria-label={hint}
                      >
                        <EstadoIcon size={20} className={estadoClass} />
                      </span>
                    </Tooltip>
                    <span aria-hidden className="text-gray-500">
                      <HiChevronRight size={18} />
                    </span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
