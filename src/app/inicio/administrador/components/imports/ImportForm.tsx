'use client'

import React from 'react'
import { Button } from 'app/components/buttons/GeneralButton'
import UploadDropzone from 'app/components/uploads/UploadDropzone'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import FileCardGrid from 'app/components/files/FileCardGrid'
import FileCard from 'app/components/files/FileCard'

export type ImportFormProps = {
  busy: boolean
  file: File | null
  accept: string
  maxSizeMB: number
  idleTitle: string
  busyTitle: string
  subtitle: string
  templatePath?: string
  templateName?: string
  /** Contenido que va entre el dropzone y la card de plantilla. */
  leftHelp: React.ReactNode
  /** Columna derecha (roles / instrucciones). Opcional. */
  rightColumn?: React.ReactNode
  onFiles: (
    accepted: File[],
    rejected: { file: File; reason: string }[],
  ) => void
  onRemoveFile: () => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

const styles = {
  panel: 'w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm',
  grid: 'grid gap-6 xl:grid-cols-3',
  column: 'flex flex-col gap-4',
  hint: 'text-xs text-gray-600',
  link: 'text-indigo-600 underline',
  footer: 'mt-6 flex justify-end gap-3',
  // card - archivo importado
  cardBase:
    'relative group overflow-hidden rounded-xl border border-gray-200 bg-white shadow hover:shadow-lg hover:ring-2 hover:ring-indigo-500/60 transition',
  cardBody: 'flex aspect-square items-center justify-center p-1',
  fileName:
    'w-full truncate px-2 py-1 text-center text-sm font-medium bg-gray-50 group-hover:bg-indigo-50 group-hover:text-indigo-600',
  // card - plantilla de ejemplo
  tplCard:
    'flex items-center justify-between gap-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4',
  tplInfo: 'flex items-center gap-3',
  tplTitle: 'text-sm font-semibold',
  tplDesc: 'text-xs text-gray-600',
  iconWrap:
    'flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700',
}

export default function ImportForm({
  busy,
  file,
  accept,
  maxSizeMB,
  idleTitle,
  busyTitle,
  subtitle,
  templatePath,
  templateName,
  leftHelp,
  rightColumn,
  onFiles,
  onRemoveFile,
  onSubmit,
  onCancel,
}: ImportFormProps) {
  return (
    <div className={styles.panel}>
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <div className={styles.grid}>
          {/* Columna izquierda: Dropzone + ayuda + card plantilla + card archivo */}
          <div className="xl:col-span-2">
            <UploadDropzone
              disabled={busy}
              multiple={false}
              accept={accept}
              maxSizeMB={maxSizeMB}
              title={busy ? busyTitle : idleTitle}
              subtitle={subtitle}
              onFiles={onFiles}
            />

            {/* Ayuda específica de cada page */}
            {leftHelp}

            {/* Las plantillas institucionales no se publican en este snapshot. */}
            {templatePath && templateName && (
              <div className={`${styles.tplCard} mt-4`}>
                <div className={styles.tplInfo}>
                  <div className={styles.iconWrap}>
                    <FontAwesomeIcon icon={faDownload} />
                  </div>
                  <div>
                    <div className={styles.tplTitle}>
                      Plantilla de importación
                    </div>
                    <div className={styles.tplDesc}>{templateName}</div>
                  </div>
                </div>
                <a href={templatePath} download>
                  <Button type="button" variant="green">
                    Descargar
                  </Button>
                </a>
              </div>
            )}

            {/* Card del archivo seleccionado */}
            {file && (
              <FileCardGrid className="mt-4">
                <FileCard file={file} showRemove onRemove={onRemoveFile} />
              </FileCardGrid>
            )}
          </div>

          {/* Columna derecha (roles / instrucciones) */}
          <div className={styles.column}>{rightColumn}</div>
        </div>

        {/* Footer acciones */}
        <div className={styles.footer}>
          <Button type="submit" variant="default" disabled={busy || !file}>
            Importar
          </Button>
          <Button
            type="button"
            variant="light"
            onClick={onCancel}
            disabled={busy}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
