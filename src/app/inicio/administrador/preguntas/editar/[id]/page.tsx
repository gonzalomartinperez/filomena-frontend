'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useQueryState, parseAsInteger, createSerializer } from 'nuqs'
import { getCasosAPI } from 'app/inicio/administrador/casos/services/casosServices'
import {
  getPreguntaAPI,
  updatePreguntaAPI,
  getPreguntasAPI,
} from '../../services/preguntasServices'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import GenericForm, { Field } from 'app/components/forms/GenericForm'
import * as Yup from 'yup'
import preguntaActionSchema from '../../schemas/preguntaActionSchema'
import { Caso } from 'app/inicio/administrador/casos/types/Caso'
import { Pregunta } from '../../types/Pregunta'
import UploadDropzone from 'app/components/uploads/UploadDropzone'
import {
  deleteArchivoAPI,
  getArchivosPreguntaAPI,
  uploadArchivoPreguntaAPI,
} from 'app/inicio/administrador/mochila-carga/services/mochilaCargaServices'
import { ApiFile } from 'app/inicio/administrador/mochila-carga/types/ApiFile'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import FileCardGrid from 'app/components/files/FileCardGrid'
import ImagePreviewModal from 'app/components/files/ImagePreviewModal'

const BASE = '/inicio/administrador/preguntas'

const stylesUpload = {
  grid: 'mt-4 grid [grid-template-columns:repeat(6,minmax(140px,1fr))] gap-4 overflow-y-auto pb-6 max-[980px]:[grid-template-columns:repeat(4,minmax(140px,1fr))] max-[640px]:[grid-template-columns:repeat(2,minmax(140px,1fr))]',
  cardBase:
    'relative group overflow-hidden rounded-xl border border-gray-200 bg-white shadow hover:shadow-lg hover:ring-2 hover:ring-blue-500/60 transition',
  cardBody: 'flex aspect-square items-center justify-center p-1',
  fileName:
    'w-full truncate px-2 py-1 text-center text-sm font-medium bg-gray-50 group-hover:bg-blue-50 group-hover:text-blue-600',
  badgeExt:
    'absolute top-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white uppercase backdrop-blur-sm',
  badgeDelete:
    'absolute left-2 top-2 rounded-full bg-red-600/80 px-2 py-0.5 text-[10px] font-semibold text-white',
  overlay:
    'absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition group-hover:opacity-100',
  iconBtn:
    '!p-2 !h-9 !w-9 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-white/70',
  modalBackdrop:
    'fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4',
  modalInner: 'relative w-full max-w-5xl',
  modalClose:
    'absolute -top-3 -right-3 rounded-full bg-white/90 p-2 shadow hover:bg-white',
}

