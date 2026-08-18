'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { buildExamenPayload, postExamenAPI } from '../services/examenesServices'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import GenericForm, { Field } from 'app/components/forms/GenericForm'
import * as Yup from 'yup'
import examActionSchema from '../schemas/examActionSchema'

export default function Page() {
  const router = useRouter()
  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()

  type FormValues = Yup.InferType<typeof examActionSchema>

  const initialValues: FormValues = {
    nombre: '',
    fecha: '',
    codigo: '',
    descargable: false,
    retrocedible: false,
  }

  const fields: Field<FormValues>[] = [
    { name: 'nombre', label: 'Nombre', type: 'text' },
    { name: 'fecha', label: 'Fecha', type: 'date' },
    { name: 'codigo', label: 'Código', type: 'text' },
    {
      name: 'descargable',
      label: 'Permitir la descarga del examen',
      type: 'checkbox',
      informacion:
        'Marcar esta casilla habilita al estudiante a descargar el examen luego de finalizado',
    },
    {
      name: 'retrocedible',
      label: 'Permitir retroceder durante el examen',
      type: 'checkbox',
      informacion: 'Si está marcado, el estudiante puede navegar hacia atrás.',
    },
  ]

  const handleSubmit = async (values: FormValues) => {
    const saveId = startLoading('Creando examen')
    const payload = buildExamenPayload(values)
    await postExamenAPI(payload)
      .then(() => {
        openToast({ severity: 'success', message: 'Examen creado' })
        router.push('/inicio/administrador/examenes')
      })
      .finally(() => stopLoading(saveId))
  }

  return (
    <div>
      <GenericForm
        title="Examen - Crear"
        fields={fields}
        initialValues={initialValues}
        validationSchema={examActionSchema}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  )
}
