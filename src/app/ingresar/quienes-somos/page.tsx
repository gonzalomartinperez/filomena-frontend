'use client'

import React from 'react'
import { Button } from 'app/components/buttons/GeneralButton'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { useRouter } from 'next/navigation'

const styles = {
  bgWrap:
    'm-0 flex min-h-screen w-full items-start justify-center ' +
    'bg-[linear-gradient(-45deg,#1abc9c,#3498db,#9b59b6,#e67e22)] bg-[length:400%_400%] ' +
    'animate-[gradientShift_15s_ease_infinite] px-4 py-10',
  shell:
    'w-full max-w-5xl rounded-2xl bg-white/15 px-5 py-8 text-center text-white shadow-xl backdrop-blur-md ' +
    'sm:px-8 md:px-10',
  title: 'text-3xl font-extrabold tracking-tight sm:text-4xl',
  intro:
    'mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-white/90 sm:text-base md:text-[17px]',
  grid: 'mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3',
  card: 'rounded-xl bg-white/10 px-5 py-6 shadow-md transition hover:bg-white/15',
  avatar:
    'mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/90 ' +
    'bg-white/15 text-2xl font-extrabold tracking-wide shadow-md sm:h-28 sm:w-28 md:h-32 md:w-32',
  name: 'mt-4 text-base font-extrabold sm:text-lg',
  role: 'mt-1 text-sm text-white/80',
  backRow: 'mt-10 text-left',
  keyframes: `
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `,
}

const TEAM = [
  { name: 'Gonzalo Martin Perez', initials: 'GMP' },
  { name: 'Juan Cruz Rossi', initials: 'JCR' },
  { name: 'Virgilio Ocampos', initials: 'VO' },
]

export default function QuienesSomosPage() {
  const router = useRouter()

  return (
    <>
      <main className={styles.bgWrap}>
        <section className={styles.shell} aria-labelledby="title">
          <h1 id="title" className={styles.title}>
            ¿Quiénes somos?
          </h1>

          <p className={styles.intro}>
            Somos un equipo de tres desarrolladores.{' '}
            <strong>Filomena v2.0</strong> fue nuestro proyecto final de
            Ingeniería en Sistemas de Información en la Universidad Nacional del
            Sur.
          </p>

          <div className={styles.grid}>
            {TEAM.map((member) => (
              <article key={member.name} className={styles.card}>
                <div className={styles.avatar} aria-hidden="true">
                  {member.initials}
                </div>
                <h2 className={styles.name}>{member.name}</h2>
                <p className={styles.role}>Desarrollador</p>
              </article>
            ))}
          </div>

          <div className={styles.backRow}>
            <Button
              variant="light"
              icon={faArrowLeft}
              onClick={() => router.push('/ingresar')}
            >
              Volver
            </Button>
          </div>
        </section>
      </main>

      <style>{styles.keyframes}</style>
    </>
  )
}
