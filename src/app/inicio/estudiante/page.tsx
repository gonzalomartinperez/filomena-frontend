/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryState, parseAsInteger } from 'nuqs'
import useModal from 'app/hooks/useModal'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import ExamStatusGate, {
  STATUS,
  type Status,
} from 'app/components/gates/ExamenStatusGate'
import { estudianteApi } from './services/estudianteServices'
import { Examen } from 'app/inicio/administrador/examenes/types/Examen'
import { Pregunta } from 'app/inicio/administrador/preguntas/types/Pregunta'
import { EstadoExamenEstudiante } from './types/modelos'
import ExamenStepNavigator, {
  type Bloque,
} from './components/ExamenStepNavigator'
import StartExamCard from './components/StartExamCard'
import UnsavedChangesGuard from 'app/components/navigation/UnsavedChangesGuard'
import { Caso } from '../administrador/casos/types/Caso'
import ReporteRespuestasButton from './components/ReporteRespuestasButton'
import { ESTUDIANTE } from '../administrador/usuarios/constants/roles'
import type { ApiFile } from 'app/inicio/administrador/mochila-carga/types/ApiFile'
import {
  sortCases,
  sortExamQuestions,
  buildDescripcionAcumulada,
} from './utils/descripcion'
import { cargarImagenesPorPregunta } from './utils/mediaLoaders'
import EstudianteHeader from './components/EstudianteHeader'
import { buildCaseOrderMap } from './utils/casos'
import { dayjs } from 'app/utils/date'
import useAuth from 'app/hooks/useAuth'
import { Button } from 'app/components/buttons/GeneralButton'
import { faLock } from '@fortawesome/free-solid-svg-icons'
import { hasRoleInExam } from 'app/utils/roles'
import { storage, STORAGE_KEYS, buildConfirmOnceKey } from 'app/utils/storage'
import { useWithLoader } from 'app/utils/loader'
import { useRouter, usePathname } from 'next/navigation'

type ExamenExtendido = Examen & { publicado?: boolean; retrocedible?: boolean }

