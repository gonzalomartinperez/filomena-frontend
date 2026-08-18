'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryState, parseAsInteger, parseAsString } from 'nuqs'
import { Button } from 'app/components/buttons/GeneralButton'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import useModal from 'app/hooks/useModal'

import type { Examen } from '../../examenes/types/Examen'
import type { Usuario } from '../../usuarios/types/Usuario'
import type { Caso } from '../../casos/types/Caso'
import type { EstadoExamenEvaluador } from 'app/inicio/evaluador/types/modelos'
import type { TablaCotejo } from '../../tablas-cotejo/types/TablaCotejo'
import type { Seccion } from '../../secciones/types/Seccion'

import { getExamenAPI } from '../../examenes/services/examenesServices'
import { getCasosAPI } from '../../casos/services/casosServices'
import { getSeccionesAPI } from '../../secciones/services/seccionesServices'
import { getEstudiantesPorExamenAPI } from './services/defensasServices'
import {
  getEstadosEvaluadoresAPI,
  getEstadosEstudiantesAPI,
  getDefensasAPI,
} from './services/defensasServices'
import { getTablasCotejoAPI } from '../../tablas-cotejo/services/tablasCotejoServices'

import { primeSecciones } from './services/defensasCache'
import PseudonimosList from './components/PseudonimosList'
import CasosList from './components/CasosList'
import DefensasEditor from './components/DefensasEditor'
import { EstadoExamenEstudiante } from 'app/inicio/estudiante/types/modelos'
import FinalizarDefensasButton from './components/FinalizarDefensasButton'

type Estudiante = Usuario

const styles = {
  container: 'font-geist-sans p-6',
  title: 'text-3xl font-semibold',
}

