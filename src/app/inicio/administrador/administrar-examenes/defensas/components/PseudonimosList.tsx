'use client'

import {
  HiUser,
  HiCheckCircle,
  HiXCircle,
  HiChevronRight,
  HiLockClosed,
} from 'react-icons/hi'
import Tooltip from 'app/components/tooltip/Tooltip'
import type { Usuario } from 'app/inicio/administrador/usuarios/types/Usuario'

type Props = {
  usuarios: Usuario[]
  onSelect: (u: Usuario) => void
  defendedById: Set<number>
  /** Si los evaluadores NO finalizaron, se deshabilita la selección. */
  evaluadoresOk: boolean
  /** Nuevo: además, el examen debe estar finalizado. */
  examenFinalizado: boolean
}

export default function PseudonimosList({
  usuarios,
  onSelect,
  defendedById,
  evaluadoresOk,
  examenFinalizado,
}: Props) {
  const card =
    'group flex w-full items-center gap-4 rounded-2xl border bg-white p-4 text-left shadow-sm ring-1 ring-black/5 transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500'

  if (usuarios.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No hay estudiantes para este examen.
      </p>
    )
  }

  const habilitado = evaluadoresOk && examenFinalizado

  return (
    <ul className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {usuarios.map((u) => {
        const nick = u.pseudonimo || '—'
        const isDefendido = defendedById.has(Number(u.id))

        const disabledMsg = !examenFinalizado
          ? 'Bloqueado: el examen no está finalizado'
          : 'Bloqueado: faltan evaluadores por finalizar'

        return (
          <li key={u.id}>
            <button
              type="button"
              aria-label={`Seleccionar pseudónimo ${nick}`}
              onClick={() => (habilitado ? onSelect(u) : void 0)}
              className={`${card} ${habilitado ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
              disabled={!habilitado}
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-gray-100 text-gray-700 shadow-sm">
                <HiUser size={24} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-medium text-gray-900">
                  {nick}
                </p>
                <p className="text-xs text-gray-500">
                  {habilitado ? 'Seleccionar para cargar defensa' : disabledMsg}
                </p>
              </div>

              <div className="flex min-w-[88px] items-center justify-end gap-3">
                {!habilitado ? (
                  <Tooltip
                    variant="warning"
                    content={
                      !examenFinalizado
                        ? 'Examen no finalizado'
                        : 'Faltan evaluadores'
                    }
                  >
                    <span className="inline-flex items-center">
                      <HiLockClosed size={20} className="text-amber-600" />
                    </span>
                  </Tooltip>
                ) : isDefendido ? (
                  <Tooltip variant="success" content="Defendido">
                    <span className="inline-flex items-center">
                      <HiCheckCircle size={20} className="text-green-600" />
                    </span>
                  </Tooltip>
                ) : (
                  <Tooltip variant="info" content="Sin defensa">
                    <span className="inline-flex items-center">
                      <HiXCircle size={20} className="text-gray-500" />
                    </span>
                  </Tooltip>
                )}
                <span aria-hidden className="text-gray-500">
                  <HiChevronRight size={18} />
                </span>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
