'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryState, parseAsInteger, createSerializer } from 'nuqs'
import { getUsuarios, deleteUsuario } from './services/usuariosServices'
import { getExamenesAPI } from '../services/filterServices'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import { Usuario } from 'app/inicio/administrador/usuarios/types/Usuario'
import { Examen } from '../examenes/types/Examen'
import { Column, DataGrid } from 'app/components/datagrid/DatagridComponent'
import { Button } from 'app/components/buttons/GeneralButton'
import {
  faCirclePlus,
  faFileImport,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons'
import useModal from 'app/hooks/useModal'
import ExamenListComponent from '../components/lists/ExamenListComponent'

const BASE = '/inicio/administrador/usuarios'

const styles = {
  container: 'font-geist-sans',
  title: 'mb-6 text-3xl font-semibold',
  controls:
    'mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
  buttonsWrapper: 'flex gap-2',
}

const columnsUsuarios: Column<Usuario & { roles_display?: string }>[] = [
  { field: 'usuario', headerName: 'Usuario' },
  { field: 'nombre', headerName: 'Nombre' },
  { field: 'apellido', headerName: 'Apellido' },
  { field: 'legajo', headerName: 'Legajo' },
  { field: 'dni', headerName: 'DNI' },
  { field: 'email', headerName: 'Email' },
  { field: 'roles_display', headerName: 'Rol(es)' },
]

function stringifyRoles(u: Usuario, examenId: number): string {
  const arr = u.roles_examenes?.[examenId] as string[] | undefined
  if (!arr || !arr.length) return '—'
  return arr.join(', ')
}

export default function Page() {
  const router = useRouter()
  const [examenParam, setExamenParam] = useQueryState('examen', parseAsInteger)
  const serialize = useMemo(
    () => createSerializer({ examen: parseAsInteger }),
    [],
  )

  const [examenes, setExamenes] = useState<Examen[]>([])
  const [examenSeleccionado, setExamenSeleccionado] = useState<Examen | null>(
    null,
  )
  const [usuarios, setUsuarios] = useState<Usuario[]>([])

  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()
  const {
    actions: { openModal },
  } = useModal()

  useEffect(() => {
    const id = startLoading('Cargando exámenes')
    getExamenesAPI()
      .then((res) => setExamenes(res.data?.data ?? []))
      .finally(() => stopLoading(id))
  }, [])

  const loadUsuarios = useCallback(
    async (examenId: number) => {
      const id = startLoading('Cargando usuarios')
      try {
        const res = await getUsuarios(examenId)
        setUsuarios(res.data.data)
        openToast({ severity: 'success', message: res.data.message })
      } finally {
        stopLoading(id)
      }
    },
    [startLoading, stopLoading, openToast],
  )

  useEffect(() => {
    if (examenParam == null || !examenes.length) return
    const found = examenes.find((e) => Number(e.id) === Number(examenParam))
    if (!found) {
      setExamenParam(null)
      openToast({
        severity: 'warning',
        message: 'El examen seleccionado no existe o ya no está disponible.',
      })
      return
    }
    if (
      !examenSeleccionado ||
      Number(examenSeleccionado.id) !== Number(found.id)
    ) {
      setExamenSeleccionado(found)
      void loadUsuarios(found.id)
    }
  }, [examenParam, examenes])

  const handleSelectExamen = useCallback(
    (ex: Examen) => {
      setExamenParam(Number(ex.id))
      setExamenSeleccionado(ex)
      void loadUsuarios(ex.id)
    },
    [setExamenParam, loadUsuarios],
  )

  const deleteElement = (user: Usuario) => {
    if (!examenSeleccionado) return
    const id = startLoading('Eliminando usuario')
    deleteUsuario(user.dni, examenSeleccionado.id)
      .then((res) => {
        setUsuarios((prev) => prev.filter((u) => u.id !== user.id))
        openToast({ severity: 'success', message: res.data.message })
      })
      .finally(() => stopLoading(id))
  }

  const handleDelete = (user: Usuario) => {
    openModal({
      type: 'confirmacion',
      message: `¿Está seguro que desea eliminar el usuario: ${user.usuario}?`,
      button: { onClick: () => deleteElement(user) },
    })
  }

  const handleBack = async () => {
    await setExamenParam(null)
    setExamenSeleccionado(null)
    setUsuarios([])
  }

  const handleCreate = () => {
    if (!examenSeleccionado) return
    router.push(
      serialize(`${BASE}/crear`, { examen: Number(examenSeleccionado.id) }),
    )
  }

  const handleImport = () => {
    if (!examenSeleccionado) return
    router.push(
      serialize(`${BASE}/importar`, { examen: Number(examenSeleccionado.id) }),
    )
  }

  const handleViewUser = (u: Usuario) => {
    const examenId = Number(examenSeleccionado?.id)
    router.push(serialize(`${BASE}/${u.dni}`, { examen: examenId }))
  }

  const handleEditUser = (u: Usuario) => {
    if (!examenSeleccionado) return
    router.push(
      serialize(`${BASE}/editar/${u.dni}`, {
        examen: Number(examenSeleccionado.id),
      }),
    )
  }

  const rows = useMemo(
    () =>
      examenSeleccionado
        ? usuarios.map((u) => ({
            ...u,
            roles_display: stringifyRoles(u, Number(examenSeleccionado.id)),
          }))
        : [],
    [usuarios, examenSeleccionado],
  )

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Usuarios</h1>

      {!examenSeleccionado && (
        <ExamenListComponent
          rows={examenes}
          columnsVariant="selection"
          onSelect={handleSelectExamen}
          rowClickEnabled
        />
      )}

      {examenSeleccionado && (
        <>
          <div className={styles.controls}>
            <div className={styles.buttonsWrapper}>
              <Button variant="light" icon={faArrowLeft} onClick={handleBack}>
                Volver a exámenes
              </Button>
              <Button
                variant="default"
                icon={faCirclePlus}
                disabled={examenSeleccionado.publicado}
                onClick={handleCreate}
              >
                Cargar usuario
              </Button>
              <Button
                variant="green"
                icon={faFileImport}
                disabled={examenSeleccionado.publicado}
                onClick={handleImport}
              >
                Cargar usuarios desde Excel
              </Button>
            </div>
          </div>

          <DataGrid
            rows={rows}
            columns={columnsUsuarios}
            rowKey="id"
            exam={examenSeleccionado}
            onView={handleViewUser}
            onEdit={handleEditUser}
            onDelete={handleDelete}
          />
        </>
      )}
    </div>
  )
}
