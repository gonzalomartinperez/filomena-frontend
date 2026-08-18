'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from 'app/components/buttons/GeneralButton'
import { Examen } from '../examenes/types/Examen'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import { faArrowLeft, faTimes } from '@fortawesome/free-solid-svg-icons'
import AdminActionButtons from '../components/examAdminButtons/AdminActionButtonsComponent'
import { MonitorEstudiante, MonitorEvaluador } from './types/Monitor'
import {
  alertarEstudianteAPI,
  monitorEstudiantesAPI,
  monitorEvaluadoresAPI,
} from './services/administrarServices'
import MonitorTable from '../components/monitorTable/MonitorTableComponent'
import MonitorCards from '../components/monitorCards/MonitorCardsComponent'
import ExamenListComponent from '../components/lists/ExamenListComponent'
import { ESTUDIANTE, EVALUADOR } from '../usuarios/constants/roles'
import { useQueryState, parseAsInteger } from 'nuqs'
import { getExamenesAPI } from '../services/filterServices'
import useAuth from 'app/hooks/useAuth'

const styles = {
  container: 'font-geist-sans',
  title: 'mb-6 text-3xl font-semibold',
  controls:
    'mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
  buttonsWrapper: 'flex gap-2',
  examActionsContainer:
    'grid grid-cols-1 gap-6 md:grid-cols-[minmax(280px,320px)_1fr]',
}

