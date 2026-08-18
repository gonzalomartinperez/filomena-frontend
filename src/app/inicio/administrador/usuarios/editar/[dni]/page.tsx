'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  getUsuario,
  upsertUsuario,
} from 'app/inicio/administrador/usuarios/services/usuariosServices'
import { getRoles } from 'app/inicio/administrador/usuarios/services/metaServices'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import { Usuario } from 'app/inicio/administrador/usuarios/types/Usuario'
import GenericForm, { Field } from 'app/components/forms/GenericForm'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import validationSchema from '../../schemas/validationSchema'
import { toRolesExamen } from 'app/utils/roles'

export default function Page() {
  const { dni } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const examenId = Number(searchParams.get('examen') ?? '0')

  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()

  const [rolesOpts, setRolesOpts] = useState<string[]>([])
  const [usuario, setUsuario] = useState<Partial<Usuario>>({})

  useEffect(() => {
    const loadId = startLoading('Cargando datos')
    Promise.all([getUsuario(dni!.toString()), getRoles()])
      .then(([uRes, rRes]) => {
        setUsuario(uRes.data.data)
        setRolesOpts(rRes.data.data)
      })
      .catch(() =>
        openToast({ severity: 'error', message: 'Error al cargar datos' }),
      )
      .finally(() => stopLoading(loadId))
  }, [dni])

  type FormValues = Yup.InferType<typeof validationSchema>

  const initialValues: FormValues = useMemo(() => {
    const pre = usuario?.roles_examenes?.[examenId] as string[] | undefined
    return {
      usuario: (usuario.usuario ?? '') as string,
      nombre: (usuario.nombre ?? '') as string,
      apellido: (usuario.apellido ?? '') as string,
      dni: (usuario.dni ?? '') as string,
      legajo: (usuario.legajo ?? '') as string,
      email: (usuario.email ?? '') as string,
      roles: pre ?? [],
    }
  }, [usuario, examenId])

  const formik = useFormik<FormValues>({
    enableReinitialize: true,
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      const saveId = startLoading('Guardando cambios')
      try {
        const { roles, ...rest } = values
        const payload: Partial<Usuario> = {
          ...rest,
          dni: (rest.dni || usuario.dni || '') as string,
          roles_examenes: toRolesExamen(examenId, roles),
        }
        await upsertUsuario(payload, examenId)
        openToast({ severity: 'success', message: 'Usuario actualizado' })
        router.replace(`/inicio/administrador/usuarios?examen=${examenId}`)
      } catch {
        openToast({ severity: 'error', message: 'Error al actualizar usuario' })
      } finally {
        stopLoading(saveId)
      }
    },
  })

  const fields: Field<FormValues>[] = [
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
            Podés seleccionar <strong>uno o más</strong> roles para este examen.
          </p>
        </>
      ),
    },
  ]

  return (
    <div>
      <GenericForm<FormValues>
        title="Usuarios - Editar"
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
