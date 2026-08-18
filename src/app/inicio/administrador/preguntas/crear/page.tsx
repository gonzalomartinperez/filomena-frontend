'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useQueryState, parseAsInteger, createSerializer } from 'nuqs'
import { getCasosAPI } from '../../casos/services/casosServices'
import { getPreguntasAPI, postPreguntaAPI } from '../services/preguntasServices'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import GenericForm, { Field } from 'app/components/forms/GenericForm'
import * as Yup from 'yup'
import preguntaActionSchema from '../schemas/preguntaActionSchema'
import { Caso } from '../../casos/types/Caso'
import UploadDropzone from 'app/components/uploads/UploadDropzone'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { uploadArchivoPreguntaAPI } from 'app/inicio/administrador/mochila-carga/services/mochilaCargaServices'
import FileCardGrid from 'app/components/files/FileCardGrid'
import ImagePreviewModal from 'app/components/files/ImagePreviewModal'
import { Pregunta } from '../types/Pregunta'

const BASE = '/inicio/administrador/preguntas'

const styles = {
  hint: 'text-xs text-gray-600',
  grid: 'mt-4 grid [grid-template-columns:repeat(6,minmax(140px,1fr))] gap-4 overflow-y-auto pb-6 max-[980px]:[grid-template-columns:repeat(4,minmax(140px,1fr))] max-[640px]:[grid-template-columns:repeat(2,minmax(140px,1fr))]',
  cardBase:
    'relative group overflow-hidden rounded-xl border border-gray-200 bg-white shadow hover:shadow-lg hover:ring-2 hover:ring-blue-500/60 transition',
  cardBody: 'flex aspect-square items-center justify-center p-1',
  fileName:
    'w-full truncate px-2 py-1 text-center text-sm font-medium bg-gray-50 group-hover:bg-blue-50 group-hover:text-blue-600',
  modalBackdrop:
    'fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4',
  modalInner: 'relative w-full max-w-5xl',
  modalClose:
    'absolute -top-3 -right-3 rounded-full bg-white/90 p-2 shadow hover:bg-white',
}

export default function Page() {
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

  const [casosExamen, setCasosExamen] = useState<Caso[]>([])
  const [selectedCaso, setSelectedCaso] = useState<number | null>(null)

  // Para calcular sugerencias localmente
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])

  // Imágenes locales (se suben luego del submit)
  const [localImages, setLocalImages] = useState<File[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewName, setPreviewName] = useState<string>('')

  // Validación mínima de params
  useEffect(() => {
    if (examen == null || examen <= 0) {
      router.replace(BASE)
    }
  }, [examen, router])

  // Cargar casos del examen
  useEffect(() => {
    if (examen == null || examen <= 0) return
    const loadingId = startLoading('Cargando opciones')
    getCasosAPI(Number(examen))
      .then((res) => setCasosExamen(res.data.data))
      .finally(() => stopLoading(loadingId))
  }, [examen])

  // Cargar preguntas del examen (para sugerir orden_relativo por caso)
  useEffect(() => {
    if (examen == null || examen <= 0) return
    const loadingId = startLoading('Cargando preguntas')
    getPreguntasAPI(Number(examen))
      .then((res) => setPreguntas(res.data.data ?? []))
      .finally(() => stopLoading(loadingId))
  }, [examen])

  // Si el examen tiene un único caso, seleccionarlo por defecto
  useEffect(() => {
    if (selectedCaso == null && casosExamen.length === 1) {
      setSelectedCaso(Number(casosExamen[0].id))
    }
  }, [casosExamen, selectedCaso])

  // Caso “efectivo” para calcular la sugerencia (selected o el único disponible)
  const effectiveCaso = useMemo(
    () =>
      selectedCaso != null
        ? selectedCaso
        : casosExamen.length === 1
          ? Number(casosExamen[0].id)
          : null,
    [selectedCaso, casosExamen],
  )

  type FormValues = Yup.InferType<typeof preguntaActionSchema>

  const initialValues: FormValues = {
    caso: '',
    descripcion: '',
    consigna: '',
    orden_relativo: '' as unknown as number,
  }

  // Mapa { caso_id → max(orden_relativo) } a partir de preguntas reales
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
        placeholder: effectiveCaso
          ? `Valor sugerido: ${getNextOrdenForCaso(effectiveCaso)}`
          : 'Valor sugerido: 1',
      },
    ],
    [casosExamen, effectiveCaso, ordenesMap],
  )

  const handleSubmit = async (values: FormValues) => {
    const examenId = Number(examen ?? 0)
    const loadId = startLoading('Creando pregunta…')
    try {
      const res = await postPreguntaAPI(
        {
          consigna: values.consigna,
          descripcion: values.descripcion,
          orden_relativo: values.orden_relativo,
          caso_id: values.caso,
        },
        examenId,
      )
      const preguntaId = (res?.data?.data as { id: number } | undefined)?.id

      if (preguntaId && localImages.length > 0) {
        const upId = startLoading('Subiendo imágenes…')
        try {
          await Promise.all(
            localImages.map((f) => uploadArchivoPreguntaAPI(preguntaId, f)),
          )
          openToast({
            severity: 'success',
            message: 'Imágenes subidas correctamente.',
          })
        } catch {
          openToast({
            severity: 'error',
            message: 'Ocurrió un problema al subir las imágenes.',
          })
        } finally {
          stopLoading(upId)
        }
      }

      openToast({ severity: 'success', message: 'Pregunta creada' })
      router.replace(serialize(BASE, { examen: examenId }))
    } finally {
      stopLoading(loadId)
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
    if (accepted.length) {
      const next = [...localImages]
      accepted.forEach((f) => {
        if (!next.some((x) => x.name === f.name && x.size === f.size))
          next.push(f)
      })
      setLocalImages(next)
    }
  }

  const removeLocal = (name: string, size: number) => {
    setLocalImages((prev) =>
      prev.filter((f) => !(f.name === name && f.size === size)),
    )
  }

  const previewLocal = (file: File) => {
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setPreviewName(file.name)
  }

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setPreviewName('')
  }

  return (
    <div>
      <GenericForm
        title="Pregunta - Crear"
        fields={fields}
        initialValues={initialValues}
        validationSchema={preguntaActionSchema}
        onSubmit={handleSubmit}
        onCancel={() =>
          router.replace(serialize(BASE, { examen: Number(examen ?? 0) }))
        }
        showUploadSlot
      >
        <UploadDropzone
          disabled={false}
          multiple
          accept=".png,.jpg,.jpeg,image/png,image/jpeg"
          maxSizeMB={20}
          title="Arrastrá o hacé clic para agregar imágenes"
          subtitle="Formatos: .png · .jpg · .jpeg"
          onFiles={handleFiles}
        />

        {localImages.length > 0 && (
          <>
            <p className="mt-4 text-xs text-gray-600">
              Estas imágenes se subirán al guardar la pregunta.
            </p>

            <FileCardGrid
              className="mt-4"
              columns="compact"
              size="sm"
              items={localImages}
              onPreview={(it) => {
                if (it instanceof File) previewLocal(it)
              }}
              onRemove={(f) => removeLocal(f.name, f.size)}
            />
          </>
        )}

        <ImagePreviewModal
          open={Boolean(previewUrl)}
          src={previewUrl ?? ''}
          alt={previewName}
          onClose={closePreview}
        />
      </GenericForm>

      {previewUrl && (
        <div
          className={styles.modalBackdrop}
          role="dialog"
          aria-label={`Vista previa: ${previewName}`}
        >
          <div className={styles.modalInner}>
            <button
              className={styles.modalClose}
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
