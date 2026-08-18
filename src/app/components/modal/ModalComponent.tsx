/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react'
import { ModalState } from 'app/contexts/ModalContext'
import Gestograma from '../herramientas/GestogramaComponent'
import MochilaArchivos from '../herramientas/MochilaArchivosComponent'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import changePasswordSchema from 'app/schemas/changePasswordSchema'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleExclamation,
  faEye,
  faEyeSlash,
  faKey,
  faLock,
} from '@fortawesome/free-solid-svg-icons'

const getStyles = (type: string) => ({
  backdrop: `fixed inset-0 z-50 flex ${type === 'confirmacion' ? 'items-start' : 'items-center'} justify-center p-4 backdrop-blur-sm`,
  container: `mx-4 w-full transform rounded-lg bg-white shadow-xl transition-all ${
    type === 'gestograma' || type === 'mochila-archivos'
      ? 'max-w-7xl max-h-[90vh]'
      : 'max-w-md'
  }`,
  content: `${type === 'gestograma' || type === 'mochila-archivos' ? 'p-2 h-full overflow-auto' : 'p-6'}`,
  title: 'mb-4 text-xl font-semibold text-gray-900',
  message: `${type === 'confirmacion' || type === 'confirmacion-alerta' ? 'mb-6' : ''} whitespace-pre-line leading-relaxed text-gray-600`,
  buttonContainer: 'flex justify-end gap-3',
  cancelButton:
    'cursor-pointer rounded-md bg-gray-100 px-4 py-2 font-medium text-gray-600 transition-colors duration-200 hover:bg-gray-200',
  confirmButton:
    'cursor-pointer rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed',
  inputWrapper: 'mb-3 relative',
  inputBase:
    'w-full rounded-md bg-gray-100 py-3 pr-3 pl-10 text-black placeholder-black/30 outline-none border-none',
  iconLeft: 'absolute top-1/2 left-3 -translate-y-1/2 transform text-[#ccc]',
  toggleButton:
    'cursor-pointer absolute top-1/2 right-3 z-20 -translate-y-1/2 transform text-[#ccc] focus:outline-none',
  inputError: 'ring-2 ring-red-500',
  errorCallout:
    'mt-1.5 flex items-center gap-2 rounded-md border-l-4 border-red-500 bg-white/95 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm',
  errorIcon: 'shrink-0',
})

interface ModalProps {
  open: ModalState
  handleClose: () => void
}

function getModalTitle(type: string) {
  switch (type) {
    case 'confirmacion':
      return 'Confirme la acción'
    case 'filtrado-examen':
      return 'Seleccione examen'
    case 'confirmacion-alerta':
      return 'Alerta'
    case 'mochila-archivos':
      return 'Archivos del examen'
    case 'cambiar-password':
      return 'Cambiar contraseña'
    case 'forzar-cambio-password':
      return 'Actualizá tu contraseña'
    default:
      return ''
  }
}

