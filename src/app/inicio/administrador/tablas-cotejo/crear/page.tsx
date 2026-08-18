'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFormik } from 'formik'
import { useQueryState, parseAsInteger, createSerializer } from 'nuqs'
import {
  getCasosAPI,
  getPreguntasDeCasoAPI,
} from '../../casos/services/casosServices'
import {
  createTablaCotejoAPI,
  getTablasCotejoAPI,
} from '../services/tablasCotejoServices'
import { getSeccionesAPI } from '../../secciones/services/seccionesServices'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import GenericForm, { Field } from 'app/components/forms/GenericForm'
import tablasCotejoActionSchema, {
  TablaCotejoValues,
} from '../schemas/tablaCotejoActionSchema'
import { Caso } from '../../casos/types/Caso'
import { Pregunta } from '../../preguntas/types/Pregunta'
import { Seccion } from '../../secciones/types/Seccion'
import SeccionEditor, { SeccionEditorType } from '../components/SeccionEditor'
import { TablaCotejo } from '../types/TablaCotejo'
import { agruparPorCaso, CasoRow } from '../utils/tablaCotejoHelperFunctions'

const BASE = '/inicio/administrador/tablas-cotejo'

const initialValues: TablaCotejoValues = { caso: '', secciones: [] }

export default function Page() {
  const router = useRouter()
  const [examenId] = useQueryState('examen', parseAsInteger)
  const serialize = useMemo(
    () => createSerializer({ examen: parseAsInteger }),
    [],
  )

  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()

  const [casosExamen, setCasosExamen] = useState<Caso[]>([])
  const [seccionesExamen, setSeccionesExamen] = useState<Seccion[]>([])
  const [preguntasCaso, setPreguntasCaso] = useState<Pregunta[]>([])

  const fields: Field<TablaCotejoValues>[] = useMemo(
    () => [
      {
        name: 'caso',
        label: 'Caso',
        type: 'select',
        options: casosExamen,
        getOptionValue: (c: Caso) => c.id,
        getOptionLabel: (c: Caso) => `${c.titulo}`,
      },
      {
        name: 'secciones',
        label: 'Secciones',
        type: 'checkbox',
        options: seccionesExamen,
        getOptionValue: (s: Seccion) => s.id,
        getOptionLabel: (s: Seccion) => s.nombre!,
        fullRow: true,
      },
    ],
    [casosExamen, seccionesExamen],
  )

  const formik = useFormik<TablaCotejoValues>({
    initialValues,
    enableReinitialize: true,
    validationSchema: tablasCotejoActionSchema,
    onSubmit: handleSubmit,
  })

  function normalizeSeccionesForEditor(
    secs: TablaCotejoValues['secciones'],
  ): SeccionEditorType[] {
    return (secs ?? []).map((s) => ({
      seccion_id: s.seccion_id,
      items: (s.items ?? []).map((it) => ({
        descripcion: it.descripcion,
        valor: it.valor,
        pregunta_id: it.pregunta_id,
      })),
    }))
  }

  async function handleSubmit(values: TablaCotejoValues) {
    const caso_id = Number(values.caso)
    const payloads = (values.secciones ?? []).map((sec) => ({
      caso_id,
      seccion_id: Number(sec.seccion_id),
      items: (sec.items ?? []).map((item) => ({
        pregunta_id: Number(item.pregunta_id),
        descripcion: item.descripcion,
        valor: Number(item.valor),
      })),
    }))

    const loadingId = startLoading('Creando tablas')
    await Promise.all(payloads.map((p) => createTablaCotejoAPI(p)))
      .then(() => {
        openToast({
          severity: 'success',
          message: 'Tabla(s) de cotejo creada(s)',
        })
        router.replace(serialize(BASE, { examen: Number(examenId ?? 0) }))
      })
      .finally(() => stopLoading(loadingId))
  }

  useEffect(() => {
    if (examenId == null || examenId <= 0) {
      router.replace(BASE)
      return
    }
    const loadingId = startLoading('Cargando datos')
    Promise.all([
      getCasosAPI(Number(examenId)),
      getSeccionesAPI(Number(examenId)),
      getTablasCotejoAPI(Number(examenId)),
    ])
      .then(([casosRes, secsRes, tcotRes]) => {
        const tablas = (tcotRes.data.data as TablaCotejo[]) ?? []
        const tablasDeCaso: CasoRow[] = agruparPorCaso(tablas)
        const casosConTablas = new Set(
          tablasDeCaso.map((tabla) => tabla.caso_id),
        )
        const casosDisponibles: Caso[] = casosRes.data.data.filter(
          (c: Caso) => !casosConTablas.has(c.id),
        )

        setCasosExamen(casosDisponibles)
        setSeccionesExamen(secsRes.data.data as Seccion[])
      })
      .finally(() => stopLoading(loadingId))
  }, [examenId])

  async function onCasoChange(caso_id: number) {
    const loadingId = startLoading('Cargando preguntas del caso')
    await getPreguntasDeCasoAPI(caso_id)
      .then((res) => {
        const nuevasPreguntas = (res.data.data as Pregunta[]).filter(
          (p) => p.consigna,
        )
        setPreguntasCaso(nuevasPreguntas)
        const prevSecciones = formik.values.secciones ?? []
        const nextSecciones: SeccionEditorType[] = prevSecciones.map((s) => ({
          seccion_id: s.seccion_id,
          items: (s.items ?? []).map((it) => ({
            descripcion: it.descripcion,
            valor: Number(it.valor),
            pregunta_id: '',
          })),
        }))
        formik.setFieldValue('secciones', nextSecciones, false)
      })
      .finally(() => stopLoading(loadingId))
  }

  useEffect(() => {
    if (formik.values.caso) onCasoChange(Number(formik.values.caso))
  }, [formik.values.caso])

  const seccionesForEditor = normalizeSeccionesForEditor(
    formik.values.secciones,
  )

  return (
    <div>
      <GenericForm
        title="Tabla de Cotejo - Crear"
        fields={fields}
        formikInstance={formik}
        onCancel={() =>
          router.replace(serialize(BASE, { examen: Number(examenId ?? 0) }))
        }
        classes={{ form: 'bg-white shadow rounded-lg p-6' }}
        showSectionEditor
      >
        <SeccionEditor
          seccionesWithFullInfo={seccionesExamen}
          secciones={seccionesForEditor}
          setSecciones={(nv) => formik.setFieldValue('secciones', nv)}
          preguntasDisponibles={preguntasCaso.map((p) => ({
            id: p.id.toString(),
            texto: `Pregunta N° ${p.orden_relativo}`,
            orden_relativo: p.orden_relativo,
          }))}
          formik={formik}
        />
      </GenericForm>
    </div>
  )
}
