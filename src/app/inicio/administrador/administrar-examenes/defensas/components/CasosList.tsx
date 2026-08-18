'use client'

import { HiCheckCircle, HiXCircle } from 'react-icons/hi'
import Tooltip from 'app/components/tooltip/Tooltip'
import type { Caso } from 'app/inicio/administrador/casos/types/Caso'

type Props = {
  casos: Caso[]
  onSelect: (c: Caso) => void
  subtitle?: string
  defendidosPorCaso?: Set<number>
}

export default function CasosList({
  casos,
  onSelect,
  defendidosPorCaso,
}: Props) {
  if (casos.length === 0) {
    return (
      <p className="text-sm text-gray-500">No hay casos para este examen.</p>
    )
  }

  return (
    <ul className="mb-4 flex flex-wrap gap-4">
      {casos.map((c) => {
        const ok = defendidosPorCaso?.has(Number(c.id)) ?? false
        return (
          <li key={c.id} className="max-w-full shrink-0">
            <button
              type="button"
              onClick={() => onSelect(c)}
              className="group relative inline-block w-auto max-w-[640px] min-w-[280px] cursor-pointer rounded-2xl border bg-white px-6 py-6 text-left shadow-sm ring-1 ring-black/5 transition hover:shadow-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              aria-label={`Abrir defensa para Caso ${c.orden_relativo}: ${c.titulo}`}
            >
              {/* Icono de estado (sin contorno) */}
              <Tooltip
                content={ok ? 'Con defensa cargada' : 'Sin defensa cargada'}
                variant={ok ? 'success' : 'info'}
              >
                <span className="absolute top-3 right-3">
                  {ok ? (
                    <HiCheckCircle size={20} className="text-green-600" />
                  ) : (
                    <HiXCircle size={20} className="text-gray-500" />
                  )}
                </span>
              </Tooltip>

              {/* Título completo */}
              <h2 className="pr-8 text-lg font-medium">{`Caso ${c.orden_relativo}: ${c.titulo}`}</h2>
              <div className="mt-2 text-xs text-gray-500">
                Click para cargar defensa
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
