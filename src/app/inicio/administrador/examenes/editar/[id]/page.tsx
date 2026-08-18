'use client'
import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  buildExamenPayload,
  getExamenAPI,
  updateExamenAPI,
} from '../../services/examenesServices'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import GenericForm, { Field } from 'app/components/forms/GenericForm'
import * as Yup from 'yup'
import examActionSchema from '../../schemas/examActionSchema'
import { Examen } from '../../types/Examen'

export default function Page() {
  const { id } = useParams()
  const router = useRouter()
  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()
  const [examen, setExamen] = useState<Examen | null>(null)

  async function recuperarExamen() {
    const loadingId = startLoading('Cargando datos')
    await getExamenAPI(Number(id))
      .then((res) => setExamen(res.data.data))
      .finally(() => stopLoading(loadingId))
  }

  useEffect(() => {
    recuperarExamen()
  }, [id])

  const formatDateForInput = (dateString?: string): string =>
    dateString ? new Date(dateString).toISOString().split('T')[0] : ''

  type FormValues = Yup.InferType<typeof examActionSchema>

  const initialValues: FormValues = {
    nombre: (examen?.nombre ?? '') as string,
    fecha: formatDateForInput(examen?.fecha),
    codigo: (examen?.codigo ?? '') as string,
    descargable: examen?.descargable ?? false,
    retrocedible: examen?.retrocedible ?? false,
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
    const saveId = startLoading('Guardando cambios')
    const payload = buildExamenPayload(values)
    await updateExamenAPI(id!.toString(), payload)
      .then(() => {
        openToast({ severity: 'success', message: 'Examen actualizado' })
        router.back()
      })
      .finally(() => stopLoading(saveId))
  }

  return (
    <div>
      <GenericForm
        title="Examen - Editar"
        fields={fields}
        initialValues={initialValues}
        validationSchema={examActionSchema}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  )
}
