'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryStates, parseAsInteger, createSerializer } from 'nuqs'
import {
  getSeccionAPI,
  updateSeccionAPI,
} from '../../services/seccionesServices'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import GenericForm, { Field } from 'app/components/forms/GenericForm'
import * as Yup from 'yup'
import sectionActionSchema from '../../schemas/sectionActionSchema'
import { Seccion } from '../../types/Seccion'

const BASE = '/inicio/administrador/secciones'

export default function Page() {
  const { id } = useParams()
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

  const [seccion, setSeccion] = useState<Partial<Seccion>>({})

  // Validación de params antes de cargar
  useEffect(() => {
    if (examen == null || orden == null || Number.isNaN(Number(id))) {
      router.replace(BASE)
    }
  }, [examen, orden, id, router])

  async function recuperarSeccion() {
    const loadingId = startLoading('Cargando datos')
    await getSeccionAPI(id!.toString())
      .then((res) => setSeccion(res.data.data))
      .finally(() => stopLoading(loadingId))
  }

  useEffect(() => {
    if (id) void recuperarSeccion()
  }, [id])

  type FormValues = Yup.InferType<typeof sectionActionSchema>

  const initialValues: FormValues = {
    nombre: (seccion.nombre ?? '') as string,
    orden_relativo: (seccion.orden_relativo ?? '') as number,
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
    const saveId = startLoading('Guardando cambios')
    await updateSeccionAPI(id!.toString(), values)
      .then(() => {
        openToast({ severity: 'success', message: 'Sección actualizada' })
        router.replace(serialize(BASE, { examen: Number(examen ?? 0) }))
      })
      .finally(() => stopLoading(saveId))
  }

  return (
    <div>
      <GenericForm
        title="Sección - Editar"
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
