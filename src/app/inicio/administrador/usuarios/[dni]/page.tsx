'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { getUsuario } from 'app/inicio/administrador/usuarios/services/usuariosServices'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import { Usuario } from 'app/inicio/administrador/usuarios/types/Usuario'
import { faArrowLeft, faUser } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button } from 'app/components/buttons/GeneralButton'

const styles = {
  container: 'font-geist-sans',
  title: 'mb-6 text-3xl font-semibold',
  wrapper: 'font-geist-sans p-8 sm:p-20 max-w-4xl mx-auto',
  header: 'flex items-center gap-4 mb-8 bg-white rounded-2xl shadow-lg p-6',
  avatarContainer:
    '-mt-16 w-32 h-32 rounded-full bg-gray-200 border-4 border-white flex items-center justify-center',
  name: 'text-2xl font-semibold mb-1',
  card: 'bg-white shadow-lg rounded-2xl p-6',
  term: 'text-sm font-medium text-gray-500 uppercase',
  desc: 'mt-1 text-base text-gray-900',
}

export default function Page() {
  const { dni } = useParams()
  const searchParams = useSearchParams()
  const examenId = Number(searchParams.get('examen') ?? '0')

  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()
  const router = useRouter()

  useEffect(() => {
    if (!dni) return
    const loadingId = startLoading('Cargando detalles')
    getUsuario(dni.toString())
      .then((res) => {
        setUsuario(res.data.data as Usuario)
        openToast({ severity: 'success', message: res.data.message })
      })
      .finally(() => stopLoading(loadingId))
  }, [dni])

  const rolesExamen = useMemo(() => {
    if (!usuario || !examenId) return []
    return (usuario.roles_examenes?.[examenId] as string[] | undefined) ?? []
  }, [usuario, examenId])

  if (!usuario) return null

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Usuarios - Ver</h1>

      <div className="mt-6 mb-2 flex justify-start">
        <Button
          type="button"
          icon={faArrowLeft}
          variant="light"
          onClick={() => router.back()}
        >
          Volver
        </Button>
      </div>

      <div className={styles.wrapper}>
        <div className={styles.header}>
          <div className={styles.avatarContainer}>
            <FontAwesomeIcon icon={faUser} size="3x" />
          </div>
          <div className="flex-1">
            <h1 className={styles.name}>
              {usuario.nombre} {usuario.apellido}
            </h1>
            <span className="inline-block rounded bg-indigo-100 px-2 py-1 text-xs text-indigo-800">
              {rolesExamen.length
                ? rolesExamen.join(', ')
                : 'Sin roles en este examen'}
            </span>
          </div>
        </div>

        <div className={styles.card}>
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {[
              ['Usuario', usuario.usuario],
              ['Legajo', usuario.legajo],
              ['DNI', usuario.dni],
              ['Email', usuario.email],
              ['Creado', new Date(usuario.created_at).toLocaleString()],
              ['Actualizado', new Date(usuario.updated_at).toLocaleString()],
            ].map(([term, desc]) => (
              <div key={term as string}>
                <dt className={styles.term}>{term}:</dt>
                <dd className={styles.desc}>{desc as string}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
