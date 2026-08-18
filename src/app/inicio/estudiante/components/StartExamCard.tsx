'use client'

import Tooltip from 'app/components/tooltip/Tooltip'
import { Button } from 'app/components/buttons/GeneralButton'
import { faPlay } from '@fortawesome/free-solid-svg-icons'
import { Examen } from 'app/inicio/administrador/examenes/types/Examen'
import CodigoExamenBadge from './CodigoExamenBadge'
import PseudonimoBadge from './PseudonimoBadge'

type Props = {
  examen: Examen & { retrocedible?: boolean }
  pseudonimo?: string
  onStart: () => void
  'data-testid'?: string
}

export default function StartExamCard({
  examen,
  pseudonimo,
  onStart,
  'data-testid': dataTestId,
}: Props) {
  return (
    <section
      data-testid={dataTestId ?? 'start-exam-card'}
      aria-labelledby="start-exam-title"
      aria-describedby="start-exam-desc"
      className="w-full max-w-2xl rounded-3xl border border-black/10 bg-white p-8 shadow-xl ring-1 ring-black/5"
    >
      <div className="mb-6 text-center">
        <h1
          id="start-exam-title"
          className="text-2xl font-semibold text-gray-900"
        >
          {examen.nombre}
        </h1>

        <div className="mt-3 flex items-center justify-center gap-2">
          <Tooltip variant="info" content="Código validado">
            <span className="inline-flex">
              <CodigoExamenBadge codigo={examen.codigo} />
            </span>
          </Tooltip>

          {!!pseudonimo && (
            <Tooltip variant="info" content="Pseudónimo asignado">
              <span className="inline-flex">
                <PseudonimoBadge nombre={pseudonimo} />
              </span>
            </Tooltip>
          )}
        </div>
      </div>

      <div
        id="start-exam-desc"
        className="mx-auto max-w-md text-sm leading-relaxed text-gray-600 md:max-w-lg"
        style={{ textAlign: 'justify' }}
      >
        <ul className="list-disc space-y-1 pl-5">
          <li>Recorrido: secuencial por casos y preguntas.</li>
          <li>
            Retroceso:{' '}
            {examen.retrocedible
              ? 'permitido entre preguntas y casos.'
              : 'no permitido.'}
          </li>
          <li>Guardado automático: al salir del campo de respuesta.</li>
          <li>
            Primera navegación: se te solicitará una confirmación para avanzar.
          </li>
          <li>
            Reporte de respuestas:{' '}
            {examen.descargable
              ? 'disponible al finalizar el examen.'
              : 'no disponible.'}
          </li>
        </ul>
      </div>

      <div className="mt-8 flex justify-center">
        <Button
          variant="default"
          icon={faPlay}
          onClick={onStart}
          aria-label="Comenzar examen"
          className="px-6 py-3 text-base"
        >
          Comenzar examen
        </Button>
      </div>
    </section>
  )
}
