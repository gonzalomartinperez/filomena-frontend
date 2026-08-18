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
import {
  deletePreguntaAPI,
  getPreguntasAPI,
} from './services/preguntasServices'
import { Pregunta } from './types/Pregunta'
import { Caso } from '../casos/types/Caso'
import ExamenListComponent from '../components/lists/ExamenListComponent'
import { getExamenesAPI } from '../services/filterServices'
import { getCasosAPI } from '../casos/services/casosServices'

const BASE = '/inicio/administrador/preguntas'

const styles = {
  container: 'font-geist-sans',
  title: 'mb-6 text-3xl font-semibold',
  controls:
    'mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
  buttonsWrapper: 'flex gap-2',
  contentContainer: 'grid grid-cols-1 gap-6 lg:grid-cols-2',
  casoInteractiveLabel:
    'text-indigo-600 underline transition-colors hover:opacity-80',
  descripcionText: 'line-clamp-3 max-w-xs text-sm text-gray-700',
  consignaText: 'line-clamp-2 max-w-xs text-sm text-gray-700',
}

export default function Page() {
  const router = useRouter()

  // nuqs
  const [examenParam, setExamenParam] = useQueryState('examen', parseAsInteger)

  const serialize = useMemo(
    () =>
      createSerializer({
        examen: parseAsInteger,
      }),
    [],
  )

  // estado
  const [examenes, setExamenes] = useState<Examen[]>([])
  const [selectedExamen, setSelectedExamen] = useState<Examen | null>(null)
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
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

  const columnsPreguntaList: Column<Pregunta>[] = [
    {
      field: 'caso_id',
      headerName: 'Caso',
      type: 'text',
      renderCell: (row) => {
        const raw = Number(row.caso_id)
        const caso = casosMap.get(raw)
        const label =
          (caso?.titulo as string | undefined) ?? (raw ? `Caso #${raw}` : '—')
        return Number.isFinite(raw) ? (
          <a
            href={`/inicio/administrador/casos/${raw}`}
            className={styles.casoInteractiveLabel}
          >
            {label}
          </a>
        ) : (
          <span>{label}</span>
        )
      },
    },
    {
      field: 'descripcion',
      headerName: 'Descripcion',
      type: 'text',
      renderCell: (row) => (
        <div className={styles.descripcionText}>{row.descripcion}</div>
      ),
    },
    {
      field: 'consigna',
      headerName: 'Consigna',
      type: 'text',
      renderCell: (row) => (
        <div className={styles.consignaText}>{row.consigna}</div>
      ),
    },
    { field: 'orden_relativo', headerName: 'Orden relativo', type: 'text' },
  ]

  // cargar exámenes (para listado y rehidratación)
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

  const cargarPreguntas = useCallback(
    async (examenId: number) => {
      const loadingId = startLoading('Cargando preguntas')
      try {
        const res = await getPreguntasAPI(examenId)
        setPreguntas(res.data.data)
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
      void cargarPreguntas(found.id)
    }
  }, [examenParam, examenes])

  // selección desde la grilla
  const handleView = (examen: Examen) => {
    setExamenParam(Number(examen.id))
    setSelectedExamen(examen)
    void cargarCasos(examen.id)
    void cargarPreguntas(examen.id)
  }

  const deleteElement = (pregunta: Pregunta) => {
    const loadingId = startLoading('Eliminando pregunta')
    deletePreguntaAPI(pregunta.id)
      .then(() => {
        setPreguntas((prev) => prev.filter((u) => u.id !== pregunta.id))
        openToast({ severity: 'success', message: 'Pregunta eliminada' })
      })
      .finally(() => stopLoading(loadingId))
  }

  const handleDelete = (pregunta: Pregunta) => {
    openModal({
      type: 'confirmacion',
      message: '¿Está seguro que desea eliminar la pregunta?',
      button: { onClick: () => deleteElement(pregunta) },
    })
  }

  const handleBack = async () => {
    await setExamenParam(null) // limpia ?examen=
    setSelectedExamen(null)
    setPreguntas([])
    setCasos([])
  }

  const handleCreate = () => {
    if (!selectedExamen) return
    router.push(
      serialize(`${BASE}/crear`, { examen: Number(selectedExamen.id) }),
    )
  }

  const handleImport = () => {
    if (!selectedExamen) return
    router.push(
      serialize(`${BASE}/importar`, { examen: Number(selectedExamen.id) }),
    )
  }

  const handleViewPregunta = (p: Pregunta) => {
    router.push(`${BASE}/${p.id}`)
  }

  const handleEditPregunta = (p: Pregunta) => {
    if (!selectedExamen) return
    router.push(
      serialize(`${BASE}/editar/${p.id}`, {
        examen: Number(selectedExamen.id),
      }),
    )
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Preguntas</h1>

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
                Crear pregunta
              </Button>

              <Button
                variant="green"
                icon={faFileImport}
                disabled={selectedExamen.publicado}
                onClick={handleImport}
              >
                Cargar preguntas desde Excel
              </Button>
            </div>
          </div>

          <DataGrid
            rows={preguntas}
            columns={columnsPreguntaList}
            rowKey="id"
            exam={selectedExamen}
            onView={handleViewPregunta}
            onEdit={handleEditPregunta}
            onDelete={handleDelete}
          />
        </>
      )}
    </div>
  )
}
