'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type ConfirmFn = (proceed: () => void) => void

type Props = {
  /** Activar el guard cuando hay cambios sin guardar */
  enabled: boolean
  /** Abre tu modal y, si el usuario confirma, ejecuta proceed() */
  confirm: ConfirmFn
  /** Mensaje a usar para beforeunload (el browser puede ignorar el texto) */
  message?: string
  /** Si false, no bloquea cerrar/recargar pestaña (solo navegación interna) */
  blockTabClose?: boolean
}

/**
 * Intercepta:
 * - Clicks en <a> o <Link> (botón izq, sin modificadores)
 * - Botón “atrás/adelante” (popstate)
 * Fallback nativo:
 * - Cerrar/recargar pestaña o abandonar el sitio (beforeunload)
 */
export default function UnsavedChangesGuard({
  enabled,
  confirm,
  message,
  blockTabClose = true,
}: Props) {
  const router = useRouter()
  const enabledRef = useRef(enabled)
  const pendingHrefRef = useRef<string | null>(null)
  const bypassOnceRef = useRef(false)
  const messageRef = useRef(message)

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  useEffect(() => {
    messageRef.current = message
  }, [message])

  const proceed = useCallback(() => {
    const href = pendingHrefRef.current
    pendingHrefRef.current = null
    bypassOnceRef.current = true
    if (href === '__BACK__') {
      window.history.back()
      return
    }
    if (href) {
      router.push(href)
    }
  }, [router])

  // Interceptar clicks en enlaces (SPA)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!enabledRef.current) return

      // ignorar clicks con modificadores/medio click
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return
      }

      const el = e.target as HTMLElement | null
      const anchor = el?.closest?.('a') as HTMLAnchorElement | null
      if (!anchor) return

      const hrefAttr = anchor.getAttribute('href')
      if (!hrefAttr) return

      // exceptuar targets especiales
      if (
        anchor.target === '_blank' ||
        anchor.hasAttribute('download') ||
        hrefAttr.startsWith('mailto:') ||
        hrefAttr.startsWith('tel:')
      ) {
        return
      }

      const url = new URL(hrefAttr, window.location.href)

      // misma página (anchor/hash) → no interceptar
      if (url.href === window.location.href || url.hash) return

      // enlaces externos → dejamos que actúe el beforeunload nativo
      const isExternal = url.origin !== window.location.origin
      if (isExternal) return

      // navegación interna Next → mostramos TU modal
      e.preventDefault()
      pendingHrefRef.current = url.pathname + url.search + url.hash
      confirm(proceed)
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [confirm, proceed])

  // Interceptar back/forward (popstate) para navegación interna
  useEffect(() => {
    const onPopState = () => {
      if (!enabledRef.current) return
      if (bypassOnceRef.current) {
        bypassOnceRef.current = false
        return
      }
      // “Cancelar” el back actual y disparar tu modal
      history.pushState(null, '', window.location.href)
      pendingHrefRef.current = '__BACK__'
      confirm(proceed)
    }

    // Empujamos un state inicial para poder “cancelar” el primer back
    if (enabled) history.pushState(null, '', window.location.href)

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [enabled, confirm, proceed])

  // beforeunload para cerrar/recargar pestaña o salir de la pestaña
  useEffect(() => {
    if (!blockTabClose) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!enabledRef.current) return
      e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [blockTabClose])

  return null
}
