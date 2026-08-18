'use client'
import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryStates, parseAsInteger, createSerializer } from 'nuqs'
import { postSeccionAPI } from '../services/seccionesServices'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import GenericForm, { Field } from 'app/components/forms/GenericForm'
import * as Yup from 'yup'
import sectionActionSchema from '../schemas/sectionActionSchema'

const BASE = '/inicio/administrador/secciones'

export default function Page() {
  const router = useRouter()
  const [{ examen, orden }] = useQueryStates({
    examen: parseAsInteger,
    orden: parseAsInteger,
  })
  const serialize = useMemo(
    () => createSerializer({ examen: parseAsInteger, orden: parseAsInteger }),
    [],
  )

  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()

  // Si falta alguno de los params, volver al índice
  if (examen == null || orden == null || examen <= 0 || orden <= 0) {
    if (typeof window !== 'undefined') router.replace(BASE)
    return null
  }

  type FormValues = Yup.InferType<typeof sectionActionSchema>

  const initialValues: FormValues = {
    nombre: '',
    orden_relativo: undefined as unknown as number,
  }

  const fields: Field<FormValues>[] = [
    {
      name: 'nombre',
      label: 'Nombre',
      type: 'text',
      placeholder: 'Nombre de la sección',
    },
    {
      name: 'orden_relativo',
      label: 'Orden relativo',
      type: 'text',
      placeholder: `Valor recomendado: ${orden ?? ''}`,
    },
  ]

  const handleSubmit = async (values: FormValues) => {
    const examenId = Number(examen ?? 0)
    const saveId = startLoading('Creando sección')
    await postSeccionAPI(values, examenId)
      .then(() => {
        openToast({ severity: 'success', message: 'Sección creada' })
        router.replace(serialize(BASE, { examen: examenId }))
      })
      .finally(() => stopLoading(saveId))
  }

  return (
    <div>
      <GenericForm
        title="Sección - Crear"
        fields={fields}
        initialValues={initialValues}
        validationSchema={sectionActionSchema}
        onSubmit={handleSubmit}
        onCancel={() =>
          router.replace(serialize(BASE, { examen: Number(examen ?? 0) }))
        }
      />
    </div>
  )
}
