'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useQueryState, parseAsInteger } from 'nuqs'
import {
  getArchivosAPI,
  uploadArchivoAPI,
  deleteArchivoAPI,
} from './services/mochilaCargaServices'
import { Button } from 'app/components/buttons/GeneralButton'
import {
  faArrowLeft,
  faTrash,
  faCircleInfo,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import useModal from 'app/hooks/useModal'
import { Examen } from '../examenes/types/Examen'
import { ApiFile } from 'app/inicio/administrador/mochila-carga/types/ApiFile'
import ExamenListComponent from '../components/lists/ExamenListComponent'
import UploadDropzone from 'app/components/uploads/UploadDropzone'
import { getExamenesAPI } from '../services/filterServices'
import FileCardGrid from 'app/components/files/FileCardGrid'
import ImagePreviewModal from 'app/components/files/ImagePreviewModal'

const styles = {
  container: 'font-geist-sans',
  title: 'mb-6 text-3xl font-semibold',
  controls:
    'mb-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between',
  buttonsWrapper: 'flex gap-2 flex-wrap items-center',
  infoBox:
    'mt-4 mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900',
}

export default function Page() {
  // nuqs
  const [examenParam, setExamenParam] = useQueryState('examen', parseAsInteger)

  // estado
  const [examenes, setExamenes] = useState<Examen[]>([])
  const [examenSeleccionado, setExamenSeleccionado] = useState<Examen | null>(
    null,
  )
  const [archivos, setArchivos] = useState<ApiFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  // selección para eliminar (FileCard -> toggle)
  const [pendingDeletes, setPendingDeletes] = useState<Set<number>>(new Set())

  // preview de imágenes
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(
    null,
  )

  const {
    actions: { openToast, startLoading, stopLoading },
  } = useVisualNotifications()

  const {
    actions: { openModal },
  } = useModal()

  // cargar exámenes (para listado y rehidratación en F5)
  useEffect(() => {
    const id = startLoading('Cargando exámenes')
    getExamenesAPI()
      .then((res) => setExamenes(res.data?.data ?? []))
      .finally(() => stopLoading(id))
  }, [])

  const fetchArchivos = useCallback(
    (examenId: number) => {
      getArchivosAPI(examenId)
        .then((res) => setArchivos(res.data.data as ApiFile[]))
        .catch(() =>
          openToast({
            severity: 'error',
            message: 'No se pudieron obtener archivos',
          }),
        )
    },
    [openToast],
  )

  // Rehidratación: si hay ?examen= y ya están los exámenes, selecciono y cargo archivos
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
    if (
      !examenSeleccionado ||
      Number(examenSeleccionado.id) !== Number(found.id)
    ) {
      setExamenSeleccionado(found)
      setPendingDeletes(new Set())
      fetchArchivos(found.id)
    }
  }, [examenParam, examenes])

  const handleView = (examen: Examen) => {
    setExamenParam(Number(examen.id))
    setExamenSeleccionado(examen)
    setPendingDeletes(new Set())
    fetchArchivos(examen.id)
  }

  const handleBack = async () => {
    await setExamenParam(null) // limpia ?examen= de la URL
    setExamenSeleccionado(null)
    setArchivos([])
    setPendingDeletes(new Set())
  }

  const uploadMany = async (files: File[]) => {
    if (!examenSeleccionado || files.length === 0) return
    const loadingId = startLoading('Subiendo archivo(s)')
    setIsUploading(true)
    try {
      await Promise.all(
        files.map((f) => uploadArchivoAPI(examenSeleccionado.id, f)),
      )
      openToast({
        severity: 'success',
        message: 'Archivo(s) subidos correctamente',
      })
      fetchArchivos(examenSeleccionado.id)
    } catch {
      openToast({
        severity: 'error',
        message: 'Ocurrió un problema al subir archivo(s)',
      })
    } finally {
      stopLoading(loadingId)
      setIsUploading(false)
    }
  }

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
    void uploadMany(accepted)
  }

  const toggleMarkDelete = (id: number) => {
    setPendingDeletes((prev) => {
      const next = new Set(prev)
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleDeleteMarked = () => {
    if (!pendingDeletes.size) return
    openModal({
      type: 'confirmacion',
      message:
        pendingDeletes.size === 1
          ? '¿Seguro que deseas eliminar el archivo seleccionado?'
          : `¿Seguro que deseas eliminar ${pendingDeletes.size} archivos seleccionados?`,
      button: {
        onClick: async () => {
          const idLoading = startLoading('Eliminando archivo(s)')
          try {
            await Promise.all(
              [...pendingDeletes.values()].map((fid) => deleteArchivoAPI(fid)),
            )
            setArchivos((prev) => prev.filter((a) => !pendingDeletes.has(a.id)))
            setPendingDeletes(new Set())
            openToast({
              severity: 'success',
              message: 'Archivo(s) eliminado(s)',
            })
          } catch {
            openToast({
              severity: 'error',
              message: 'No se pudieron eliminar algunos archivos',
            })
          } finally {
            stopLoading(idLoading)
          }
        },
      },
    })
  }

  const infoText = useMemo(
    () =>
      `La “Mochila de carga” contiene los archivos del examen seleccionado.
       Todo lo que subas aquí queda disponible para los estudiantes durante el examen como material de apoyo.
       Podés subir PDFs, imágenes, planillas, documentos, etc. También es posible previsualizar imágenes, descargar archivos
       y marcar varios para eliminarlos de una sola vez.`,
    [],
  )

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Mochila de carga</h1>

      {!examenSeleccionado && (
        <ExamenListComponent
          rows={examenes}
          columnsVariant="selection"
          onSelect={handleView}
          rowClickEnabled
        />
      )}

      {examenSeleccionado && (
        <>
          <Button variant="light" icon={faArrowLeft} onClick={handleBack}>
            Volver a exámenes
          </Button>
          <div className={styles.infoBox}>
            <p className="flex items-start gap-3 text-sm leading-6">
              <FontAwesomeIcon
                icon={faCircleInfo}
                className="mt-0.5 h-5 w-5 shrink-0"
              />
              <span>{infoText}</span>
            </p>
          </div>

          <div className={styles.controls}>
            <div className={styles.buttonsWrapper}>
              {pendingDeletes.size > 0 && (
                <Button
                  variant="red"
                  icon={faTrash}
                  onClick={handleDeleteMarked}
                >
                  Eliminar marcados ({pendingDeletes.size})
                </Button>
              )}
            </div>

            <UploadDropzone
              disabled={isUploading}
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.zip,.csv,.xls,.xlsx,.doc,.docx,.rtf"
              maxSizeMB={20}
              title={
                isUploading ? 'Subiendo…' : 'Arrastrá o hacé clic para subir'
              }
              onFiles={handleFiles}
            />
          </div>

          <FileCardGrid
            className="pb-20"
            items={archivos}
            features={{ toggleDelete: true, preview: true, download: true }}
            markedPredicate={(it) =>
              !(it instanceof File) && pendingDeletes.has(it.id)
            }
            onPreview={(it) => {
              if (!(it instanceof File))
                setPreview({ url: it.url, name: it.file_name })
            }}
            onToggleMarkDelete={(id) => toggleMarkDelete(id)}
            size="md"
          />
        </>
      )}

      <ImagePreviewModal
        open={Boolean(preview)}
        src={preview?.url ?? ''}
        alt={preview?.name ?? ''}
        onClose={() => setPreview(null)}
      />
    </div>
  )
}
