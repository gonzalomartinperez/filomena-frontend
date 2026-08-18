'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from 'app/components/buttons/GeneralButton'
import { faSave } from '@fortawesome/free-solid-svg-icons'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import useModal from 'app/hooks/useModal'
import UnsavedChangesGuard from 'app/components/navigation/UnsavedChangesGuard'

import type { Caso } from 'app/inicio/administrador/casos/types/Caso'
import type { Usuario } from 'app/inicio/administrador/usuarios/types/Usuario'
import type { Item as ItemTC } from 'app/inicio/administrador/tablas-cotejo/types/TablaCotejo'

import {
  getDefensasAPI,
  putDefensasAPI,
  marcarEstudianteDefendido,
} from '../services/defensasServices'
import { getCorreccionesAlumno } from 'app/inicio/evaluador/services/evaluadorCache'
import { getOrFetchTablas, getSeccionNombre } from '../services/defensasCache'

import { useFormik } from 'formik'
import { HiCheck, HiX, HiUser } from 'react-icons/hi'
import { buildDefensasSchema, TopesPorSeccion } from '../schemas/defensasSchema'

type SeccionTabla = {
  seccion_id: number
  seccion_nombre: string
  items: (ItemTC & { aprobado: boolean })[]
  tope: number
  total: number
}

type Props = {
  examenId: number
  caso: Caso
  pseudonimo: Usuario['pseudonimo'] extends string ? string : string
  estudianteId: number
  tablaIds: number[]
  examenDefendido: boolean
  onBack: () => void
  onSaved?: () => void
  /** Notifica cambios efectivos del formulario (true cuando hay ediciones no guardadas). */
  onDirtyChange?: (dirty: boolean) => void
}