export default function EstudiantePage() {
  const router = useRouter()
  const pathname = usePathname()

  const {
    state: { usuario },
  } = useAuth()

  const authReady = Boolean(usuario?.id)

  const {
    actions: { openModal },
  } = useModal()

  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()

  const withLoader = useWithLoader()

  // Query param (solo setter)
  const [, setPreguntaParam] = useQueryState('pregunta', parseAsInteger)

  // Gate
  const [showGate, setShowGate] = useState<boolean>(false)
  const [gateStatus, setGateStatus] = useState<Status>(STATUS.FORBIDDEN)
  const [gateDescription, setGateDescription] = useState<string | undefined>()

  // Estado principal
  const [examen, setExamen] = useState<ExamenExtendido | null>(null)
  const [estado, setEstado] = useState<EstadoExamenEstudiante | null>(null)
  const [pseudonimo, setPseudonimo] = useState<string | undefined>(undefined)

  const [pregunta, setPregunta] = useState<Pregunta | null>(null)
  const [respuesta, setRespuesta] = useState<string>('')
  const [dirty, setDirty] = useState<boolean>(false)

  const alertaMostradaRef = useRef(false)

  // Estructura global (evita navegar por backend y requests redundantes)
  const [casosExamen, setCasosExamen] = useState<Caso[] | null>(null)
  const [preguntasExamen, setPreguntasExamen] = useState<Pregunta[] | null>(
    null,
  )

  // Datos auxiliares para encabezados
  const [casoOrden, setCasoOrden] = useState<number | null>(null)
  const [preguntasEnCaso, setPreguntasEnCaso] = useState<number>(0)
  const [bloquesStack, setBloquesStack] = useState<Bloque[]>([])

  // Cache por caso / preguntas / imágenes
  const preguntasCasoCache = useRef<Map<number, Pregunta[]>>(new Map())
  const imagenesPreguntaCache = useRef<Map<number, ApiFile[]>>(new Map())

  const puedeFinalizar = useMemo(
    () => Boolean(examen) && Boolean(estado?.inicio) && !estado?.finalizado,
    [examen, estado],
  )

  const navPos = useMemo(() => {
    if (
      !pregunta ||
      !Array.isArray(preguntasExamen) ||
      preguntasExamen.length === 0
    ) {
      return { ready: false, isFirst: false, isLast: false }
    }
    const idx = preguntasExamen.findIndex((q) => q.id === pregunta.id)
    if (idx < 0) return { ready: false, isFirst: false, isLast: false }
    return {
      ready: true,
      isFirst: idx === 0,
      isLast: idx === preguntasExamen.length - 1,
    }
  }, [pregunta, preguntasExamen])

  // Siguiente: solo si base ok y sabemos que NO es la última
  const puedeSiguiente = useMemo(() => {
    const base =
      Boolean(examen) && Boolean(estado?.inicio) && !estado?.finalizado
    if (!base) return false
    if (!navPos.ready) return false
    return !navPos.isLast
  }, [examen, estado, navPos.ready, navPos.isLast])

  // Anterior: solo si examen retrocedible, base ok y sabemos que NO es la primera
  const puedeAnterior = useMemo(() => {
    const retro = Boolean(examen?.retrocedible)
    const base =
      retro && Boolean(examen) && Boolean(estado?.inicio) && !estado?.finalizado
    if (!base) return false
    if (!navPos.ready) return false
    return !navPos.isFirst
  }, [examen?.retrocedible, examen, estado, navPos.ready, navPos.isFirst])

  // ¿Mostrar StartExamCard?
  const showStartCard = useMemo(
    () => Boolean(examen) && Boolean(estado) && !estado?.inicio,
    [examen, estado],
  )

  // Mostrar el navegador SOLO cuando todo está listo
  const isNavigatorReady = useMemo(() => {
    const hasExamen = Boolean(examen)
    const started = Boolean(estado?.inicio)
    const hasPregunta = Boolean(pregunta)
    const hasCaseOrder = typeof casoOrden === 'number'
    const hasTotal = preguntasEnCaso > 0
    const hasBlocks = bloquesStack.length > 0

    return (
      hasExamen &&
      started &&
      hasPregunta &&
      hasCaseOrder &&
      hasTotal &&
      hasBlocks
    )
  }, [
    examen,
    estado?.inicio,
    pregunta,
    casoOrden,
    preguntasEnCaso,
    bloquesStack.length,
  ])

  const preguntasOrdenadasDeCaso = useCallback(
    (casoId: number): Pregunta[] => {
      const list = (preguntasExamen ?? []).filter((q) => q.caso_id === casoId)
      return list.sort(
        (a, b) => (a.orden_relativo ?? 0) - (b.orden_relativo ?? 0),
      )
    },
    [preguntasExamen],
  )

  const ensurePreguntasCaso = useCallback(
    async (casoId: number): Promise<Pregunta[]> => {
      const cached = preguntasCasoCache.current.get(casoId)
      if (cached && cached.length) return cached
      const res = await estudianteApi.preguntasCaso(casoId)
      const list = (res.data.data ?? []).slice().sort((a, b) => {
        const ao = a.orden_relativo ?? 0
        const bo = b.orden_relativo ?? 0
        return ao - bo
      })
      preguntasCasoCache.current.set(casoId, list)
      return list
    },
    [],
  )

  const cargarPseudonimo = useCallback(
    async (examenId: number): Promise<void> => {
      await withLoader('Cargando pseudónimo', () =>
        estudianteApi.pseudonimo(examenId),
      ).then((res) => {
        setPseudonimo(res?.data?.data?.nombre)
      })
    },
    [withLoader],
  )

  const cargarPreguntaYRespuesta = useCallback(
    async (preguntaId: number): Promise<void> => {
      const [pRes, rRes] = await Promise.all([
        estudianteApi.pregunta(preguntaId),
        estudianteApi.miRespuesta(preguntaId),
      ])

      const p = pRes.data.data ?? null
      setPregunta(p)
      setRespuesta(rRes.data.data?.respuesta ?? '')
      setDirty(false)
      setPreguntaParam(preguntaId)

      if (p) {
        if (examen && (!preguntasExamen || !casosExamen)) {
          const [resPreg, resCasos] = await Promise.all([
            estudianteApi.preguntasExamen(examen.id),
            estudianteApi.casosExamen(examen.id),
          ])
          setPreguntasExamen(sortExamQuestions(resPreg.data.data ?? []))
          setCasosExamen(sortCases(resCasos.data.data ?? []))
        }

        const buildBloques = async (listaCaso: Pregunta[]) => {
          const caseOrder = casosExamen ? buildCaseOrderMap(casosExamen) : null
          if (caseOrder) setCasoOrden(caseOrder.get(p.caso_id) ?? null)

          const hasta = p.orden_relativo ?? 0
          setPreguntasEnCaso(listaCaso.length)

          const descripciones = buildDescripcionAcumulada(listaCaso, p)

          const imgsPorPregunta = await cargarImagenesPorPregunta(
            listaCaso,
            hasta,
            imagenesPreguntaCache.current,
          )

          const bloques: Bloque[] = descripciones.map((d, i) => ({
            descripcion: d,
            imagenes: imgsPorPregunta[i] ?? [],
            isActual: listaCaso[i]?.id === p.id,
          }))
          setBloquesStack(bloques)
        }

        if (preguntasExamen && casosExamen) {
          const listaCaso = preguntasOrdenadasDeCaso(p.caso_id)
          await buildBloques(listaCaso)
        } else {
          const [cRes, listaCaso] = await Promise.all([
            estudianteApi.caso(p.caso_id),
            ensurePreguntasCaso(p.caso_id),
          ])
          const caso: Caso = cRes.data.data
          setCasoOrden(
            typeof caso.orden_relativo === 'number'
              ? caso.orden_relativo
              : null,
          )
          await buildBloques(listaCaso)
        }
      } else {
        setCasoOrden(null)
        setPreguntasEnCaso(0)
        setBloquesStack([])
      }
    },
    [
      examen,
      preguntasExamen,
      casosExamen,
      preguntasOrdenadasDeCaso,
      ensurePreguntasCaso,
      setPreguntaParam,
    ],
  )

  /**
   * Rehidrata SIEMPRE examen + estado en paralelo.
   */
  const rehydrate = useCallback(
    async (opts?: {
      examenId?: number
      codigo?: string
    }): Promise<{
      ex?: ExamenExtendido | null
      es?: EstadoExamenEstudiante | null
    }> => {
      const examenId =
        opts?.examenId ??
        examen?.id ??
        Number(storage.session.get(STORAGE_KEYS.estudiante.examenId) || '')
      const codigo =
        opts?.codigo ??
        storage.session.get(STORAGE_KEYS.estudiante.codigo) ??
        undefined

      const [exRes, esRes] = await Promise.all([
        codigo ? estudianteApi.examenByCodigo(codigo).catch(() => null) : null,
        examenId ? estudianteApi.estado(examenId).catch(() => null) : null,
      ])

      const exData = exRes?.data?.data ?? (codigo ? null : examen)
      const esData = esRes?.data?.data ?? estado

      if (exData) setExamen(exData)
      if (esData !== undefined) setEstado(esData ?? null)

      return { ex: exData ?? null, es: esData ?? null }
    },
    [examen, estado],
  )

  const finalizeAndShowGate = useCallback(
    (msg?: string): void => {
      // limpiar claves de sesión
      storage.session.remove(STORAGE_KEYS.estudiante.codigo)
      storage.session.remove(STORAGE_KEYS.estudiante.examenId)
      if (examen) {
        storage.session.remove(buildConfirmOnceKey(examen.id))
      }

      // Reset de navegación/estructura, pero conservamos `examen` y `estado`
      setPreguntaParam(null)
      preguntasCasoCache.current.clear()
      imagenesPreguntaCache.current.clear()
      setPreguntasExamen(null)
      setCasosExamen(null)
      setPregunta(null)
      setRespuesta('')
      setDirty(false)
      setCasoOrden(null)
      setPreguntasEnCaso(0)
      setBloquesStack([])

      setGateStatus(STATUS.INFO)
      setGateDescription(
        msg ?? 'El examen ha finalizado. Tus respuestas fueron registradas.',
      )
      setShowGate(true)
    },
    [examen, setPreguntaParam],
  )

  const cargarEstado = useCallback(
    async (examenId: number): Promise<void> => {
      const res = await withLoader('Cargando estado', () =>
        estudianteApi.estado(examenId),
      )
      const est = res.data.data
      if (est?.finalizado) {
        // Rehidratar con datos frescos antes de mostrar el gate
        await rehydrate({ examenId })
        finalizeAndShowGate(
          'Este examen ya fue finalizado. Ingresá un nuevo código para rendir otro examen.',
        )
        return
      }

      setEstado(est)

      if (est?.inicio) {
        // Si falta estructura global, la cargamos ahora
        if (!preguntasExamen || !casosExamen) {
          const [resPreg, resCasos] = await Promise.all([
            estudianteApi.preguntasExamen(examenId),
            estudianteApi.casosExamen(examenId),
          ])
          setPreguntasExamen(sortExamQuestions(resPreg.data.data ?? []))
          setCasosExamen(sortCases(resCasos.data.data ?? []))
        }

        if (est?.pregunta_id) {
          await cargarPreguntaYRespuesta(est.pregunta_id)
        }
      } else {
        setPregunta(null)
        setRespuesta('')
        setDirty(false)
        setCasoOrden(null)
        setPreguntasEnCaso(0)
        setBloquesStack([])
      }
    },
    [
      withLoader,
      cargarPreguntaYRespuesta,
      rehydrate,
      finalizeAndShowGate,
      preguntasExamen,
      casosExamen,
    ],
  )

  const resetToLanding = useCallback((): void => {
    // limpiar navegación/caches/estado local
    setPreguntaParam(null)
    preguntasCasoCache.current.clear()
    imagenesPreguntaCache.current.clear()

    setPreguntasExamen(null)
    setCasosExamen(null)
    setPregunta(null)
    setRespuesta('')
    setDirty(false)
    setCasoOrden(null)
    setPreguntasEnCaso(0)
    setBloquesStack([])

    // limpiar entidades principales
    setExamen(null)
    setEstado(null)
    setPseudonimo(undefined)

    // quitar cualquier gate abierto
    setShowGate(false)
    setGateDescription(undefined)
  }, [setPreguntaParam])

  const validarExamen = useCallback(
    async (codigo: string): Promise<void> => {
      async function validate(currentCodigo: string): Promise<void> {
        await withLoader('Validando examen', async () => {
          const res = await estudianteApi.examenByCodigo(currentCodigo)
          const ex = (res?.data?.data ?? null) as ExamenExtendido | null

          if (!ex) throw new Error('Examen no encontrado')

          // Verificación de permiso por examen (rol estudiante)
          if (!hasRoleInExam(usuario, ESTUDIANTE, ex.id)) {
            setGateStatus(STATUS.FORBIDDEN)
            setGateDescription('No tenés permisos para rendir este examen.')
            setShowGate(true)
            return
          }

          if (ex?.finalizado) {
            // Rehidratar y mostrar gate
            setExamen(ex)
            await rehydrate({ examenId: ex.id, codigo: currentCodigo })
            finalizeAndShowGate(
              'Este examen ya fue finalizado. Ingresá un nuevo código para rendir otro examen.',
            )
            return
          }

          if (!ex?.publicado) {
            setGateStatus(STATUS.NOT_PUBLISHED)
            setGateDescription(
              'El examen todavía no está disponible para rendir.',
            )
            setShowGate(true)
            return
          }

          if (!dayjs(ex?.fecha ?? '').isToday()) {
            setGateStatus(STATUS.FORBIDDEN)
            setGateDescription(
              'El examen solo puede rendirse el día programado.',
            )
            setShowGate(true)
            return
          }

          // Guardamos en sesión para permitir rehidratación & polling
          storage.session.set(STORAGE_KEYS.estudiante.codigo, currentCodigo)
          storage.session.set(STORAGE_KEYS.estudiante.examenId, String(ex.id))
          // limpiar confirmOnce (prefijo)
          storage.session.remove(STORAGE_KEYS.estudiante.confirmOnce)

          // Examen válido para rendir
          setPregunta(null)
          setRespuesta('')
          setDirty(false)
          setExamen(ex)

          return Promise.all([
            cargarEstado(ex.id),
            cargarPseudonimo(ex.id),
          ]).then(() => {
            setExamen(ex)
            openToast({
              severity: 'success',
              message: res?.data?.message ?? 'Examen recuperado exitosamente',
            })
          })
        }).catch(() => {
          setGateStatus(STATUS.FORBIDDEN)
          setGateDescription('Código de examen inválido')
          setShowGate(true)
          openToast({ severity: 'error', message: 'Código de examen inválido' })
          openModal({
            type: 'filtrado-examen',
            message: 'Ingrese el código de examen:',
            button: {
              onClick: (payload?: unknown) => {
                if (typeof payload === 'string') void validate(payload.trim())
              },
            },
          })
        })
      }

      await validate(codigo)
    },
    [
      withLoader,
      cargarEstado,
      cargarPseudonimo,
      openToast,
      openModal,
      rehydrate,
      finalizeAndShowGate,
      usuario,
    ],
  )

  const openCodeModal = useCallback((): void => {
    openModal({
      type: 'filtrado-examen',
      message: 'Ingrese el código de examen:',
      button: {
        onClick: (payload?: unknown) => {
          if (typeof payload === 'string') void validarExamen(payload.trim())
          setShowGate(false)
        },
      },
    })
  }, [openModal, validarExamen])

  const iniciarExamen = useCallback(async (): Promise<void> => {
    if (!examen) return
    const res = await withLoader('Iniciando examen', () =>
      estudianteApi.iniciar(examen.id),
    )
    const est = res.data.data
    setEstado(est)
    if (est?.pregunta_id) await cargarPreguntaYRespuesta(est.pregunta_id)
  }, [examen, withLoader, cargarPreguntaYRespuesta])

  const confirmarInicio = useCallback((): void => {
    const retro = Boolean(examen?.retrocedible)
    const msg = retro
      ? '¿Querés comenzar el examen ahora? \nEl recorrido será secuencial y podrás retroceder entre preguntas y casos cuando lo necesites.'
      : '¿Querés comenzar el examen ahora? \nEl recorrido será secuencial y no podrás retroceder entre preguntas ni casos.'
    openModal({
      type: 'confirmacion',
      message: msg,
      button: {
        onClick: () => {
          void iniciarExamen()
        },
      },
    })
  }, [openModal, iniciarExamen, examen?.retrocedible])

  const finalizarExamen = useCallback((): void => {
    if (!examen) return
    openModal({
      type: 'confirmacion',
      message: '¿Deseás finalizar el examen? \nNo podrás editar luego.',
      button: {
        onClick: () => {
          void (async () => {
            await withLoader('Finalizando examen', () =>
              estudianteApi.finalizar(examen.id),
            )
            // Rehidratar antes del gate (estado+examen frescos)
            await rehydrate({ examenId: examen.id })
            openToast({
              severity: 'success',
              message: 'Examen finalizado',
            })
            finalizeAndShowGate(
              'Este examen ya fue finalizado. Ingresá un nuevo código para rendir otro examen.',
            )
          })()
        },
      },
    })
  }, [examen, withLoader, openModal, openToast, rehydrate, finalizeAndShowGate])

  const guardarRespuesta = useCallback(
    async (opts?: { silent?: boolean }): Promise<void> => {
      if (!pregunta) return

      const doSave = () => estudianteApi.responder(pregunta.id, respuesta)
      const res = opts?.silent
        ? await doSave()
        : await withLoader('Guardando respuesta', doSave)

      setEstado(res.data.data)
      setDirty(false)

      if (!opts?.silent) {
        openToast({
          severity: 'success',
          message: res.data.message ?? 'Respuesta guardada',
        })
      }
    },
    [pregunta, respuesta, withLoader, openToast],
  )

  const mover = useCallback(
    async (direccion: 'siguiente' | 'anterior'): Promise<void> => {
      if (!examen || !pregunta) return
      if (direccion === 'anterior' && !examen.retrocedible) return

      if (!preguntasExamen || preguntasExamen.length === 0) {
        const res = await withLoader('Navegando', () =>
          estudianteApi.navegar(examen.id, direccion),
        )
        const next = res.data.data
        if (!next) {
          openToast({
            severity: 'success',
            message: res.data.message ?? 'Fin del recorrido',
          })
          return
        }
        await estudianteApi.actualizarPuntero(examen.id, {
          caso_id: next.caso_id,
          pregunta_id: next.id,
        })
        await cargarPreguntaYRespuesta(next.id)
        return
      }

      const idx = preguntasExamen.findIndex((q) => q.id === pregunta.id)
      if (idx < 0) return

      const delta = direccion === 'siguiente' ? 1 : -1
      const nextIdx = idx + delta
      if (nextIdx < 0 || nextIdx >= preguntasExamen.length) {
        openToast({ severity: 'success', message: 'Fin del recorrido' })
        return
      }

      const avanzar = async () => {
        const next = preguntasExamen[nextIdx]
        await estudianteApi.actualizarPuntero(examen.id, {
          caso_id: next.caso_id,
          pregunta_id: next.id,
        })
        await cargarPreguntaYRespuesta(next.id)
      }

      if (direccion === 'siguiente') {
        const key = buildConfirmOnceKey(examen.id)
        const visto = storage.session.get(key)
        if (!visto) {
          openModal({
            type: 'confirmacion',
            message:
              'Se guardará tu respuesta y pasarás a la siguiente pregunta/caso. \nEste mensaje no volverá a mostrarse.',
            button: {
              onClick: () => {
                storage.session.set(key, '1')
                void (async () => {
                  if ((pregunta?.consigna ?? '').trim().length) {
                    await guardarRespuesta({ silent: true })
                  }
                  await avanzar()
                })()
              },
            },
          })
          return
        }
      }

      await avanzar()
    },
    [
      examen,
      pregunta,
      preguntasExamen,
      withLoader,
      openToast,
      cargarPreguntaYRespuesta,
      openModal,
      guardarRespuesta,
    ],
  )

  const UNSAVED_MESSAGE =
    'Tenés cambios sin guardar. Si salís, se van a perder. ¿Querés salir igualmente?'

  const confirmLeave = useCallback(
    (proceed: () => void): void => {
      openModal({
        type: 'confirmacion',
        message: UNSAVED_MESSAGE,
        button: { onClick: proceed },
      })
    },
    [openModal],
  )

  const triedRestore = useRef<boolean>(false)

  useEffect(() => {
    if (triedRestore.current || !authReady) return
    triedRestore.current = true

    const codigo = storage.session.get(STORAGE_KEYS.estudiante.codigo)
    const examenId = Number(
      storage.session.get(STORAGE_KEYS.estudiante.examenId) || '',
    )

    // Caso 1: tengo codigo + examenId en sesión → rehidrato todo y valido permisos
    if (codigo && examenId) {
      void (async () => {
        const { ex } = await rehydrate({ examenId, codigo }).catch(() => ({
          ex: null,
        }))
        if (!ex) {
          // Limpio y muestro landing (NO abrir modal automáticamente)
          storage.session.remove(STORAGE_KEYS.estudiante.codigo)
          storage.session.remove(STORAGE_KEYS.estudiante.examenId)
          resetToLanding()
          openToast({
            severity: 'info',
            message: 'Ingresá el código para comenzar.',
          })
          return
        }

        // Reglas de acceso (con usuario YA listo)
        if (!hasRoleInExam(usuario, ESTUDIANTE, ex.id)) {
          storage.session.remove(STORAGE_KEYS.estudiante.codigo)
          storage.session.remove(STORAGE_KEYS.estudiante.examenId)
          setGateStatus(STATUS.FORBIDDEN)
          setGateDescription('No tenés permisos para rendir este examen.')
          setShowGate(true)
          return
        }

        if (ex.finalizado) {
          finalizeAndShowGate(
            'Este examen ya fue finalizado. Ingresá un nuevo código para rendir otro examen.',
          )
          return
        }
        if (!ex.publicado) {
          setGateStatus(STATUS.NOT_PUBLISHED)
          setGateDescription(
            'El examen todavía no está disponible para rendir.',
          )
          setShowGate(true)
          return
        }
        if (!dayjs(ex?.fecha ?? '').isToday()) {
          setGateStatus(STATUS.FORBIDDEN)
          setGateDescription('El examen solo puede rendirse el día programado.')
          setShowGate(true)
          return
        }

        // Examen vigente: asegurar estado y pseudónimo
        await cargarEstado(ex.id)
        await cargarPseudonimo(ex.id)
      })()
      return
    }

    // Caso 2: sólo tengo código → uso el flujo existente de validarExamen
    if (codigo) {
      void validarExamen(codigo)
      return
    }

    // Caso 3: NO abrir modal; mostrar landing y esperar a que el usuario haga click
    // (no hacemos nada acá)
  }, [
    authReady,
    rehydrate,
    cargarEstado,
    cargarPseudonimo,
    validarExamen,
    usuario,
    openToast,
  ])

  useEffect(() => {
    if (storage.session.has(STORAGE_KEYS.estudiante.goHome)) {
      storage.session.remove(STORAGE_KEYS.estudiante.goHome)
      const resetId = window.setTimeout(() => {
        resetToLanding()
        router.replace(pathname)
      }, 0)
      return () => window.clearTimeout(resetId)
    }

    // Si estoy mostrando el Gate, NO vuelvo a la landing salvo override anterior
    if (showGate) return

    const hasSession =
      storage.session.has(STORAGE_KEYS.estudiante.codigo) ||
      storage.session.has(STORAGE_KEYS.estudiante.examenId)

    if (!hasSession && (examen || estado || preguntasExamen || casosExamen)) {
      const resetId = window.setTimeout(() => {
        resetToLanding()
        router.replace(pathname)
      }, 0)
      return () => window.clearTimeout(resetId)
    }
  }, [
    showGate,
    examen,
    estado,
    preguntasExamen,
    casosExamen,
    resetToLanding,
    router,
    pathname,
  ])

  // Polling de estado
  useEffect(() => {
    if (!examen) return
    const examenId: number = examen.id
    const TICK_MS = 5000
    let cancelled = false

    const timer = window.setInterval(async () => {
      if (cancelled) return
      const codigo = storage.session.get(STORAGE_KEYS.estudiante.codigo)
      if (!codigo) return

      try {
        const [exRes, estRes] = await Promise.all([
          estudianteApi.examenByCodigo(codigo),
          estudianteApi.estado(examenId),
        ])
        const exData: ExamenExtendido | undefined = exRes?.data?.data
        const est: EstadoExamenEstudiante | undefined = estRes?.data?.data

        if (exData?.finalizado || est?.finalizado) {
          // Rehidratar y gate
          await rehydrate({ examenId, codigo })
          finalizeAndShowGate(
            'El examen ha finalizado. Tus respuestas fueron registradas.',
          )
          window.clearInterval(timer)
          return
        }

        if (est?.alertado && !alertaMostradaRef.current) {
          alertaMostradaRef.current = true
          openModal({
            type: 'confirmacion-alerta',
            message:
              'Has sido alertado por el administrador del examen. \nTe sugerimos administrar mejor tu tiempo y avanzar.',
            button: {
              onClick: () => {
                void estudianteApi.desactivarAlerta(examenId).finally(() => {
                  alertaMostradaRef.current = false
                })
              },
            },
          })
        }
      } catch {
        // errores transitorios del polling: ignorar
      }
    }, TICK_MS)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [examen?.id, rehydrate, finalizeAndShowGate])

  // Loader global mientras preparamos el navegador (evita intersticial)
  const navLoaderIdRef = useRef<string | null>(null)

  useEffect(() => {
    const needsLoader =
      !showGate &&
      Boolean(examen) &&
      Boolean(estado?.inicio) &&
      !showStartCard &&
      !isNavigatorReady

    if (needsLoader && navLoaderIdRef.current == null) {
      navLoaderIdRef.current = startLoading('Cargando…')
    }

    if (!needsLoader && navLoaderIdRef.current != null) {
      stopLoading(navLoaderIdRef.current)
      navLoaderIdRef.current = null
    }

    return () => {
      if (navLoaderIdRef.current != null) {
        stopLoading(navLoaderIdRef.current)
        navLoaderIdRef.current = null
      }
    }
  }, [examen, estado?.inicio, showStartCard, isNavigatorReady])

  // Al cambiar de pregunta, ir al tope de la PAGE (sin contenedor fixed)
  useEffect(() => {
    if (!pregunta?.id) return
    const scroller =
      document.querySelector<HTMLElement>('[data-page-scroll-root]') ??
      (document.scrollingElement as HTMLElement) ??
      document.documentElement

    try {
      scroller.scrollTo({ top: 0, behavior: 'auto' })
    } catch {
      ;(scroller as any).scrollTop = 0
    }
  }, [pregunta?.id])

  const showDownload =
    Boolean(examen?.descargable) && dayjs(examen?.fecha ?? '').isToday()

  const enableDownload =
    Boolean(examen?.finalizado) && Boolean(estado?.finalizado)

  const hasExamSession = storage.session.has(STORAGE_KEYS.estudiante.examenId)

  const goHomeRequested = storage.session.has(STORAGE_KEYS.estudiante.goHome)

  const shouldShowStart =
    !goHomeRequested && Boolean(examen && showStartCard && hasExamSession)
  const shouldShowNavigator =
    !goHomeRequested && Boolean(examen && isNavigatorReady && hasExamSession)

  if (showGate && !goHomeRequested) {
    return (
      <div className="p-6">
        <ExamStatusGate
          context={ESTUDIANTE}
          status={gateStatus}
          description={gateDescription}
          primary={{
            label: 'Ingresar un código de examen',
            onClick: () => {
              setPregunta(null)
              setPreguntasExamen(null)
              setCasosExamen(null)
              setEstado(null)
              setExamen(null)
              setPseudonimo(undefined)
              openCodeModal()
            },
          }}
        />
        {showDownload && examen?.id && (
          <div className="flex justify-center">
            <ReporteRespuestasButton
              examenId={examen.id}
              enabled={enableDownload}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      data-page-scroll-root
      className="font-geist-sans fixed inset-x-0 top-16 bottom-0 overflow-y-auto p-4"
    >
      <UnsavedChangesGuard
        enabled={dirty}
        confirm={confirmLeave}
        message={UNSAVED_MESSAGE}
      />

      {shouldShowStart ? (
        // 1) Start card (examen validado pero aún no iniciado)
        <div className="grid min-h-[60vh] place-items-center">
          <StartExamCard
            examen={examen!}
            pseudonimo={pseudonimo}
            onStart={confirmarInicio}
          />
        </div>
      ) : shouldShowNavigator ? (
        // 2) Navegador (examen iniciado y estructura lista)
        <div className="space-y-6 md:space-y-8">
          <EstudianteHeader examen={examen!} pseudonimo={pseudonimo} />
          <ExamenStepNavigator
            casoOrdenRelativo={casoOrden}
            casoPreguntasTotal={preguntasEnCaso}
            bloquesEnunciado={bloquesStack}
            pregunta={pregunta}
            respuesta={respuesta}
            onChangeRespuesta={(v) => {
              setRespuesta(v)
              setDirty(true)
            }}
            onGuardar={(opts) => guardarRespuesta(opts)}
            onAnterior={() => void mover('anterior')}
            onSiguiente={() => void mover('siguiente')}
            onIniciar={() => {
              confirmarInicio()
            }}
            onFinalizar={() => void finalizarExamen()}
            puedeAnterior={puedeAnterior}
            puedeSiguiente={puedeSiguiente}
            puedeIniciar={false}
            puedeFinalizar={puedeFinalizar}
          />
        </div>
      ) : (
        // 3) Landing (sin sesión → no hay examen guardado en storage)
        <div className="grid min-h-[calc(100vh-4rem)] place-items-center">
          <div className="text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-800">
              ¡Hola {usuario.nombre}!
            </h1>
            <p className="mb-3 text-lg text-gray-600">
              Ingresá un código para rendir un examen
            </p>
            <Button type="button" icon={faLock} onClick={openCodeModal}>
              Ingresar código
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