export default function Page() {
  const router = useRouter()
  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()
  const {
    actions: { openModal },
  } = useModal()

  const [examenId] = useQueryState('examen', parseAsInteger)
  const [pseudonimoParam, setPseudonimoParam] = useQueryState(
    'pseudonimo',
    parseAsString,
  )
  const [casoParam, setCasoParam] = useQueryState('caso', parseAsInteger)

  const [examen, setExamen] = useState<Examen | null>(null)
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [casos, setCasos] = useState<Caso[]>([])
  const [selectedCaso, setSelectedCaso] = useState<Caso | null>(null)
  const [selectedPseudonimo, setSelectedPseudonimo] = useState<string>('')

  const [evaluadoresOk, setEvaluadoresOk] = useState<boolean>(false)
  const [defendidosById, setDefendidosById] = useState<Set<number>>(
    () => new Set(),
  )
  const [tablasPorCaso, setTablasPorCaso] = useState<Map<number, number[]>>(
    () => new Map(),
  )
  const [casosConDefensa, setCasosConDefensa] = useState<Set<number>>(
    () => new Set(),
  )

  const [editorDirty, setEditorDirty] = useState<boolean>(false)

  useEffect(() => {
    if (!examenId || examenId <= 0) return
    let alive = true
    const lid = startLoading('Cargando datos de defensa')

    ;(async () => {
      try {
        const [exRes, casosRes, estsRes, tablasRes, secsRes] =
          await Promise.all([
            getExamenAPI(examenId),
            getCasosAPI(examenId),
            getEstudiantesPorExamenAPI(Number(examenId)),
            getTablasCotejoAPI(Number(examenId)),
            getSeccionesAPI(Number(examenId)),
          ])

        if (!alive) return

        setExamen((exRes?.data?.data ?? null) as Examen | null)
        setCasos((casosRes?.data?.data ?? []) as Caso[])

        const usuarios = (estsRes?.data?.data ?? []) as Usuario[]
        setEstudiantes(usuarios)

        const tablas = (tablasRes?.data?.data ?? []) as TablaCotejo[]
        const map = new Map<number, number[]>()
        tablas.forEach((t) => {
          const cid = Number(t.caso_id)
          if (!map.has(cid)) map.set(cid, [])
          map.get(cid)!.push(Number(t.id))
        })
        setTablasPorCaso(map)

        primeSecciones((secsRes?.data?.data ?? []) as Seccion[])
      } finally {
        stopLoading(lid)
      }
    })()

    return () => {
      alive = false
    }
  }, [examenId])

  useEffect(() => {
    if (!examenId) return
    let alive = true
    const lid = startLoading('Verificando estados')
    ;(async () => {
      try {
        const [evalsRes, estRes] = await Promise.all([
          getEstadosEvaluadoresAPI(Number(examenId)),
          getEstadosEstudiantesAPI(Number(examenId)),
        ])

        if (!alive) return

        const listaEvals = (evalsRes?.data?.data ??
          []) as EstadoExamenEvaluador[]
        setEvaluadoresOk((listaEvals ?? []).every((e) => Boolean(e.finalizado)))
        const estados = estRes?.data
          ?.data as unknown as EstadoExamenEstudiante[]
        const defended = new Set<number>()
        estados.forEach((s) => {
          if (s.defendido) defended.add(Number(s.estudiante_id))
        })
        setDefendidosById(defended)
      } finally {
        stopLoading(lid)
      }
    })()
    return () => {
      alive = false
    }
  }, [examenId])

  useEffect(() => {
    if (!casos.length) return
    const cid = Number(casoParam || 0)
    if (!cid) {
      setSelectedCaso(null)
      return
    }
    const found = casos.find((c) => Number(c.id) === cid) ?? null
    if (!found) {
      void setCasoParam(null)
      return
    }
    setSelectedCaso(found)
  }, [casoParam, casos, setCasoParam])

  useEffect(() => {
    const pseudo = (pseudonimoParam ?? '').trim()
    setSelectedPseudonimo(pseudo)
  }, [pseudonimoParam])

  // También exigimos que el examen esté finalizado.
  const examenFinalizado = useMemo(() => {
    const ex = (examen ?? null) as unknown as { finalizado?: boolean } | null
    return Boolean(ex?.finalizado)
  }, [examen])

  const defensasHabilitadas = evaluadoresOk && examenFinalizado

  // Si no está habilitado, el "paso" queda forzado en PSEUDONIMOS.
  const step: 'PSEUDONIMOS' | 'CASOS' | 'EDITOR' =
    !defensasHabilitadas || !selectedPseudonimo
      ? 'PSEUDONIMOS'
      : !selectedCaso
        ? 'CASOS'
        : 'EDITOR'

  const onSelectPseudonimo = useCallback(
    async (p: string) => {
      await setPseudonimoParam(p)
      await setCasoParam(null)
      setCasosConDefensa(new Set())
    },
    [setPseudonimoParam, setCasoParam],
  )

  const onSelectCaso = useCallback(
    async (c: Caso) => {
      await setCasoParam(Number(c.id))
    },
    [setCasoParam],
  )

  const volverAPseudonimos = useCallback(async () => {
    await setCasoParam(null)
    await setPseudonimoParam(null)
    setCasosConDefensa(new Set())
  }, [setCasoParam, setPseudonimoParam])

  const askConfirmLeave = useCallback(
    (cb: () => void) => {
      if (!editorDirty) return cb()
      openModal({
        type: 'confirmacion',
        message: '¿Querés salir sin guardar las defensas?',
        button: { onClick: cb },
      })
    },
    [editorDirty, openModal],
  )

  const goBackToCasos = useCallback(() => {
    setSelectedCaso(null)
    void setCasoParam(null)
  }, [setCasoParam])

  const volverACasos = useCallback(
    () => askConfirmLeave(goBackToCasos),
    [askConfirmLeave, goBackToCasos],
  )

  const volverAAdministrar = useCallback(() => {
    if (!examenId) return
    router.push(`/inicio/administrador/administrar-examenes?examen=${examenId}`)
  }, [router, examenId])

  useEffect(() => {
    let alive = true
    if (step !== 'CASOS' || !selectedPseudonimo || !examenId) return
    const lid = startLoading('Cargando defensas del alumno')
    ;(async () => {
      try {
        const set = new Set<number>()
        await Promise.all(
          casos.map(async (c) => {
            try {
              const r = await getDefensasAPI(
                Number(c.id),
                String(selectedPseudonimo),
              )
              const list = (r?.data?.data ?? []) as { caso_id: number }[]
              if (list.length > 0) set.add(Number(c.id))
            } catch {}
          }),
        )
        if (!alive) return
        setCasosConDefensa(set)
      } finally {
        stopLoading(lid)
      }
    })()
    return () => {
      alive = false
    }
  }, [step, selectedPseudonimo, examenId, casos])

  const estudiantesMap = useMemo(() => {
    const m = new Map<string, Estudiante>()
    estudiantes.forEach((e) => m.set(String(e.pseudonimo ?? ''), e))
    return m
  }, [estudiantes])

  const estudianteActual = selectedPseudonimo
    ? (estudiantesMap.get(selectedPseudonimo) ?? null)
    : null

  const showEditor =
    step === 'EDITOR' &&
    Boolean(examenId) &&
    !!estudianteActual &&
    !!selectedCaso &&
    examen !== null

  const guardMissingExamShown = useRef(false)
  useEffect(() => {
    if (!examenId && !guardMissingExamShown.current) {
      guardMissingExamShown.current = true
      openModal({
        type: 'confirmacion',
        message:
          'No se recibió el ID de examen. Accedé desde el botón "Defensa" del examen en Administración.',
      })
    }
  }, [examenId, openModal])

  return (
    <div className={styles.container}>
      <h1 className={`${styles.title} mb-2`}>Defensas</h1>

      <div className="mt-4 mb-4 flex items-center gap-3">
        {step === 'PSEUDONIMOS' && (
          <>
            <Button
              variant="alternative"
              icon={faArrowLeft}
              onClick={volverAAdministrar}
            >
              Volver a administrar examen
            </Button>

            <FinalizarDefensasButton
              className="ml-auto"
              examenId={Number(examenId)}
              enabled={examenFinalizado && evaluadoresOk}
              finalizado={Boolean(examen?.defendido)}
              onFinalized={() =>
                setExamen((prev) =>
                  prev ? { ...prev, defendido: true } : prev,
                )
              }
            />
          </>
        )}
        {step === 'CASOS' && (
          <Button
            variant="alternative"
            icon={faArrowLeft}
            onClick={volverAPseudonimos}
          >
            Volver a pseudónimos
          </Button>
        )}
        {step === 'EDITOR' && (
          <Button
            variant="alternative"
            icon={faArrowLeft}
            onClick={volverACasos}
          >
            Volver a casos
          </Button>
        )}
      </div>

      {Boolean(examen?.defendido) ? (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-800">
          Este examen ya fue <b>defendido</b>. Las notas de defensa quedaron
          fijas (solo lectura).
        </div>
      ) : null}

      {/* ► Mensajes de bloqueo (nuevos) */}
      {step === 'PSEUDONIMOS' && !defensasHabilitadas && (
        <div className="mb-4 space-y-2">
          {!examenFinalizado && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-800">
              Para cargar defensas, el examen debe estar <b>finalizado</b>.
            </div>
          )}
          {!evaluadoresOk && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-800">
              <b>Todos los evaluadores</b> deben haber finalizado sus
              correcciones.
            </div>
          )}
        </div>
      )}

      {step === 'PSEUDONIMOS' && (
        <PseudonimosList
          usuarios={estudiantes}
          defendedById={defendidosById}
          evaluadoresOk={evaluadoresOk}
          examenFinalizado={examenFinalizado}
          onSelect={(u) => onSelectPseudonimo(String(u.pseudonimo ?? ''))}
        />
      )}

      {step === 'CASOS' && (
        <CasosList
          casos={casos}
          onSelect={onSelectCaso}
          defendidosPorCaso={casosConDefensa}
        />
      )}

      {showEditor ? (
        <DefensasEditor
          examenId={Number(examenId)}
          caso={selectedCaso as Caso}
          pseudonimo={(estudianteActual as Estudiante).pseudonimo ?? ''}
          estudianteId={Number((estudianteActual as Estudiante).id)}
          tablaIds={tablasPorCaso.get(Number((selectedCaso as Caso).id)) ?? []}
          examenDefendido={Boolean(examen?.defendido)}
          onBack={volverACasos}
          onSaved={() =>
            openToast({
              severity: 'success',
              message: 'Notas de defensa guardadas',
            })
          }
          onDirtyChange={setEditorDirty}
        />
      ) : null}
    </div>
  )
}
