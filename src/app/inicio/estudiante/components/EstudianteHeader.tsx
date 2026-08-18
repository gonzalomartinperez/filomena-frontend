'use client'

import Tooltip from 'app/components/tooltip/Tooltip'
import type { Examen } from 'app/inicio/administrador/examenes/types/Examen'
import PseudonimoBadge from './PseudonimoBadge'
import CodigoExamenBadge from './CodigoExamenBadge'

type Props = {
  examen: Examen
  pseudonimo?: string
}

export default function EstudianteHeader({ examen, pseudonimo }: Props) {
  return (
    <div className="mb-6 flex items-center justify-between border-b pb-3">
      <h1 className="text-3xl leading-[1.15] font-semibold tracking-normal text-balance text-gray-900 antialiased md:text-4xl">
        {examen.nombre}
      </h1>
      <div className="flex items-center gap-2">
        <Tooltip variant="info" content="Código validado">
          <span className="inline-flex">
            <CodigoExamenBadge codigo={examen.codigo} />
          </span>
        </Tooltip>
        <Tooltip variant="info" content="Pseudónimo asignado">
          <span className="inline-flex">
            <PseudonimoBadge nombre={pseudonimo} />
          </span>
        </Tooltip>
      </div>
    </div>
  )
}
