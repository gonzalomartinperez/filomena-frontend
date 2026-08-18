'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import { Button } from 'app/components/buttons/GeneralButton'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { Caso } from '../types/Caso'
import { getCasoAPI, getPreguntasDeCasoAPI } from '../services/casosServices'
import { Pregunta } from '../../preguntas/types/Pregunta'
import {
  TablaCotejo,
  Item,
  PuntajesResponse,
  SeccionHeader,
} from '../../tablas-cotejo/types/TablaCotejo'
import {
  getTablaCotejoAPI,
  getPuntajesTablaCotejoAPI,
} from '../../tablas-cotejo/services/tablasCotejoServices'
import { getSeccionAPI } from '../../secciones/services/seccionesServices'
import { Seccion as SeccionType } from '../../secciones/types/Seccion'
import MetaInfo, { MetaField } from '../../components/metaInfo/MetaInfo'
import TablaCotejoStructure, {
  Columna,
  Seccion,
} from '../../components/tablaCotejoStructure/TablaCotejoStructure'
import PreguntasDeCaso, {
  PreguntasDeCasoColumn,
} from '../../components/preguntasDeCaso/PreguntasDeCaso'
import { EVALUADOR } from '../../usuarios/constants/roles'

const styles = {
  container: 'p-6',
  heading: 'text-4xl border-b border-gray-200 mb-6',
  label: 'text-blue-700 text-xl font-semibold mt-4',
  value: 'text-gray-800',
  interactiveValue:
    'text-indigo-600 underline transition-colors hover:opacity-80',
  table: 'mb-6 min-w-full mt-4',
  thead: 'bg-gray-100 text-left text-sm font-semibold text-gray-700',
  th: 'px-4 py-2 border-b border-gray-300',
  td: 'px-4 py-2 align-top border-b border-gray-300 text-sm text-gray-800',
  tdClamped:
    'px-4 py-2 align-top border-b border-gray-300 text-sm text-gray-800 max-w-xs',
  clampedText: 'line-clamp-3 break-words',
  link: 'text-blue-600 hover:underline',
  sectionRow: 'bg-gray-50 text-blue-800 font-semibold',
}

export default function CasoView() {
  const router = useRouter()
  const { id } = useParams()
  const [caso, setCaso] = useState<Partial<Caso>>({})
  const [preguntasCaso, setPreguntasCaso] = useState<Pregunta[]>([])
  const [tablaCotejo, setTablaCotejo] = useState<TablaCotejo>()
  const [puntajes, setPuntajes] = useState<PuntajesResponse>()
  const [seccion, setSeccion] = useState<SeccionType>()

  const {
    actions: { startLoading, stopLoading },
  } = useVisualNotifications()

  const metaFields: MetaField<Partial<Caso>>[] = [
    {
      name: EVALUADOR,
      label: 'Evaluador asignado',
      type: 'link',
      getValue: (data) => {
        const ev = data.evaluador ?? null
        return ev && (ev.apellido || ev.nombre)
          ? `${ev.apellido ?? ''}${ev.apellido ? ', ' : ''}${ev.nombre ?? ''}`
          : ''
      },
      getHref: (data) => {
        const dni = data.evaluador?.dni
        return dni ? `/inicio/administrador/usuarios/${dni}` : ''
      },
    },
    { name: 'titulo', label: 'Título', type: 'text' },
    { name: 'orden_relativo', label: 'Orden relativo', type: 'text' },
  ]

  const preguntasColumns: PreguntasDeCasoColumn<Pregunta>[] = [
    {
      key: 'orden_relativo',
      header: 'Orden relativo',
      type: 'link',
      getValue: (pregunta) => `Pregunta N°${pregunta.orden_relativo}`,
      getHref: (pregunta) => `/inicio/administrador/preguntas/${pregunta.id}`,
    },
    { key: 'descripcion', header: 'Descripción', isClamped: true },
    { key: 'consigna', header: 'Consigna', isClamped: true },
  ]

  const tablaCotejoColumns: Columna<Item, Pregunta[]>[] = [
    { key: 'seccion', header: 'Sección', getValue: () => '' },
    {
      key: 'descripcion',
      header: 'Ítem',
      getValue: (item) => item.descripcion,
    },
    { key: 'valor', header: 'Valor', getValue: (item) => item.valor },
    {
      key: 'pregunta_id',
      header: 'Pregunta',
      type: 'link',
      getValue: (item, preguntasCaso) => {
        const p = preguntasCaso?.find((pp) => pp.id === item.pregunta_id)
        return `Pregunta N°${p?.orden_relativo ?? '?'}`
      },
      getHref: (item) => `/inicio/administrador/preguntas/${item.pregunta_id}`,
    },
  ]

  const sections: Seccion<SeccionHeader, Item>[] = (() => {
    if (!tablaCotejo) return []
    const items = tablaCotejo.items ?? []

    const subtotal =
      typeof puntajes?.totales?.seccion === 'number'
        ? Number(puntajes.totales.seccion)
        : items.reduce((acc, it) => acc + (Number(it.valor) || 0), 0)

    const total =
      typeof puntajes?.totales?.caso === 'number'
        ? Number(puntajes.totales.caso)
        : subtotal

    const nombreSeccion =
      seccion?.nombre ?? `Sección #${tablaCotejo.seccion_id}`

    const seccionHeader: SeccionHeader = {
      seccion_nombre: nombreSeccion,
      subtotal,
      total,
    }

    return [
      {
        sectionData: seccionHeader,
        items,
        getSectionName: (section) => (
          <>
            <span className="text-base text-blue-500">
              {section.seccion_nombre}
            </span>
            <br />
          </>
        ),
        getSectionExtra: (section) => (
          <span className="text-green-600">
            Total: {section.subtotal}/{section.total}
          </span>
        ),
      },
    ]
  })()

  async function recuperarInformacionCaso() {
    const loadingId = startLoading('Cargando datos')
    await Promise.all([
      getCasoAPI(Number(id)).then((res) => setCaso(res.data.data)),
      getPreguntasDeCasoAPI(Number(id!)).then((res) =>
        setPreguntasCaso(res.data.data),
      ),
      getTablaCotejoAPI(id!.toString()).then(async (res) => {
        const data = res.data.data as TablaCotejo
        setTablaCotejo(data)

        const [punt, sec] = await Promise.all([
          getPuntajesTablaCotejoAPI(data.id),
          getSeccionAPI(String(data.seccion_id)),
        ])
        setPuntajes(punt.data.data as PuntajesResponse)
        setSeccion(sec.data.data as SeccionType)
      }),
    ]).finally(() => stopLoading(loadingId))
  }

  useEffect(() => {
    recuperarInformacionCaso()
  }, [id])

  return (
    <div className={styles.container}>
      {/* Volver */}
      <div className="mt-6 mb-2 flex justify-start">
        <Button
          type="button"
          icon={faArrowLeft}
          variant="light"
          onClick={() => router.back()}
        >
          Volver
        </Button>
      </div>

      <MetaInfo title="Caso" fields={metaFields} data={caso} />

      <PreguntasDeCaso
        title="Preguntas del caso"
        columns={preguntasColumns}
        data={preguntasCaso}
      />

      <TablaCotejoStructure
        title="Tabla de cotejo"
        columns={tablaCotejoColumns}
        sections={sections}
        additionalData={preguntasCaso}
      />
    </div>
  )
}
