'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import { Button } from 'app/components/buttons/GeneralButton'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { Pregunta } from '../types/Pregunta'
import {
  getPreguntaAPI,
  getTablaCotejoDePreguntaAPI,
} from '../services/preguntasServices'
import { getCasoAPI } from '../../casos/services/casosServices'
import MetaInfo, { MetaField } from '../../components/metaInfo/MetaInfo'
import TablaCotejoStructure, {
  Columna,
  Seccion,
} from '../../components/tablaCotejoStructure/TablaCotejoStructure'
import {
  TablaCotejo,
  Item,
  PuntajesResponse,
  SeccionHeader,
} from '../../tablas-cotejo/types/TablaCotejo'
import { Caso } from '../../casos/types/Caso'
import { getPuntajesTablaCotejoAPI } from '../../tablas-cotejo/services/tablasCotejoServices'
import { getSeccionAPI } from '../../secciones/services/seccionesServices'
import { Seccion as SeccionType } from '../../secciones/types/Seccion'
import { getArchivosPreguntaAPI } from 'app/inicio/administrador/mochila-carga/services/mochilaCargaServices'
import { ApiFile } from 'app/inicio/administrador/mochila-carga/types/ApiFile'
import FileCardGrid from 'app/components/files/FileCardGrid'
import ImagePreviewModal from 'app/components/files/ImagePreviewModal'

const styles = {
  container: 'p-6',
  actions: 'mt-6 mb-2 flex justify-start',
  sectionName: 'text-base text-blue-500',
  sectionExtra: 'text-green-600',
  gridCards:
    'grid [grid-template-columns:repeat(6,minmax(140px,1fr))] gap-4 overflow-y-auto pb-6 max-[980px]:[grid-template-columns:repeat(4,minmax(140px,1fr))] max-[640px]:[grid-template-columns:repeat(2,minmax(140px,1fr))]',
  cardBase:
    'relative group overflow-hidden rounded-xl border border-gray-200 bg-white shadow hover:shadow-lg hover:ring-2 hover:ring-blue-500/60 transition',
  cardBody: 'flex aspect-square items-center justify-center p-1',
  fileName:
    'w-full truncate px-2 py-1 text-center text-sm font-medium bg-gray-50 group-hover:bg-blue-50 group-hover:text-blue-600',
  modalBackdrop:
    'fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4',
  modalInner: 'relative w-full max-w-5xl',
  modalClose:
    'absolute -top-3 -right-3 rounded-full bg-white/90 p-2 shadow hover:bg-white',
}

