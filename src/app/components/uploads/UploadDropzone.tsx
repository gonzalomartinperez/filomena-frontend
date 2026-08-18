'use client'

import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  DragEvent,
  KeyboardEvent,
} from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpload } from '@fortawesome/free-solid-svg-icons'
import { IconType } from 'react-icons'
import {
  FaFilePdf,
  FaFileImage,
  FaFileArchive,
  FaFileCsv,
  FaFileExcel,
  FaFileWord,
  FaRegFile,
} from 'react-icons/fa'

type FileRejection = { file: File; reason: string }

export type UploadDropzoneProps = {
  title?: string
  subtitle?: string
  /** Aceptados: extensiones y/o mimes, separados por coma. */
  accept?: string
  /** Límite por archivo en MB. */
  maxSizeMB?: number
  multiple?: boolean
  disabled?: boolean
  className?: string
  actionLabel?: string
  onFiles: (accepted: File[], rejected: FileRejection[]) => void
  icon?: IconType
}

const styles = {
  root:
    'relative w-full rounded-2xl border-2 border-dashed transition ' +
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400/50 ' +
    'bg-white/70',
  idle: 'border-indigo-200 hover:bg-indigo-50/40 ' + 'text-gray-700',
  dragging: 'border-indigo-500 bg-indigo-50/70 ring-4 ring-indigo-400/60',
  disabled: 'opacity-60 pointer-events-none',
  inner:
    'relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 p-8 text-center',
  title: 'text-sm font-semibold tracking-wide',
  subtitle: 'text-xs text-gray-600',
  aura:
    'pointer-events-none absolute inset-0 rounded-2xl ' +
    'bg-[radial-gradient(120px_60px_at_var(--x,50%)_var(--y,50%),rgba(99,102,241,0.10),transparent_70%)]',
  gridPattern:
    'pointer-events-none absolute inset-0 rounded-2xl ' +
    'bg-[linear-gradient(to_right,rgba(99,102,241,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.07)_1px,transparent_1px)] ' +
    'bg-[size:14px_14px]',
}

const EXT_ICON_MAP: Record<string, IconType> = {
  pdf: FaFilePdf,
  png: FaFileImage,
  jpg: FaFileImage,
  jpeg: FaFileImage,
  zip: FaFileArchive,
  csv: FaFileCsv,
  xls: FaFileExcel,
  xlsx: FaFileExcel,
  doc: FaFileWord,
  docx: FaFileWord,
}
const getIconByExt = (ext: string): IconType => EXT_ICON_MAP[ext] ?? FaRegFile
const getIconColor = (ext: string): string =>
  ({
    pdf: '#e53935',
    png: '#9c27b0',
    jpg: '#009688',
    jpeg: '#009688',
    zip: '#ff9800',
    csv: '#4caf50',
    xls: '#4caf50',
    xlsx: '#4caf50',
    doc: '#2196f3',
    docx: '#2196f3',
  })[ext] ?? '#9e9e9e'

const toMB = (bytes: number): number => bytes / (1024 * 1024)
const formatMB = (mb: number): string => `${mb.toFixed(2)} MB`

function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true
  const tokens = accept
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
  if (tokens.length === 0) return true

  const fileName = file.name.toLowerCase()
  const fileType = (file.type || '').toLowerCase()

  return tokens.some((token) => {
    if (token.startsWith('.')) return fileName.endsWith(token)
    if (token.endsWith('/*')) {
      const family = token.slice(0, -2)
      return fileType.startsWith(`${family}/`)
    }
    return fileType === token
  })
}

