'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryState, parseAsInteger, createSerializer } from 'nuqs'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import ImportForm from 'app/inicio/administrador/components/imports/ImportForm'
import { importTablasCotejoAPI } from 'app/inicio/administrador/tablas-cotejo/services/tablasCotejoServices'
import type { ApiResponse } from 'app/types/ApiResponse'

const styles = {
  container: 'font-geist-sans',
  title: 'mb-6 text-3xl font-semibold',
  hint: 'text-xs text-gray-600',
  link: 'text-indigo-600 underline',
}

const ACCEPT = [
  '.xls',
  '.xlsx',
  '.csv',
  '.ods',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/vnd.oasis.opendocument.spreadsheet',
].join(',')
const BASE = '/inicio/administrador/tablas-cotejo'

export default function ImportarTablasCotejoPage() {
  const router = useRouter()
  const [examenId] = useQueryState('examen', parseAsInteger)
  const serialize = useMemo(
    () => createSerializer({ examen: parseAsInteger }),
    [],
  )

  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)

  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()

  useEffect(() => {
    if (examenId == null || Number.isNaN(examenId) || examenId <= 0) {
      router.replace(BASE)
    }
  }, [examenId, router])

  const handleFiles = (
    accepted: File[],
    rejected: { file: File; reason: string }[],
  ) => {
    if (rejected.length) {
      const err = rejected[0]
      openToast({
        severity: 'warning',
        message: `“${err.file.name}”: ${err.reason}`,
      })
    }
    setFile(accepted[0] ?? null)
  }

  const clearFile = () => setFile(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      openToast({
        severity: 'warning',
        message: 'Seleccioná un archivo válido',
      })
      return
    }
    const id = Number(examenId ?? 0)
    if (!id || Number.isNaN(id)) {
      openToast({ severity: 'error', message: 'Examen inválido' })
      return
    }

    const formData = new FormData()
    formData.append('archivo', file)

    const loadId = startLoading('Importando tablas de cotejo…')
    setBusy(true)
    try {
      await importTablasCotejoAPI(formData, id)
      openToast({
        severity: 'success',
        message: 'Tablas de cotejo importadas correctamente.',
      })
      router.replace(serialize(BASE, { examen: id }))
    } catch (error) {
      const err = error as { response?: { data?: ApiResponse<unknown> } }
      const msg =
        err?.response?.data?.message ||
        (error as Error)?.message ||
        'Fallo al importar tablas de cotejo.'
      openToast({ severity: 'error', message: msg })
    } finally {
      stopLoading(loadId)
      setBusy(false)
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Tablas de cotejo · Importar desde Excel</h1>

      <ImportForm
        busy={busy}
        file={file}
        accept={ACCEPT}
        maxSizeMB={20}
        idleTitle="Arrastrá el archivo o hacé clic para seleccionar"
        busyTitle="Procesando…"
        subtitle="Formatos: .xls · .xlsx · .csv · .ods"
        onFiles={handleFiles}
        onRemoveFile={clearFile}
        onSubmit={handleSubmit}
        onCancel={() =>
          router.replace(serialize(BASE, { examen: Number(examenId ?? 0) }))
        }
        leftHelp={
          <p className={`${styles.hint} mt-2`}>
            Las plantillas institucionales no se distribuyen en el snapshot
            público. Cargá un archivo compatible preparado para tu institución.
          </p>
        }
        rightColumn={
          <>
            <span className="text-sm font-medium text-gray-700">
              Instrucciones
            </span>
            <p className={styles.hint}>
              La importación crea/actualiza tablas de cotejo del examen
              seleccionado. Cada tabla queda asociada a un caso y una sección.
              Verificá los ordenes relativos de seccion, pregunta y caso para un
              caso para un mapeo correcto de ítems según la plantilla.
            </p>
          </>
        }
      />
    </div>
  )
}