export default function PreguntaView() {
  const router = useRouter()
  const { id } = useParams()
  const [pregunta, setPregunta] = useState<Partial<Pregunta>>({})
  const [caso, setCaso] = useState<Caso>()
  const [tabla, setTabla] = useState<TablaCotejo>()
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [puntajes, setPuntajes] = useState<PuntajesResponse>()
  const [seccion, setSeccion] = useState<SeccionType>()

  // Archivos (solo ver)
  const [archivos, setArchivos] = useState<ApiFile[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewName, setPreviewName] = useState<string>('')

  const {
    actions: { startLoading, stopLoading },
  } = useVisualNotifications()

  const metaFields: MetaField<Partial<Pregunta>>[] = [
    {
      name: 'caso_id',
      label: 'Caso',
      type: 'link',
      getValue: () => {
        if (caso?.titulo) return caso.titulo || ''
        if (pregunta?.caso_id) return `Caso #${pregunta.caso_id}`
        return ''
      },
      getHref: () => {
        const numericId = Number(pregunta?.caso_id)
        return Number.isFinite(numericId)
          ? `/inicio/administrador/casos/${numericId}`
          : ''
      },
    },
    { name: 'descripcion', label: 'Descripción', type: 'text' },
    { name: 'consigna', label: 'Consigna', type: 'text' },
    { name: 'orden_relativo', label: 'Orden relativo', type: 'text' },
  ]

  const tablaCotejoColumns: Columna<Item>[] = [
    { key: 'seccion', header: 'Sección', getValue: () => '' },
    {
      key: 'descripcion',
      header: 'Ítem',
      getValue: (item) => item.descripcion,
    },
    { key: 'valor', header: 'Valor', getValue: (item) => item.valor },
  ]

  const sections: Seccion<SeccionHeader, Item>[] = (() => {
    if (!tabla) return []

    const preguntaIdNum = Number(id)

    const itemsAll = tabla.items ?? []
    const itemsPregunta = itemsAll.filter(
      (it) => it.pregunta_id === preguntaIdNum,
    )

    const totalSeccion =
      typeof puntajes?.totales?.seccion === 'number'
        ? Number(puntajes!.totales.seccion)
        : itemsAll.reduce((acc, it) => acc + (Number(it.valor) || 0), 0)

    const subtotalPregunta = (() => {
      const m = puntajes?.preguntas?.find(
        (p) => p.pregunta_id === preguntaIdNum,
      )
      if (m) return Number(m.total)
      return itemsPregunta.reduce((acc, it) => acc + (Number(it.valor) || 0), 0)
    })()
    const nombreSeccion = seccion?.nombre ?? `Sección #${tabla.seccion_id}`
    const seccionHeader: SeccionHeader = {
      seccion_nombre: nombreSeccion,
      subtotal: subtotalPregunta,
      total: totalSeccion,
    }
    return [
      {
        sectionData: seccionHeader,
        items: itemsPregunta,
        getSectionName: (section) => (
          <>
            <span className={styles.sectionName}>{section.seccion_nombre}</span>
            <br />
          </>
        ),
        getSectionExtra: (section) => (
          <span className={styles.sectionExtra}>
            Total: {section.subtotal}/{section.total}
          </span>
        ),
      },
    ]
  })()

  useEffect(() => {
    const loadingId = startLoading('Cargando datos')
    getPreguntaAPI(id!.toString())
      .then((res) => setPregunta(res.data.data))
      .finally(() => stopLoading(loadingId))
  }, [id])

  useEffect(() => {
    const casoId = pregunta?.caso_id
    if (!casoId) return
    let cancel = false
    const loadingId = startLoading('Cargando información relacionada')
    const setIfMounted =
      <T,>(setter: (v: T) => void) =>
      (v: T) => {
        if (!cancel) setter(v)
      }
    getCasoAPI(casoId)
      .then((casoRes) => setIfMounted(setCaso)(casoRes.data.data as Caso))
      .then(() => getTablaCotejoDePreguntaAPI(casoId, Number(id)))
      .then((tablaRes) => {
        const tablaData = tablaRes.data.data as TablaCotejo
        if (!tablaData) {
          setIfMounted(setIsDataLoaded)(true)
          return null
        }
        setIfMounted(setTabla)(tablaData)
        return Promise.all([
          getPuntajesTablaCotejoAPI(tablaData.id),
          getSeccionAPI(String(tablaData.seccion_id)),
        ]).then(([puntajesRes, seccionRes]) => {
          setIfMounted(setPuntajes)(puntajesRes.data.data as PuntajesResponse)
          setIfMounted(setSeccion)(seccionRes.data.data as SeccionType)
        })
      })
      .finally(() => {
        if (!cancel) {
          stopLoading(loadingId)
          setIsDataLoaded(true)
        }
      })
    return () => {
      cancel = true
    }
  }, [pregunta?.caso_id, id])

  // Archivos (solo ver/descargar) – debajo de metadata y antes de Tabla de cotejo
  useEffect(() => {
    const pid = Number(id)
    if (!Number.isFinite(pid)) return
    getArchivosPreguntaAPI(pid)
      .then((res) => setArchivos(res.data.data as ApiFile[]))
      .catch(() => {})
  }, [id])

  const onPreview = (file: ApiFile) => {
    setPreviewUrl(file.url)
    setPreviewName(file.file_name)
  }

  const onClosePreview = () => {
    setPreviewUrl(null)
    setPreviewName('')
  }

  if (!isDataLoaded || !pregunta) return null

  return (
    <div className={styles.container}>
      <div className={styles.actions}>
        <Button
          type="button"
          icon={faArrowLeft}
          variant="light"
          onClick={() => router.back()}
        >
          Volver
        </Button>
      </div>

      <MetaInfo title="Pregunta" fields={metaFields} data={pregunta} />

      {/* Archivos */}
      <FileCardGrid
        className="mt-4"
        columns="compact"
        size="sm"
        items={archivos}
        onPreview={(it) => {
          // En esta page todos son ApiFile
          if (!(it instanceof File)) onPreview(it)
        }}
      />

      {/* Modal de preview */}
      <ImagePreviewModal
        open={Boolean(previewUrl)}
        src={previewUrl ?? ''}
        alt={previewName}
        onClose={onClosePreview}
      />

      <TablaCotejoStructure
        title="Secciones e ítems evaluados"
        columns={tablaCotejoColumns}
        sections={sections}
      />
    </div>
  )
}
