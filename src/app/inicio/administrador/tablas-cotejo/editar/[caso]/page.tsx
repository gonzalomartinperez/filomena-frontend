/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryState, parseAsInteger, createSerializer } from 'nuqs'
import { useFormik } from 'formik'
import {
  getPreguntasDeCasoAPI,
  getCasoAPI,
  getCasosAPI,
} from '../../../casos/services/casosServices'
import { getSeccionesAPI } from '../../../secciones/services/seccionesServices'
import {
  getTablasCotejoAPI,
  getTablaCotejoAPI,
  updateTablaCotejoAPI,
} from '../../services/tablasCotejoServices'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import GenericForm, { Field } from 'app/components/forms/GenericForm'
import tablaCotejoActionSchema, {
  TablaCotejoValues,
} from '../../schemas/tablaCotejoActionSchema'
import { Caso } from '../../../casos/types/Caso'
import { Pregunta } from '../../../preguntas/types/Pregunta'
import { Seccion } from '../../../secciones/types/Seccion'
import { TablaCotejo, Item as ItemType } from '../../types/TablaCotejo'
import SeccionEditor from '../../components/SeccionEditor'

const BASE = '/inicio/administrador/tablas-cotejo'
const toArray = (v: any): any[] => {
  if (Array.isArray(v)) return v
  if (v && Array.isArray(v.data)) return v.data
  if (v && Array.isArray(v.preguntas)) return v.preguntas
  return []
}

