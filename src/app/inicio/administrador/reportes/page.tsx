'use client'
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Button } from 'app/components/buttons/GeneralButton'
import { Examen } from '../examenes/types/Examen'
import { faArrowLeft, faDownload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  FaFilePdf,
  FaFileExcel,
  FaRegFile,
  FaCircleNotch,
  FaLock,
  FaInfoCircle,
} from 'react-icons/fa'
import { IconType } from 'react-icons'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import {
  estadosEvaluadores,
  reporteCorrecciones,
  reporteCorreccionesDetalladas,
  reporteEstructura,
  reporteNotas,
  type ReportService,
} from './services/reportesServices'
import ExamenListComponent from '../components/lists/ExamenListComponent'
import { EstadoExamenEvaluador } from 'app/inicio/evaluador/types/modelos'
import { useQueryState, parseAsInteger } from 'nuqs'
import { getExamenesAPI } from '../services/filterServices'

const styles = {
  container: 'font-geist-sans',
  title: 'mb-6 text-3xl font-semibold',
  controls: 'mb-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center',
  buttonsWrapper: 'flex gap-2 flex-wrap items-center',
  cardBase:
    'relative group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition ' +
    'hover:shadow-lg',
  cardBody:
    'flex aspect-square items-center justify-center p-1 bg-gradient-to-br from-gray-50 to-white',
  fileName:
    'w-full truncate px-3 py-2 text-center text-sm font-medium bg-gray-50',
  badge:
    'absolute top-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white uppercase backdrop-blur-sm',
  blocked: 'pointer-events-none opacity-70 grayscale contrast-75',
  overlay:
    'absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition group-hover:opacity-100',
  helper:
    'mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800',
}

const isAllEvaluatorsFinalized = (data: EstadoExamenEvaluador[]): boolean => {
  const list = Array.isArray(data) ? data : [data]
  return list.length > 0 && list.every((e) => e.finalizado === true)
}

type ReportKey =
  | 'estructura'
  | 'correcciones'
  | 'notas'
  | 'correcciones-detalladas'

interface ReportDef {
  key: ReportKey
  label: string
  ext: 'pdf' | 'xlsx'
  icon: IconType
  color: string
  service: ReportService
}

const REPORTS: ReportDef[] = [
  {
    key: 'estructura',
    label: 'PDF · Estructura',
    ext: 'pdf',
    icon: FaFilePdf,
    color: '#e53935',
    service: reporteEstructura,
  },
  {
    key: 'correcciones',
    label: 'PDF · Correcciones',
    ext: 'pdf',
    icon: FaFilePdf,
    color: '#e53935',
    service: reporteCorrecciones,
  },
  {
    key: 'notas',
    label: 'Excel · Notas',
    ext: 'xlsx',
    icon: FaFileExcel,
    color: '#4caf50',
    service: reporteNotas,
  },
  {
    key: 'correcciones-detalladas',
    label: 'Excel · Correcciones detalladas',
    ext: 'xlsx',
    icon: FaFileExcel,
    color: '#4caf50',
    service: reporteCorreccionesDetalladas,
  },
]

type Status = 'generating' | 'ready' | 'error' | 'blocked'
type StatusMap = Partial<Record<ReportKey, Status>>
type UrlMap = Partial<Record<ReportKey, string>>

