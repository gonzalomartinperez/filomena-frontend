'use client'

import { useCallback, useMemo, useState } from 'react'
import { FaCheckCircle, FaCircleNotch, FaLock } from 'react-icons/fa'
import Tooltip from 'app/components/tooltip/Tooltip'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import { evaluadorApi } from '../services/evaluadorServices'
import { ApiResponse } from 'app/types/ApiResponse'

type Props = {
  examenId: number
  enabled: boolean
  finalizado?: boolean
  className?: string
  onFinalized?: () => void
}

export default function FinalizarCorreccionesButton({
  examenId,
  enabled,
  finalizado = false,
  className,
  onFinalized,
}: Props) {
  const {
    actions: { openToast },
  } = useVisualNotifications()

  type Status = 'idle' | 'closing' | 'closed'
  const [status, setStatus] = useState<Status>(finalizado ? 'closed' : 'idle')

  const isClosing = status === 'closing'
  const isClosed = status === 'closed' || finalizado
  const canClick = enabled && !isClosing && !isClosed

  const tooltip = useMemo(() => {
    if (isClosing) return 'Finalizando…'
    if (isClosed) return 'Correcciones finalizadas'
    if (!enabled) return 'Debes completar todas tus correcciones asignadas'
    return 'Finalizar correcciones'
  }, [enabled, isClosing, isClosed])

  const onClick = useCallback(async () => {
    if (!canClick) return

    setStatus('closing')

    await evaluadorApi
      .finalizarCorreccion(examenId)
      .then((res) => {
        const ok = res?.data?.status === 200 && res?.data?.data?.finalizado
        if (ok) {
          setStatus('closed')
          openToast({
            severity: 'success',
            message: 'Correcciones finalizadas',
          })
          onFinalized?.()
          return
        }
        setStatus('idle')
        openToast({
          severity: 'warning',
          message:
            res?.data?.message ??
            'No fue posible finalizar. Verifica que no queden pendientes.',
        })
      })
      .catch((e: ApiResponse<unknown>) => {
        setStatus('idle')
        openToast({
          severity: 'error',
          message: e?.message ?? 'Error al finalizar correcciones.',
        })
      })
  }, [canClick, examenId, onFinalized, openToast])

  const base =
    'inline-flex items-center gap-3 rounded-full border bg-white/80 px-4 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-black/5 transition ' +
    'hover:shadow-md hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ' +
    'backdrop-blur supports-[backdrop-filter]:bg-white/60'
  const disabled =
    'cursor-not-allowed opacity-60 hover:shadow-sm hover:bg-white/80 focus:ring-0'

  return (
    <Tooltip
      side="bottom"
      content={tooltip}
      variant={canClick ? 'info' : isClosed ? 'success' : 'warning'}
    >
      <button
        type="button"
        onClick={onClick}
        aria-disabled={!canClick}
        className={`${base} ${canClick ? 'cursor-pointer' : disabled} ${className ?? ''}`}
      >
        {isClosing ? (
          <FaCircleNotch className="h-4 w-4 animate-spin" aria-hidden />
        ) : isClosed ? (
          <FaLock className="h-4 w-4" aria-hidden />
        ) : (
          <FaCheckCircle className="h-4 w-4" aria-hidden />
        )}
        <span className="whitespace-nowrap">
          {isClosed ? 'Correcciones finalizadas' : 'Finalizar correcciones'}
        </span>
      </button>
    </Tooltip>
  )
}
