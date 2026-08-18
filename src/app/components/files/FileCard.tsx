'use client'

import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faDownload,
  faEye,
  faTrash,
  faRotateLeft,
} from '@fortawesome/free-solid-svg-icons'
import type { ApiFile } from 'app/inicio/administrador/mochila-carga/types/ApiFile'
import { getIconForFileName } from 'app/components/uploads/UploadDropzone'

export type FileCardProps =
  | ({
      apiFile: ApiFile
      file?: never
    } & CommonProps)
  | ({
      file: File
      apiFile?: never
    } & CommonProps)

type CommonProps = {
  className?: string
  marked?: boolean
  disabled?: boolean
  showPreview?: boolean
  showDownload?: boolean
  showRemove?: boolean
  showToggleDelete?: boolean
  toggleDeleteBadgeText?: string
  onPreview?: () => void
  onRemove?: () => void
  onToggleMarkDelete?: () => void
  /** Tamaño visual de la card (ícono/typography) */
  size?: 'sm' | 'md'
}

/** Imagenes permitidas para preview */
export const isPreviewableImage = (name: string): boolean =>
  /\.(png|jpe?g)$/i.test(name)

const base = {
  card: 'relative group overflow-hidden rounded-xl border border-gray-200 bg-white shadow hover:shadow-lg hover:ring-2 hover:ring-blue-500/60 transition',
  body: 'flex aspect-square items-center justify-center',
  fileName:
    'w-full truncate px-2 py-1 text-center font-medium bg-gray-50 group-hover:bg-blue-50 group-hover:text-blue-600',
  badgeExt:
    'absolute top-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white uppercase backdrop-blur-sm',
  badgeDelete:
    'absolute left-2 top-2 rounded-full bg-red-600/80 px-2 py-0.5 text-[10px] font-semibold text-white',
  overlay:
    'absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100',
  /** Botón redondo base (sin color por defecto; hereda el color del variant) */
  actionRound:
    'inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full p-0 shadow ' +
    'focus:outline-none focus:ring-2 focus:ring-white/70',
}

const sizeMap = {
  md: {
    bodyPad: 'p-2',
    icon: 'h-3/4 w-3/4',
    fileName: 'text-sm',
  },
  sm: {
    bodyPad: 'p-1',
    icon: 'h-2/3 w-2/3',
    fileName: 'text-xs',
  },
} as const

export default function FileCard(props: FileCardProps) {
  const {
    className,
    marked,
    disabled,
    showPreview,
    showDownload,
    showRemove,
    showToggleDelete,
    toggleDeleteBadgeText = 'A eliminar',
    onPreview,
    onRemove,
    onToggleMarkDelete,
    size = 'md',
  } = props

  const displayName =
    'apiFile' in props ? props.apiFile?.file_name : props.file.name
  const url = 'apiFile' in props ? props.apiFile?.url : undefined
  const { Icon, color, ext } = getIconForFileName(displayName ?? '')
  const canPreview = !!(showPreview && isPreviewableImage(displayName ?? ''))
  const s = sizeMap[size]

  return (
    <div
      className={[
        base.card,
        marked ? 'opacity-60 ring-2 ring-red-500' : '',
        disabled ? 'pointer-events-none opacity-60' : '',
        className ?? '',
      ].join(' ')}
      aria-disabled={disabled || undefined}
    >
      <span className={base.badgeExt}>{ext || 'file'}</span>
      {marked && (
        <span className={base.badgeDelete}>{toggleDeleteBadgeText}</span>
      )}

      <div className={`${base.body} ${s.bodyPad}`}>
        {/* Asegura el color del ícono principal */}
        <Icon className={s.icon} style={{ color }} />
      </div>

      <div
        className={`${base.fileName} ${s.fileName} line-clamp-2`}
        title={displayName}
      >
        {displayName}
      </div>

      <div className={base.overlay}>
        {canPreview && (
          <button
            type="button"
            className={`${base.actionRound} bg-blue-600 text-white hover:bg-blue-700`}
            onClick={(e) => {
              e.stopPropagation()
              onPreview?.()
            }}
            title="Vista previa"
            aria-label="Vista previa"
          >
            <FontAwesomeIcon icon={faEye} className="h-5 w-5 text-current" />
          </button>
        )}

        {'apiFile' in props && showDownload && url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`${base.actionRound} bg-emerald-600 text-white hover:bg-emerald-700`}
            title="Descargar"
            aria-label="Descargar"
          >
            <FontAwesomeIcon
              icon={faDownload}
              className="h-5 w-5 text-current"
            />
          </a>
        )}

        {showToggleDelete && (
          <button
            type="button"
            className={`${base.actionRound} ${
              marked
                ? 'bg-slate-600 text-white'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleMarkDelete?.()
            }}
            title={marked ? 'Desmarcar' : 'Marcar para eliminar'}
            aria-label={marked ? 'Desmarcar' : 'Marcar para eliminar'}
          >
            <FontAwesomeIcon
              icon={marked ? faRotateLeft : faTrash}
              className="h-5 w-5 text-current"
            />
          </button>
        )}

        {showRemove && (
          <button
            type="button"
            className={`${base.actionRound} bg-red-600 text-white hover:bg-red-700`}
            onClick={(e) => {
              e.stopPropagation()
              onRemove?.()
            }}
            title="Quitar"
            aria-label="Quitar"
          >
            <FontAwesomeIcon icon={faTrash} className="h-5 w-5 text-current" />
          </button>
        )}
      </div>
    </div>
  )
}
