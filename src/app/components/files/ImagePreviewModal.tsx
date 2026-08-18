'use client'

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'

type Props = {
  src: string
  alt: string
  open: boolean
  onClose: () => void
}

export default function ImagePreviewModal({ src, alt, open, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Cerrar con Esc + bloquear scroll de fondo
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal
      aria-label={`Vista previa: ${alt}`}
      onClick={(e) => {
        // Cerrar al hacer click fuera del contenido
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div ref={containerRef} className="relative w-full max-w-5xl">
        <button
          type="button"
          className="absolute top-3 right-3 z-20 cursor-pointer rounded-full bg-white/95 p-2 text-gray-900 shadow hover:bg-white focus:ring-2 focus:ring-white focus:outline-none"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <FontAwesomeIcon icon={faXmark} className="h-5 w-5" />
        </button>

        <div className="relative h-[70vh] w-full overflow-hidden rounded-xl bg-black/20 backdrop-blur-sm">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 1200px) 100vw, 1200px"
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
      </div>
    </div>
  )
}
