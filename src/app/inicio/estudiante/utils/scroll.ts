'use client'

import { type DependencyList, type RefObject, useEffect } from 'react'

/**
 * Autoscroll del ENUNCIADO:
 * - Va a #bloque-actual (fallback: #bloque-siguiente -> #bloque-anterior)
 * - Se ejecuta UNA sola vez por cambio de deps
 * - No "pega" el scroll: si el usuario interactúa, no se vuelve a forzar
 * - No registra listeners de scroll ni intervals persistentes
 */
export function useAutoScrollToActiveEnunciado(
  containerRef: RefObject<HTMLElement | null>,
  deps: DependencyList = [],
  options?: {
    /** 'smooth' si querés animación, 'auto' si lo querés instantáneo (por defecto: 'smooth') */
    behavior?: ScrollBehavior
    /** padding visual desde el borde superior del contenedor (px) */
    padding?: number
    /** cuántos cuadros de rAF reintenta para asentar layout (imágenes, fuentes) */
    settleFrames?: number
  },
): void {
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const behavior = options?.behavior ?? 'smooth'
    const padding = options?.padding ?? 8
    const settleFrames = Math.max(0, options?.settleFrames ?? 2)

    // Busca el target "tal cual" tu lógica original
    const findTarget = (): HTMLElement | null => {
      return (
        (el.querySelector('#bloque-actual') as HTMLElement | null) ??
        (el.querySelector('#bloque-siguiente') as HTMLElement | null) ??
        (el.querySelector('#bloque-anterior') as HTMLElement | null)
      )
    }

    const getOffsetTopWithin = (container: HTMLElement, node: HTMLElement) => {
      const c = container.getBoundingClientRect()
      const n = node.getBoundingClientRect()
      // posición relativa del nodo dentro del contenedor que scrollea
      return n.top - c.top + container.scrollTop
    }

    let cancelled = false

    // Si el usuario toca/rueda/tecla, cancelamos cualquier reintento
    const cancel = () => {
      cancelled = true
    }
    const stopOnUserInput = () => {
      el.addEventListener('wheel', cancel, { passive: true, once: true })
      el.addEventListener('touchstart', cancel, { passive: true, once: true })
      el.addEventListener('keydown', cancel, { once: true })
    }

    stopOnUserInput()

    let frames = 0
    const tick = () => {
      if (cancelled) return
      const target = findTarget()

      // Si no hay target, subimos el ENUNCIADO al tope y listo (una sola vez)
      if (!target) {
        try {
          el.scrollTo({ top: 0, behavior })
        } catch {
          el.scrollTop = 0
        }
        return
      }

      const top = Math.max(0, getOffsetTopWithin(el, target) - padding)
      try {
        el.scrollTo({ top, behavior })
      } catch {
        el.scrollTop = top
      }

      // Reintentamos unas pocas veces por si hay reflows (imágenes/fuentes)
      if (frames < settleFrames) {
        frames += 1
        requestAnimationFrame(tick)
      }
      // Importante: NO programamos nada más; queda libre el scroll manual
    }

    // Ejecutamos en el próximo frame para asegurar que el DOM esté pintado
    requestAnimationFrame(tick)

    return () => {
      cancelled = true
    }
  }, [containerRef, ...deps])
}
