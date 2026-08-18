/* eslint-disable react-hooks/immutability */
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useModal from 'app/hooks/useModal'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import useAuth from 'app/hooks/useAuth'

import ExamStatusGate, {
  STATUS,
  type Status,
} from 'app/components/gates/ExamenStatusGate'

import { evaluadorApi } from './services/evaluadorServices'
import CasosList from './components/CasosList'
import PreguntasList from './components/PreguntasList'
import PseudonimosList from './components/PseudonimosList'
import CorreccionPregunta from './components/CorreccionPregunta'
import ReporteCorreccionesButton from './components/ReporteCorreccionesButton'

import { Examen } from 'app/inicio/administrador/examenes/types/Examen'
import { Caso } from 'app/inicio/administrador/casos/types/Caso'
import { Pregunta } from 'app/inicio/administrador/preguntas/types/Pregunta'
import { Usuario } from 'app/inicio/administrador/usuarios/types/Usuario'
import {
  EstadoExamenEvaluador,
  Estudiante,
  toPseudonimo,
} from './types/modelos'
import { preloadGrupos } from './services/evaluadorCache'
import FinalizarCorreccionesButton from './components/FinalizarCorreccionesButton'
import { EVALUADOR } from '../administrador/usuarios/constants/roles'
import { useQueryState, parseAsInteger, parseAsString } from 'nuqs'
import { Button } from 'app/components/buttons/GeneralButton'
import { faLock } from '@fortawesome/free-solid-svg-icons'
import { hasRoleInExam } from 'app/utils/roles'

import { storage, STORAGE_KEYS } from 'app/utils/storage'
import { useWithLoader } from 'app/utils/loader'
import { usePathname, useRouter } from 'next/navigation'

enum Step {
  Casos = 'CASOS',
  Preguntas = 'PREGUNTAS',
  Usuarios = 'USUARIOS',
  Correccion = 'CORRECCION',
}

type Flow = 'continue' | 'stop'

const setIfChanged = <T,>(
  current: T,
  next: T,
  setter: (v: T) => void,
  equals: (a: T, b: T) => boolean = Object.is,
) => {
  if (!equals(current, next)) setter(next)
}

const areSamePreguntas = (a: Pregunta[], b: Pregunta[]) =>
  a.length === b.length && a.every((p, i) => p.id === b[i]?.id)

