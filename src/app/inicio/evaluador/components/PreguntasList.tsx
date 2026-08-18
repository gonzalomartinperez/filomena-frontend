'use client'
import { HiCheckCircle, HiXCircle } from 'react-icons/hi'
import Tooltip from 'app/components/tooltip/Tooltip'
import { Pregunta } from 'app/inicio/administrador/preguntas/types/Pregunta'
import ProgressStat from './ProgressStat'
import { Button } from 'app/components/buttons/GeneralButton'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'

type Props = {
  preguntas: Pregunta[]
  onBack: () => void
  onSelect: (p: Pregunta) => void
  statusByPregunta?: Record<number, boolean>
  estudiantesProgressByPregunta?: Record<
    number,
    { done: number; total: number }
  >
}

export default function PreguntasList({
  preguntas,
  onBack,
  onSelect,
  statusByPregunta = {},
  estudiantesProgressByPregunta = {},
}: Props) {
  return (
    <div className="space-y-4">
      <div className="mb-4 flex items-center">
        <Button variant="alternative" icon={faArrowLeft} onClick={onBack}>
          Volver a casos
        </Button>
      </div>

      {preguntas.length === 0 ? (
        <p className="text-sm text-gray-500">
          No hay preguntas para este caso.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4">
          {preguntas.map((p) => {
            const done = statusByPregunta[p.id] ?? false
            const est = estudiantesProgressByPregunta[p.id]
            const showProgress = !!est
            const preview = p.consigna ?? ''
            const hasPreview = preview.length > 0

            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onSelect(p)}
                  onKeyDown={(e) => (e.key === 'Enter' ? onSelect(p) : null)}
                  aria-label={`Seleccionar pregunta ${p.orden_relativo}`}
                  className="group w-full cursor-pointer rounded-2xl border bg-white p-5 text-left shadow-sm ring-1 ring-black/5 transition hover:shadow-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg leading-snug font-medium">
                        {`Pregunta ${p.orden_relativo}`}
                      </h3>

                      {hasPreview && (
                        <p className="mt-1 text-[13px] leading-relaxed break-words whitespace-pre-line text-gray-600">
                          {preview}
                        </p>
                      )}
                    </div>

                    <Tooltip
                      variant={done ? 'success' : 'warning'}
                      title="Estado de la pregunta"
                      content={done ? 'Corregida' : 'Pendiente de corrección'}
                    >
                      <span
                        aria-label={
                          done ? 'Corregida' : 'Pendiente de corrección'
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

                  <div
                    className={`mt-3 flex items-center ${
                      showProgress ? 'justify-between' : 'justify-end'
                    }`}
                  >
                    {showProgress && (
                      <ProgressStat
                        label="Estudiantes corregidos:"
                        done={est!.done}
                        total={est!.total}
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
    </div>
  )
}
