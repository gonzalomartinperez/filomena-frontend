'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryState, parseAsInteger, createSerializer } from 'nuqs'
import { Column, DataGrid } from 'app/components/datagrid/DatagridComponent'
import { Button } from 'app/components/buttons/GeneralButton'
import { Examen } from '../examenes/types/Examen'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import {
  faCirclePlus,
  faFileImport,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons'
import { Caso } from './types/Caso'
import useModal from 'app/hooks/useModal'
import { deleteCasoAPI, getCasosAPI } from './services/casosServices'
import ExamenListComponent from '../components/lists/ExamenListComponent'
import { EVALUADOR } from '../usuarios/constants/roles'
import { getExamenesAPI } from '../services/filterServices'

const BASE = '/inicio/administrador/casos'

const styles = {
  container: 'font-geist-sans',
  title: 'mb-6 text-3xl font-semibold',
  controls:
    'mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
  buttonsWrapper: 'flex gap-2',
  contentContainer: 'grid grid-cols-1 gap-6 lg:grid-cols-2',
}

const columnsCasoList: Column<Caso>[] = [
  { field: 'titulo', headerName: 'Nombre', type: 'text' },
  { field: 'orden_relativo', headerName: 'Orden relativo', type: 'text' },
  {
    field: EVALUADOR,
    headerName: 'Evaluador asignado',
    type: 'text',
    renderCell: (row) => {
      const ev = row.evaluador ?? null
      const nombre =
        ev && (ev.apellido || ev.nombre)
          ? `${ev.apellido ?? ''}${ev.apellido ? ', ' : ''}${ev.nombre ?? ''}`
          : '—'
      return ev?.dni ? (
        <a
          href={`usuarios/${ev.dni}`}
          className="text-indigo-600 underline transition-colors hover:opacity-80"
        >
          {nombre}
        </a>
      ) : (
        <span>{nombre}</span>
      )
    },
  },
  {
    field: 'email',
    headerName: 'Email',
    type: 'text',
    renderCell: (row) => <span>{row.evaluador?.email ?? '—'}</span>,
  },
]

export default function Page() {
  const router = useRouter()

  // Serializer tipado p/ armar URLs sin depender del pathname
  const serialize = useMemo(
    () =>
      createSerializer({
        examen: parseAsInteger,
        orden: parseAsInteger,
      }),
    [],
  )

  // nuqs
  const [examenParam, setExamenParam] = useQueryState('examen', parseAsInteger)

  // estado
  const [examenes, setExamenes] = useState<Examen[]>([])
  const [examenSeleccionado, setExamenSeleccionado] = useState<Examen | null>(
    null,
  )
  const [casos, setCasos] = useState<Caso[]>([])

  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()
  const {
    actions: { openModal },
  } = useModal()

  // Cargar exámenes una sola vez
  useEffect(() => {
    const load = async () => {
      const id = startLoading('Cargando exámenes')
      try {
        const res = await getExamenesAPI()
        const data: Examen[] = res.data?.data ?? []
        setExamenes(data)
      } finally {
        stopLoading(id)
      }
    }
    void load()
  }, [])

  // Rehidratación en F5: si hay ?examen=, seleccioná y cargá casos
  useEffect(() => {
    if (
      examenParam == null ||
      !Array.isArray(examenes) ||
      examenes.length === 0
    )
      return
    const found = examenes.find((e) => Number(e.id) === Number(examenParam))
    if (!found) {
      // Si el ID no existe, limpiamos y mostramos la lista
      setExamenParam(null)
      openToast({
        severity: 'warning',
        message: 'El examen seleccionado no existe o ya no está disponible.',
      })
      return
    }
    // Si cambia el examenParam o la lista, actualizamos selección y cargamos casos
    if (
      !examenSeleccionado ||
      Number(examenSeleccionado.id) !== Number(found.id)
    ) {
      setExamenSeleccionado(found)
      void loadCasos(found.id)
    }
  }, [examenParam, examenes])

  const loadCasos = useCallback(
    async (examenId: number) => {
      const loadingId = startLoading('Cargando casos')
      try {
        const res = await getCasosAPI(examenId)
        setCasos(res.data.data)
        openToast({ severity: 'success', message: res.data.message })
      } finally {
        stopLoading(loadingId)
      }
    },
    [startLoading, stopLoading, openToast],
  )

  const getMaxOrdenRelativo = useCallback(() => {
    if (casos.length === 0) return 1
    return Math.max(...casos.map((c) => Number(c.orden_relativo))) + 1
  }, [casos])

  // Click en un examen desde la grilla
  const handleSelectExamen = useCallback(
    (examen: Examen) => {
      setExamenParam(Number(examen.id))
      setExamenSeleccionado(examen)
      void loadCasos(examen.id)
    },
    [setExamenParam, loadCasos],
  )

  const deleteElement = (caso: Caso) => {
    const loadingId = startLoading('Eliminando caso')
    deleteCasoAPI(caso.id)
      .then(() => {
        setCasos((prev) => prev.filter((u) => u.id !== caso.id))
        openToast({ severity: 'success', message: 'Caso eliminado' })
      })
      .finally(() => stopLoading(loadingId))
  }

  const handleDelete = (caso: Caso) => {
    openModal({
      type: 'confirmacion',
      message: `¿Está seguro que desea eliminar el caso: ${caso.titulo}?`,
      button: { onClick: () => deleteElement(caso) },
    })
  }

  const handleBack = async () => {
    await setExamenParam(null) // limpia ?examen= en la URL
    setExamenSeleccionado(null)
    setCasos([])
  }

  const handleCreate = () => {
    if (!examenSeleccionado) return
    const nextOrden = getMaxOrdenRelativo()
    router.push(
      serialize(`${BASE}/crear`, {
        examen: Number(examenSeleccionado.id),
        orden: nextOrden,
      }),
    )
  }

  const handleViewCaso = (c: Caso) => {
    router.push(`${BASE}/${c.id}`)
  }

  const handleEditCaso = (c: Caso) => {
    if (!examenSeleccionado) return
    const nextOrden = getMaxOrdenRelativo()
    router.push(
      serialize(`${BASE}/editar/${c.id}`, {
        examen: Number(examenSeleccionado.id),
        orden: nextOrden,
      }),
    )
  }

  const handleImport = () => {
    if (!examenSeleccionado) return
    router.push(
      serialize(`${BASE}/importar`, {
        examen: Number(examenSeleccionado.id),
      }),
    )
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Casos</h1>

      {/* Si no hay examen seleccionado, mostrar lista (lee/rehidrata la page) */}
      {!examenSeleccionado && (
        <ExamenListComponent
          rows={examenes}
          columnsVariant="selection"
          onSelect={handleSelectExamen}
          rowClickEnabled
        />
      )}

      {examenSeleccionado && (
        <>
          <div className={styles.controls}>
            <div className={styles.buttonsWrapper}>
              <Button variant="light" icon={faArrowLeft} onClick={handleBack}>
                Volver a exámenes
              </Button>

              <Button
                variant="default"
                icon={faCirclePlus}
                disabled={examenSeleccionado?.publicado}
                onClick={handleCreate}
              >
                Cargar caso
              </Button>

              <Button
                variant="green"
                icon={faFileImport}
                disabled={examenSeleccionado?.publicado}
                onClick={handleImport}
              >
                Cargar casos desde Excel
              </Button>
            </div>
          </div>

          <DataGrid
            rows={casos}
            columns={columnsCasoList}
            rowKey="id"
            exam={examenSeleccionado}
            onView={handleViewCaso}
            onEdit={handleEditCaso}
            onDelete={handleDelete}
          />
        </>
      )}
    </div>
  )
}
