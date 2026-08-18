'use client'

import React, { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useFormik } from 'formik'
import forgotSchema from '../schemas/forgotSchema'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEnvelope,
  faCircleRight,
  faCircleExclamation,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import { forgotPasswordAPI } from 'app/services/authServices'
import { Button } from 'app/components/buttons/GeneralButton'

const styles = {
  // layout & header (mismos que /ingresar)
  pageWrapper:
    'm-0 flex h-screen w-screen animate-[gradientShift_15s_ease_infinite] items-center justify-center ' +
    'bg-[linear-gradient(-45deg,#1abc9c,#3498db,#9b59b6,#e67e22)] bg-[length:400%_400%] px-4 sm:px-0',
  card: 'w-full max-w-md rounded-xl bg-white/15 px-8 py-6 text-center text-white shadow-xl backdrop-blur-md',
  header: 'mb-6 flex flex-col items-center',
  iconWhite: 'text-white',
  title: 'mt-3 text-2xl font-semibold text-white',

  // form exactamente como /ingresar
  form: 'flex flex-col gap-4',
  fieldGroup: 'flex flex-col gap-2',
  inputWrapper: 'relative',
  iconLeft:
    'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transform text-[#ccc]',
  inputBase:
    'w-full rounded-md bg-white py-3 pr-3 pl-10 text-black placeholder-black/30 outline-none ring-1 ring-transparent',
  inputError: 'ring-2 ring-red-500',

  // callout idéntico
  errorCallout:
    'mt-1.5 flex items-center gap-2 rounded-md border-l-4 border-red-500 ' +
    'bg-white/95 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm',
  errorIcon: 'shrink-0',

  // botones/links
  submitButton:
    'flex cursor-pointer items-center justify-center gap-2 rounded-md bg-[#2979ff] px-4 py-3 ' +
    'text-sm font-bold text-white transition-colors duration-300 hover:bg-[#1565c0]',
  backRow: 'mt-6 text-left',

  keyframes: `
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `,
}

export default function Page() {
  const router = useRouter()
  const emailInputRef = useRef<HTMLInputElement>(null)
  const {
    actions: { openToast, startLoading, stopLoading },
  } = useVisualNotifications()

  useEffect(() => {
    emailInputRef.current?.focus()
  }, [])

  const formik = useFormik({
    initialValues: { email: '' },
    validationSchema: forgotSchema,
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: async (values) => {
      const loadingId = startLoading('Enviando solicitud')
      await forgotPasswordAPI(values.email)
        .then((res) => {
          openToast({ severity: 'success', message: res.data.message })
          setTimeout(() => router.replace('/ingresar'), 1500)
        })
        .finally(() => stopLoading(loadingId))
    },
  })

  const emailHasError = Boolean(formik.touched.email && formik.errors.email)

  return (
    <>
      <div className={styles.pageWrapper}>
        <div className={styles.card}>
          <header className={styles.header}>
            <FontAwesomeIcon
              icon={faEnvelope}
              size="2x"
              className={styles.iconWhite}
            />
            <h2 className={styles.title}>Recuperar contraseña</h2>
          </header>

          <form className={styles.form} onSubmit={formik.handleSubmit}>
            <div className={styles.fieldGroup}>
              <div className={styles.inputWrapper}>
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className={styles.iconLeft}
                />
                <input
                  id="email"
                  type="email"
                  placeholder="Ingresa tu correo"
                  ref={emailInputRef}
                  {...formik.getFieldProps('email')}
                  className={`${styles.inputBase} ${emailHasError ? styles.inputError : ''}`}
                  aria-invalid={emailHasError}
                  aria-describedby={emailHasError ? 'email-error' : undefined}
                />
              </div>

              {emailHasError && (
                <div
                  id="email-error"
                  role="alert"
                  className={styles.errorCallout}
                >
                  <FontAwesomeIcon
                    icon={faCircleExclamation}
                    className={styles.errorIcon}
                  />
                  <span>{formik.errors.email}</span>
                </div>
              )}
            </div>

            <button type="submit" className={styles.submitButton}>
              <span>Enviar solicitud</span>
              <FontAwesomeIcon icon={faCircleRight} />
            </button>
          </form>

          <div className={styles.backRow}>
            <Button
              variant="light"
              icon={faArrowLeft}
              onClick={() => router.push('/ingresar')}
            >
              Volver
            </Button>
          </div>
        </div>
      </div>

      <style>{styles.keyframes}</style>
    </>
  )
}