export default function EvaluadorPage() {
  const router = useRouter()
  const pathname = usePathname()

  const {
    state: { usuario },
  } = useAuth()

  const authReady = Boolean(usuario?.id)

  const evaluatorId = usuario?.id ?? null
  const seenLoggedInRef = useRef(false)

  const [casoParam, setCasoParam] = useQueryState('caso', parseAsInteger)
  const [preguntaParam, setPreguntaParam] = useQueryState(
    'pregunta',
    parseAsInteger,
  )
  const [pseudoParam, setPseudoParam] = useQueryState(
    'pseudonimo',
    parseAsString,
  )

  const [examen, setExamen] = useState<Examen | null>(null)
  const [estado, setEstado] = useState<EstadoExamenEvaluador | null>(null)
  const [casos, setCasos] = useState<Caso[]>([])
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])

  const [selectedCaso, setSelectedCaso] = useState<Caso | null>(null)
  const [preguntasCaso, setPreguntasCaso] = useState<Pregunta[]>([])
  const [selectedPregunta, setSelectedPregunta] = useState<Pregunta | null>(
    null,
  )
  const [selectedEstudiante, setSelectedEstudiante] =
    useState<Estudiante | null>(null)

  const [showGate, setShowGate] = useState(false)
  const [gateStatus, setGateStatus] = useState<Status>(STATUS.NOT_FINALIZED)
  const [gateDescription, setGateDescription] = useState<string | undefined>()

  const {
    actions: { openModal },
  } = useModal()

  const withLoader = useWithLoader()

  const {
    actions: { openToast },
  } = useVisualNotifications()

  const preguntasByCasoCache = useRef<Map<number, Pregunta[]>>(new Map())
  const syncSeq = useRef(0)
  const guardStale = (mySeq: number) => () => mySeq !== syncSeq.current

  const clearExamSession = useCallback(
    async (options?: { clearQs?: boolean }) => {
      storage.session.remove(STORAGE_KEYS.evaluador.codigo)
      storage.session.remove(STORAGE_KEYS.evaluador.examenId)
      preguntasByCasoCache.current.clear()

      setExamen(null)
      setEstado(null)
      setCasos([])
      setEstudiantes([])
      setSelectedCaso(null)
      setPreguntasCaso([])
      setSelectedPregunta(null)
      setSelectedEstudiante(null)

      if (options?.clearQs !== false) {
        await Promise.all([
          setCasoParam(null),
          setPreguntaParam(null),
          setPseudoParam(null),
        ])
      }
    },
    [setCasoParam, setPreguntaParam, setPseudoParam],
  )

  useEffect(() => {
    // Volver desde "Inicio" de HeadBar (no navega, solo limpia gate local)
    if (storage.session.has(STORAGE_KEYS.evaluador.goHome)) {
      storage.session.remove(STORAGE_KEYS.evaluador.goHome)
      setShowGate(false)
      setGateDescription(undefined)
    }

    if (showGate) return

    const hasSession =
      storage.session.has(STORAGE_KEYS.evaluador.codigo) ||
      storage.session.has(STORAGE_KEYS.evaluador.examenId)

    const isLoggingOut = !usuario?.id

    if (
      !hasSession &&
      (examen || estado || casos.length || estudiantes.length)
    ) {
      void (async () => {
        await clearExamSession({ clearQs: !isLoggingOut })
      })()
    }
  }, [
    showGate,
    examen,
    estado,
    casos.length,
    estudiantes.length,
    clearExamSession,
    setCasoParam,
    setPreguntaParam,
    setPseudoParam,
    router,
    pathname,
    usuario?.id,
  ])

  const validarExamen = useCallback(
    (codigo: string) =>
      withLoader('Validando examen', async () => {
        const code = (codigo ?? '').trim()
        if (!code) {
          openToast({ severity: 'warning', message: 'Código vacío' })
          return
        }

        storage.session.set(STORAGE_KEYS.evaluador.codigo, code)

        if (!evaluatorId) {
          openToast({
            severity: 'info',
            message:
              'Esperando autenticación del evaluador para validar el examen…',
          })
          return
        }

        const res = await evaluadorApi.examenByCodigo(code)
        const ex = (res?.data?.data ?? null) as Examen | null
        if (!ex) throw new Error('Examen no encontrado')

        // Permisos por examen (rol evaluador)
        if (!hasRoleInExam(usuario, EVALUADOR, ex.id)) {
          setGateStatus(STATUS.FORBIDDEN)
          setGateDescription('No tenés permisos para corregir este examen.')
          setShowGate(true)
          return
        }

        if (!ex.publicado) {
          setGateStatus(STATUS.NOT_PUBLISHED)
          setGateDescription('El examen aún no está publicado')
          setShowGate(true)
          return
        }

        // Gate si el examen aún no finalizó (no hay corrección en vivo)
        if (!ex.finalizado) {
          setGateStatus(STATUS.NOT_FINALIZED)
          setGateDescription(
            'Las correcciones se habilitan cuando el examen haya finalizado para todos los estudiantes.',
          )
          setShowGate(true)
          return
        }

        storage.session.set(STORAGE_KEYS.evaluador.codigo, code)
        storage.session.set(STORAGE_KEYS.evaluador.examenId, String(ex.id))
        storage.session.set(
          STORAGE_KEYS.evaluador.evaluadorId,
          String(evaluatorId),
        )

        const [estadoRes, casosRes, estsRes] = await Promise.all([
          evaluadorApi.estadoCorreccionEvaluador(ex.id),
          evaluadorApi.casos(ex.id, evaluatorId),
          evaluadorApi.estudiantesPorExamen(ex.id),
        ])

        setExamen(ex)
        setEstado((estadoRes?.data?.data ?? null) as EstadoExamenEvaluador)
        setCasos((casosRes?.data?.data ?? []) as Caso[])
        const rawUsers = (estsRes?.data?.data ?? []) as Usuario[]
        setEstudiantes(rawUsers.map(toPseudonimo))

        openToast({
          severity: 'success',
          message: res?.data?.message ?? 'Examen recuperado exitosamente',
        })
      }).catch(() => {
        setGateStatus(STATUS.FORBIDDEN)
        setGateDescription('Código de examen inválido')
        setShowGate(true)
        openToast({ severity: 'error', message: 'Código de examen inválido' })
        void clearExamSession()
        openCodeModal()
      }),
    [withLoader, evaluatorId, openToast, clearExamSession, usuario],
  )

  const openCodeModal = useCallback(() => {
    openModal({
      type: 'filtrado-examen',
      message: 'Ingrese el código de examen:',
      button: {
        onClick: (payload?: unknown) => {
          if (typeof payload === 'string') {
            const code = payload.trim()
            if (code) {
              setShowGate(false)
              setGateDescription(undefined)
              void validarExamen(code)
            }
          }
        },
      },
    })
  }, [openModal, validarExamen])

  // auth & sesiones
  useEffect(() => {
    if (evaluatorId) {
      seenLoggedInRef.current = true
      storage.session.set(
        STORAGE_KEYS.evaluador.evaluadorId,
        String(evaluatorId),
      )
      return
    }
    if (seenLoggedInRef.current && !evaluatorId) {
      // En logout: limpiá estado, pero se tocan los query params (evita carrera con /ingresar)
      void clearExamSession({ clearQs: false })
      storage.session.remove(STORAGE_KEYS.evaluador.evaluadorId)
      return
    }
  }, [evaluatorId, clearExamSession])

  useEffect(() => {
    if (!evaluatorId) return
    const prev = storage.session.get(STORAGE_KEYS.evaluador.evaluadorId)
    if (prev && prev !== String(evaluatorId)) {
      void clearExamSession()
      openCodeModal()
    }
    storage.session.set(STORAGE_KEYS.evaluador.evaluadorId, String(evaluatorId))
  }, [evaluatorId, openCodeModal, clearExamSession])

  const triedRestore = useRef(false)

  useEffect(() => {
    if (triedRestore.current || !authReady) return
    triedRestore.current = true

    const codigo = storage.session.get(STORAGE_KEYS.evaluador.codigo) || ''
    const examenId = Number(
      storage.session.get(STORAGE_KEYS.evaluador.examenId) || '',
    )
    const prevEvalId = storage.session.get(STORAGE_KEYS.evaluador.evaluadorId)

    // si cambió el evaluador respecto del que quedó en sesión, limpiamos y pedimos código
    if (prevEvalId && usuario?.id && prevEvalId !== String(usuario.id)) {
      void clearExamSession()
      openCodeModal()
      return
    }

    if (codigo && !examenId) {
      validarExamen(codigo)
      return
    }

    if (!codigo || !examenId) return

    withLoader('Restaurando sesión', async () => {
      const [estadoRes, casosRes, exRes, estsRes] = await Promise.all([
        evaluadorApi.estadoCorreccionEvaluador(examenId),
        evaluadorApi.casos(examenId, usuario!.id),
        evaluadorApi.examenByCodigo(codigo),
        evaluadorApi.estudiantesPorExamen(examenId),
      ])

      const ex = (exRes?.data?.data ?? null) as Examen | null
      if (!ex) throw new Error('Examen no encontrado')

      // permisos con usuario YA listo
      if (!hasRoleInExam(usuario, EVALUADOR, ex.id)) {
        setGateStatus(STATUS.FORBIDDEN)
        setGateDescription('No tenés permisos para corregir este examen.')
        setShowGate(true)
        return
      }

      if (!ex.publicado) {
        setGateStatus(STATUS.NOT_PUBLISHED)
        setGateDescription('El examen aún no está publicado')
        setShowGate(true)
        return
      }

      if (!ex.finalizado) {
        setGateStatus(STATUS.NOT_FINALIZED)
        setGateDescription(
          'Las correcciones se habilitan cuando el examen haya finalizado para todos los estudiantes.',
        )
        setShowGate(true)
        return
      }

      storage.session.set(
        STORAGE_KEYS.evaluador.evaluadorId,
        String(usuario!.id),
      )
      setExamen(ex)
      setEstado((estadoRes?.data?.data ?? null) as EstadoExamenEvaluador)
      setCasos((casosRes?.data?.data ?? []) as Caso[])
      const rawUsers = (estsRes?.data?.data ?? []) as Usuario[]
      setEstudiantes(rawUsers.map(toPseudonimo))
    }).catch(() => {
      void clearExamSession()
      openCodeModal()
    })
  }, [authReady, usuario, withLoader, clearExamSession])

  /**
   * Sincroniza seleccionados según params (con guards para params inválidos)
   */
  useEffect(() => {
    if (!examen || casos.length === 0) return

    const mySeq = ++syncSeq.current
    const isStale = guardStale(mySeq)

    const cId = Number(casoParam || 0)
    const pId = Number(preguntaParam || 0)
    const pseudo = String(pseudoParam || '')

    const stepCaso = async (): Promise<Flow> => {
      if (!cId) {
        if (isStale()) return 'stop'
        setIfChanged(selectedCaso, null, setSelectedCaso)
        if (preguntasCaso.length) setPreguntasCaso([])
        if (selectedPregunta) setSelectedPregunta(null)
        if (selectedEstudiante) setSelectedEstudiante(null)
        return 'stop'
      }

      const caso = casos.find((c) => c.id === cId) ?? null
      if (!caso) {
        // Param inválido -> normalizamos
        await setCasoParam(null)
        return 'stop'
      }

      if (isStale()) return 'stop'
      setIfChanged(selectedCaso?.id ?? null, caso.id, () =>
        setSelectedCaso(caso),
      )

      const cached = preguntasByCasoCache.current.get(caso.id)
      const getPreguntas = cached
        ? Promise.resolve(cached)
        : evaluadorApi
            .preguntas(examen.id, caso.id)
            .then((r) => (r?.data?.data ?? []) as Pregunta[])
            .then((listRaw) => {
              const list = listRaw
                .filter((p) => (p.consigna ?? '').trim().length > 0)
                .sort(
                  (a, b) => (a.orden_relativo ?? 0) - (b.orden_relativo ?? 0),
                )

              preguntasByCasoCache.current.set(caso.id, list)
              return list
            })
            .catch(() => [] as Pregunta[])

      const list_1 = await getPreguntas
      if (isStale()) return 'stop'
      if (!areSamePreguntas(preguntasCaso, list_1)) setPreguntasCaso(list_1)
      return 'continue'
    }

    const stepPregunta = async (): Promise<Flow> => {
      if (!pId) {
        if (isStale()) return 'stop'
        if (selectedPregunta) setSelectedPregunta(null)
        if (selectedEstudiante) setSelectedEstudiante(null)
        return 'stop'
      }

      const list = preguntasByCasoCache.current.get(cId) ?? []
      const pregunta = list.find((p) => p.id === pId) ?? null
      if (!pregunta) {
        await setPreguntaParam(null)
        return 'stop'
      }

      if (isStale()) return 'stop'
      setIfChanged(selectedPregunta?.id ?? null, pregunta.id, () =>
        setSelectedPregunta(pregunta),
      )
      return 'continue'
    }

    const stepPseudonimo = async (): Promise<void> => {
      if (!pseudo) {
        if (!isStale() && selectedEstudiante) setSelectedEstudiante(null)
        return
      }
      const est = estudiantes.find((e) => e.pseudonimo === pseudo) ?? null
      if (!est) {
        await setPseudoParam(null)
        return
      }
      if (isStale()) return
      setIfChanged(selectedEstudiante?.id ?? null, est.id, () =>
        setSelectedEstudiante(est),
      )
    }

    stepCaso().then((r1) => {
      if (r1 === 'stop' || isStale()) return
      stepPregunta().then((r2) => {
        if (r2 === 'stop' || isStale()) return
        stepPseudonimo()
      })
    })

    if (examen && selectedCaso && selectedPregunta) {
      preloadGrupos(examen.id, selectedCaso.id, selectedPregunta.id)
    }
  }, [
    examen?.id,
    casos,
    estudiantes,
    casoParam,
    preguntaParam,
    pseudoParam,
    selectedCaso?.id,
    selectedPregunta?.id,
    selectedEstudiante?.id,
    preguntasCaso,
    setCasoParam,
    setPreguntaParam,
    setPseudoParam,
  ])

  const step: Step = !casoParam
    ? Step.Casos
    : !preguntaParam
      ? Step.Preguntas
      : !pseudoParam
        ? Step.Usuarios
        : Step.Correccion

  // sets auxiliares opcionales (sin polling en vivo)
  const preguntasFinalizadas = useMemo(() => {
    const m: Record<number, boolean> = {}
    ;(estado?.preguntas ?? []).forEach((p) => (m[p.id] = Boolean(p.finalizada)))
    return m
  }, [estado])

  const estudiantesProgressByPregunta = useMemo(() => {
    const total = estado?.estudiantes?.length ?? 0
    const counts: Record<number, number> = {}
    ;(estado?.estudiantes ?? []).forEach((a) =>
      (a.preguntas_finalizadas ?? []).forEach((pid) => {
        counts[pid] = (counts[pid] ?? 0) + 1
      }),
    )
    const out: Record<number, { done: number; total: number }> = {}
    ;(estado?.preguntas ?? []).forEach((p) => {
      out[p.id] = { done: counts[p.id] ?? 0, total }
    })
    return out
  }, [estado])

  // Handlers (nuqs)
  const onSelectCaso = useCallback(
    async (c: Caso) => {
      await setCasoParam(Number(c.id))
      await setPreguntaParam(null)
      await setPseudoParam(null)
    },
    [setCasoParam, setPreguntaParam, setPseudoParam],
  )

  const onSelectPregunta = useCallback(
    async (p: Pregunta) => {
      if (selectedEstudiante) setSelectedEstudiante(null)
      if (examen && selectedCaso)
        preloadGrupos(examen.id, selectedCaso.id, p.id)
      await setPreguntaParam(Number(p.id))
      await setPseudoParam(null)
    },
    [
      selectedEstudiante,
      examen?.id,
      selectedCaso?.id,
      setPreguntaParam,
      setPseudoParam,
    ],
  )

  const onSelectEstudiante = useCallback(
    async (e: Estudiante) => {
      await setPseudoParam(e.pseudonimo)
    },
    [setPseudoParam],
  )

  const volverACasos = useCallback(async () => {
    if (selectedEstudiante) setSelectedEstudiante(null)
    if (selectedPregunta) setSelectedPregunta(null)
    if (preguntasCaso.length) setPreguntasCaso([])
    await Promise.all([
      setCasoParam(null),
      setPreguntaParam(null),
      setPseudoParam(null),
    ])
  }, [
    selectedEstudiante,
    selectedPregunta,
    preguntasCaso.length,
    setCasoParam,
    setPreguntaParam,
    setPseudoParam,
  ])

  const volverAPreguntas = useCallback(async () => {
    if (selectedEstudiante) setSelectedEstudiante(null)
    await Promise.all([setPreguntaParam(null), setPseudoParam(null)])
  }, [selectedEstudiante, setPreguntaParam, setPseudoParam])

  const volverAEstudiantes = useCallback(async () => {
    await setPseudoParam(null)
  }, [setPseudoParam])

  const puedeFinalizar = useMemo(() => {
    if (!estado || estado.finalizado) return false
    const asignadas = estado.correcciones_asignadas ?? 0
    const realizadas = estado.correcciones_realizadas ?? 0
    return asignadas > 0 && asignadas === realizadas
  }, [estado])

  const reporteEnabled = Boolean(estado?.finalizado)

  const syncEstado = useCallback(() => {
    if (!examen?.id) return Promise.resolve()
    return withLoader('Actualizando estado', async () => {
      const r = await evaluadorApi.estadoCorreccionEvaluador(examen.id)
      setEstado((r?.data?.data ?? null) as EstadoExamenEvaluador)
    })
  }, [withLoader, examen?.id])

  // índices para navegación de estudiantes
  const currentIdx = useMemo(() => {
    if (!selectedEstudiante) return -1
    return estudiantes.findIndex((e) => e.id === selectedEstudiante.id)
  }, [estudiantes, selectedEstudiante?.id])

  const hasPrev = currentIdx > 0
  const hasNext = currentIdx >= 0 && currentIdx < estudiantes.length - 1

  const gotoIdx = async (idx: number) => {
    const target = estudiantes[idx]
    if (target) await setPseudoParam(target.pseudonimo)
  }

  const corregidosIds = useMemo(() => {
    const set = new Set<number>()
    if (!estado || !selectedPregunta) return set
    const lista = estado.estudiantes ?? []
    lista.forEach((est) => {
      if ((est.preguntas_finalizadas ?? []).includes(selectedPregunta.id)) {
        set.add(est.id)
      }
    })
    return set
  }, [estado, selectedPregunta?.id])

  const goHomeRequested = storage.session.has(STORAGE_KEYS.evaluador.goHome)

  const renderUI =
    !goHomeRequested &&
    Boolean(examen && estado && casos.length > 0 && examen?.finalizado)

  if (showGate && !goHomeRequested) {
    return (
      <ExamStatusGate
        context={EVALUADOR}
        status={gateStatus}
        description={gateDescription}
        primary={{
          label: 'Ingresar otro código',
          onClick: () => {
            setShowGate(false)
            setGateDescription(undefined)
            openCodeModal()
          },
        }}
      />
    )
  }

  return (
    <div className="font-geist-sans fixed inset-x-0 top-16 bottom-0 overflow-y-auto p-4">
      {!renderUI && (
        <div className="grid min-h-[calc(100vh-4rem)] place-items-center">
          <div className="text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-800">
              ¡Hola {usuario.nombre}!
            </h1>
            <p className="mb-3 text-lg text-gray-600">
              Ingresá un código para corregir un examen
            </p>
            <Button type="button" icon={faLock} onClick={openCodeModal}>
              Ingresar código
            </Button>
          </div>
        </div>
      )}

      {renderUI && step === Step.Casos && (
        <CasosList
          examenNombre={examen?.nombre}
          casos={casos}
          onSelect={onSelectCaso}
          statusByCaso={(() => {
            const m: Record<number, boolean> = {}
            ;(estado?.casos ?? []).forEach(
              (c) => (m[c.id] = Boolean(c.finalizado)),
            )
            return m
          })()}
          progressByCaso={(() => {
            const m: Record<number, { done: number; total: number }> = {}
            ;(estado?.casos ?? []).forEach((c) => {
              m[c.id] = {
                done: c.preguntas_corregidas ?? 0,
                total: c.preguntas_totales ?? 0,
              }
            })
            return m
          })()}
          headerAction={
            examen ? (
              <div className="flex items-center gap-3">
                <FinalizarCorreccionesButton
                  examenId={examen.id}
                  enabled={puedeFinalizar}
                  finalizado={estado?.finalizado}
                  onFinalized={syncEstado}
                />
                <ReporteCorreccionesButton
                  examenId={examen.id}
                  enabled={reporteEnabled}
                />
              </div>
            ) : null
          }
        />
      )}

      {renderUI && step === Step.Preguntas && selectedCaso && (
        <PreguntasList
          preguntas={preguntasCaso}
          onBack={volverACasos}
          onSelect={onSelectPregunta}
          statusByPregunta={preguntasFinalizadas}
          estudiantesProgressByPregunta={estudiantesProgressByPregunta}
        />
      )}

      {renderUI && step === Step.Usuarios && selectedPregunta && (
        <PseudonimosList
          estudiantes={estudiantes}
          onBack={volverAPreguntas}
          onSelect={onSelectEstudiante}
          corregidosIds={corregidosIds}
        />
      )}

      {renderUI &&
        step === Step.Correccion &&
        selectedCaso &&
        selectedPregunta &&
        selectedEstudiante &&
        examen && (
          <CorreccionPregunta
            examenId={examen.id}
            caso={selectedCaso}
            pregunta={selectedPregunta}
            estudiante={selectedEstudiante}
            onBackEstudiantes={volverAEstudiantes}
            onSaved={() => void syncEstado()}
            readOnly={Boolean(estado?.finalizado)}
            hasPrev={hasPrev}
            hasNext={hasNext}
            onPrevEstudiante={() => void gotoIdx(currentIdx - 1)}
            onNextEstudiante={() => void gotoIdx(currentIdx + 1)}
            advanceOnSave={true}
            showPrevNextButtons={false}
          />
        )}
    </div>
  )
}
