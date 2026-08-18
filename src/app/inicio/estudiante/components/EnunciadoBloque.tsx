'use client'

import type { ApiFile } from 'app/inicio/administrador/mochila-carga/types/ApiFile'
import ImagenesGrid from './ImagenesGrid'

type Props = {
  descripcion: string
  imagenes: ApiFile[]
  resaltado?: boolean
  showDivider?: boolean
  anchorId?: string
}

export default function EnunciadoBloque({
  descripcion,
  imagenes,
  resaltado,
  showDivider,
  anchorId,
}: Props) {
  return (
    <div className="w-full">
      {showDivider && (
        <hr className="my-3 border-t border-dashed border-gray-200" />
      )}

      {anchorId ? (
        <span
          id={anchorId}
          data-anchor={anchorId}
          className="block h-0 w-0 overflow-hidden"
          aria-hidden
        />
      ) : null}

      <p
        className={
          resaltado
            ? 'rounded-lg bg-amber-50/80 px-3 py-2 text-[15px] leading-[1.8] font-semibold text-gray-900 ring-1 ring-amber-200/60 md:text-[16px]'
            : 'text-[15px] leading-[1.85] font-medium text-gray-900 md:text-[16px]'
        }
        style={{ textAlign: 'justify' }}
      >
        {descripcion}
      </p>

      <div className="mt-3 flex justify-center">
        <ImagenesGrid
          files={imagenes}
          accentClassName="text-indigo-600"
          size="md"
        />
      </div>
    </div>
  )
}
