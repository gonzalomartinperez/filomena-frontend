'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from 'app/components/buttons/GeneralButton'
import { Examen } from '../examenes/types/Examen'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import ProgressChart from '../components/graphics/ProgressChartComponent'
import {
  getOrdenEntregaAlumnosAPI,
  getPorcentajeFinalizacionAlumnosAPI,
  getPorcentajeFinalizacionEvaluadoresAPI,
} from './services/graficosServices'
import CompletionOrder, {
  StudentCompletion,
} from '../components/graphics/CompletionOrderComponent'
import ExamenListComponent from '../components/lists/ExamenListComponent'
import { ESTUDIANTE, EVALUADOR } from '../usuarios/constants/roles'
import { useQueryState, parseAsInteger } from 'nuqs'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import { getExamenesAPI } from '../services/filterServices'
import useAuth from 'app/hooks/useAuth'

const styles = {
  container: 'mb-12 font-geist-sans',
  title: 'mb-6 text-3xl font-semibold',
  controls:
    'mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
  buttonsWrapper: 'flex gap-2',
  graphicsContainer: 'grid grid-cols-1 gap-6 lg:grid-cols-2',
}

export default function Page() {
  const {
    state: { usuario },
  } = useAuth()
  // nuqs
  const [examenParam, setExamenParam] = useQueryState('examen', parseAsInteger)

  // estado
  const [examenes, setExamenes] = useState<Examen[]>([])
  const selectedExamen =
    examenParam == null
      ? null
      : (examenes.find((examen) => Number(examen.id) === Number(examenParam)) ??
        null)
  const [alumnosPercentage, setAlumnosPercentage] = useState<number>(0)
  const [alumnosDelivered, setAlumnosDelivered] = useState<StudentCompletion[]>(
    [],
  )
  const [evaluadoresPercentage, setEvaluadoresPercentage] = useState<number>(0)

  const {
    actions: { openToast, startLoading, stopLoading },
  } = useVisualNotifications()

  // cargar exámenes (para listado y rehidratación)
  useEffect(() => {
    const id = startLoading('Cargando exámenes')
    getExamenesAPI()
      .then((res) => setExamenes(res.data?.data ?? []))
      .finally(() => stopLoading(id))
  }, [])

  // Rehidratación en F5: si hay ?examen= y ya tenemos exámenes, selecciono
  useEffect(() => {
    if (examenParam == null || !examenes.length) return
    if (!selectedExamen) {
      void setExamenParam(null)
      openToast({
        severity: 'warning',
        message: 'El examen seleccionado no existe o ya no está disponible.',
      })
    }
  }, [examenParam, examenes.length, selectedExamen, openToast, setExamenParam])

  // Handlers selección / volver
  const handleView = (examen: Examen) => {
    void setExamenParam(Number(examen.id)) // fija ?examen= en la URL
  }

  const handleBack = async () => {
    await setExamenParam(null) // limpia ?examen= de la URL
    setAlumnosPercentage(0)
    setAlumnosDelivered([])
    setEvaluadoresPercentage(0)
  }

  // Polling y actualizaciones cuando hay examen seleccionado
  const obtenerPorcentajeAlumnos = useCallback(() => {
    if (!selectedExamen) return
    getPorcentajeFinalizacionAlumnosAPI(selectedExamen.id).then((res) => {
      setAlumnosPercentage(res.data.data.porcentaje_finalizados)
    })
  }, [selectedExamen])

  const obtenerOrdenEntregaAlumnos = useCallback(() => {
    if (!usuario?.id) return
    if (!selectedExamen) return
    getOrdenEntregaAlumnosAPI(selectedExamen.id).then((res) => {
      setAlumnosDelivered(res.data.data)
    })
  }, [selectedExamen, usuario?.id])

  const obtenerPorcentajeEvaluadores = useCallback(() => {
    if (!selectedExamen) return
    getPorcentajeFinalizacionEvaluadoresAPI(selectedExamen.id).then((res) => {
      setEvaluadoresPercentage(res.data.data.porcentaje_finalizados)
    })
  }, [selectedExamen])

  useEffect(() => {
    if (!selectedExamen) return

    // primera carga
    obtenerPorcentajeAlumnos()
    obtenerOrdenEntregaAlumnos()
    obtenerPorcentajeEvaluadores()

    // intervals
    const intervalAlumnos = setInterval(obtenerPorcentajeAlumnos, 5000)
    const intervalEntregaAlumnos = setInterval(obtenerOrdenEntregaAlumnos, 5000)
    const intervalEvaluadores = setInterval(obtenerPorcentajeEvaluadores, 10000)

    return () => {
      clearInterval(intervalAlumnos)
      clearInterval(intervalEntregaAlumnos)
      clearInterval(intervalEvaluadores)
    }
  }, [
    selectedExamen,
    obtenerPorcentajeAlumnos,
    obtenerOrdenEntregaAlumnos,
    obtenerPorcentajeEvaluadores,
  ])

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Gráficos en tiempo real</h1>

      <div className={selectedExamen ? 'hidden' : ''}>
        <ExamenListComponent
          rows={examenes}
          columnsVariant="selection"
          onSelect={handleView}
          rowClickEnabled
        />
      </div>

      {selectedExamen && (
        <>
          <div className={styles.controls}>
            <div className={styles.buttonsWrapper}>
              <Button variant="light" icon={faArrowLeft} onClick={handleBack}>
                Volver a examenes
              </Button>
            </div>
          </div>

          <div className={styles.graphicsContainer}>
            {/* Alumnos Card */}
            <ProgressChart rol={ESTUDIANTE} progress={alumnosPercentage} />

            {/* Evaluadores Card */}
            <ProgressChart rol={EVALUADOR} progress={evaluadoresPercentage} />
          </div>

          <div className="mt-6">
            <CompletionOrder data={alumnosDelivered} />
          </div>
        </>
      )}
    </div>
  )
}
