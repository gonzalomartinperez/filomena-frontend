'use client'

import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import Tooltip from 'app/components/tooltip/Tooltip'
import type { ApiFile } from 'app/inicio/administrador/mochila-carga/types/ApiFile'

type Size = 'sm' | 'md' | 'lg'

type Props = {
  files: ApiFile[]
  accentClassName?: string
  size?: Size
}

export default function ImagenesGrid({
  files,
  accentClassName,
  size = 'md',
}: Props) {
  if (!files?.length) return null

  const accent = accentClassName ?? 'text-indigo-600'

  // Miniaturas pensadas para "preview" (no obstruyen el enunciado)
  const thumbBySize: Record<
    Size,
    { w: string; h: string; sizesAttr: string; minCol: number }
  > = {
    sm: {
      w: 'w-[180px]',
      h: 'h-[120px]',
      sizesAttr:
        '(min-width:1280px) 180px, (min-width:1024px) 180px, (min-width:640px) 180px, 160px',
      minCol: 160,
    },
    md: {
      w: 'w-[220px]',
      h: 'h-[150px]',
      sizesAttr:
        '(min-width:1280px) 220px, (min-width:1024px) 220px, (min-width:640px) 220px, 190px',
      minCol: 190,
    },
    lg: {
      w: 'w-[260px]',
      h: 'h-[170px]',
      sizesAttr:
        '(min-width:1280px) 260px, (min-width:1024px) 260px, (min-width:640px) 240px, 200px',
      minCol: 200,
    },
  }

  const { w, h, sizesAttr, minCol } = thumbBySize[size]

  return (
    <div className="mt-3 w-full">
      {/* Grid fluido: la cantidad por fila se ajusta sola y queda centrada */}
      <div
        className="grid justify-center gap-3"
        style={{
          // auto-fit la máxima cantidad por fila; cada columna mide lo que la card necesite
          gridTemplateColumns: `repeat(auto-fit, minmax(${minCol}px, max-content))`,
        }}
      >
        {files.map((f) => {
          const label = f?.nombre || f?.file_name || 'imagen de la pregunta'
          return (
            <figure
              key={f.id}
              className="flex flex-col items-stretch overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition will-change-transform hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* Contenedor de imagen: alto fijo, ancho de miniatura; la imagen nunca se estira (object-contain) */}
              <div className={`relative ${w} ${h}`}>
                <Image
                  src={f.url}
                  alt={label}
                  fill
                  className="object-contain object-center"
                  sizes={sizesAttr}
                  priority={false}
                />
              </div>

              <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-[11px] text-gray-600">
                <span className="truncate" title={label}>
                  {label}
                </span>

                <Tooltip content="Descargar imagen" variant="info" side="left">
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 ring-1 ring-gray-200 transition hover:bg-gray-50"
                    aria-label="Descargar imagen"
                  >
                    <FontAwesomeIcon
                      icon={faDownload}
                      className={`h-3 w-3 ${accent}`}
                    />
                    <span className={accent}>Descargar</span>
                  </a>
                </Tooltip>
              </figcaption>
            </figure>
          )
        })}
      </div>
    </div>
  )
}