export default function Page() {
  const { id } = useParams()
  const router = useRouter()

  // Solo conservamos ?examen=
  const [examen] = useQueryState('examen', parseAsInteger)
  const serialize = useMemo(
    () =>
      createSerializer({
        examen: parseAsInteger,
      }),
    [],
  )

  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()

  const [pregunta, setPregunta] = useState<Partial<Pregunta>>({})
  const [casosExamen, setCasosExamen] = useState<Caso[]>([])

  // Archivos actuales del backend
  const [archivos, setArchivos] = useState<ApiFile[]>([])

  // Cambios locales (transacción)
  const [pendingUploads, setPendingUploads] = useState<File[]>([])
  const [pendingDeletes, setPendingDeletes] = useState<Set<number>>(new Set())

  // Preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewName, setPreviewName] = useState<string>('')

  // Para sugerir orden localmente
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])

  // Validación mínima de params
  useEffect(() => {
    if (examen == null || examen <= 0 || Number.isNaN(Number(id))) {
      router.replace(BASE)
    }
  }, [examen, id, router])

  // --- carga de datos ---
  useEffect(() => {
    const loadingId = startLoading('Cargando datos')
    getPreguntaAPI(id!.toString())
      .then((res) => setPregunta(res.data.data))
      .finally(() => stopLoading(loadingId))
  }, [id])

  useEffect(() => {
    const loadingId = startLoading('Cargando archivos')
    getArchivosPreguntaAPI(Number(id))
      .then((res) => setArchivos(res.data.data as ApiFile[]))
      .finally(() => stopLoading(loadingId))
  }, [id])

  useEffect(() => {
    if (examen == null || examen <= 0) return
    const loadingId = startLoading('Cargando opciones')
    getCasosAPI(Number(examen))
      .then((res) => setCasosExamen(res.data.data))
      .finally(() => stopLoading(loadingId))
  }, [examen])

  // Cargar preguntas del examen (para sugerir orden si se cambia el caso)
  useEffect(() => {
    if (examen == null || examen <= 0) return
    const loadingId = startLoading('Cargando preguntas')
    getPreguntasAPI(Number(examen))
      .then((res) => setPreguntas(res.data.data ?? []))
      .finally(() => stopLoading(loadingId))
  }, [examen])

  type FormValues = Yup.InferType<typeof preguntaActionSchema>

  const initialValues: FormValues = useMemo(
    () => ({
      caso: (pregunta.caso_id ?? '') as string,
      descripcion: (pregunta.descripcion ?? '') as string,
      consigna: (pregunta.consigna ?? '') as string,
      orden_relativo: (pregunta.orden_relativo ?? '') as number,
    }),
    [pregunta],
  )

  // Mapa { caso_id → max(orden_relativo) }
  const ordenesMap = useMemo(() => {
    const map = new Map<number, number>()
    preguntas.forEach((p) => {
      const casoId = Number(p.caso_id)
      const orden = Number(p.orden_relativo)
      if (Number.isFinite(casoId) && Number.isFinite(orden)) {
        const current = map.get(casoId) ?? 0
        if (orden > current) map.set(casoId, orden)
      }
    })
    return map
  }, [preguntas])

  const getNextOrdenForCaso = (casoId: number): number => {
    const maxOrden = ordenesMap.get(casoId)
    return maxOrden ? maxOrden + 1 : 1
  }

  const [selectedCaso, setSelectedCaso] = useState<number | null>(null)

  const fields: Field<FormValues>[] = useMemo(
    () => [
      {
        name: 'caso',
        label: 'Caso',
        type: 'select',
        options: casosExamen,
        getOptionValue: (c: Caso) => c.id,
        getOptionLabel: (c: Caso) => `${c.titulo}`,
        onChange: (value: string) => {
          setSelectedCaso(Number(value))
        },
      },
      {
        name: 'descripcion',
        label: 'Descripción',
        type: 'textarea',
        placeholder: 'Descripción de la pregunta',
        fullRow: true,
      },
      {
        name: 'consigna',
        label: 'Consigna',
        type: 'textarea',
        placeholder: 'Consigna de la pregunta',
        fullRow: true,
      },
      {
        name: 'orden_relativo',
        label: 'Orden relativo',
        type: 'text',
        placeholder: selectedCaso
          ? `Valor sugerido: ${getNextOrdenForCaso(selectedCaso)}`
          : 'Valor sugerido: 1',
      },
    ],
    [casosExamen, selectedCaso, ordenesMap],
  )

  const handleSubmit = async (values: FormValues) => {
    const saveId = startLoading('Guardando cambios')
    try {
      await updatePreguntaAPI(id!.toString(), {
        consigna: values.consigna,
        descripcion: values.descripcion,
        orden_relativo: values.orden_relativo,
        caso_id: Number(values.caso),
      })

      const pid = Number(id)

      // 1) subidas pendientes
      if (pendingUploads.length) {
        await Promise.all(
          pendingUploads.map((f) => uploadArchivoPreguntaAPI(pid, f)),
        )
      }

      // 2) eliminaciones pendientes
      if (pendingDeletes.size) {
        await Promise.all(
          [...pendingDeletes].map((fileId) => deleteArchivoAPI(fileId)),
        )
      }

      openToast({ severity: 'success', message: 'Pregunta actualizada' })
      router.replace(serialize(BASE, { examen: Number(examen ?? 0) }))
    } catch {
      openToast({
        severity: 'error',
        message: 'No se pudieron guardar los cambios',
      })
    } finally {
      stopLoading(saveId)
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
    if (!accepted.length) return
    setPendingUploads((prev) => {
      const next = [...prev]
      accepted.forEach((f) => {
        if (!next.some((x) => x.name === f.name && x.size === f.size))
          next.push(f)
      })
      return next
    })
  }
  const removePendingUpload = (name: string, size: number) => {
    setPendingUploads((prev) =>
      prev.filter((f) => !(f.name === name && f.size === size)),
    )
  }

  const toggleMarkDelete = (fileId: number) => {
    setPendingDeletes((prev) => {
      const next = new Set(prev)
      if (next.has(fileId)) next.delete(fileId)
      else next.add(fileId)
      return next
    })
  }

  const openPreview = (url: string, name: string) => {
    setPreviewUrl(url)
    setPreviewName(name)
  }
  const closePreview = () => {
    setPreviewUrl(null)
    setPreviewName('')
  }

  return (
    <div>
      <GenericForm
        title="Pregunta - Editar"
        fields={fields}
        initialValues={initialValues}
        validationSchema={preguntaActionSchema}
        onSubmit={handleSubmit}
        onCancel={() =>
          router.replace(serialize(BASE, { examen: Number(examen ?? 0) }))
        }
        showUploadSlot
      >
        {/* Dropzone para adjuntar archivos NUEVOS (pendientes) */}
        <UploadDropzone
          disabled={false}
          multiple
          accept=".png,.jpg,.jpeg,image/png,image/jpeg"
          maxSizeMB={20}
          title="Arrastrá o hacé clic para subir"
          onFiles={handleFiles}
        />

        {/* ► Nuevos archivos a subir */}
        {pendingUploads.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-600">
              Estos archivos se subirán al guardar.
            </p>

            <FileCardGrid
              className="mt-4"
              columns="compact"
              size="sm"
              items={pendingUploads}
              onPreview={(it) => {
                if (it instanceof File) {
                  const url = URL.createObjectURL(it)
                  openPreview(url, it.name)
                }
              }}
              onRemove={(f) => removePendingUpload(f.name, f.size)}
            />
          </div>
        )}

        {/* ► Archivos actuales (con marcado para eliminar) */}
        <div className="mt-4">
          <p className="text-xs text-gray-600">
            Estos archivos se eliminarán al guardar.
          </p>
          <FileCardGrid
            className="mt-4"
            columns="compact"
            size="sm"
            items={archivos}
            features={{ toggleDelete: true, download: true }}
            markedPredicate={(it) =>
              !(it instanceof File) && pendingDeletes.has(it.id)
            }
            onPreview={(it) => {
              if (!(it instanceof File)) openPreview(it.url, it.file_name)
            }}
            onToggleMarkDelete={(id) => toggleMarkDelete(id)}
          />
        </div>

        <ImagePreviewModal
          open={Boolean(previewUrl)}
          src={previewUrl ?? ''}
          alt={previewName}
          onClose={closePreview}
        />
      </GenericForm>

      {/* Modal Preview */}
      {previewUrl && (
        <div
          className={stylesUpload.modalBackdrop}
          role="dialog"
          aria-label={`Vista previa: ${previewName}`}
        >
          <div className={stylesUpload.modalInner}>
            <button
              className={stylesUpload.modalClose}
              onClick={closePreview}
              aria-label="Cerrar"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
            <div className="relative h-[70vh] w-full">
              <Image
                src={previewUrl}
                alt={previewName}
                fill
                sizes="(max-width: 1200px) 100vw, 1200px"
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
