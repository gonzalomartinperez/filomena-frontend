'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Column, DataGrid } from 'app/components/datagrid/DatagridComponent'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import { getExamenesAPI } from 'app/inicio/administrador/services/filterServices'
import { Examen } from 'app/inicio/administrador/examenes/types/Examen'
import { storage, STORAGE_KEYS } from 'app/utils/storage'

type ExamRow = Examen & {
  codigo?: string
  publicado?: boolean
  finalizado?: boolean
  defendido?: boolean
  descargable?: boolean
  retrocedible?: boolean
  fecha?: string
}

export type ExamenListProps = {
  onSelect?: (examen: ExamRow) => void
  onEdit?: (examen: ExamRow) => void
  onDelete?: (examen: ExamRow) => void
  onRewind?: (examen: ExamRow) => void
  /** Si pasás rows, el componente NO hace fetch y usa esa data. */
  rows?: ExamRow[]
  /** Para distinguir visualmente: 'admin' muestra flags; 'selection' solo nombre/fecha. */
  columnsVariant?: 'admin' | 'selection'
  /** Habilita click en fila para seleccionar (default true). */
  rowClickEnabled?: boolean
}

const columnsExamen: Column<ExamRow>[] = [
  { field: 'nombre', headerName: 'Nombre', type: 'text' },
  { field: 'fecha', headerName: 'Fecha', type: 'date' },
  { field: 'publicado', headerName: 'Publicado', type: 'boolean' },
  { field: 'finalizado', headerName: 'Finalizado', type: 'boolean' },
  { field: 'defendido', headerName: 'Defendido', type: 'boolean' },
]

const columnsExamenSelection: Column<ExamRow>[] = [
  { field: 'nombre', headerName: 'Nombre', type: 'text' },
  { field: 'fecha', headerName: 'Fecha', type: 'date' },
]

export default function ExamenListComponent({
  onSelect,
  onEdit,
  onDelete,
  onRewind,
  rows: controlledRows,
  columnsVariant,
  rowClickEnabled = true,
}: ExamenListProps) {
  const [internalRows, setInternalRows] = useState<ExamRow[]>([])
  const rows = controlledRows ?? internalRows

  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()

  const fetchedRef = useRef(false)
  const toastSeenRef = useRef(false)

  const sortByFechaDesc = useCallback((a: ExamRow, b: ExamRow) => {
    const ta = a?.fecha ? new Date(a.fecha).getTime() : -Infinity
    const tb = b?.fecha ? new Date(b.fecha).getTime() : -Infinity
    return tb - ta
  }, [])

  // Si no vienen rows por props, hace fetch
  useEffect(() => {
    if (controlledRows) return
    if (fetchedRef.current) return
    fetchedRef.current = true

    const load = async () => {
      const loadingId = startLoading('Cargando exámenes')
      try {
        const res = await getExamenesAPI()
        const data: ExamRow[] = (res.data?.data ?? [])
          .slice()
          .sort(sortByFechaDesc)
        setInternalRows(data)

        let alreadySeen = toastSeenRef.current
        try {
          alreadySeen =
            alreadySeen ||
            storage.session.has(STORAGE_KEYS.administrador.examenListToastSeen)
        } catch {}

        if (!alreadySeen) {
          openToast({ severity: 'success', message: res.data?.message ?? 'OK' })
          toastSeenRef.current = true
          try {
            storage.session.set(
              STORAGE_KEYS.administrador.examenListToastSeen,
              '1',
            )
          } catch {}
        }
      } finally {
        stopLoading(loadingId)
      }
    }

    void load()
  }, [controlledRows, sortByFechaDesc, startLoading, stopLoading, openToast])

  const resolvedColumns = useMemo(() => {
    if (columnsVariant === 'admin') return columnsExamen
    if (columnsVariant === 'selection') return columnsExamenSelection
    return onEdit || onDelete || onRewind
      ? columnsExamen
      : columnsExamenSelection
  }, [columnsVariant, onEdit, onDelete, onRewind])

  const handleView = useCallback(
    (ex: ExamRow) => {
      onSelect?.(ex)
    },
    [onSelect],
  )

  return (
    <DataGrid
      rows={rows}
      columns={resolvedColumns}
      rowKey="id"
      onView={rowClickEnabled ? handleView : undefined}
      onEdit={onEdit}
      onDelete={onDelete}
      onRewind={onRewind}
    />
  )
}
