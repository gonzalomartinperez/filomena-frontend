'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import { importUsuarios } from 'app/inicio/administrador/usuarios/services/usuariosServices'
import ImportForm from 'app/inicio/administrador/components/imports/ImportForm'
import type { ApiResponse } from 'app/types/ApiResponse'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUserShield,
  faUserTie,
  faUserGraduate,
} from '@fortawesome/free-solid-svg-icons'

import { ADMINISTRADOR, ESTUDIANTE, EVALUADOR } from '../constants/roles'
type RolUsuario = typeof ESTUDIANTE | typeof EVALUADOR | typeof ADMINISTRADOR

const styles = {
  container: 'font-geist-sans',
  title: 'mb-6 text-3xl font-semibold',
  roleList: 'flex flex-col gap-3',
  roleItem:
    'relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition ' +
    'hover:shadow-md hover:ring-2 hover:ring-indigo-400/60 has-[:checked]:ring-2 has-[:checked]:ring-indigo-500',
  roleRadio: 'peer absolute inset-0 h-full w-full cursor-pointer opacity-0',
  roleTitle: 'mt-2 text-sm font-semibold',
  roleDesc: 'text-xs text-gray-500',
  roleIconWrap:
    'flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700',
  hint: 'text-xs text-gray-600',
  link: 'text-indigo-600 underline',
}

type RoleOption = { value: RolUsuario; label: string; desc: string }
const useRoleOptions = (): RoleOption[] =>
  useMemo(
    () => [
      { value: ESTUDIANTE, label: 'Estudiante', desc: 'Realizan el examen' },
      { value: EVALUADOR, label: 'Evaluador', desc: 'Corrigen el examen' },
      {
        value: ADMINISTRADOR,
        label: 'Administrador',
        desc: 'Gestionan el examen',
      },
    ],
    [],
  )

const ACCEPT = [
  '.xls',
  '.xlsx',
  '.csv',
  '.ods',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/vnd.oasis.opendocument.spreadsheet',
].join(',')

export default function ImportarUsuariosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [file, setFile] = useState<File | null>(null)
  const [rol, setRol] = useState<RolUsuario>(ESTUDIANTE)
  const [busy, setBusy] = useState(false)
  const roleOptions = useRoleOptions()

  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()

  const examenParam = searchParams.get('examen')
  const examenId = Number(examenParam ?? '0')

  useEffect(() => {
    if (!examenParam || Number.isNaN(examenId) || examenId <= 0) {
      router.replace('/inicio/administrador/usuarios')
    }
  }, [examenParam, examenId, router])

  const handleFiles = (
    accepted: File[],
    rejected: { file: File; reason: string }[],
  ) => {
    if (rejected.length) {
      const err = rejected[0]
      openToast({
        severity: 'warning',
        message: `“${err.file.name}”: ${err.reason}`,
      })
    }
    setFile(accepted[0] ?? null)
  }

  const clearFile = () => setFile(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      openToast({
        severity: 'warning',
        message: 'Seleccioná un archivo válido',
      })
      return
    }
    if (!examenId || Number.isNaN(examenId)) {
      openToast({ severity: 'error', message: 'Examen inválido' })
      return
    }
    const formData = new FormData()
    formData.append('archivo', file)

    const loadId = startLoading('Importando usuarios…')
    setBusy(true)
    try {
      await importUsuarios(formData, examenId, rol)
      openToast({
        severity: 'success',
        message: 'Usuarios importados correctamente.',
      })
      router.back()
    } catch (error) {
      const err = error as { response?: { data?: ApiResponse<unknown> } }
      const msg =
        err?.response?.data?.message ||
        (error as Error)?.message ||
        'Fallo al importar usuarios.'
      openToast({ severity: 'error', message: msg })
    } finally {
      stopLoading(loadId)
      setBusy(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* ¡mantengo tu título exacto! */}
      <h1 className={styles.title}>Usuarios - Importar desde Excel</h1>

      <ImportForm
        busy={busy}
        file={file}
        accept={ACCEPT}
        maxSizeMB={20}
        idleTitle="Arrastrá el archivo o hacé clic para seleccionar"
        busyTitle="Procesando…"
        subtitle="Formatos: .xls · .xlsx · .csv · .ods"
        onFiles={handleFiles}
        onRemoveFile={clearFile}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        leftHelp={
          <p className={`${styles.hint} mt-2`}>
            Las plantillas institucionales no se distribuyen en el snapshot
            público. Cargá un archivo compatible preparado para tu institución.
          </p>
        }
        rightColumn={
          <>
            <span className="text-sm font-medium text-gray-700">
              Rol a asignar
            </span>
            <div
              className={styles.roleList}
              role="radiogroup"
              aria-label="Seleccionar rol"
            >
              {roleOptions.map((opt) => (
                <label key={opt.value} className={styles.roleItem}>
                  <input
                    type="radio"
                    name="rol"
                    value={opt.value}
                    checked={rol === opt.value}
                    onChange={() => setRol(opt.value)}
                    className={styles.roleRadio}
                    disabled={busy}
                    aria-checked={rol === opt.value}
                    aria-label={opt.label}
                  />
                  <div className="flex items-start gap-3">
                    <span className={styles.roleIconWrap}>
                      {getRoleIcon(opt.value)}
                    </span>
                    <div>
                      <div className={styles.roleTitle}>{opt.label}</div>
                      <div className={styles.roleDesc}>{opt.desc}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <span className={styles.hint}>
              El rol seleccionado se aplicará a todos los registros del Excel.
            </span>
          </>
        }
      />
    </div>
  )
}

function getRoleIcon(rol: RolUsuario) {
  if (rol === ADMINISTRADOR) return <FontAwesomeIcon icon={faUserShield} />
  if (rol === EVALUADOR) return <FontAwesomeIcon icon={faUserTie} />
  return <FontAwesomeIcon icon={faUserGraduate} />
}
