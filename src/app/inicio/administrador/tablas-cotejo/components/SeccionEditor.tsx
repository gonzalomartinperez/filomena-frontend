import React, { useState } from 'react'
import { Seccion } from 'app/inicio/administrador/secciones/types/Seccion'
import { Button } from 'app/components/buttons/GeneralButton'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

import type { FormikProps } from 'formik'
import type { TablaCotejoValues } from '../schemas/tablaCotejoActionSchema'

export type Item = {
  id?: number
  descripcion: string
  valor: number
  pregunta_id: string
}

export type SeccionEditorType = {
  seccion_id: string
  items: Item[]
}

type Props = {
  seccionesWithFullInfo: Seccion[]
  secciones: SeccionEditorType[]
  setSecciones: (secciones: SeccionEditorType[]) => void
  preguntasDisponibles: { id: string; texto: string; orden_relativo: number }[]
  formik?: FormikProps<TablaCotejoValues>
}

export default function SeccionEditor(props: Props) {
  const {
    seccionesWithFullInfo,
    secciones,
    setSecciones,
    preguntasDisponibles,
    formik,
  } = props

  const nameFor = (i: number, j: number, key: keyof Item): string =>
    `secciones[${i}].items[${j}].${String(key)}`

  const [createdAtByItem, setCreatedAtByItem] = useState<number[][]>([])

  const createdAtOf = (i: number, j: number): number =>
    createdAtByItem[i]?.[j] ?? 0

  const fieldErrorForItem = (
    i: number,
    j: number,
    key: keyof Item,
  ): string | undefined => {
    if (!formik) return undefined
    const path = nameFor(i, j, key)
    const meta = formik.getFieldMeta<string>(path)
    const wasCreatedAt = createdAtOf(i, j)
    const shouldShow = meta.touched || (formik.submitCount ?? 0) > wasCreatedAt
    return shouldShow && typeof meta.error === 'string' ? meta.error : undefined
  }

  const fieldErrorRaw = (path: string): string | undefined => {
    if (!formik) return undefined
    const meta = formik.getFieldMeta<string>(path)
    return typeof meta.error === 'string' ? meta.error : undefined
  }

  function handleItemChange<K extends keyof Item>(
    seccionIndex: number,
    itemIndex: number,
    key: K,
    value: Item[K],
  ): void {
    const updated = secciones.map((seccion, index) =>
      index === seccionIndex
        ? {
            ...seccion,
            items: seccion.items.map((item, currentItemIndex) =>
              currentItemIndex === itemIndex ? { ...item, [key]: value } : item,
            ),
          }
        : seccion,
    )
    setSecciones(updated)

    if (formik) {
      const path = nameFor(seccionIndex, itemIndex, key)
      formik.setFieldValue(path, value)
      formik.setFieldTouched(path, true, false)
    }
  }

  const addItem = (seccionIndex: number): void => {
    const currentItems = secciones[seccionIndex].items

    const pregunta_id =
      currentItems.length === 0
        ? ''
        : currentItems[currentItems.length - 1].pregunta_id

    const newItem: Item = {
      descripcion: '',
      valor: 0.5,
      pregunta_id,
    }

    const updated = secciones.map((seccion, index) =>
      index === seccionIndex
        ? { ...seccion, items: [...seccion.items, newItem] }
        : seccion,
    )

    setSecciones(updated)
    setCreatedAtByItem((previous) => {
      const next = previous.map((row) => [...row])
      while (next.length <= seccionIndex) next.push([])
      while (next[seccionIndex].length < currentItems.length) {
        next[seccionIndex].push(0)
      }
      next[seccionIndex].push(formik?.submitCount ?? 0)
      return next
    })
  }

  const removeItem = (seccionIndex: number, itemIndex: number): void => {
    const currentItems = secciones[seccionIndex].items
    const updated = secciones.map((seccion, index) =>
      index === seccionIndex
        ? {
            ...seccion,
            items: seccion.items.filter(
              (_, currentIndex) => currentIndex !== itemIndex,
            ),
          }
        : seccion,
    )
    setSecciones(updated)
    setCreatedAtByItem((previous) => {
      const next = previous.map((row) => [...row])
      while (next.length <= seccionIndex) next.push([])
      while (next[seccionIndex].length < currentItems.length) {
        next[seccionIndex].push(0)
      }
      next[seccionIndex].splice(itemIndex, 1)
      return next
    })
  }

  return (
    <div className="col-span-2 w-full">
      <div className="mt-6 space-y-6">
        {secciones.map((seccion, seccionIndex) => {
          const fullInfo = seccionesWithFullInfo.find(
            (s) => String(s.id) === String(seccion.seccion_id),
          )
          const sectionName = fullInfo?.nombre

          const itemsMetaError = formik?.getFieldMeta<string>(
            `secciones[${seccionIndex}].items`,
          ).error
          const showItemsError =
            typeof itemsMetaError === 'string' && (formik?.submitCount ?? 0) > 0

          return (
            <div
              key={seccion.seccion_id}
              className="rounded border border-dashed border-gray-500 p-4 shadow"
            >
              <h3 className="mb-1 font-semibold text-blue-600 uppercase">
                {sectionName}
              </h3>

              <div className="mb-2">
                <span className="font-medium text-gray-700">Items</span>
                {showItemsError && (
                  <span className="ml-2 text-xs text-red-600">
                    {itemsMetaError}
                  </span>
                )}
              </div>

              {seccion.items.map((item, itemIndex) => {
                const itemHasErrorRaw =
                  !!fieldErrorRaw(
                    nameFor(seccionIndex, itemIndex, 'pregunta_id'),
                  ) ||
                  !!fieldErrorRaw(
                    nameFor(seccionIndex, itemIndex, 'descripcion'),
                  ) ||
                  !!fieldErrorRaw(nameFor(seccionIndex, itemIndex, 'valor'))

                const itemIsVisibleBySubmit =
                  (formik?.submitCount ?? 0) >
                  createdAtOf(seccionIndex, itemIndex)

                const paintRed = itemHasErrorRaw && itemIsVisibleBySubmit

                return (
                  <div
                    key={itemIndex}
                    className={`mb-6 rounded border border-dashed p-4 ${
                      paintRed
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-500 bg-gray-50'
                    }`}
                  >
                    <div className="mb-4 grid grid-cols-3 gap-4">
                      {/* Pregunta */}
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Pregunta:
                        </label>
                        <select
                          className="w-full rounded border border-gray-300 px-3 py-2"
                          value={item.pregunta_id}
                          onChange={(e) =>
                            handleItemChange(
                              seccionIndex,
                              itemIndex,
                              'pregunta_id',
                              e.target.value,
                            )
                          }
                          onBlur={() =>
                            formik?.setFieldTouched(
                              nameFor(seccionIndex, itemIndex, 'pregunta_id'),
                              true,
                              false,
                            )
                          }
                        >
                          <option value="" disabled>
                            Seleccionar pregunta
                          </option>
                          {preguntasDisponibles.map((p) => (
                            <option key={p.id} value={p.id}>
                              {`Pregunta N° ${p.orden_relativo}`}
                            </option>
                          ))}
                        </select>
                        {fieldErrorForItem(
                          seccionIndex,
                          itemIndex,
                          'pregunta_id',
                        ) && (
                          <span className="mt-1 block text-xs text-red-600">
                            {fieldErrorForItem(
                              seccionIndex,
                              itemIndex,
                              'pregunta_id',
                            )}
                          </span>
                        )}
                      </div>

                      {/* Descripción */}
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Descripción:
                        </label>
                        <input
                          type="text"
                          className="w-full rounded border border-gray-300 px-3 py-2"
                          placeholder="Descripción del ítem"
                          value={item.descripcion}
                          onChange={(e) =>
                            handleItemChange(
                              seccionIndex,
                              itemIndex,
                              'descripcion',
                              e.target.value,
                            )
                          }
                          onBlur={() =>
                            formik?.setFieldTouched(
                              nameFor(seccionIndex, itemIndex, 'descripcion'),
                              true,
                              false,
                            )
                          }
                        />
                        {fieldErrorForItem(
                          seccionIndex,
                          itemIndex,
                          'descripcion',
                        ) && (
                          <span className="mt-1 block text-xs text-red-600">
                            {fieldErrorForItem(
                              seccionIndex,
                              itemIndex,
                              'descripcion',
                            )}
                          </span>
                        )}
                      </div>

                      {/* Valor */}
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Valor:
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min={0.5}
                          max={10}
                          className="w-full rounded border border-gray-300 px-3 py-2"
                          placeholder="[0.5-10]"
                          value={item.valor}
                          onChange={(e) =>
                            handleItemChange(
                              seccionIndex,
                              itemIndex,
                              'valor',
                              Number(e.target.value),
                            )
                          }
                          onBlur={() =>
                            formik?.setFieldTouched(
                              nameFor(seccionIndex, itemIndex, 'valor'),
                              true,
                              false,
                            )
                          }
                        />
                        {fieldErrorForItem(
                          seccionIndex,
                          itemIndex,
                          'valor',
                        ) && (
                          <span className="mt-1 block text-xs text-red-600">
                            {fieldErrorForItem(
                              seccionIndex,
                              itemIndex,
                              'valor',
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="red"
                        onClick={() => removeItem(seccionIndex, itemIndex)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                )
              })}

              <Button
                type="button"
                icon={faPlus}
                variant="orange"
                onClick={() => addItem(seccionIndex)}
              >
                Agregar ítem
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
