'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleRight,
  faLock,
  faUserDoctor,
  faUserLarge,
  faEye,
  faEyeSlash,
  faCircleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import { useFormik } from 'formik'
import loginSchema from './schemas/loginSchema'

import { getAuthenticatedUserAPI, loginAPI } from 'app/services/authServices'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import useAuth from 'app/hooks/useAuth'

const styles = {
  // layout
  rootWrapper:
    'm-0 flex h-screen w-screen animate-[gradientShift_15s_ease_infinite] items-center justify-center ' +
    'bg-[linear-gradient(-45deg,#1abc9c,#3498db,#9b59b6,#e67e22)] bg-[length:400%_400%] px-4 sm:px-0',
  cardBox:
    'w-[400px] md:w-[450px] lg:w-[500px] rounded-xl bg-white/15 px-8 py-6 text-center text-white ' +
    'shadow-xl backdrop-blur-md',

  // header
  headerBox: 'mb-6 flex flex-col items-center',
  appTitle: 'mt-4 font-serif text-3xl font-bold text-white',

  // form
  formRoot: 'flex flex-col gap-4',
  fieldGroup: 'flex flex-col gap-2',
  inputShell: 'relative',
  iconLeft:
    'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transform text-[#ccc]',
  inputBase:
    'w-full rounded-md bg-white py-3 pr-10 pl-10 text-black placeholder-black/30 outline-none ring-1 ring-transparent',
  inputError: 'ring-2 ring-red-500',
  toggleBtn:
    'absolute right-3 top-1/2 -translate-y-1/2 transform text-[#ccc] focus:outline-none cursor-pointer',

  // error callout
  errorCallout:
    'mt-1.5 flex items-center gap-2 rounded-md border-l-4 border-red-500 ' +
    'bg-white/95 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm',
  errorIcon: 'shrink-0',

  // submit + links
  submitBtn:
    'flex cursor-pointer items-center justify-center gap-2 rounded-md bg-[#2979ff] px-4 py-3 ' +
    'text-sm font-bold text-white transition-colors duration-300 hover:bg-[#1565c0]',
  linkRow: 'mt-2 text-right',
  linkAnchor: 'text-sm font-medium text-white/80 hover:underline',

  // footer
  footerBox: 'mt-6 text-sm text-[#f0f0f0]',
  footerLink: 'mt-2 block text-white/80 no-underline',

  // keyframes
  keyframes: `
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `,
}

export default function LoginPage() {
  const {
    actions: { login },
  } = useAuth()
  const {
    actions: { openToast, startLoading, stopLoading },
  } = useVisualNotifications()

  const userInputRef = useRef<HTMLInputElement>(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    userInputRef.current?.focus()
  }, [])

  async function getUserData() {
    const res = await getAuthenticatedUserAPI()
    login(res.data.data)
    openToast({ severity: 'success', message: res.data.message })
    return res
  }

  const formik = useFormik({
    initialValues: { dni: '', password: '' },
    validationSchema: loginSchema,
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: async (values) => {
      const loadingId = startLoading('Ingresando')
      await loginAPI(values.dni, values.password)
        .then(() => getUserData())
        .finally(() => {
          stopLoading(loadingId)
        })
    },
  })

  const handleTogglePassword = () => setShowPassword((prev) => !prev)

  const dniHasError = Boolean(formik.touched.dni && formik.errors.dni)
  const passHasError = Boolean(
    formik.touched.password && formik.errors.password,
  )

  return (
    <>
      <div className={styles.rootWrapper}>
        <div className={styles.cardBox}>
          {/* Header */}
          <header className={styles.headerBox}>
            <FontAwesomeIcon icon={faUserDoctor} size="3x" />
            <h1 className={styles.appTitle}>Filomena</h1>
          </header>

          {/* Form */}
          <form className={styles.formRoot} onSubmit={formik.handleSubmit}>
            {/* DNI */}
            <div className={styles.fieldGroup}>
              <div className={styles.inputShell}>
                <FontAwesomeIcon
                  icon={faUserLarge}
                  className={styles.iconLeft}
                />
                <input
                  id="dni"
                  type="text"
                  placeholder="DNI"
                  inputMode="numeric"
                  ref={userInputRef}
                  {...formik.getFieldProps('dni')}
                  className={`${styles.inputBase} ${dniHasError ? styles.inputError : ''}`}
                  aria-invalid={dniHasError}
                  aria-describedby={dniHasError ? 'dni-error' : undefined}
                />
              </div>

              {dniHasError && (
                <div
                  id="dni-error"
                  role="alert"
                  className={styles.errorCallout}
                >
                  <FontAwesomeIcon
                    icon={faCircleExclamation}
                    className={styles.errorIcon}
                  />
                  <span>{formik.errors.dni}</span>
                </div>
              )}
            </div>

            {/* Contraseña */}
            <div className={styles.fieldGroup}>
              <div className={styles.inputShell}>
                <FontAwesomeIcon icon={faLock} className={styles.iconLeft} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  {...formik.getFieldProps('password')}
                  className={`${styles.inputBase} ${passHasError ? styles.inputError : ''}`}
                  aria-invalid={passHasError}
                  aria-describedby={passHasError ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={handleTogglePassword}
                  className={styles.toggleBtn}
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
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

            {/* Submit */}
            <button type="submit" className={styles.submitBtn}>
              <span>Ingresar</span>
              <FontAwesomeIcon icon={faCircleRight} />
            </button>
          </form>

          {/* Links */}
          <div className={styles.linkRow}>
            <Link
              href="/ingresar/olvide-mi-contrasena"
              className={styles.linkAnchor}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Footer */}
          <footer className={styles.footerBox}>
            <p>2025 © Filomena</p>
            <Link href="/ingresar/quienes-somos" className={styles.footerLink}>
              Quiénes somos
            </Link>
          </footer>
        </div>
      </div>

      {/* Keyframes */}
      <style>{styles.keyframes}</style>
    </>
  )
}
