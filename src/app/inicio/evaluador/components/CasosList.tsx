'use client'
import { HiCheckCircle, HiXCircle } from 'react-icons/hi'
import { Caso } from 'app/inicio/administrador/casos/types/Caso'
import { ReactNode } from 'react'
import Tooltip from 'app/components/tooltip/Tooltip'
import ProgressStat from './ProgressStat'

type Props = {
  examenNombre?: string
  casos: Caso[]
  onSelect: (c: Caso) => void
  statusByCaso?: Record<number, boolean>
  progressByCaso?: Record<number, { done: number; total: number }>
  headerAction?: ReactNode
}

export default function CasosList({
  examenNombre,
  casos,
  onSelect,
  statusByCaso = {},
  progressByCaso = {},
  headerAction,
}: Props) {
  return (
    <>
      {(!!examenNombre || !!headerAction) && (
        <div className="mb-4 flex items-center justify-between gap-4 border-b pb-2">
          {!!examenNombre && (
            <h1 className="text-3xl leading-[1.15] font-semibold tracking-normal text-balance text-gray-900 antialiased md:text-4xl">
              {examenNombre}
            </h1>
          )}
          <div className="shrink-0">{headerAction}</div>
        </div>
      )}

      {casos.length === 0 ? (
        <p className="text-sm text-gray-500">
          No tenés casos asignados para este examen.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {casos.map((c) => {
            const evaluador = c.evaluador.apellido + ', ' + c.evaluador.nombre
            const done = statusByCaso[c.id] ?? false
            const prog = progressByCaso[c.id]

            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onSelect(c)}
                  className="group block w-full cursor-pointer rounded-2xl border bg-white p-5 text-left shadow-sm ring-1 ring-black/5 transition hover:shadow-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  aria-label={`${done ? 'Ver' : 'Corregir'} caso ${c.orden_relativo}: ${c.titulo}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="line-clamp-2 text-lg font-medium">
                        {`Caso ${c.orden_relativo}: ${c.titulo}`}
                      </h2>
                    </div>

                    <Tooltip
                      variant={done ? 'success' : 'warning'}
                      title="Estado del caso"
                      content={done ? 'Corregido' : 'Pendiente de corrección'}
                    >
                      <span
                        aria-label={
                          done ? 'Corregido' : 'Pendiente de corrección'
                        }
                      >
                        {done ? (
                          <HiCheckCircle size={20} className="text-green-600" />
                        ) : (
                          <HiXCircle size={20} className="text-red-500" />
                        )}
                      </span>
                    </Tooltip>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm text-gray-500">Evaluador a cargo</p>
                    <p className="text-sm font-medium text-gray-800">
                      {evaluador}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    {!!prog && (
                      <ProgressStat
                        label="Preguntas corregidas:"
                        done={prog.done}
                        total={prog.total}
                      />
                    )}
                    <span className="text-xs text-gray-400">
                      {done ? 'Click para ver' : 'Click para corregir'}
                    </span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
