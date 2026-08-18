'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import {
  HiChevronLeft,
  HiChevronRight,
  HiCheck,
  HiX,
  HiInformationCircle,
} from 'react-icons/hi'
import useModal from 'app/hooks/useModal'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import Tooltip from 'app/components/tooltip/Tooltip'
import { Caso } from 'app/inicio/administrador/casos/types/Caso'
import { Pregunta } from 'app/inicio/administrador/preguntas/types/Pregunta'
import YesNoCheck from './YesNoCheck'
import { evaluadorApi } from '../services/evaluadorServices'
import { Item } from 'app/inicio/administrador/tablas-cotejo/types/TablaCotejo'
import { Button } from 'app/components/buttons/GeneralButton'
import { faSave, faLock, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { Seccion } from 'app/inicio/administrador/secciones/types/Seccion'
import UnsavedChangesGuard from 'app/components/navigation/UnsavedChangesGuard'
import {
  getGrupos,
  getRespuestaAlumno,
  getCorreccionesAlumno,
  setCorreccionesAlumno,
} from '../services/evaluadorCache'
import type { ApiFile } from 'app/inicio/administrador/mochila-carga/types/ApiFile'
import CasoAcumuladoModal, { type BloqueCaso } from './CasoAcumuladoModal'
import CasoAccesoCard from './CasoAccesoCard'
import PreguntaAccesoCard from './PreguntaAccesoCard'
import PreguntaInfoModal from './PreguntaInfoModal'

const panel = 'rounded-2xl border bg-white p-4 shadow-sm'
const smallBtn =
  'cursor-pointer inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500'

type Props = {
  examenId: number
  caso: Caso
  pregunta: Pregunta
  estudiante: { id: number; pseudonimo: string }
  onBackEstudiantes: () => void
  onSaved?: () => void
  readOnly?: boolean
  hasPrev?: boolean
  hasNext?: boolean
  onPrevEstudiante?: () => void
  onNextEstudiante?: () => void
  advanceOnSave?: boolean
  showPrevNextButtons?: boolean
}

export default function CorreccionPregunta({
  examenId,
  caso,
  pregunta,
  estudiante,
  onBackEstudiantes,
  onSaved,
  readOnly = false,
  hasPrev = false,
  hasNext = false,
  onPrevEstudiante,
  onNextEstudiante,
  advanceOnSave = true,
  showPrevNextButtons = true,
}: Props) {
  const {
    actions: { openModal },
  } = useModal()
  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()

  const [respuesta, setRespuesta] = useState<string>('')
  const [grupos, setGrupos] = useState<{ seccion: Seccion; items: Item[] }[]>(
    [],
  )
  const [values, setValues] = useState<Record<number, boolean | null>>({})
  const [initialValues, setInitialValues] = useState<
    Record<number, boolean | null>
  >({})

  const isInformativa = !pregunta.consigna?.trim()
  const locked = readOnly || isInformativa

  // Imágenes de la pregunta actual (para previews en las cards y el modal)
  const [imagenesActuales, setImagenesActuales] = useState<ApiFile[]>([])
  useEffect(() => {
    let alive = true
    const lid = startLoading('Cargando recursos…')
    evaluadorApi
      .imagenesPregunta(pregunta.id)
      .then((r) => {
        if (!alive) return
        setImagenesActuales((r?.data?.data ?? []) as ApiFile[])
      })
      .finally(() => stopLoading(lid))
    return () => {
      alive = false
    }
  }, [pregunta.id])

  // Modales
  const [showCasoModal, setShowCasoModal] = useState<boolean>(false)
  const [bloquesCaso, setBloquesCaso] = useState<BloqueCaso[]>([])
  const [showPreguntaModal, setShowPreguntaModal] = useState<boolean>(false)

  // Cache caso acumulado
  const casoModalCacheRef = useRef<Map<string, BloqueCaso[]>>(new Map())
  const casoKey = `${caso.id}:${pregunta.orden_relativo ?? 0}`

  // Carga estructura de cotejo (evitamos loaders/requests si es informativa)
  useEffect(() => {
    let alive = true
    if (isInformativa) {
      setGrupos([])
      return () => {
        alive = false
      }
    }
    const lid = startLoading('Cargando estructura de corrección')
    setGrupos([])
    getGrupos(examenId, caso.id, pregunta.id)
      .then((grs) => {
        if (!alive) return
        const sorted = grs
          .slice()
          .sort(
            (a, b) =>
              (a.seccion.orden_relativo ?? 0) - (b.seccion.orden_relativo ?? 0),
          )
        setGrupos(sorted)
      })
      .finally(() => stopLoading(lid))
    return () => {
      alive = false
    }
  }, [examenId, caso.id, pregunta.id, isInformativa])

  // Carga datos del alumno (respuesta/correcciones) — evitamos loaders en informativas
  useEffect(() => {
    let alive = true
    if (isInformativa) {
      setRespuesta('Pregunta informativa — no aplica respuesta.')
      setValues({})
      setInitialValues({})
      return () => {
        alive = false
      }
    }
    const lid = startLoading('Cargando respuesta y estado previo')
    Promise.all([
      getRespuestaAlumno(pregunta.id, estudiante.pseudonimo),
      getCorreccionesAlumno(pregunta.id, estudiante.pseudonimo),
    ])
      .then(([resp, prev]) => {
        if (!alive) return
        setRespuesta(resp || 'Sin respuesta.')
        setValues(prev)
        setInitialValues(prev)
      })
      .finally(() => stopLoading(lid))
    return () => {
      alive = false
    }
  }, [pregunta.id, estudiante.pseudonimo, isInformativa])

  const allItemsIds = useMemo(
    () => grupos.flatMap((g) => g.items.map((i) => i.id)),
    [grupos],
  )

  const canSave = useMemo(() => {
    if (locked) return false
    if (allItemsIds.length === 0) return false
    return allItemsIds.every((id) => typeof values[id] === 'boolean')
  }, [allItemsIds, values, locked])

  const isDirty = useMemo(() => {
    if (locked) return false
    const ids = Array.from(
      new Set([...Object.keys(values), ...Object.keys(initialValues)]),
    )
    return ids.some((k) => initialValues[Number(k)] !== values[Number(k)])
  }, [values, initialValues, locked])

  const confirmLeave = useCallback(
    (proceed: () => void) => {
      if (locked) return proceed()
      openModal({
        type: 'confirmacion',
        message: '¿Querés salir sin guardar tu corrección?',
        button: { onClick: proceed },
      })
    },
    [locked, openModal],
  )

  const setItemValue = useCallback(
    (itemId: number, v: boolean) => {
      if (locked) return
      setValues((prev) => ({ ...prev, [itemId]: v }))
    },
    [locked],
  )

  const setAll = useCallback(
    (v: boolean) => {
      if (locked) return
      const next: Record<number, boolean> = {}
      allItemsIds.forEach((id) => {
        next[id] = v
      })
      setValues((prev) => ({ ...prev, ...next }))
    },
    [allItemsIds, locked],
  )

  const askConfirmLeave = (cb: () => void) => {
    if (!isDirty) return cb()
    openModal({
      type: 'confirmacion',
      message: '¿Querés salir sin guardar tu corrección?',
      button: { onClick: cb },
    })
  }

  const backToEstudiantes = () => askConfirmLeave(onBackEstudiantes)

  // Caso acumulado (con caché)
  const openCasoAcumulado = async () => {
    const cached = casoModalCacheRef.current.get(casoKey)
    if (cached) {
      setBloquesCaso(cached)
      setShowCasoModal(true)
      return
    }
    const lid = startLoading('Armando caso acumulado')
    try {
      const listRes = await evaluadorApi.preguntas(examenId, caso.id)
      const todas: Pregunta[] = (listRes?.data?.data ?? []) as Pregunta[]
      const ordenActual = pregunta.orden_relativo ?? 0
      const hasta = todas
        .filter((q) => (q.orden_relativo ?? 0) <= ordenActual)
        .sort((a, b) => (a.orden_relativo ?? 0) - (b.orden_relativo ?? 0))

      const bloques = await Promise.all(
        hasta.map(async (q, idx) => {
          let imgs: ApiFile[] = []
          try {
            const filesRes = await evaluadorApi.imagenesPregunta(q.id)
            imgs = (filesRes?.data?.data ?? []) as ApiFile[]
          } catch {
            imgs = []
          }
          return {
            ordenPregunta: q.orden_relativo ?? idx + 1,
            descripcion: q.descripcion || '',
            imagenes: imgs,
            isActual: q.id === pregunta.id,
          } as BloqueCaso
        }),
      )
      casoModalCacheRef.current.set(casoKey, bloques)
      setBloquesCaso(bloques)
      setShowCasoModal(true)
    } finally {
      stopLoading(lid)
    }
  }

  const guardar = async () => {
    if (!canSave) return
    const itemsPayload = allItemsIds.map((id) => ({
      item_id: id,
      aprobado: Boolean(values[id]),
      comentario: null as string | null,
    }))
    const lid = startLoading('Guardando corrección')
    evaluadorApi
      .cargarNotaPregunta(pregunta.id, estudiante.pseudonimo, itemsPayload)
      .then((res) => {
        setCorreccionesAlumno(pregunta.id, estudiante.pseudonimo, values)
        openToast({ severity: 'success', message: res.data.message })
        setInitialValues(values)
        onSaved?.()
        if (advanceOnSave && onNextEstudiante) onNextEstudiante()
      })
      .finally(() => stopLoading(lid))
  }

  return (
    <div className="space-y-4">
      <UnsavedChangesGuard
        enabled={isDirty}
        confirm={confirmLeave}
        message="¿Querés salir sin guardar tu corrección?"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="alternative"
          icon={faArrowLeft}
          onClick={backToEstudiantes}
        >
          Volver a estudiantes
        </Button>

        {showPrevNextButtons && (
          <div className="ml-auto flex items-center gap-2">
            <Tooltip variant="info" content="Ir al estudiante anterior">
              <span>
                <Button
                  variant="default"
                  onClick={() => onPrevEstudiante?.()}
                  disabled={!hasPrev}
                  className={!hasPrev ? 'pointer-events-none opacity-50' : ''}
                >
                  <span className="inline-flex items-center gap-1">
                    <HiChevronLeft /> Anterior
                  </span>
                </Button>
              </span>
            </Tooltip>

            <Tooltip variant="info" content="Ir al siguiente estudiante">
              <span>
                <Button
                  variant="default"
                  onClick={() => onNextEstudiante?.()}
                  disabled={!hasNext}
                  className={!hasNext ? 'pointer-events-none opacity-50' : ''}
                >
                  <span className="inline-flex items-center gap-1">
                    Siguiente <HiChevronRight />
                  </span>
                </Button>
              </span>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Cards de Pregunta + Caso acumulado */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PreguntaAccesoCard
          ordenPregunta={pregunta.orden_relativo ?? 0}
          descripcion={pregunta.descripcion ?? ''}
          onOpen={() => setShowPreguntaModal(true)}
        />
        <CasoAccesoCard
          ordenCaso={caso.orden_relativo ?? 0}
          tituloCaso={caso.titulo}
          ordenPreguntaActual={pregunta.orden_relativo ?? 0}
          onOpen={openCasoAcumulado}
        />
      </section>

      {/* Grid de Respuesta + Tabla de cotejo */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Respuesta del alumno */}
        <div className={`${panel} min-h-[320px]`}>
          <h2 className="mb-2 text-sm font-semibold text-gray-700">
            Respuesta del estudiante | Pseudónimo: {estudiante.pseudonimo}
          </h2>
          <div className="rounded-lg border bg-gray-50 p-3 text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
            {respuesta}
          </div>
        </div>

        {/* Tabla de cotejo */}
        <div className={panel}>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              Tabla de cotejo
            </h2>

            {/* Ocultar acciones masivas en preguntas informativas */}
            {!isInformativa && (
              <div className="flex items-center gap-2">
                <Tooltip
                  variant="success"
                  content="Marca todos los ítems como aprobados (Sí)."
                >
                  <span>
                    <button
                      type="button"
                      onClick={() => setAll(true)}
                      className={`${smallBtn} text-green-700 ${locked ? 'pointer-events-none opacity-50' : ''}`}
                      aria-label="Marcar Sí a todo"
                      title="Marcar Sí a todo"
                      disabled={locked}
                    >
                      <HiCheck size={14} /> Sí a todo
                    </button>
                  </span>
                </Tooltip>
                <Tooltip
                  variant="danger"
                  content="Marca todos los ítems como no aprobados (No)."
                >
                  <span>
                    <button
                      type="button"
                      onClick={() => setAll(false)}
                      className={`${smallBtn} text-red-700 ${locked ? 'pointer-events-none opacity-50' : ''}`}
                      aria-label="Marcar No a todo"
                      title="Marcar No a todo"
                      disabled={locked}
                    >
                      <HiX size={14} /> No a todo
                    </button>
                  </span>
                </Tooltip>
              </div>
            )}
          </div>

          {isInformativa ? (
            <p className="text-sm text-gray-500">
              Pregunta informativa: no hay ítems para corregir.
            </p>
          ) : grupos.length === 0 ? (
            <p className="text-sm text-gray-500">
              No hay ítems para esta pregunta.
            </p>
          ) : (
            <ul className="space-y-3">
              {grupos.map((g) => (
                <li key={g.seccion.id}>
                  <p className="mb-1 text-sm font-medium text-gray-900">
                    {g.seccion.nombre}
                  </p>
                  <ul className="space-y-1.5">
                    {g.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-center gap-2 rounded-xl border bg-white p-2 shadow-sm"
                      >
                        <div className="min-w-0 flex-1 text-[13px] leading-snug break-words text-gray-800">
                          {item.descripcion}
                        </div>

                        <div className="ml-auto shrink-0">
                          <YesNoCheck
                            value={(values[item.id] ?? null) as boolean | null}
                            onChange={(v) => setItemValue(item.id, v)}
                            disabled={locked}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}

          {isInformativa && (
            <div className="mt-3 rounded-xl border border-sky-300 bg-sky-50 px-3 py-2 text-sm text-sky-900">
              <span className="inline-flex items-center gap-2 font-medium">
                <HiInformationCircle size={18} />
                Esta es una <b>pregunta informativa</b>: no requiere respuesta
                ni corrección.
              </span>
            </div>
          )}
          {!isInformativa && readOnly && (
            <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <span className="inline-flex items-center gap-2 font-medium">
                <i className="fa fa-lock" aria-hidden />
                Este examen fue finalizado por el evaluador. Las correcciones
                son de solo lectura.
              </span>
            </div>
          )}

          <div className="mt-4 flex items-center justify-end">
            <Button
              variant={locked ? 'alternative' : 'default'}
              icon={locked ? faLock : faSave}
              onClick={guardar}
              disabled={!canSave}
              className={!canSave ? 'pointer-events-none opacity-60' : ''}
            >
              {locked
                ? 'Corrección bloqueada'
                : hasNext && advanceOnSave
                  ? 'Guardar corrección y avanzar'
                  : 'Guardar corrección'}
            </Button>
          </div>
        </div>
      </div>

      {/* Modales */}
      <PreguntaInfoModal
        open={showPreguntaModal}
        onClose={() => setShowPreguntaModal(false)}
        ordenPregunta={pregunta.orden_relativo ?? 0}
        descripcion={pregunta.descripcion ?? ''}
        consigna={pregunta.consigna ?? ''}
        imagenes={imagenesActuales}
      />

      <CasoAcumuladoModal
        open={showCasoModal}
        onClose={() => setShowCasoModal(false)}
        ordenCaso={caso.orden_relativo ?? 0}
        tituloCaso={caso.titulo}
        ordenHasta={pregunta.orden_relativo ?? 0}
        bloques={bloquesCaso}
      />
    </div>
  )
}
