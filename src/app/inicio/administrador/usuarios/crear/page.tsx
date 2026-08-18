'use client'

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import GenericForm, { type Field } from 'app/components/forms/GenericForm'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import { upsertUsuario } from 'app/inicio/administrador/usuarios/services/usuariosServices'
import { getRoles } from 'app/inicio/administrador/usuarios/services/metaServices'
import type { Usuario } from 'app/inicio/administrador/usuarios/types/Usuario'
import validationSchema from '../schemas/validationSchema'
import { toRolesExamen } from 'app/utils/roles'
import UserPicker from '../components/UserPicker'

export default function Page() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const examenId = Number(searchParams.get('examen') ?? '0')

  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()

  const [rolesOpts, setRolesOpts] = useState<string[]>([])

  useEffect(() => {
    const loadId = startLoading('Cargando opciones')
    getRoles()
      .then((rRes) => setRolesOpts(rRes.data.data || []))
      .catch(() =>
        openToast({ severity: 'error', message: 'Error al cargar opciones' }),
      )
      .finally(() => stopLoading(loadId))
  }, [])

  type FormValues = Yup.InferType<typeof validationSchema>

  const formik = useFormik<FormValues>({
    enableReinitialize: true,
    initialValues: {
      usuario: '',
      nombre: '',
      apellido: '',
      dni: '',
      legajo: '',
      email: '',
      roles: [],
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!examenId) {
        openToast({
          severity: 'warning',
          message: 'Seleccioná un examen para continuar.',
        })
        return
      }
      const saveId = startLoading('Creando usuario')
      try {
        const { roles, ...rest } = values
        const payload: Partial<Usuario> = {
          ...rest,
          roles_examenes: toRolesExamen(examenId, roles),
        }
        await upsertUsuario(payload, examenId)
        openToast({ severity: 'success', message: 'Usuario creado' })
        router.replace(`/inicio/administrador/usuarios?examen=${examenId}`)
      } catch {
        openToast({ severity: 'error', message: 'Error al crear usuario' })
      } finally {
        stopLoading(saveId)
      }
    },
  })

  const handlePickUser = useCallback(
    (u: Usuario) => {
      const rolesFromExam = Array.isArray(u.roles_examenes?.[examenId])
        ? u.roles_examenes[examenId]
        : []

      formik.setValues({
        usuario: u.usuario ?? '',
        nombre: u.nombre ?? '',
        apellido: u.apellido ?? '',
        dni: u.dni ?? '',
        legajo: u.legajo ?? '',
        email: u.email ?? '',
        roles: rolesFromExam,
      })
    },
    [formik, examenId],
  )

  const fields: Field<FormValues>[] = useMemo(
    () => [
      { name: 'nombre', label: 'Nombre', type: 'text' },
      { name: 'apellido', label: 'Apellido', type: 'text' },
      { name: 'dni', label: 'DNI', type: 'text' },
      { name: 'legajo', label: 'Legajo', type: 'text' },
      { name: 'usuario', label: 'Usuario', type: 'text' },
      { name: 'email', label: 'Email', type: 'text' },
      {
        name: 'roles',
        label: 'Roles (para este examen)',
        type: 'custom',
        render: () => (
          <>
            <div className="flex flex-wrap gap-2">
              {rolesOpts.map((r) => {
                const checked = (formik.values?.roles ?? []).includes(r)
                return (
                  <label
                    key={r}
                    className={[
                      'cursor-pointer rounded-full border px-3 py-1 text-sm transition select-none',
                      checked
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-emerald-50',
                    ].join(' ')}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={(e) => {
                        const next = new Set(formik.values.roles)
                        if (e.target.checked) next.add(r)
                        else next.delete(r)
                        formik.setFieldValue('roles', Array.from(next))
                      }}
                    />
                    <span className="capitalize">{r}</span>
                  </label>
                )
              })}
            </div>

            <p id="rolesHint" className="mt-2 text-xs text-slate-500">
              Podés seleccionar <strong>uno o más</strong> roles para este
              examen.
            </p>
          </>
        ),
      },
    ],
    [
      formik.values.roles,
      rolesOpts,
      formik.setFieldValue,
      formik.setFieldTouched,
    ],
  )

  return (
    <div className="font-geist-sans">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Usuarios · Crear</h1>
        <UserPicker onPick={handlePickUser} />
      </div>

      {/* Form */}
      <GenericForm<FormValues>
        title=""
        fields={fields}
        formikInstance={formik}
        submitLabel="Guardar"
        onCancel={() =>
          router.replace(`/inicio/administrador/usuarios?examen=${examenId}`)
        }
      />
    </div>
  )
}