export default function Page() {
  const { caso } = useParams<{ caso: string }>()
  const router = useRouter()
  const [examenId] = useQueryState('examen', parseAsInteger)
  const serialize = useMemo(
    () => createSerializer({ examen: parseAsInteger }),
    [],
  )

  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()

  // Catálogos
  const [casosExamen, setCasosExamen] = useState<Caso[]>([])
  const [seccionesExamen, setSeccionesExamen] = useState<Seccion[]>([])

  // Datos del caso actual
  const [casoInfo, setCasoInfo] = useState<Caso | null>(null)
  const [preguntasCaso, setPreguntasCaso] = useState<Pregunta[]>([])
  const [tablas, setTablas] = useState<TablaCotejo[]>([]) // completas (con items)

  // UI: checkboxes de secciones visibles (solo controla visibilidad, no el payload)
  const [seccionesDisponibles, setSeccionesDisponibles] = useState<Seccion[]>(
    [],
  )
  const [seccionesVisibles, setSeccionesVisibles] = useState<string[]>([])

  useEffect(() => {
    if (examenId == null || examenId <= 0) {
      router.replace(BASE)
    }
  }, [examenId, router])

  useEffect(() => {
    if (!caso || !examenId) return
    const loadId = startLoading('Cargando datos')
    ;(async () => {
      try {
        const [casosRes, seccionesRes] = await Promise.all([
          getCasosAPI(Number(examenId)),
          getSeccionesAPI(Number(examenId)),
        ])
        setCasosExamen((casosRes?.data?.data as Caso[]) ?? [])
        setSeccionesExamen((seccionesRes?.data?.data as Seccion[]) ?? [])

        const [casoRes, preguntasRes, tablasRes] = await Promise.all([
          getCasoAPI(Number(caso)),
          getPreguntasDeCasoAPI(Number(caso)),
          getTablasCotejoAPI(Number(examenId)),
        ])
        setCasoInfo(casoRes?.data?.data as Caso)

        const preguntasArr = toArray(preguntasRes?.data?.data)
        setPreguntasCaso(preguntasArr as Pregunta[])

        const tablasExamen = (tablasRes?.data?.data as TablaCotejo[]) ?? []
        const tablasDelCaso = tablasExamen.filter(
          (t) => Number(t.caso_id) === Number(caso),
        )
        const completas = await Promise.all(
          tablasDelCaso.map((t) =>
            getTablaCotejoAPI(t.id).then((r) => r?.data?.data as TablaCotejo),
          ),
        )
        setTablas(completas)

        const secIdsConTabla = new Set(
          completas.map((t) => String(t.seccion_id)),
        )
        const disponibles = (seccionesRes?.data?.data as Seccion[]).filter(
          (s) => secIdsConTabla.has(String(s.id)),
        )
        setSeccionesDisponibles(disponibles)
        setSeccionesVisibles(disponibles.map((s) => String(s.id)))
      } finally {
        stopLoading(loadId)
      }
    })()
  }, [caso, examenId])

  const initialValues: TablaCotejoValues = useMemo(() => {
    const secs = (tablas ?? []).map((t) => ({
      seccion_id: String(t.seccion_id),
      items: (t.items ?? []).map((it: ItemType) => ({
        id: it.id,
        descripcion: it.descripcion,
        valor: it.valor,
        pregunta_id: String(it.pregunta_id),
      })),
    }))
    return { caso: String(caso ?? ''), secciones: secs }
  }, [tablas, caso])

  const formik = useFormik<TablaCotejoValues>({
    initialValues,
    enableReinitialize: true,
    validationSchema: tablaCotejoActionSchema,
    onSubmit: handleSubmit,
  })

  // sincroniza select de caso ⇄ URL (preserva ?examen= con nuqs)
  useEffect(() => {
    const selected = String(formik.values.caso || '')
    if (!selected || String(caso) === selected) return
    router.replace(
      serialize(`${BASE}/editar/${selected}`, {
        examen: Number(examenId ?? 0),
      }),
    )
  }, [formik.values.caso])

  async function handleSubmit(values: TablaCotejoValues) {
    const saveId = startLoading('Guardando cambios')
    try {
      const updates = (values.secciones ?? []).map(async (sec) => {
        const existing = tablas.find(
          (t) => String(t.seccion_id) === String(sec.seccion_id),
        )
        if (!existing?.id) return Promise.resolve()

        const itemsPayload = (sec.items ?? []).map((item) => ({
          ...(item.id ? { id: Number(item.id) } : {}),
          descripcion: item.descripcion,
          valor: Number(item.valor),
          pregunta_id: Number(item.pregunta_id),
        }))

        const payload = {
          caso_id: Number(values.caso),
          seccion_id: Number(sec.seccion_id),
          items: itemsPayload,
        }
        return updateTablaCotejoAPI(existing.id, payload)
      })

      await Promise.all(updates)
      openToast({
        severity: 'success',
        message: 'Tabla de cotejo del caso actualizada',
      })
      router.replace(serialize(BASE, { examen: Number(examenId ?? 0) }))
    } finally {
      stopLoading(saveId)
    }
  }

  const fields: Field<TablaCotejoValues>[] = useMemo(
    () => [
      {
        name: 'caso',
        label: 'Caso',
        type: 'select',
        disabled: true,
        options: casosExamen,
        getOptionValue: (c: Caso) => String(c.id),
        getOptionLabel: (c: Caso) => `${c.titulo}`,
      },
      {
        name: 'secciones',
        label: 'Secciones',
        type: 'custom',
        fullRow: true,
        render: () => (
          <div className="flex flex-row flex-wrap gap-4">
            {seccionesDisponibles.map((s) => {
              const id = String(s.id)
              const checked = seccionesVisibles.includes(id)
              return (
                <label
                  key={id}
                  className="inline-flex items-center gap-2 text-sm text-gray-800"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setSeccionesVisibles((prev) =>
                        prev.includes(id)
                          ? prev.filter((x) => x !== id)
                          : [...prev, id],
                      )
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {s.nombre}
                </label>
              )
            })}
          </div>
        ),
      },
    ],
    [casosExamen, seccionesDisponibles, seccionesVisibles],
  )

  const preguntasDisponibles = (preguntasCaso ?? []).map((p) => ({
    id: String(p.id),
    texto: `Pregunta N° ${p.orden_relativo}`,
    orden_relativo: p.orden_relativo,
  }))

  const seccionesForEditor = useMemo(
    () =>
      (formik.values.secciones ?? []).filter((s) =>
        seccionesVisibles.includes(String(s.seccion_id)),
      ),
    [formik.values.secciones, seccionesVisibles],
  )

  const seccionesFullInfoForEditor = useMemo(
    () =>
      seccionesExamen.filter((sec) =>
        seccionesForEditor.some(
          (sv) => String(sv.seccion_id) === String(sec.id),
        ),
      ),
    [seccionesExamen, seccionesForEditor],
  )

  const ready = Boolean(casoInfo) && (formik.values.secciones ?? []).length > 0
  if (!ready) return null

  return (
    <div>
      <GenericForm
        title="Tablas de Cotejo - Editar"
        fields={fields}
        formikInstance={formik}
        onCancel={() =>
          router.replace(serialize(BASE, { examen: Number(examenId ?? 0) }))
        }
        classes={{ form: 'bg-white shadow rounded-lg p-6' }}
        showSectionEditor
      >
        <SeccionEditor
          seccionesWithFullInfo={seccionesFullInfoForEditor}
          secciones={seccionesForEditor.map((s) => ({
            ...s,
            items: s.items ?? [],
          }))}
          setSecciones={(nv) => formik.setFieldValue('secciones', nv)}
          preguntasDisponibles={preguntasDisponibles}
          formik={formik}
        />
      </GenericForm>
    </div>
  )
}
