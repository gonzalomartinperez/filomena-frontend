'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import ImportForm from 'app/inicio/administrador/components/imports/ImportForm'
import { importSeccionesAPI } from 'app/inicio/administrador/secciones/services/seccionesServices'
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

export default function ImportarSeccionesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)

  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()

  const examenParam = searchParams.get('examen')
  const examenId = Number(examenParam ?? '0')

  useEffect(() => {
    if (!examenParam || Number.isNaN(examenId) || examenId <= 0) {
      router.replace('/inicio/administrador/secciones')
    }
  }, [examenParam, examenId, router])

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
    if (!examenId || Number.isNaN(examenId)) {
      openToast({ severity: 'error', message: 'Examen inválido' })
      return
    }

    const formData = new FormData()
    formData.append('archivo', file)

    const loadId = startLoading('Importando secciones…')
    setBusy(true)
    try {
      await importSeccionesAPI(formData, examenId)
      openToast({
        severity: 'success',
        message: 'Secciones importadas correctamente.',
      })
      router.back()
    } catch (error) {
      const err = error as { response?: { data?: ApiResponse<unknown> } }
      const msg =
        err?.response?.data?.message ||
        (error as Error)?.message ||
        'Fallo al importar secciones.'
      openToast({ severity: 'error', message: msg })
    } finally {
      stopLoading(loadId)
      setBusy(false)
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Secciones · Importar desde Excel</h1>

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
        onCancel={() => router.back()}
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
              La importación creará/actualizará secciones del examen
              seleccionado. Revisá los campos obligatorios y el orden relativo
              en la plantilla.
            </p>
          </>
        }
      />
    </div>
  )
}
