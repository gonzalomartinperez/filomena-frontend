'use client'

import { useCallback, useEffect, useState } from 'react'
import { Column, DataGrid } from 'app/components/datagrid/DatagridComponent'
import { Button } from 'app/components/buttons/GeneralButton'
import { Examen } from '../examenes/types/Examen'
import { Pseudonimo } from './types/Pseudonimo'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { getPseudonimosAPI } from './services/pseudonimosServices'
import ExamenListComponent from '../components/lists/ExamenListComponent'
import { useQueryState, parseAsInteger } from 'nuqs'
import { getExamenesAPI } from '../services/filterServices'

const styles = {
  container: 'font-geist-sans',
  title: 'mb-6 text-3xl font-semibold',
  controls:
    'mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
  buttonsWrapper: 'flex gap-2',
}

const columnsPseudonimoList: Column<Pseudonimo>[] = [
  { field: 'nombre', headerName: 'Nombre', type: 'text' },
  { field: 'en_uso', headerName: 'En uso', type: 'boolean' },
]

export default function Page() {
  // nuqs
  const [examenParam, setExamenParam] = useQueryState('examen', parseAsInteger)

  // estado
  const [examenes, setExamenes] = useState<Examen[]>([])
  const [selectedExamen, setSelectedExamen] = useState<Examen | null>(null)
  const [pseudonimos, setPseudonimos] = useState<Pseudonimo[]>([])

  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()

  // Cargar exámenes una sola vez (para rehidratación y listado)
  useEffect(() => {
    const id = startLoading('Cargando exámenes')
    getExamenesAPI()
      .then((res) => setExamenes(res.data?.data ?? []))
      .finally(() => stopLoading(id))
  }, [])

  const loadPseudonimos = useCallback(
    async (examenId: number) => {
      const id = startLoading('Cargando pseudónimos')
      try {
        const res = await getPseudonimosAPI(examenId)
        setPseudonimos(res.data.data)
        openToast({ severity: 'success', message: res.data.message })
      } finally {
        stopLoading(id)
      }
    },
    [startLoading, stopLoading, openToast],
  )

  // Rehidratación en F5: si hay ?examen= y ya tenemos examenes, selecciono y cargo pseudónimos
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
    if (!selectedExamen || Number(selectedExamen.id) !== Number(found.id)) {
      setSelectedExamen(found)
      void loadPseudonimos(found.id)
    }
  }, [examenParam, examenes])

  // Selección desde la grilla
  const handleView = (examen: Examen) => {
    setExamenParam(Number(examen.id))
    setSelectedExamen(examen)
    void loadPseudonimos(examen.id)
  }

  const handleBack = async () => {
    await setExamenParam(null) // limpia ?examen= en la URL
    setSelectedExamen(null)
    setPseudonimos([])
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Pseudónimos</h1>

      {!selectedExamen && (
        <ExamenListComponent
          rows={examenes}
          columnsVariant="selection"
          onSelect={handleView}
          rowClickEnabled
        />
      )}

      {selectedExamen && (
        <>
          <div className={styles.controls}>
            <div className={styles.buttonsWrapper}>
              <Button variant="light" icon={faArrowLeft} onClick={handleBack}>
                Volver a exámenes
              </Button>
            </div>
          </div>

          <DataGrid
            rows={pseudonimos}
            columns={columnsPseudonimoList}
            rowKey="id"
          />
        </>
      )}
    </div>
  )
}
