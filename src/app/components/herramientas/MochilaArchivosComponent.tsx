'use client'

import { useEffect, useState } from 'react'
import type { ApiFile } from 'app/inicio/administrador/mochila-carga/types/ApiFile'
import { getArchivosAPI } from 'app/inicio/administrador/mochila-carga/services/mochilaCargaServices'
import FileCardGrid from 'app/components/files/FileCardGrid'
import ImagePreviewModal from 'app/components/files/ImagePreviewModal'
import { isPreviewableImage } from 'app/components/files/FileCard'
import { storage, STORAGE_KEYS } from 'app/utils/storage'
import useAuth from 'app/hooks/useAuth'
import {
  ESTUDIANTE,
  EVALUADOR,
} from 'app/inicio/administrador/usuarios/constants/roles'

export default function MochilaArchivos() {
  const {
    state: { rolSeleccionado },
  } = useAuth()

  const [archivos, setArchivos] = useState<ApiFile[]>([])
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(
    null,
  )
  const examenIdKey =
    rolSeleccionado === ESTUDIANTE
      ? STORAGE_KEYS.estudiante.examenId
      : rolSeleccionado === EVALUADOR
        ? STORAGE_KEYS.evaluador.examenId
        : undefined

  const examenIdRaw = examenIdKey ? storage.session.get(examenIdKey) : null
  const examenId = Number(examenIdRaw || '')

  const puedeCargar = Boolean(
    examenIdKey && Number.isFinite(examenId) && examenId > 0,
  )

  async function obtenerArchivos() {
    if (!puedeCargar) return
    await getArchivosAPI(examenId).then((res) => {
      setArchivos(res.data.data as ApiFile[])
    })
  }

  useEffect(() => {
    void obtenerArchivos()
  }, [rolSeleccionado])

  const tieneContenido = archivos.length > 0

  return (
    <div className="max-h-[70vh] overflow-y-auto overscroll-y-contain px-2">
      {!puedeCargar ? (
        <div className="py-6 text-center text-sm text-black/60">
          No hay un examen activo para este rol.
        </div>
      ) : !tieneContenido ? (
        <div className="py-6 text-center text-sm text-black/60">
          No hay archivos cargados para este examen.
        </div>
      ) : (
        <>
          <FileCardGrid
            className="pb-20"
            items={archivos}
            features={{ preview: true, download: true }}
            onPreview={(it) => {
              if (it instanceof File) return
              const name = it.file_name ?? it.nombre ?? ''
              if (!isPreviewableImage(name)) return
              setPreview({ url: it.url, name })
            }}
            size="md"
          />

          <ImagePreviewModal
            open={Boolean(preview)}
            src={preview?.url ?? ''}
            alt={preview?.name ?? ''}
            onClose={() => setPreview(null)}
          />
        </>
      )}
    </div>
  )
}