export default function DefensasEditor({
  examenId,
  caso,
  pseudonimo,
  estudianteId,
  tablaIds,
  examenDefendido,
  onSaved,
  onDirtyChange,
}: Props) {
  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()
  const {
    actions: { openModal },
  } = useModal()

  const [tabla, setTabla] = useState<SeccionTabla[]>([])

  useEffect(() => {
    let alive = true
    const lid = startLoading('Cargando estructura y estado')

    ;(async () => {
      try {
        const tablas = await getOrFetchTablas(tablaIds)

        const allItems = tablas.flatMap((t) => t.items ?? [])
        const byPregunta = new Map<number, ItemTC[]>()
        allItems.forEach((it) => {
          const pid = Number(it.pregunta_id)
          if (!byPregunta.has(pid)) byPregunta.set(pid, [])
          byPregunta.get(pid)!.push(it)
        })

        const aprobadosPorItem = new Map<number, boolean>()
        await Promise.all(
          Array.from(byPregunta.entries()).map(async ([preguntaId, items]) => {
            const corr =
              (await getCorreccionesAlumno(
                preguntaId,
                String(pseudonimo),
              ).catch(() => ({}) as Record<number, boolean>)) ?? {}
            items.forEach((it) =>
              aprobadosPorItem.set(
                Number(it.id),
                Boolean(corr[it.id] ?? false),
              ),
            )
          }),
        )

        const secciones = new Map<number, SeccionTabla>()
        tablas.forEach((t) => {
          const sid = Number(t.seccion_id)
          if (!secciones.has(sid)) {
            secciones.set(sid, {
              seccion_id: sid,
              seccion_nombre: getSeccionNombre(sid),
              items: [],
              tope: 0,
              total: 0,
            })
          }
          ;(t.items ?? []).forEach((it) => {
            const aprobado = Boolean(aprobadosPorItem.get(Number(it.id)))
            const s = secciones.get(sid)!
            s.items.push({ ...it, aprobado })
            if (!aprobado) s.tope += Number(it.valor || 0)
            s.total += Number(it.valor || 0)
          })
        })

        const list = Array.from(secciones.values()).sort(
          (a, b) => a.seccion_id - b.seccion_id,
        )
        if (!alive) return
        setTabla(list)

        const defRes = await getDefensasAPI(Number(caso.id), String(pseudonimo))
        const defensas = (defRes?.data?.data ?? []) as {
          seccion_id: number
          nota: number
        }[]
        const init: Record<number, number> = {}
        defensas.forEach(
          (d) => (init[Number(d.seccion_id)] = Number(d.nota || 0)),
        )

        // Importante: fijamos baseline para que Formik NO quede "dirty" al cargar.
        formik.resetForm({ values: init })
      } finally {
        stopLoading(lid)
      }
    })()

    return () => {
      alive = false
    }
  }, [examenId, caso.id, pseudonimo, estudianteId, tablaIds])

  const topePorSeccion: TopesPorSeccion = useMemo(() => {
    const o: TopesPorSeccion = {}
    tabla.forEach((s) => (o[s.seccion_id] = s.tope))
    return o
  }, [tabla])

  const validationSchema = useMemo(
    () => buildDefensasSchema(topePorSeccion),
    [topePorSeccion],
  )

  const formik = useFormik<Record<number, number>>({
    initialValues: {},
    enableReinitialize: false,
    validationSchema,
    onSubmit: async (values) => {
      if (examenDefendido) return
      const payload = Object.entries(values).map(([sid, nota]) => ({
        caso_id: Number(caso.id),
        seccion_id: Number(sid),
        nota: Number(nota ?? 0),
      }))

      const lid = startLoading('Guardando defensa')
      try {
        await putDefensasAPI(Number(caso.id), String(pseudonimo), payload)
        await marcarEstudianteDefendido(Number(examenId), String(pseudonimo))
        openToast({
          severity: 'success',
          message: 'Defensa guardada correctamente',
        })

        // Tras guardar, el estado actual pasa a ser el baseline (no sucio).
        formik.resetForm({ values: formik.values })
        onSaved?.()
      } finally {
        stopLoading(lid)
      }
    },
  })

  const isDirty = useMemo(() => formik.dirty, [formik.dirty])

  // Notificamos al padre si cambió el estado de "dirty"
  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  const totalTope = useMemo(
    () => tabla.reduce((a, s) => a + Number(s.tope || 0), 0),
    [tabla],
  )
  const totalNota = useMemo(
    () =>
      tabla.reduce((a, s) => a + Number(formik.values[s.seccion_id] ?? 0), 0),
    [tabla, formik.values],
  )

  const confirmLeave = useCallback(
    (proceed: () => void) => {
      if (!isDirty) return proceed()
      openModal({
        type: 'confirmacion',
        message: '¿Querés salir sin guardar las defensas?',
        button: { onClick: proceed },
      })
    },
    [isDirty, openModal],
  )

  const clearAll = useCallback(() => {
    if (examenDefendido) return
    const v: Record<number, number> = {}
    tabla.forEach((s) => (v[s.seccion_id] = 0))
    formik.setValues({ ...formik.values, ...v })
  }, [tabla, examenDefendido, formik])

  const canSave = useMemo(() => {
    if (examenDefendido) return false
    return validationSchema.isValidSync(formik.values)
  }, [examenDefendido, formik.values, validationSchema])

  return (
    <div className="space-y-4">
      <UnsavedChangesGuard
        enabled={isDirty}
        confirm={confirmLeave}
        message="¿Querés salir sin guardar las defensas?"
      />

      {/* Pseudónimo resaltado */}
      <div className="flex items-center justify-start">
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">
          <HiUser className="h-4 w-4" />
          <span className="opacity-80">Pseudónimo:</span>
          <span className="font-semibold">{pseudonimo}</span>
        </span>
      </div>

      {/* Tabla de cotejo (por secciones) + ítem de defensa */}
      <form
        className="mb-4 rounded-2xl border bg-white p-4 shadow-sm"
        onSubmit={formik.handleSubmit}
      >
        <div className="mb-2">
          <h2 className="text-sm font-semibold text-gray-900">{`Caso ${caso.orden_relativo}: ${caso.titulo}`}</h2>
          <p className="text-xs text-gray-500">
            Cargá el <b>ítem de defensa</b> por sección. El tope es la{' '}
            <b>suma de valores no acertados</b> en esa sección.
          </p>
        </div>

        {tabla.length === 0 ? (
          <p className="text-sm text-gray-500">
            No hay ítems configurados para este caso.
          </p>
        ) : (
          <ul className="space-y-3">
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="red"
                onClick={clearAll}
                disabled={examenDefendido}
                className="px-2.5 py-1 text-xs"
              >
                Limpiar
              </Button>
            </div>

            {tabla.map((sec) => (
              <li key={sec.seccion_id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">
                    {sec.seccion_nombre}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200">
                    Total sección:
                    <b className="ml-1 font-semibold">{sec.total}</b>
                  </span>
                </div>

                <ul className="rounded-xl border bg-white">
                  {sec.items.map((item) => {
                    const aprobado = item.aprobado
                    return (
                      <li
                        key={item.id}
                        className={`grid grid-cols-[minmax(0,1fr)_72px_90px] items-center gap-3 px-3 py-2 ${
                          aprobado ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        {/* Descripción */}
                        <div className="min-w-0 pr-2 text-[13px] leading-snug text-gray-800">
                          {item.descripcion}
                        </div>

                        {/* Puntaje alineado a la derecha (ancho fijo) */}
                        <span
                          className="justify-self-end text-right text-[12px] font-semibold text-gray-700 tabular-nums"
                          title="Valor del ítem"
                        >
                          {item.valor}
                        </span>

                        {/* Globito con ancho fijo (mismo ancho para Sí/No) */}
                        <span
                          className={`inline-flex w-[90px] items-center justify-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium ring-1 ${
                            aprobado
                              ? 'bg-green-100 text-green-800 ring-green-300'
                              : 'bg-red-100 text-red-800 ring-red-300'
                          }`}
                          title={aprobado ? 'Aprobado' : 'No aprobado'}
                          aria-label={aprobado ? 'Aprobado' : 'No aprobado'}
                        >
                          {aprobado ? (
                            <HiCheck className="h-4 w-4" />
                          ) : (
                            <HiX className="h-4 w-4" />
                          )}
                          {aprobado ? 'Sí' : 'No'}
                        </span>
                      </li>
                    )
                  })}
                </ul>

                {/* Ítem de defensa de la sección */}
                <div className="flex items-center justify-between gap-3 rounded-xl border bg-gray-50 p-2">
                  <div className="text-xs text-gray-600">
                    Tope de defensa: <b>{sec.tope}</b>
                  </div>
                  <div className="shrink-0">
                    <label
                      htmlFor={`sec-${sec.seccion_id}`}
                      className="mr-2 text-xs text-gray-600"
                    >
                      Ítem de defensa
                    </label>
                    <input
                      id={`sec-${sec.seccion_id}`}
                      name={`${sec.seccion_id}`}
                      type="number"
                      step={0.5}
                      min={0}
                      max={sec.tope}
                      value={
                        typeof formik.values[sec.seccion_id] === 'number'
                          ? formik.values[sec.seccion_id]
                          : ''
                      }
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      disabled={examenDefendido}
                      className={`w-28 rounded-lg border px-2 py-1 text-right text-sm ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 ${
                        examenDefendido ? 'bg-gray-100 opacity-60' : ''
                      }`}
                    />
                    {formik.touched[sec.seccion_id] &&
                      formik.errors[sec.seccion_id] && (
                        <p className="mt-1 text-right text-xs text-red-600">
                          {String(formik.errors[sec.seccion_id])}
                        </p>
                      )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex items-center justify-end gap-4">
          <div className="text-sm text-gray-700">
            <span className="opacity-80">Total defensa:</span>{' '}
            <b className="font-semibold text-gray-900">{totalNota}</b>
            <span className="opacity-60"> / </span>
            <b className="font-semibold text-gray-900">{totalTope}</b>
          </div>

          <Button
            type="submit"
            variant="default"
            disabled={!canSave}
            icon={faSave}
            className={!canSave ? 'pointer-events-none opacity-60' : ''}
          >
            {examenDefendido ? 'Defensa bloqueada' : 'Guardar defensa'}
          </Button>
        </div>
      </form>
    </div>
  )
}
