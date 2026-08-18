'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryStates, parseAsInteger, createSerializer } from 'nuqs'
import { getEvaluadoresAPI, postCasoAPI } from '../services/casosServices'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import GenericForm, { Field } from 'app/components/forms/GenericForm'
import * as Yup from 'yup'
import casoActionSchema from '../schemas/casoActionSchema'
import { Usuario } from 'app/inicio/administrador/usuarios/types/Usuario'
import { EVALUADOR } from '../../usuarios/constants/roles'

const BASE = '/inicio/administrador/casos'

export default function Page() {
  const router = useRouter()
  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()

  const [evaluadoresExamen, setEvaluadoresExamen] = useState<Usuario[]>([])

  const [{ examen, orden }] = useQueryStates({
    examen: parseAsInteger,
    orden: parseAsInteger,
  })

  const serialize = useMemo(
    () =>
      createSerializer({
        examen: parseAsInteger,
        orden: parseAsInteger,
      }),
    [],
  )

  // Gate por hidratación: sólo decidimos si redirigir cuando el cliente ya está listo
  useEffect(() => {
    if (examen == null || orden == null || examen <= 0 || orden <= 0) {
      router.replace(BASE)
    }
  }, [examen, orden, router])

  type FormValues = Yup.InferType<typeof casoActionSchema>
  const initialValues: FormValues = {
    evaluador: '',
    titulo: '',
    orden_relativo: undefined as unknown as number,
  }

  const fields: Field<FormValues>[] = [
    {
      name: EVALUADOR,
      label: 'Evaluador asignado',
      type: 'select',
      options: evaluadoresExamen,
      getOptionValue: (u: Usuario) => u.id,
      getOptionLabel: (u: Usuario) => `${u.apellido}, ${u.nombre}`,
    },
    {
      name: 'titulo',
      label: 'Título',
      type: 'text',
      placeholder: 'Título del caso',
    },
    {
      name: 'orden_relativo',
      label: 'Orden relativo',
      type: 'text',
      placeholder: `Valor sugerido: ${orden ?? ''}`,
    },
  ]

  const handleSubmit = async (values: FormValues) => {
    const examenId = Number(examen ?? 0)
    const saveId = startLoading('Creando caso')
    await postCasoAPI(
      {
        evaluador_id: values.evaluador,
        titulo: values.titulo,
        orden_relativo: values.orden_relativo,
      },
      examenId,
    )
      .then(() => {
        openToast({ severity: 'success', message: 'Caso creado' })
        router.replace(serialize(BASE, { examen: examenId }))
      })
      .finally(() => stopLoading(saveId))
  }

  async function obtenerEvaluadoresDeExamen() {
    const examenId = Number(examen ?? 0)
    const loadingId = startLoading('Cargando opciones')
    await getEvaluadoresAPI(examenId)
      .then((res) => setEvaluadoresExamen(res.data.data))
      .finally(() => stopLoading(loadingId))
  }

  useEffect(() => {
    if (examen != null && examen > 0) void obtenerEvaluadoresDeExamen()
  }, [examen])

  return (
    <div>
      <GenericForm
        title="Caso - Crear"
        fields={fields}
        initialValues={initialValues}
        validationSchema={casoActionSchema}
        onSubmit={handleSubmit}
        onCancel={() => {
          const examenId = Number(examen ?? 0)
          router.replace(serialize(BASE, { examen: examenId }))
        }}
      />
    </div>
  )
}
