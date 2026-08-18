'use client'

import React from 'react'
import FileCard, { isPreviewableImage } from 'app/components/files/FileCard'
import type { ApiFile } from 'app/inicio/administrador/mochila-carga/types/ApiFile'

export const fileGridClasses =
  'grid [grid-template-columns:repeat(6,minmax(140px,1fr))] gap-4 overflow-y-auto pb-6 ' +
  'max-[980px]:[grid-template-columns:repeat(4,minmax(140px,1fr))] ' +
  'max-[640px]:[grid-template-columns:repeat(2,minmax(140px,1fr))]'

const columnsVariant = {
  default: '',
  compact:
    '[grid-template-columns:repeat(6,minmax(110px,1fr))] ' +
    'max-[980px]:[grid-template-columns:repeat(4,minmax(110px,1fr))] ' +
    'max-[640px]:[grid-template-columns:repeat(2,minmax(110px,1fr))]',
  comfortable:
    '[grid-template-columns:repeat(6,minmax(180px,1fr))] ' +
    'max-[980px]:[grid-template-columns:repeat(4,minmax(180px,1fr))] ' +
    'max-[640px]:[grid-template-columns:repeat(2,minmax(160px,1fr))]',
} as const

type ChildrenModeProps = {
  children: React.ReactNode
  className?: string
  columns?: keyof typeof columnsVariant
}

type ItemsModeProps = {
  items: ReadonlyArray<ApiFile | File>
  className?: string
  /** default 'default' */
  columns?: keyof typeof columnsVariant
  /** default 'md' */
  size?: 'sm' | 'md'
  /**
   * Habilita/deshabilita acciones por tipo:
   * - ApiFile: preview (auto por extensión), download (true), toggleDelete (false)
   * - File: preview (true), remove (true)
   */
  features?: Partial<{
    preview: boolean
    download: boolean
    remove: boolean
    toggleDelete: boolean
  }>
  /** Marca la card (p.ej. “A eliminar”) */
  markedPredicate?: (item: ApiFile | File) => boolean
  /** Callbacks (se llaman con el item original) */
  onPreview?: (item: ApiFile | File) => void
  onRemove?: (file: File) => void
  onToggleMarkDelete?: (apiFileId: number) => void
  /** Clave opcional; por defecto usa id o name+size según corresponda */
  keyExtractor?: (item: ApiFile | File) => string
}

type Props = ChildrenModeProps | ItemsModeProps

function isApiFile(x: ApiFile | File): x is ApiFile {
  return !(x instanceof File)
}

export default function FileCardGrid(props: Props) {
  const columnsClass =
    props.columns && props.columns !== 'default'
      ? columnsVariant[props.columns]
      : ''
  const className = [fileGridClasses, columnsClass, props.className ?? ''].join(
    ' ',
  )

  // Modo “children” (retro-compat)
  if ('children' in props) {
    const { children } = props
    return <div className={className}>{children}</div>
  }

  // Modo “items”
  const {
    items,
    size = 'md',
    features,
    markedPredicate,
    onPreview,
    onRemove,
    onToggleMarkDelete,
    keyExtractor,
  } = props

  return (
    <div className={className}>
      {items.map((item) => {
        if (isApiFile(item)) {
          const name = item.file_name ?? ''
          const canPreview =
            (features?.preview ?? true) && isPreviewableImage(name)
          const allowDownload = features?.download ?? true
          const marked = markedPredicate ? markedPredicate(item) : false

          const key = keyExtractor ? keyExtractor(item) : String(item.id)

          return (
            <FileCard
              key={key}
              apiFile={item}
              size={size}
              showPreview={canPreview}
              showDownload={allowDownload}
              showToggleDelete={features?.toggleDelete ?? false}
              marked={marked}
              onPreview={() => onPreview?.(item)}
              onToggleMarkDelete={() => {
                if (typeof item.id === 'number') onToggleMarkDelete?.(item.id)
              }}
            />
          )
        }

        // File local
        const name = item.name
        const canPreview =
          (features?.preview ?? true) && isPreviewableImage(name)
        const allowRemove = features?.remove ?? true

        const key = keyExtractor
          ? keyExtractor(item)
          : `${item.name}-${item.size}`

        return (
          <FileCard
            key={key}
            file={item}
            size={size}
            showPreview={canPreview}
            showRemove={allowRemove}
            onPreview={() => onPreview?.(item)}
            onRemove={() => onRemove?.(item)}
          />
        )
      })}
    </div>
  )
}
