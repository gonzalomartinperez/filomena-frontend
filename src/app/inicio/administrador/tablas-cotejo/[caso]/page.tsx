'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQueryState, parseAsInteger } from 'nuqs'
import { Button } from 'app/components/buttons/GeneralButton'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import {
  getCasoAPI,
  getPreguntasDeCasoAPI,
} from '../../casos/services/casosServices'
import { getSeccionesAPI } from '../../secciones/services/seccionesServices'
import {
  getTablasCotejoAPI,
  getTablaCotejoAPI,
} from '../services/tablasCotejoServices'
import { Caso } from '../../casos/types/Caso'
import { Pregunta } from '../../preguntas/types/Pregunta'
import { Seccion as SeccionType } from '../../secciones/types/Seccion'
import { TablaCotejo, Item } from '../types/TablaCotejo'
import TablaCotejoStructure, {
  Columna,
  Seccion as SeccionStruct,
} from '../../components/tablaCotejoStructure/TablaCotejoStructure'
import MetaInfo, { MetaField } from '../../components/metaInfo/MetaInfo'

const BASE = '/inicio/administrador/tablas-cotejo'

export default function TablaCotejoPorCaso() {
  const router = useRouter()
  const { caso } = useParams<{ caso: string }>()
  const [examenId] = useQueryState('examen', parseAsInteger)

  const [casoInfo, setCasoInfo] = useState<Caso>()
  const [preguntasCaso, setPreguntasCaso] = useState<Pregunta[]>([])
  const [seccionesCatalogo, setSeccionesCatalogo] = useState<SeccionType[]>([])
  const [tablas, setTablas] = useState<TablaCotejo[]>([])

  const {
    actions: { startLoading, stopLoading },
  } = useVisualNotifications()

  useEffect(() => {
    if (examenId == null || examenId <= 0) {
      router.replace(BASE)
    }
  }, [examenId, router])

  useEffect(() => {
    if (!caso || !examenId) return
    let alive = true
    const loadId = startLoading('Cargando tablas del caso')
    ;(async () => {
      try {
        const [casoRes, pregRes, secsRes, tablasRes] = await Promise.all([
          getCasoAPI(Number(caso)),
          getPreguntasDeCasoAPI(Number(caso)),
          getSeccionesAPI(Number(examenId)),
          getTablasCotejoAPI(Number(examenId)),
        ])
        if (!alive) return

        const allTablasExamen = (tablasRes.data.data as TablaCotejo[]) ?? []
        const tablasDelCaso = allTablasExamen.filter(
          (t) => Number(t.caso_id) === Number(caso),
        )
        const full = await Promise.all(
          tablasDelCaso.map((t) =>
            getTablaCotejoAPI(String(t.id)).then(
              (r) => r.data.data as TablaCotejo,
            ),
          ),
        )

        setCasoInfo(casoRes.data.data as Caso)
        setPreguntasCaso(pregRes.data.data as Pregunta[])
        setSeccionesCatalogo(secsRes.data.data as SeccionType[])
        setTablas(full)
      } finally {
        stopLoading(loadId)
      }
    })()
    return () => {
      alive = false
    }
  }, [caso, examenId])

  const preguntasIdx = useMemo(() => {
    const m = new Map<number, Pregunta>()
    preguntasCaso.forEach((p) => m.set(p.id, p))
    return m
  }, [preguntasCaso])

  const seccionNombre = (id: number) =>
    seccionesCatalogo.find((s) => Number(s.id) === Number(id))?.nombre ??
    `Sección #${id}`

  const columns: Columna<Item, { preguntasIdx: Map<number, Pregunta> }>[] = [
    { key: 'seccion', header: 'Sección', getValue: () => '' },
    { key: 'descripcion', header: 'Ítem', getValue: (i) => i.descripcion },
    { key: 'valor', header: 'Valor', getValue: (i) => i.valor },
    {
      key: 'pregunta_id',
      header: 'Pregunta',
      type: 'link',
      getValue: (i, ad) => {
        const p = ad?.preguntasIdx?.get(i.pregunta_id)
        return `Pregunta N°${p?.orden_relativo ?? '?'}`
      },
      getHref: (i) => `/inicio/administrador/preguntas/${i.pregunta_id}`,
    },
  ]

  const totalCaso = useMemo(
    () =>
      tablas.reduce(
        (acc, t) =>
          acc + (t.items ?? []).reduce((a, it) => a + Number(it.valor || 0), 0),
        0,
      ),
    [tablas],
  )

  const sections: SeccionStruct<
    { seccion_nombre: string; subtotal: number; total: number },
    Item
  >[] = useMemo(() => {
    return tablas.map((t) => {
      const items = t.items ?? []
      const subtotal = items.reduce((acc, it) => acc + Number(it.valor || 0), 0)
      return {
        sectionData: {
          seccion_nombre: seccionNombre(Number(t.seccion_id)),
          subtotal,
          total: totalCaso,
        },
        items,
        getSectionName: (s) => (
          <>
            <span className="text-base text-blue-500">{s.seccion_nombre}</span>
            <br />
          </>
        ),
        getSectionExtra: (s) => (
          <span className="text-green-600">
            Total: {s.subtotal}/{s.total}
          </span>
        ),
      }
    })
  }, [tablas, totalCaso])

  const metaFields: MetaField<Partial<Caso>>[] = [
    {
      name: 'titulo',
      label: 'Caso',
      type: 'text',
      getValue: () => casoInfo?.titulo ?? `Caso #${caso}`,
    },
  ]

  return (
    <div className="p-6">
      <div className="mt-6 flex justify-between">
        <Button
          type="button"
          icon={faArrowLeft}
          variant="light"
          onClick={() => router.back()}
        >
          Volver
        </Button>
      </div>

      {casoInfo && (
        <MetaInfo title="Tabla de cotejo" fields={metaFields} data={casoInfo} />
      )}

      <TablaCotejoStructure
        title="Estructura de la tabla"
        columns={columns}
        sections={sections}
        additionalData={{ preguntasIdx }}
      />
    </div>
  )
}
