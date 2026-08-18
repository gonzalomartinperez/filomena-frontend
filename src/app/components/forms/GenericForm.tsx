/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import React, { useEffect } from 'react'
import {
  useFormik,
  FormikErrors,
  FormikHelpers,
  FormikTouched,
  FormikProps,
} from 'formik'
import { ObjectSchema } from 'yup'
import { Button } from 'app/components/buttons/GeneralButton'

const styles = {
  container: 'font-geist-sans',
  formContainer: 'font-geist-sans w-5xl h-full sm:items-center overflow-y-auto',
  title: 'mb-6 text-3xl font-semibold',
  form: 'bg-white shadow rounded-lg p-6',
  field: 'flex flex-col',
  label: 'mb-1 text-sm font-medium text-gray-700',
  input:
    'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500',
  error: 'mt-1 text-xs text-red-600',
}

type BasicInput =
  | 'text'
  | 'select'
  | 'checkbox'
  | 'date'
  | 'textarea'
  | 'custom'

export interface Field<T> {
  name: keyof T & string
  label: string
  type: BasicInput
  disabled?: boolean
  render?: (formik: FormikProps<T>) => React.ReactNode
  informacion?: string
  placeholder?: string
  options?: Array<string | object>
  getOptionLabel?: (option: any) => string
  getOptionValue?: (option: any) => string | number
  fullRow?: boolean
  onChange?: (value: any, formik: FormikProps<T>) => void
}

export interface FormClasses {
  container: string
  formContainer: string
  title: string
  form: string
  field: string
  label: string
  input: string
  error: string
}

interface GenericFormProps<T extends Record<string, unknown>> {
  title: string
  fields: Field<T>[]
  initialValues?: T
  validationSchema?: ObjectSchema<T>
  onSubmit?: (values: T, helpers: FormikHelpers<T>) => void | Promise<void>
  onCancel?: () => void
  submitLabel?: string
  cancelLabel?: string
  /** Permite sobrescribir alguna clase puntual si lo necesitás */
  classes?: Partial<FormClasses>
  formikInstance?: FormikProps<T>
  /** Si true, agrega acolchonado extra inferior y coloca children como “sección de subida” antes de la botonera */
  showUploadSlot?: boolean
  /** Si true, agrega subcomponente de armado de items para tabla de cotejo */
  showSectionEditor?: boolean
  /** Contenido que quieras renderizar (por ej. la sección de archivos) antes de los botones */
  children?: React.ReactNode
}