export default function Page() {
  // nuqs
  const [examenParam, setExamenParam] = useQueryState('examen', parseAsInteger)

  // estado
  const [examenes, setExamenes] = useState<Examen[]>([])
  const [examenSeleccionado, setExamenSeleccionado] = useState<Examen | null>(
    null,
  )
  const [status, setStatus] = useState<StatusMap>({})
  const [urls, setUrls] = useState<UrlMap>({})
  const [evalsReady, setEvalsReady] = useState<boolean | null>(null)
  const [loadingEvals, setLoadingEvals] = useState(false)

  const {
    actions: { openToast, startLoading, stopLoading },
  } = useVisualNotifications()

  // cargar exámenes para listado y rehidratación (F5)
  useEffect(() => {
    const id = startLoading('Cargando exámenes')
    getExamenesAPI()
      .then((res) => setExamenes(res.data?.data ?? []))
      .finally(() => stopLoading(id))
  }, [])

  // Rehidratación en F5: si hay ?examen= y ya tenemos exámenes, selecciono
  useEffect(() => {
    if (examenParam == null || !examenes.length) return
    const found = examenes.find((e) => Number(e.id) === Number(examenParam))
    if (!found) {
      setExamenParam(null)
      openToast({
        severity: 'warning',
        message: 'El examen seleccionado no existe o ya no está disponible.',
      })
      return
    }
    if (
      !examenSeleccionado ||
      Number(examenSeleccionado.id) !== Number(found.id)
    ) {
      // reset y selección (como en handleView)
      queueMicrotask(() => {
        setUrls({})
        setStatus({})
        setEvalsReady(null)
        setExamenSeleccionado(found)
      })
    }
  }, [examenParam, examenes])

  const handleView = (e: Examen) => {
    setExamenParam(Number(e.id)) // fija ?examen= en la URL
    setUrls({})
    setStatus({})
    setEvalsReady(null)
    setExamenSeleccionado(e)
  }

  const handleBack = async () => {
    await setExamenParam(null) // limpia ?examen= de la URL
    setExamenSeleccionado(null)
    setUrls({})
    setStatus({})
    setEvalsReady(null)
  }

  useEffect(() => {
    if (!examenSeleccionado) return

    let canceled = false
    let intervalId: number | null = null

    const checkStates = (toastOnError: boolean) => {
      setLoadingEvals(true)
      estadosEvaluadores(examenSeleccionado.id)
        .then((res) => {
          if (canceled) return
          const ok = isAllEvaluatorsFinalized(
            res.data.data as unknown as EstadoExamenEvaluador[],
          )
          setEvalsReady(ok)
          if (ok && intervalId !== null) {
            window.clearInterval(intervalId)
            intervalId = null
          }
        })
        .catch(() => {
          if (toastOnError && !canceled) {
            setEvalsReady(false)
            openToast({
              severity: 'warning',
              message:
                'No se pudo recuperar el estado de evaluadores. Intentaremos nuevamente en 15s.',
            })
          }
        })
        .finally(() => {
          if (!canceled) setLoadingEvals(false)
        })
    }

    // Primer chequeo inmediato (con posible toast)
    checkStates(true)

    // Polling cada 15s (sin toast repetitivo)
    intervalId = window.setInterval(() => {
      checkStates(false)
    }, 15000)

    return () => {
      canceled = true
      if (intervalId !== null) window.clearInterval(intervalId)
    }
  }, [examenSeleccionado, openToast])

  const generateReport = useCallback(
    async (def: ReportDef) => {
      if (!examenSeleccionado) return
      setStatus((s) => ({ ...s, [def.key]: 'generating' }))

      const MAX_ATTEMPTS = 12
      const INTERVAL_MS = 5000
      let attempts = 0
      let url: string | null = null
      let force = true

      try {
        while (attempts < MAX_ATTEMPTS && !url) {
          const res = await def.service(examenSeleccionado.id, force)
          force = false
          if (res.data.status === 200 && res.data.data?.url) {
            url = res.data.data.url
          } else {
            await new Promise((r) => setTimeout(r, INTERVAL_MS))
            attempts++
          }
        }

        if (url) {
          setUrls((u) => ({ ...u, [def.key]: url }))
          setStatus((s) => ({ ...s, [def.key]: 'ready' }))
        } else {
          setStatus((s) => ({ ...s, [def.key]: 'error' }))
          openToast({
            severity: 'warning',
            message: `No se pudo generar ${def.label.toLowerCase()}`,
          })
        }
      } catch {
        setStatus((s) => ({ ...s, [def.key]: 'error' }))
        openToast({
          severity: 'error',
          message: 'Ocurrió un error al generar el reporte',
        })
      }
    },
    [examenSeleccionado, openToast],
  )

  const canGenerate = useCallback(
    (def: ReportDef, exam: Examen, allEvalsDone: boolean | null) =>
      def.key === 'estructura' || (exam.finalizado && allEvalsDone === true),
    [],
  )

  useEffect(() => {
    if (!examenSeleccionado) return
    if (evalsReady === null) return

    REPORTS.forEach((def) => {
      if (canGenerate(def, examenSeleccionado, evalsReady)) {
        void generateReport(def)
      } else {
        setStatus((s) => ({ ...s, [def.key]: 'blocked' }))
      }
    })
  }, [examenSeleccionado, evalsReady, canGenerate, generateReport])

  const helperMessage = useMemo(() => {
    if (!examenSeleccionado) return null
    if (!examenSeleccionado.finalizado) {
      return 'Los reportes estarán disponibles cuando el examen sea finalizado.'
    }
    if (evalsReady === false) {
      return 'Los reportes en blanco y negro estarán disponibles cuando todos los evaluadores finalicen sus correcciones.'
    }
    return null
  }, [examenSeleccionado, evalsReady])

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Reportes de examen</h1>

      <div className={examenSeleccionado ? 'hidden' : ''}>
        {/* Pasamos rows para controlarlo desde la page y rehidratar via ?examen= */}
        <ExamenListComponent
          rows={examenes}
          onSelect={handleView}
          rowClickEnabled
        />
      </div>

      {examenSeleccionado && (
        <>
          <div className={styles.controls}>
            <div className={styles.buttonsWrapper}>
              <Button variant="light" icon={faArrowLeft} onClick={handleBack}>
                Volver a exámenes
              </Button>
            </div>
          </div>

          <div className="grid [grid-template-columns:repeat(4,minmax(160px,1fr))] gap-4 max-[820px]:[grid-template-columns:repeat(2,minmax(160px,1fr))]">
            {REPORTS.map((def) => {
              const Icon = def.icon ?? FaRegFile
              const st: Status = status[def.key] ?? 'blocked'
              const isClickable = st === 'ready'
              const showLoader = st === 'generating'
              const isBlocked = st === 'blocked'
              const showLock =
                def.key !== 'estructura' &&
                (loadingEvals ||
                  evalsReady === false ||
                  !examenSeleccionado.finalizado)

              return (
                <button
                  key={def.key}
                  type="button"
                  className={`${styles.cardBase} ${isClickable ? 'cursor-pointer hover:ring-2 hover:ring-blue-500/60' : ''} ${isBlocked ? styles.blocked : ''}`}
                  onClick={() => {
                    if (isClickable && urls[def.key])
                      window.open(urls[def.key]!, '_blank')
                  }}
                >
                  <span className={styles.badge}>{def.ext}</span>

                  <div className={styles.cardBody}>
                    {showLoader ? (
                      <FaCircleNotch
                        className="h-8 w-8 animate-spin"
                        color={def.color}
                      />
                    ) : showLock ? (
                      <FaLock className="h-8 w-8" />
                    ) : (
                      <Icon className="h-3/4 w-3/4" color={def.color} />
                    )}
                  </div>

                  <div
                    className={`${styles.fileName} ${isClickable ? 'group-hover:bg-blue-50 group-hover:text-blue-600' : ''}`}
                  >
                    {def.label}
                  </div>

                  {isClickable && (
                    <div className={styles.overlay}>
                      <FontAwesomeIcon
                        icon={faDownload}
                        className="h-7 w-7 text-white transition-transform duration-200 ease-out group-hover:scale-110 md:h-9 md:w-9"
                      />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {helperMessage && (
            <p className={styles.helper}>
              <FaInfoCircle className="mt-0.5 shrink-0" />
              <span>{helperMessage}</span>
            </p>
          )}
        </>
      )}
    </div>
  )
}