export default function Page() {
  const {
    state: { usuario },
  } = useAuth()

  const [selectedExamenState, setSelectedExamen] = useState<Examen | null>(null)
  const [monitorEstudiante, setMonitorEstudiante] = useState<
    MonitorEstudiante[]
  >([])
  const [monitorEvaluador, setmonitorEvaluador] = useState<MonitorEvaluador[]>(
    [],
  )
  const [monitor, setMonitor] = useState<string>('')

  const [examenParam, setExamenParam] = useQueryState('examen', parseAsInteger)
  const [examenes, setExamenes] = useState<Examen[]>([])
  const examenFromQuery =
    examenParam == null
      ? null
      : (examenes.find((examen) => Number(examen.id) === Number(examenParam)) ??
        null)
  const selectedExamen =
    examenParam != null &&
    Number(selectedExamenState?.id) === Number(examenParam)
      ? selectedExamenState
      : examenFromQuery

  const {
    actions: { openToast, startLoading, stopLoading },
  } = useVisualNotifications()

  // Cargar exámenes (para listado y rehidratación al F5)
  useEffect(() => {
    const id = startLoading('Cargando exámenes')
    getExamenesAPI()
      .then((res) => setExamenes(res.data?.data ?? []))
      .finally(() => stopLoading(id))
  }, [])

  // Rehidratación: si hay ?examen= y ya están los exámenes, selecciono y muestro panel
  useEffect(() => {
    if (examenParam == null || !examenes.length) return
    if (!examenFromQuery) {
      void setExamenParam(null)
      openToast({
        severity: 'warning',
        message: 'El examen seleccionado no existe o ya no está disponible.',
      })
    }
  }, [examenParam, examenes.length, examenFromQuery, openToast, setExamenParam])

  const handleView = (e: Examen) => {
    setSelectedExamen(e)
    void setExamenParam(Number(e.id)) // fija ?examen=
  }

  const handleBack = async () => {
    await setExamenParam(null) // limpia ?examen= de la URL
    setMonitor('')
    setMonitorEstudiante([])
    setmonitorEvaluador([])
    setSelectedExamen(null)
  }

  const alertarEstudiante = (student: MonitorEstudiante) => {
    if (!selectedExamen) return
    alertarEstudianteAPI(selectedExamen.id, student.estudiante_id)
      .then((res) => {
        openToast({ severity: 'info', message: res.data.message })
      })
      .finally(() => {
        obtenerDatosMonitorEstudiante(selectedExamen.id)
      })
  }

  const obtenerDatosMonitorEstudiante = useCallback(
    (examenId: number) => {
      if (
        !selectedExamen ||
        !selectedExamen.publicado ||
        selectedExamen.finalizado
      )
        return
      monitorEstudiantesAPI(examenId).then((res) => {
        setMonitorEstudiante(res.data.data.progreso)
      })
    },
    [selectedExamen],
  )

  const obtenerDatosMonitorEvaluador = useCallback(
    (examenId: number) => {
      if (!selectedExamen || selectedExamen.defendido || monitor !== EVALUADOR)
        return
      monitorEvaluadoresAPI(examenId).then((res) => {
        setmonitorEvaluador(res.data.data.progreso)
      })
    },
    [selectedExamen, monitor],
  )

  const handleMonitorClick = () => {
    if (!selectedExamen) return
    if (selectedExamen.publicado && !selectedExamen.finalizado) {
      setMonitor(ESTUDIANTE)
    } else if (selectedExamen.finalizado) {
      setMonitor(EVALUADOR)
    }
  }

  // polling según el monitor visible
  useEffect(() => {
    if (!usuario?.id) return
    if (!monitor || !selectedExamen) return

    if (monitor === ESTUDIANTE) obtenerDatosMonitorEstudiante(selectedExamen.id)
    if (monitor === EVALUADOR) obtenerDatosMonitorEvaluador(selectedExamen.id)

    const intervalEstudiantes = setInterval(() => {
      if (monitor === ESTUDIANTE)
        obtenerDatosMonitorEstudiante(selectedExamen.id)
    }, 10000)

    const intervalEvaluadores = setInterval(() => {
      if (monitor === EVALUADOR) obtenerDatosMonitorEvaluador(selectedExamen.id)
    }, 15000)

    return () => {
      clearInterval(intervalEstudiantes)
      clearInterval(intervalEvaluadores)
    }
  }, [
    monitor,
    selectedExamen,
    obtenerDatosMonitorEstudiante,
    obtenerDatosMonitorEvaluador,
  ])

  return (
    <div className={`${styles.container} pb-8`}>
      <h1 className={styles.title}>Administrar examenes</h1>

      <div className={selectedExamen ? 'hidden' : ''}>
        {/* Pasamos rows para que la page controle datos y podamos rehidratar */}
        <ExamenListComponent rows={examenes} onSelect={handleView} />
      </div>

      {selectedExamen && (
        <>
          <div className={styles.controls}>
            <div className={styles.buttonsWrapper}>
              <Button variant="light" icon={faArrowLeft} onClick={handleBack}>
                Volver a examenes
              </Button>
            </div>

            <div className="rounded-lg border-2 border-blue-300 bg-blue-100 px-4 py-3 shadow-md">
              <span className="text-lg font-semibold text-blue-800">
                El código de examen es:{' '}
              </span>
              <span className="text-2xl font-black text-blue-900 underline decoration-blue-500">
                {selectedExamen.codigo}
              </span>
            </div>
          </div>

          <div className={styles.examActionsContainer}>
            <AdminActionButtons
              selectedExamen={selectedExamen}
              setSelectedExamen={setSelectedExamen}
            />
            <MonitorCards
              selectedExamen={selectedExamen}
              handleMonitorClick={handleMonitorClick}
            />
          </div>

          {monitor && (
            <div className="mt-6">
              <Button
                variant="light"
                icon={faTimes}
                onClick={() => {
                  if (monitor === ESTUDIANTE) {
                    setMonitorEstudiante([])
                  } else {
                    setmonitorEvaluador([])
                  }
                  setMonitor('')
                }}
              >
                Cerrar monitor
              </Button>
            </div>
          )}

          {monitor === ESTUDIANTE && (
            <div className="mt-4">
              <MonitorTable
                data={monitorEstudiante}
                onAlert={(student) => {
                  alertarEstudiante(student)
                }}
                monitor="estudiante"
                examen={selectedExamen}
              />
            </div>
          )}

          {monitor === EVALUADOR && (
            <div className="mt-4">
              <MonitorTable
                data={monitorEvaluador}
                onAlert={() => {}}
                monitor="evaluador"
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
