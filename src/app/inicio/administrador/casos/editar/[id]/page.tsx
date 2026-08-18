'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryStates, parseAsInteger, createSerializer } from 'nuqs'
import {
  getCasoAPI,
  getEvaluadoresAPI,
  updateCasoAPI,
} from '../../services/casosServices'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import GenericForm, { Field } from 'app/components/forms/GenericForm'
import * as Yup from 'yup'
import casoActionSchema from '../../schemas/casoActionSchema'
import { Usuario } from 'app/inicio/administrador/usuarios/types/Usuario'
import { Caso } from '../../types/Caso'
import { EVALUADOR } from 'app/inicio/administrador/usuarios/constants/roles'

const BASE = '/inicio/administrador/casos'

export default function Page() {
  const { id } = useParams()
  const router = useRouter()
  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()

  const [caso, setCaso] = useState<Partial<Caso>>({})
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

  // Gate por hidratación para evitar redirect falso en F5
  useEffect(() => {
    if (examen == null || orden == null || Number.isNaN(Number(id))) {
      router.replace(BASE)
    }
  }, [examen, orden, id, router])

  async function recuperarCaso() {
    const loadingId = startLoading('Cargando datos')
    await getCasoAPI(Number(id))
      .then((res) => setCaso(res.data.data))
      .finally(() => stopLoading(loadingId))
  }

  useEffect(() => {
    if (id) void recuperarCaso()
  }, [id])

  type FormValues = Yup.InferType<typeof casoActionSchema>
  const initialValues: FormValues = {
    evaluador: (caso.evaluador_id ?? '') as string,
    titulo: (caso.titulo ?? '') as string,
    orden_relativo: (caso.orden_relativo ?? '') as number,
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
    const saveId = startLoading('Guardando cambios')
    await updateCasoAPI(id!.toString(), {
      evaluador_id: values.evaluador,
      titulo: values.titulo,
      orden_relativo: values.orden_relativo,
    })
      .then(() => {
        openToast({ severity: 'success', message: 'Caso actualizado' })
        const examenId = Number(examen ?? 0)
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
        title="Caso - Editar"
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