export default function GenericForm<T extends Record<string, unknown>>(
  props: GenericFormProps<T>,
) {
  const {
    title,
    fields,
    initialValues,
    validationSchema,
    onSubmit,
    onCancel,
    submitLabel = 'Guardar',
    cancelLabel = 'Cancelar',
    classes = {},
    formikInstance,
    showUploadSlot = false,
    showSectionEditor = false,
    children,
  } = props

  /* Combina estilos base + overrides */
  const cls: FormClasses = { ...styles, ...classes }

  const internalFormik = useFormik<T>({
    enableReinitialize: true,
    initialValues: initialValues!,
    validationSchema: validationSchema!,
    onSubmit: onSubmit!,
  })

  const formik: FormikProps<T> = formikInstance ?? internalFormik

  // Auto-select single options in select fields
  useEffect(() => {
    fields.forEach((field) => {
      if (
        field.type === 'select' &&
        field.options &&
        field.options.length === 1
      ) {
        const currentValue = formik.values[field.name]

        if (!currentValue || currentValue === '') {
          const singleOption = field.options[0]
          const optionValue = field.getOptionValue
            ? field.getOptionValue(singleOption)
            : String(singleOption)

          formik.setFieldValue(field.name, optionValue)
        }
      }
    })
  }, [fields, formik])

  const getError = (name: keyof T): string | undefined => {
    const touched: FormikTouched<T>[keyof T] = formik.touched[name]
    const error: FormikErrors<T>[keyof T] = formik.errors[name]
    if ((touched || formik.submitCount > 0) && typeof error === 'string') {
      return error
    }
    return undefined
  }

  const getSafeFieldProps = (name: keyof T & string, type: BasicInput) => {
    const fp: any = formik.getFieldProps(name)
    const needsString =
      type === 'text' ||
      type === 'textarea' ||
      type === 'select' ||
      type === 'date'
    return { ...fp, value: needsString ? (fp.value ?? '') : fp.value }
  }

  const renderField = (f: Field<T>) => {
    if (f.type === 'select') {
      const fp = getSafeFieldProps(f.name, f.type)
      return (
        <select
          id={f.name}
          {...fp}
          className={`${cls.input} ${f.disabled ? 'cursor-not-allowed bg-gray-100/50 text-gray-400 opacity-50' : ''}`}
          disabled={f.disabled}
          onChange={(e) => {
            fp.onChange(e)

            if (f.onChange) {
              f.onChange(e.target.value, formik)
            }
          }}
        >
          <option value="" disabled>
            Seleccionar {f.name}
          </option>
          {f.options?.map((opt, index) => {
            const value = f.getOptionValue ? f.getOptionValue(opt) : String(opt)
            const label = f.getOptionLabel ? f.getOptionLabel(opt) : String(opt)
            return (
              <option key={index} value={value}>
                {label}
              </option>
            )
          })}
        </select>
      )
    }

    if (f.type === 'checkbox') {
      if (Array.isArray(f.options)) {
        return (
          <div className="flex flex-row flex-wrap gap-4">
            {f.options.map((opt, index) => {
              const value = f.getOptionValue?.(opt) ?? String(opt)
              const label = f.getOptionLabel?.(opt) ?? String(opt)
              const selectedValues = formik.values[f.name] as
                | { seccion_id: string; items?: unknown[] }[]
                | undefined
              const isChecked = selectedValues?.some(
                (v) => v.seccion_id === String(value),
              )

              return (
                <label
                  key={index}
                  className="inline-flex items-center gap-2 text-sm text-gray-800"
                >
                  <input
                    type="checkbox"
                    name={f.name}
                    value={String(value)}
                    checked={Boolean(isChecked)}
                    onChange={() => {
                      const currentValues = [
                        ...((formik.values[f.name] as unknown[]) ?? []),
                      ] as Array<{ seccion_id: string; items?: unknown[] }>
                      const exists = currentValues.find(
                        (s) => s.seccion_id === String(value),
                      )

                      if (exists) {
                        formik.setFieldValue(
                          f.name,
                          currentValues.filter(
                            (s) => s.seccion_id !== String(value),
                          ),
                        )
                      } else {
                        formik.setFieldValue(f.name, [
                          ...currentValues,
                          {
                            seccion_id: String(value),
                            items: [
                              {
                                descripcion: '',
                                valor: 0.5,
                                pregunta_id: '',
                              },
                            ],
                          },
                        ])
                      }

                      formik.setFieldTouched(f.name, true, false)
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {label}
                </label>
              )
            })}
          </div>
        )
      }

      // Checkbox simple (boolean)
      return (
        <div className="flex items-center">
          <input
            id={f.name}
            name={f.name}
            type="checkbox"
            checked={Boolean(formik.values[f.name])}
            onChange={(e) => {
              formik.setFieldValue(f.name, e.target.checked)
              formik.setFieldTouched(f.name, true, false)
            }}
            onBlur={() => formik.setFieldTouched(f.name, true, false)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          {f.informacion && (
            <label
              htmlFor={f.name}
              className="ml-2 block text-sm text-gray-900"
            >
              {f.informacion}
            </label>
          )}
        </div>
      )
    }

    if (f.type === 'textarea') {
      const fp = getSafeFieldProps(f.name, f.type)
      return (
        <textarea
          id={f.name}
          {...fp}
          rows={5}
          placeholder={f.placeholder}
          className={cls.input + ' resize-y'}
        />
      )
    }

    // text / date
    const fp = getSafeFieldProps(f.name, f.type)
    return (
      <input
        id={f.name}
        {...fp}
        type={f.type}
        placeholder={f.placeholder}
        className={cls.input}
      />
    )
  }

  return (
    <div className={cls.container}>
      <h1 className={cls.title}>{title}</h1>

      <div className={`${cls.formContainer} ${showUploadSlot ? 'pb-24' : ''}`}>
        <form
          onSubmit={formik.handleSubmit}
          className={`${cls.form} grid grid-cols-1 gap-6 sm:grid-cols-2`}
        >
          {fields.map((f) => (
            <div
              key={f.name}
              className={`${cls.field} ${f.fullRow ? 'col-span-2' : ''}`}
            >
              <label htmlFor={f.name} className={cls.label}>
                {f.label}
              </label>

              {f.type === 'custom' && f.render
                ? f.render(formik)
                : renderField(f)}

              {getError(f.name) && (
                <span className={cls.error}>{getError(f.name)}</span>
              )}
            </div>
          ))}

          {/* Área opcional: subida / contenido extra dentro del form */}
          {showUploadSlot && <div className="col-span-2">{children}</div>}
          {showSectionEditor && <>{children}</>}

          {/* Botonera */}
          <div className="col-span-2 flex justify-end gap-3">
            <Button type="submit" variant="default">
              {submitLabel}
            </Button>
            {onCancel && (
              <Button type="button" variant="light" onClick={onCancel}>
                {cancelLabel}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