export default function Modal({ open, handleClose }: ModalProps) {
  const [codigo, setCodigo] = useState('')

  if (!open.render) return null

  const styles = getStyles(open.type!)

  const handleConfirm = () => {
    if (open.button?.onClick) {
      if (open.type === 'filtrado-examen') {
        open.button.onClick(codigo.trim())
      } else {
        open.button.onClick()
      }
    }
    handleClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    const isForceChangePassword = open.type === 'force-change-password'

    if (isForceChangePassword) return

    if (
      e.target === e.currentTarget &&
      (open.type === 'confirmacion' ||
        open.type === 'gestograma' ||
        open.type === 'mochila-archivos' ||
        open.type === 'change-password' ||
        open.type === 'filtrado-examen')
    ) {
      handleClose()
    }
  }

  const renderButtons = () => (
    <div className={styles.buttonContainer}>
      {open.type !== 'confirmacion-alerta' && (
        <button onClick={handleClose} className={styles.cancelButton}>
          {open.type !== 'gestograma' && open.type !== 'mochila-archivos'
            ? 'Cancelar'
            : 'Cerrar'}
        </button>
      )}
      {open.type !== 'gestograma' && open.type !== 'mochila-archivos' && (
        <button
          onClick={handleConfirm}
          className={styles.confirmButton}
          disabled={open.type === 'filtrado-examen' && codigo.trim() === ''}
        >
          Confirmar
        </button>
      )}
    </div>
  )

  const PasswordField = ({
    name,
    placeholder,
    autoComplete,
    className = '',
    leftIcon,
  }: {
    name: string
    placeholder: string
    autoComplete?: string
    className?: string
    leftIcon?: any
  }) => {
    const [show, setShow] = useState(false)
    return (
      <div className={className}>
        <div className="relative">
          {leftIcon && (
            <FontAwesomeIcon icon={leftIcon} className={styles.iconLeft} />
          )}

          <Field name={name}>
            {({ field, meta }: any) => (
              <input
                {...field}
                id={name}
                type={show ? 'text' : 'password'}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className={`${styles.inputBase} ${
                  meta.touched && meta.error ? styles.inputError : ''
                }`}
                aria-invalid={meta.touched && !!meta.error}
                aria-describedby={
                  meta.touched && meta.error ? `${name}-error` : undefined
                }
              />
            )}
          </Field>

          <button
            type="button"
            aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            title={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onClick={() => setShow((s) => !s)}
            className={styles.toggleButton}
          >
            <FontAwesomeIcon
              icon={show ? faEyeSlash : faEye}
              className="leading-none"
            />
          </button>
        </div>

        <ErrorMessage name={name}>
          {(msg: string) => (
            <div
              id={`${name}-error`}
              role="alert"
              className={styles.errorCallout}
            >
              <FontAwesomeIcon
                icon={faCircleExclamation}
                className={styles.errorIcon}
              />
              <span>{msg}</span>
            </div>
          )}
        </ErrorMessage>
      </div>
    )
  }

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <div className={styles.content}>
          <h2 className={styles.title}>{getModalTitle(open.type!)}</h2>
          {open.type !== 'filtrado-examen' &&
            open.type !== 'gestograma' &&
            open.type !== 'mochila-archivos' &&
            open.type !== 'change-password' && (
              <p className={styles.message}>{open.message}</p>
            )}
          {open.type === 'filtrado-examen' && (
            <>
              <p className={styles.message}>{open.message}</p>
              <div className={styles.inputWrapper}>
                <input
                  id="codigo"
                  type="text"
                  placeholder="Código de examen"
                  className={styles.inputBase}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                />
              </div>
            </>
          )}
          {open.type === 'gestograma' && <Gestograma />}
          {open.type === 'mochila-archivos' && <MochilaArchivos />}
          {(open.type === 'change-password' ||
            open.type === 'force-change-password') && (
            <Formik
              initialValues={{
                password: '',
                new_password: '',
                password_confirmation: '',
              }}
              validationSchema={changePasswordSchema}
              onSubmit={async (values, { setSubmitting, resetForm }) => {
                await Promise.resolve(open.button?.onClick?.(values))
                  .then(() => {
                    resetForm()
                    handleClose()
                  })
                  .finally(() => {
                    setSubmitting(false)
                  })
              }}
            >
              {({ isSubmitting }) => (
                <Form>
                  <PasswordField
                    name="password"
                    placeholder="Contraseña actual"
                    autoComplete="current-password"
                    className={styles.inputWrapper}
                    leftIcon={faLock}
                  />

                  <PasswordField
                    name="new_password"
                    placeholder="Nueva contraseña"
                    autoComplete="new-password"
                    className={styles.inputWrapper}
                    leftIcon={faKey}
                  />

                  <PasswordField
                    name="password_confirmation"
                    placeholder="Repetir contraseña"
                    autoComplete="new-password"
                    className={styles.inputWrapper}
                    leftIcon={faKey}
                  />

                  <div className={styles.buttonContainer}>
                    {open.type !== 'force-change-password' && (
                      <button
                        type="button"
                        onClick={handleClose}
                        className={styles.cancelButton}
                      >
                        Cancelar
                      </button>
                    )}

                    <button
                      type="submit"
                      className={styles.confirmButton}
                      disabled={isSubmitting}
                    >
                      Guardar
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          )}

          {open.type !== 'change-password' &&
            open.type !== 'force-change-password' &&
            renderButtons()}
        </div>
      </div>
    </div>
  )
}
