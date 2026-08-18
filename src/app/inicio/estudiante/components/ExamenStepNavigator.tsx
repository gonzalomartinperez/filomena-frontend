'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from 'app/components/buttons/GeneralButton'
import {
  faArrowLeft,
  faArrowRight,
  faPlay,
  faStop,
} from '@fortawesome/free-solid-svg-icons'
import type { Pregunta } from 'app/inicio/administrador/preguntas/types/Pregunta'
import type { ApiFile } from 'app/inicio/administrador/mochila-carga/types/ApiFile'
import EnunciadoBloque from './EnunciadoBloque'
import { useAutoScrollToActiveEnunciado } from '../utils/scroll'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function InlineSaveIndicator({
  status,
  onRetry,
}: {
  status: SaveStatus
  onRetry?: () => void
}) {
  const dotClass =
    status === 'saving'
      ? 'bg-indigo-400 animate-pulse'
      : status === 'saved'
        ? 'bg-emerald-500'
        : status === 'error'
          ? 'bg-rose-500'
          : 'bg-gray-300'

  const label =
    status === 'saving'
      ? 'Guardando…'
      : status === 'saved'
        ? 'Guardado'
        : status === 'error'
          ? 'No se pudo guardar'
          : 'Autosave al salir del campo'

  return (
    <div
      className="flex items-center gap-2 text-[10px] text-gray-500"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      <span className="tracking-wide">{label}</span>
      {status === 'error' && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="ml-1 underline decoration-dotted hover:text-gray-700"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}

export type Bloque = {
  descripcion: string
  imagenes: ApiFile[]
  isActual: boolean
}

type Props = {
  casoOrdenRelativo: number | null
  casoPreguntasTotal: number
  bloquesEnunciado: Bloque[]
  pregunta?: Pregunta | null
  respuesta: string
  onChangeRespuesta: (value: string) => void
  onGuardar: (opts?: { silent?: boolean }) => Promise<void> | void
  onAnterior: () => void
  onSiguiente: () => void
  onIniciar: () => void
  onFinalizar: () => void
  puedeAnterior: boolean
  puedeSiguiente: boolean
  puedeIniciar: boolean
  puedeFinalizar: boolean
}

export default function ExamenStepNavigator({
  casoOrdenRelativo,
  casoPreguntasTotal,
  bloquesEnunciado,
  pregunta,
  respuesta,
  onChangeRespuesta,
  onGuardar,
  onAnterior,
  onSiguiente,
  onIniciar,
  onFinalizar,
  puedeAnterior,
  puedeSiguiente,
  puedeIniciar,
  puedeFinalizar,
}: Props) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  // ref solo para el scroller del ENUNCIADO
  const enunciadoRef = useRef<HTMLDivElement | null>(null)

  // Desactivar tecla Tab
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [])

  // Índice del bloque actual
  const idxActual = useMemo(
    () =>
      Math.max(
        0,
        bloquesEnunciado.findIndex((b) => b.isActual),
      ),
    [bloquesEnunciado],
  )

  // autoscroll one-shot por cambio de pregunta/bloque
  useAutoScrollToActiveEnunciado(enunciadoRef, [pregunta?.id, idxActual], {
    behavior: 'smooth',
    padding: 8,
    settleFrames: 2,
  })

  const handleBlurSave = async () => {
    // Si no hay consigna, no hay nada que guardar
    if (!((pregunta?.consigna ?? '').trim().length > 0)) return
    try {
      setSaveStatus('saving')
      await Promise.resolve(onGuardar?.({ silent: true }))
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
      return
    }
    window.setTimeout(() => setSaveStatus('idle'), 1500)
  }

  const consigna = useMemo(() => {
    const c = (pregunta?.consigna ?? '').trim()
    return c.length ? c : null
  }, [pregunta?.consigna])

  const progreso = useMemo(() => {
    const total = Math.max(1, casoPreguntasTotal || 0)
    const pr = Math.max(0, pregunta?.orden_relativo ?? 0)
    const pct = Math.round((pr / total) * 100)
    return Math.min(100, Math.max(0, pct))
  }, [pregunta?.orden_relativo, casoPreguntasTotal])

  const casoLabel =
    typeof casoOrdenRelativo === 'number' ? String(casoOrdenRelativo) : '-'
  const pregLabel =
    typeof pregunta?.orden_relativo === 'number'
      ? String(pregunta!.orden_relativo)
      : '-'
  const totalLabel = casoPreguntasTotal > 0 ? String(casoPreguntasTotal) : '-'

  return (
    <div className="mx-2 my-2 space-y-5 md:mx-4 md:my-4">
      {/* Header compacto del paso actual */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl leading-tight font-semibold text-gray-900 md:text-2xl">
            {`Caso ${casoLabel}: Pregunta ${pregLabel} de ${totalLabel}`}
          </h2>
          <div className="mt-2 h-1.5 w-full max-w-[420px] overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-indigo-500/60"
              style={{ width: `${progreso}%` }}
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {puedeIniciar && (
            <Button variant="alternative" icon={faPlay} onClick={onIniciar}>
              Iniciar examen
            </Button>
          )}
          {puedeFinalizar && (
            <Button variant="red" icon={faStop} onClick={onFinalizar}>
              Finalizar examen
            </Button>
          )}
        </div>
      </div>

      {/* Paneles principales: Enunciado (izquierda) + Respuesta (derecha) */}
      <div className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-stretch">
        {/* Panel Enunciado */}
        <div className="flex h-[50vh] flex-col rounded-2xl border border-gray-200 bg-white shadow-sm md:h-[70vh]">
          <div className="flex items-center justify-between rounded-t-2xl border-b px-4 py-2">
            <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Enunciado
            </h2>
          </div>

          <div
            ref={enunciadoRef}
            className="min-h-0 flex-1 overflow-y-auto px-4 pb-4"
            aria-live="polite"
          >
            {bloquesEnunciado.map((b, i) => {
              const anchorId = b.isActual
                ? 'bloque-actual'
                : i === idxActual + 1
                  ? 'bloque-siguiente'
                  : i === idxActual - 1
                    ? 'bloque-anterior'
                    : undefined

              return (
                <EnunciadoBloque
                  key={`bloque-${i}`}
                  descripcion={b.descripcion}
                  imagenes={b.imagenes}
                  resaltado={b.isActual}
                  showDivider={i > 0}
                  anchorId={anchorId}
                />
              )
            })}
          </div>
        </div>

        {/* Panel Respuesta */}
        {consigna && (
          <div className="flex h-[40vh] flex-col rounded-2xl border border-gray-200 bg-white shadow-sm md:h-[70vh]">
            <div className="sticky top-0 z-[1] flex items-center justify-between rounded-t-2xl px-4 py-2">
              <h3 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Tu respuesta
              </h3>
              <InlineSaveIndicator
                status={saveStatus}
                onRetry={() => void handleBlurSave()}
              />
            </div>

            <div className="px-4 pb-2">
              <p className="rounded-md border-l-4 border-amber-300 bg-amber-50/60 px-3 py-2 text-[15px] leading-relaxed font-semibold whitespace-pre-line text-gray-900">
                {consigna}
              </p>
            </div>

            <div className="min-h-0 flex-1 px-4 pb-4">
              <textarea
                aria-label="Respuesta del estudiante"
                className="h-full w-full resize-none rounded-xl border border-gray-200 bg-white p-4 text-[15px] leading-6 text-gray-900 transition outline-none placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                value={respuesta}
                onChange={(e) => onChangeRespuesta(e.target.value)}
                onBlur={handleBlurSave}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navegación */}
      <div className="flex items-center justify-between border-t pt-3">
        <div>
          {puedeAnterior && (
            <Button variant="default" icon={faArrowLeft} onClick={onAnterior}>
              Anterior
            </Button>
          )}
        </div>
        <div>
          {puedeSiguiente && (
            <Button variant="default" icon={faArrowRight} onClick={onSiguiente}>
              Siguiente
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
