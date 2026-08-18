'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryState, parseAsInteger, createSerializer } from 'nuqs'
import { Column, DataGrid } from 'app/components/datagrid/DatagridComponent'
import { Button } from 'app/components/buttons/GeneralButton'
import { Examen } from '../examenes/types/Examen'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import {
  faArrowLeft,
  faCirclePlus,
  faFileImport,
} from '@fortawesome/free-solid-svg-icons'
import { Seccion } from './types/Seccion'
import { deleteSeccionAPI, getSeccionesAPI } from './services/seccionesServices'
import useModal from 'app/hooks/useModal'
import ExamenListComponent from '../components/lists/ExamenListComponent'
import { getExamenesAPI } from '../services/filterServices'

const BASE = '/inicio/administrador/secciones'

const styles = {
  container: 'font-geist-sans',
  title: 'mb-6 text-3xl font-semibold',
  controls:
    'mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
  buttonsWrapper: 'flex gap-2',
  contentContainer: 'grid grid-cols-1 gap-6 lg:grid-cols-2',
}

const columnsSeccionList: Column<Seccion>[] = [
  { field: 'nombre', headerName: 'Nombre', type: 'text' },
  { field: 'orden_relativo', headerName: 'Orden relativo', type: 'text' },
]

export default function Page() {
  const router = useRouter()

  // nuqs
  const [examenParam, setExamenParam] = useQueryState('examen', parseAsInteger)
  const serialize = useMemo(
    () =>
      createSerializer({
        examen: parseAsInteger,
        orden: parseAsInteger,
      }),
    [],
  )

  // estado
  const [examenes, setExamenes] = useState<Examen[]>([])
  const [selectedExamen, setSelectedExamen] = useState<Examen | null>(null)
  const [secciones, setSecciones] = useState<Seccion[]>([])

  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()
  const {
    actions: { openModal },
  } = useModal()

  const getMaxOrdenRelativo = useCallback(() => {
    if (secciones.length === 0) return 1
    return Math.max(...secciones.map((s) => Number(s.orden_relativo))) + 1
  }, [secciones])

  const cargarSeccionesExamen = useCallback(
    async (examenId: number) => {
      const loadingId = startLoading('Cargando secciones')
      try {
        const res = await getSeccionesAPI(examenId)
        setSecciones(res.data.data)
        openToast({ severity: 'success', message: res.data.message })
      } finally {
        stopLoading(loadingId)
      }
    },
    [startLoading, stopLoading, openToast],
  )

  // Cargar exámenes para rehidratación/listado
  useEffect(() => {
    const id = startLoading('Cargando exámenes')
    getExamenesAPI()
      .then((res) => setExamenes(res.data?.data ?? []))
      .finally(() => stopLoading(id))
  }, [])

  // Rehidratación en F5: si hay ?examen= y ya tenemos exámenes, selecciono y cargo secciones
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
      void cargarSeccionesExamen(found.id)
    }
  }, [examenParam, examenes])

  const handleView = (examen: Examen) => {
    setExamenParam(Number(examen.id))
    setSelectedExamen(examen)
    void cargarSeccionesExamen(examen.id)
  }

  const deleteElement = async (section: Seccion) => {
    const loadingId = startLoading('Eliminando sección')
    try {
      await deleteSeccionAPI(section.id)
      setSecciones((prev) => prev.filter((u) => u.id !== section.id))
      openToast({ severity: 'success', message: 'Sección eliminada' })
    } finally {
      stopLoading(loadingId)
    }
  }

  const handleDelete = (section: Seccion) => {
    openModal({
      type: 'confirmacion',
      message: `¿Está seguro que desea eliminar la sección: ${section.nombre}?`,
      button: { onClick: () => void deleteElement(section) },
    })
  }

  const handleBack = async () => {
    await setExamenParam(null) // limpia ?examen=
    setSelectedExamen(null)
    setSecciones([])
  }

  const handleEdit = (s: Seccion) => {
    if (!selectedExamen) return
    const nextOrden = getMaxOrdenRelativo()
    router.push(
      serialize(`${BASE}/editar/${s.id}`, {
        examen: Number(selectedExamen.id),
        orden: nextOrden,
      }),
    )
  }

  const handleCreate = () => {
    if (!selectedExamen) return
    const nextOrden = getMaxOrdenRelativo()
    router.push(
      serialize(`${BASE}/crear`, {
        examen: Number(selectedExamen.id),
        orden: nextOrden,
      }),
    )
  }

  const handleImport = () => {
    if (!selectedExamen) return
    router.push(
      serialize(`${BASE}/importar`, {
        examen: Number(selectedExamen.id),
      }),
    )
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Secciones</h1>

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
                Volver a examenes
              </Button>

              <Button
                variant="default"
                icon={faCirclePlus}
                disabled={selectedExamen.publicado}
                onClick={handleCreate}
              >
                Crear sección
              </Button>
              <Button
                variant="green"
                icon={faFileImport}
                disabled={selectedExamen.publicado}
                onClick={handleImport}
              >
                Cargar secciones desde Excel
              </Button>
            </div>
          </div>

          <DataGrid
            rows={secciones}
            columns={columnsSeccionList}
            rowKey="id"
            exam={selectedExamen}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </>
      )}
    </div>
  )
}
