'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faHouse,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import { Button } from './components/buttons/GeneralButton'

const styles = {
  // Fondo animado
  bgWrap:
    'm-0 flex min-h-screen w-full items-center justify-center ' +
    'bg-[linear-gradient(-45deg,#1abc9c,#3498db,#9b59b6,#e67e22)] bg-[length:400%_400%] ' +
    'animate-[gradientShift_15s_ease_infinite] px-4 py-10',
  // Tarjeta principal
  shell:
    'w-full max-w-xl rounded-2xl bg-white/15 px-6 py-8 text-center text-white shadow-xl backdrop-blur-md ' +
    'sm:px-8 md:px-10',
  iconWrap:
    'mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-white/15 ring-1 ring-white/25',
  title: 'text-3xl font-extrabold tracking-tight sm:text-4xl',
  subtitle:
    'mx-auto mt-2 max-w-lg text-sm leading-relaxed text-white/90 sm:text-base',
  codePill:
    'mx-auto mt-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/25',
  // Acciones
  actions: 'mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row',
  homeBtn:
    'inline-flex items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white ' +
    'ring-1 ring-white/25 transition hover:bg-white/20',
  // Footer
  hint: 'mt-6 text-xs text-white/80',
  // Keyframes
  keyframes: `
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `,
}

export default function NotFound() {
  const router = useRouter()

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      // Fallback si no hay historial
      router.replace('/ingresar')
    }
  }

  return (
    <>
      <main className={styles.bgWrap}>
        <section className={styles.shell} aria-labelledby="nf-title">
          <div className={styles.iconWrap} aria-hidden>
            <FontAwesomeIcon icon={faTriangleExclamation} size="lg" />
          </div>

          <h1 id="nf-title" className={styles.title}>
            Página no encontrada
          </h1>
          <p className={styles.subtitle}>
            Es posible que el enlace esté roto, haya cambiado de ubicación o que
            este mal escrita la dirección.
          </p>

          <span className={styles.codePill}>Error 404</span>

          <div className={styles.actions}>
            <Button variant="light" icon={faArrowLeft} onClick={handleBack}>
              Volver
            </Button>

            <Button
              variant="light"
              icon={faHouse}
              onClick={() => router.replace('/ingresar')}
            >
              Ir a ingresar
            </Button>
          </div>

          <p className={styles.hint}>
            Si el problema persiste, volvé al inicio y navega desde allí.
          </p>
        </section>
      </main>

      {/* Fondo animado */}
      <style>{styles.keyframes}</style>
    </>
  )
}
