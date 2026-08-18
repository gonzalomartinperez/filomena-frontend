'use client'

import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faDownload } from '@fortawesome/free-solid-svg-icons'
import Tooltip from 'app/components/tooltip/Tooltip'
import type { ApiFile } from 'app/inicio/administrador/mochila-carga/types/ApiFile'

type Props = {
  open: boolean
  onClose: () => void
  ordenPregunta: number
  descripcion?: string | null
  consigna?: string | null
  imagenes?: ApiFile[]
}

export default function PreguntaInfoModal({
  open,
  onClose,
  ordenPregunta,
  descripcion,
  consigna,
  imagenes = [],
}: Props) {
  if (!open) return null

  const hasDesc = Boolean(descripcion?.trim())
  const hasConsigna = Boolean(consigna?.trim())
  const files = imagenes ?? []

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Detalle de la pregunta"
      className="fixed inset-0 z-50 grid place-items-center p-4"
    >
      <div
        className="absolute inset-0 cursor-pointer bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl border bg-white shadow-xl ring-1 ring-black/10">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h3 className="text-sm font-semibold text-gray-900">
            {`Pregunta ${ordenPregunta}`}
          </h3>
          <Tooltip content="Cerrar" variant="neutral">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-1 text-gray-500 hover:bg-gray-100 focus:outline-none"
              onClick={onClose}
              aria-label="Cerrar"
              title="Cerrar"
            >
              <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>

        <div className="max-h-[calc(85vh-40px)] overflow-y-auto px-4 py-3">
          {hasDesc ? (
            <p
              className="rounded-lg bg-amber-50/80 px-3 py-2 text-[15px] leading-relaxed font-medium whitespace-pre-line text-gray-900 ring-1 ring-amber-200/60"
              style={{ textAlign: 'justify' }}
            >
              {descripcion}
            </p>
          ) : (
            <p className="text-sm text-gray-500">Sin descripción.</p>
          )}

          {!!files.length && (
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {files.map((f) => {
                const label = f?.nombre || f?.file_name || 'imagen'
                return (
                  <figure
                    key={f.id}
                    className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src={f.url}
                        alt={label}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority={false}
                      />
                    </div>
                    <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-[11px] text-gray-600">
                      <span className="truncate" title={label}>
                        {label}
                      </span>
                      <Tooltip
                        content="Descargar imagen"
                        variant="info"
                        side="left"
                      >
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-200 px-2 py-1 ring-1 ring-gray-200 transition hover:bg-gray-50"
                          aria-label="Descargar imagen"
                        >
                          <FontAwesomeIcon
                            icon={faDownload}
                            className="h-3 w-3 text-indigo-600"
                          />
                          <span className="text-indigo-600">Descargar</span>
                        </a>
                      </Tooltip>
                    </figcaption>
                  </figure>
                )
              })}
            </div>
          )}

          {hasConsigna && (
            <div className="mt-3 rounded-md border-l-4 border-amber-300 bg-amber-50/60 px-3 py-2 text-[14px] leading-relaxed text-gray-900">
              <b className="font-semibold">Consigna:</b>{' '}
              <span className="whitespace-pre-line">{consigna}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
