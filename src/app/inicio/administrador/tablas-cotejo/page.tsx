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
import useModal from 'app/hooks/useModal'
import { TablaCotejo } from './types/TablaCotejo'
import {
  deleteTablaCotejoAPI,
  getTablasCotejoAPI,
} from './services/tablasCotejoServices'
import { Caso } from '../casos/types/Caso'
import ExamenListComponent from '../components/lists/ExamenListComponent'
import { getExamenesAPI } from '../services/filterServices'
import { getCasosAPI } from '../casos/services/casosServices'
import { agruparPorCaso, CasoRow } from './utils/tablaCotejoHelperFunctions'

const BASE = '/inicio/administrador/tablas-cotejo'

const styles = {
  container: 'font-geist-sans',
  title: 'mb-6 text-3xl font-semibold',
  controls:
    'mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
  buttonsWrapper: 'flex gap-2',
  casoInteractiveLabel:
    'text-indigo-600 underline transition-colors hover:opacity-80',
}

/*type CasoRow = { id: number; caso_id: number; tablas: TablaCotejo[] }

function agruparPorCaso(tablas: TablaCotejo[]): CasoRow[] {
  const map = new Map<number, TablaCotejo[]>()
  tablas.forEach((t) => {
    const cid = Number(t.caso_id)
    if (!map.has(cid)) map.set(cid, [])
    map.get(cid)!.push(t)
  })
  return Array.from(map.entries()).map(([caso_id, tablas]) => ({
    id: caso_id,
    caso_id,
    tablas,
  }))
}*/

export default function Page() {
  const router = useRouter()

  // nuqs
  const [examenParam, setExamenParam] = useQueryState('examen', parseAsInteger)
  const serialize = useMemo(
    () => createSerializer({ examen: parseAsInteger }),
    [],
  )

  // estado
  const [examenes, setExamenes] = useState<Examen[]>([])
  const [selectedExamen, setSelectedExamen] = useState<Examen | null>(null)
  const [rows, setRows] = useState<CasoRow[]>([])
  const [casos, setCasos] = useState<Caso[]>([])

  const casosMap = useMemo(() => {
    const m = new Map<number, Caso>()
    casos.forEach((c) => m.set(Number(c.id), c))
    return m
  }, [casos])

  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()
  const {
    actions: { openModal },
  } = useModal()

  const columnsPorCaso: Column<CasoRow>[] = [
    {
      field: 'id',
      headerName: 'Tablas de cotejo',
      type: 'text',
      renderCell: (row) => {
        const caso = casosMap.get(Number(row.caso_id))
        const label =
          (caso?.titulo as string | undefined) ?? `Caso #${row.caso_id}`
        return (
          <span>
            Tabla de cotejo para{' '}
            <a
              href={`/inicio/administrador/casos/${row.caso_id}`}
              className={styles.casoInteractiveLabel}
            >
              {label}
            </a>
          </span>
        )
      },
    },
  ]

  // cargar exámenes (para listado + rehidratación)
  useEffect(() => {
    const id = startLoading('Cargando exámenes')
    getExamenesAPI()
      .then((res) => setExamenes(res.data?.data ?? []))
      .finally(() => stopLoading(id))
  }, [])

  const cargarCasos = useCallback(
    async (examenId: number) => {
      const lid = startLoading('Cargando casos')
      try {
        const res = await getCasosAPI(examenId)
        setCasos(res.data.data ?? [])
      } finally {
        stopLoading(lid)
      }
    },
    [startLoading, stopLoading],
  )

  const cargarTablas = useCallback(
    async (examenId: number) => {
      const loadingId = startLoading('Cargando tablas de cotejo')
      try {
        const res = await getTablasCotejoAPI(examenId)
        const tablas = (res.data.data as TablaCotejo[]) ?? []
        setRows(agruparPorCaso(tablas))
        openToast({ severity: 'success', message: res.data.message })
      } finally {
        stopLoading(loadingId)
      }
    },
    [startLoading, stopLoading, openToast],
  )

  // rehidratación F5
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
      void cargarCasos(found.id)
      void cargarTablas(found.id)
    }
  }, [examenParam, examenes])

  const handleSelectExamen = (examen: Examen) => {
    setExamenParam(Number(examen.id))
    setSelectedExamen(examen)
    void cargarCasos(examen.id)
    void cargarTablas(examen.id)
  }

  const deleteLote = (row: CasoRow) => {
    const loadingId = startLoading('Eliminando tablas del caso')
    Promise.allSettled(
      (row.tablas ?? []).map((t) => deleteTablaCotejoAPI(t.id!)),
    )
      .then(() => {
        setRows((prev) => prev.filter((r) => r.caso_id !== row.caso_id))
        openToast({
          severity: 'success',
          message: 'Tablas del caso eliminadas',
        })
      })
      .finally(() => stopLoading(loadingId))
  }

  const handleDelete = (row: CasoRow) => {
    const caso = casosMap.get(Number(row.caso_id))
    const label = (caso?.titulo as string | undefined) ?? `Caso #${row.caso_id}`
    openModal({
      type: 'confirmacion',
      message: `¿Está seguro que desea eliminar la tabla de cotejo del caso ${label}?`,
      button: { onClick: () => deleteLote(row) },
    })
  }

  const handleBack = async () => {
    await setExamenParam(null)
    setSelectedExamen(null)
    setRows([])
    setCasos([])
  }

  const handleCreate = () => {
    if (!selectedExamen) return
    router.push(
      serialize(`${BASE}/crear`, { examen: Number(selectedExamen.id) }),
    )
  }

  const handleViewRow = (r: CasoRow) => {
    if (!selectedExamen) return
    router.push(
      serialize(`${BASE}/${r.caso_id}`, { examen: Number(selectedExamen.id) }),
    )
  }

  const handleEditRow = (r: CasoRow) => {
    if (!selectedExamen) return
    router.push(
      serialize(`${BASE}/editar/${r.caso_id}`, {
        examen: Number(selectedExamen.id),
      }),
    )
  }

  const handleImport = () => {
    if (!selectedExamen) return
    router.push(
      serialize(`${BASE}/importar`, { examen: Number(selectedExamen.id) }),
    )
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Tablas de cotejo</h1>

      {!selectedExamen && (
        <ExamenListComponent
          rows={examenes}
          columnsVariant="selection"
          onSelect={handleSelectExamen}
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
                Crear tabla
              </Button>
              <Button
                variant="green"
                icon={faFileImport}
                disabled={selectedExamen.publicado}
                onClick={handleImport}
              >
                Cargar tablas desde Excel
              </Button>
            </div>
          </div>

          <DataGrid
            rows={rows}
            columns={columnsPorCaso}
            rowKey="id"
            exam={selectedExamen}
            onView={handleViewRow}
            onEdit={handleEditRow}
            onDelete={handleDelete}
          />
        </>
      )}
    </div>
  )
}