export default function UploadDropzone({
  title = 'Arrastrá y soltá archivos, o hacé clic para seleccionar',
  subtitle,
  accept,
  maxSizeMB,
  multiple = true,
  disabled,
  className,
  actionLabel = 'Seleccionar archivos',
  onFiles,
  icon: BigIcon,
}: UploadDropzoneProps) {
  const [isDragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Contador robusto para dragenter/dragleave (evita parpadeo al atravesar hijos)
  const dragCounter = useRef(0)

  const acceptText = useMemo(() => {
    if (!accept) return 'Casi cualquier tipo de archivo'
    return accept
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .join(', ')
  }, [accept])

  const openPicker = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const validate = useCallback(
    (incoming: File[]): { accepted: File[]; rejected: FileRejection[] } => {
      const accepted: File[] = []
      const rejected: FileRejection[] = []

      incoming.forEach((file) => {
        if (accept && !matchesAccept(file, accept)) {
          rejected.push({
            file,
            reason: `Tipo no permitido. Aceptados: ${acceptText}`,
          })
          return
        }
        if (maxSizeMB && maxSizeMB > 0 && toMB(file.size) > maxSizeMB) {
          rejected.push({
            file,
            reason: `El archivo pesa ${formatMB(
              toMB(file.size),
            )} y el máximo es ${maxSizeMB} MB`,
          })
          return
        }
        accepted.push(file)
      })

      if (!multiple && accepted.length > 1) accepted.splice(1)

      return { accepted, rejected }
    },
    [accept, acceptText, maxSizeMB, multiple],
  )

  const pushFiles = useCallback(
    (list: FileList | File[]) => {
      const files = Array.from(list ?? []).filter((f) => f instanceof File)
      const { accepted, rejected } = validate(files)
      onFiles(accepted, rejected)
    },
    [onFiles, validate],
  )

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setDragging(false)
    if (disabled) return
    if (e.dataTransfer?.files?.length) {
      pushFiles(e.dataTransfer.files)
    }
  }

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) e.dataTransfer.dropEffect = 'copy'
  }

  const onDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current += 1
    if (!disabled) setDragging(true)
  }

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    // Solo “soltar” cuando realmente salimos del contenedor
    dragCounter.current = Math.max(0, dragCounter.current - 1)
    if (dragCounter.current === 0) setDragging(false)
  }

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openPicker()
    }
  }

  const Icon = BigIcon ?? (FaRegFile as IconType)

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={actionLabel}
      aria-busy={disabled || undefined}
      onKeyDown={onKey}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onClick={() => {
        if (!disabled) openPicker()
      }}
      className={[
        styles.root,
        isDragging ? styles.dragging : styles.idle,
        disabled ? styles.disabled : '',
        className ?? '',
      ].join(' ')}
    >
      {/* fondos sutiles */}
      <div className={styles.gridPattern} />
      <div className={styles.aura} />

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        aria-hidden
        className="hidden"
        onChange={(e) => {
          if (e.currentTarget.files?.length) pushFiles(e.currentTarget.files)
          e.currentTarget.value = '' // permitir re-subir mismo archivo
        }}
      />

      <div className={styles.inner}>
        <FontAwesomeIcon icon={faUpload} className="h-6 w-6 text-indigo-600" />
        <div className={styles.title}>{title}</div>
        <div className={styles.subtitle} aria-live="polite">
          {subtitle ?? `Aceptados: ${acceptText}`}
          {maxSizeMB ? ` · Máx: ${maxSizeMB} MB` : null}
        </div>

        {/* decorativo */}
        <Icon className="absolute -z-10 h-28 w-28 opacity-5" />

        {/* overlay de “soltar” */}
        {isDragging && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-indigo-500/5 text-indigo-700">
            <span className="rounded-lg bg-white/70 px-3 py-1 text-sm font-semibold shadow-sm ring-1 ring-indigo-200">
              Soltá para subir
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/** Utilidad: elegir icono por extensión. */
export function getIconForFileName(name: string): {
  Icon: IconType
  color: string
  ext: string
} {
  const lower = name.toLowerCase()
  const match = lower.match(/\.(\w+)$/)
  const ext = match?.[1] ?? ''
  const Icon = getIconByExt(ext)
  const color = getIconColor(ext)
  return { Icon, color, ext }
}
