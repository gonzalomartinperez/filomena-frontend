'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useFormik } from 'formik'
import resetSchema from '../schemas/resetSchema'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faLock,
  faCircleRight,
  faEye,
  faEyeSlash,
  faCircleExclamation,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import { resetPasswordAPI } from 'app/services/authServices'
import { Button } from 'app/components/buttons/GeneralButton'

const styles = {
  pageWrapper:
    'm-0 flex h-screen w-screen animate-[gradientShift_15s_ease_infinite] items-center justify-center ' +
    'bg-[linear-gradient(-45deg,#1abc9c,#3498db,#9b59b6,#e67e22)] bg-[length:400%_400%] px-4 sm:px-0',
  card: 'w-full max-w-md rounded-xl bg-white/15 px-8 py-6 text-center text-white shadow-xl backdrop-blur-md',
  header: 'mb-6 flex flex-col items-center',
  iconWhite: 'text-white',
  title: 'mt-3 text-2xl font-semibold text-white',
  subtitle: 'mt-2 text-sm text-white/80',
  emailHighlight: 'font-medium',

  // form exactamente como /ingresar
  form: 'flex flex-col gap-4',
  fieldGroup: 'flex flex-col gap-2',
  inputWrapper: 'relative',
  iconLeft:
    'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transform text-[#ccc]',
  inputBase:
    'w-full rounded-md bg-white py-3 pr-10 pl-10 text-black placeholder-black/30 outline-none ring-1 ring-transparent',
  inputError: 'ring-2 ring-red-500',
  toggleButton:
    'absolute right-3 top-1/2 -translate-y-1/2 transform text-[#ccc] focus:outline-none cursor-pointer',

  // callout idéntico
  errorCallout:
    'mt-1.5 flex items-center gap-2 rounded-md border-l-4 border-red-500 ' +
    'bg-white/95 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm',
  errorIcon: 'shrink-0',

  submitButton:
    'flex cursor-pointer items-center justify-center gap-2 rounded-md bg-[#2979ff] px-4 py-3 ' +
    'text-sm font-bold text-white transition-colors duration-300 hover:bg-[#1565c0]',

  linkContainer: 'mt-6 text-center text-sm',
  invalidWrapper: 'mb-4 text-lg font-medium text-white',
  invalidButton:
    'inline-block rounded-md bg-[#2979ff] px-4 py-2 text-sm font-bold text-white ' +
    'transition-colors duration-300 hover:bg-[#1565c0]',

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
  const {
    actions: { openToast, startLoading, stopLoading },
  } = useVisualNotifications()

  const [token, setToken] = useState('')
  const [email, setEmail] = useState('')
  const [invalidLink, setInvalidLink] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    let active = true

    const hashParams = new URLSearchParams(window.location.hash.slice(1))
    const searchParams = new URLSearchParams(window.location.search)

    const _token = hashParams.get('token') ?? searchParams.get('token') ?? ''
    const _email = hashParams.get('email') ?? searchParams.get('email') ?? ''

    queueMicrotask(() => {
      if (!active) return
      setToken(_token)
      setEmail(_email)
      setInvalidLink(!_token || !_email)
    })

    if (window.location.hash) {
      history.replaceState(
        {},
        '',
        window.location.pathname + window.location.search,
      )
    }

    return () => {
      active = false
    }
  }, [])

  const formik = useFormik({
    initialValues: { password: '', password_confirmation: '' },
    validationSchema: resetSchema,
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: async (values) => {
      const loadingId = startLoading('Restableciendo contraseña')
      await resetPasswordAPI({
        token,
        email,
        password: values.password,
        password_confirmation: values.password_confirmation,
      })
        .then((res) => {
          openToast({ severity: 'success', message: res.data.message })
          setTimeout(() => router.replace('/ingresar'), 1500)
        })
        .finally(() => stopLoading(loadingId))
    },
  })

  function handleTogglePassword() {
    setShowPassword((p) => !p)
  }
  function handleToggleConfirm() {
    setShowConfirm((p) => !p)
  }

  if (invalidLink) {
    return (
      <>
        <div className={styles.pageWrapper}>
          <div className={styles.card}>
            <p className={styles.invalidWrapper}>Enlace inválido o caducado.</p>
            <Link
              href="/ingresar/olvide-mi-contrasena"
              className={styles.invalidButton}
            >
              Solicitar nueva recuperación
            </Link>
          </div>
        </div>
        <style>{styles.keyframes}</style>
      </>
    )
  }

  const passHasError = Boolean(
    formik.touched.password && formik.errors.password,
  )
  const confirmHasError = Boolean(
    formik.touched.password_confirmation && formik.errors.password_confirmation,
  )

  return (
    <>
      <div className={styles.pageWrapper}>
        <div className={styles.card}>
          <header className={styles.header}>
            <FontAwesomeIcon
              icon={faLock}
              size="2x"
              className={styles.iconWhite}
            />
            <h2 className={styles.title}>Restablecer contraseña</h2>
            <p className={styles.subtitle}>
              Para: <span className={styles.emailHighlight}>{email}</span>
            </p>
          </header>

          <form className={styles.form} onSubmit={formik.handleSubmit}>
            {/* Nueva contraseña */}
            <div className={styles.fieldGroup}>
              <div className={styles.inputWrapper}>
                <FontAwesomeIcon icon={faLock} className={styles.iconLeft} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nueva contraseña"
                  {...formik.getFieldProps('password')}
                  className={`${styles.inputBase} ${passHasError ? styles.inputError : ''}`}
                  aria-invalid={passHasError}
                  aria-describedby={passHasError ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={handleTogglePassword}
                  className={styles.toggleButton}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
              {passHasError && (
                <div
                  id="password-error"
                  role="alert"
                  className={styles.errorCallout}
                >
                  <FontAwesomeIcon
                    icon={faCircleExclamation}
                    className={styles.errorIcon}
                  />
                  <span>{formik.errors.password}</span>
                </div>
              )}
            </div>

            {/* Confirmación */}
            <div className={styles.fieldGroup}>
              <div className={styles.inputWrapper}>
                <FontAwesomeIcon icon={faLock} className={styles.iconLeft} />
                <input
                  id="password_confirmation"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repetir contraseña"
                  {...formik.getFieldProps('password_confirmation')}
                  className={`${styles.inputBase} ${confirmHasError ? styles.inputError : ''}`}
                  aria-invalid={confirmHasError}
                  aria-describedby={
                    confirmHasError ? 'password_confirmation-error' : undefined
                  }
                />
                <button
                  type="button"
                  onClick={handleToggleConfirm}
                  className={styles.toggleButton}
                >
                  <FontAwesomeIcon icon={showConfirm ? faEyeSlash : faEye} />
                </button>
              </div>
              {confirmHasError && (
                <div
                  id="password_confirmation-error"
                  role="alert"
                  className={styles.errorCallout}
                >
                  <FontAwesomeIcon
                    icon={faCircleExclamation}
                    className={styles.errorIcon}
                  />
                  <span>{formik.errors.password_confirmation}</span>
                </div>
              )}
            </div>

            <button type="submit" className={styles.submitButton}>
              <span>Cambiar contraseña</span>
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
