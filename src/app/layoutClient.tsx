'use client'

import './globals.css'
import '../lib/fontawesome'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import GlobalToast from './GlobalToastComponent'
import { Provider as VisualNotificationsProvider } from './contexts/VisualNotificationsContext'
import { Provider as AuthProvider } from './contexts/AuthContext'
import { AuthAxiosInterceptor } from 'api/AxiosInterceptor'
import GlobalLoading from './GlobalLoadingComponent'
import {
  changePasswordAPI,
  getAuthenticatedUserAPI,
} from './services/authServices'
import useAuth from './hooks/useAuth'
import useModal from './hooks/useModal'
import useVisualNotifications from './hooks/useVisualNotifications'
import { paginaDeInicio } from './utils/permissionUtils'
import GlobalModal from './GlobalModalComponent'
import { Provider as ModalProvider } from './contexts/ModalContext'
import { storage, STORAGE_KEYS } from './utils/storage'
import { Usuario } from './inicio/administrador/usuarios/types/Usuario'

const PUBLIC_ROUTES = new Set<string>([
  '/ingresar',
  '/ingresar/olvide-mi-contrasena',
  '/ingresar/restablecer-contrasena',
  '/ingresar/quienes-somos',
])

function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const {
    state: { session, rolSeleccionado, usuario },
    actions: { login },
  } = useAuth()

  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()

  const {
    actions: { openModal },
  } = useModal()

  const [isInitializing, setIsInitializing] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const fetchedUserRef = useRef(false)

  const token = storage.session.get(STORAGE_KEYS.auth.token)

  const isPublicRoute = useMemo(() => PUBLIC_ROUTES.has(pathname), [pathname])

  const userReady = Boolean(usuario?.id || session)

  const isNotFound = pathname === '/not-found'

  const isPollingUserRef = useRef(false)

  const userPollIntervalRef = useRef<number | null>(null)

  const getUserData = useCallback(async () => {
    if (fetchedUserRef.current || isAuthenticating) return
    fetchedUserRef.current = true
    setIsAuthenticating(true)
    const loadingId = startLoading('Cargando')

    try {
      const res = await getAuthenticatedUserAPI()
      login(res.data.data)
      maybeForcePasswordChange(res.data.data)
    } catch {
      router.replace('/ingresar')
    } finally {
      stopLoading(loadingId)
      setIsAuthenticating(false)
      setIsInitializing(false)
      fetchedUserRef.current = false
    }
  }, [login, router, isAuthenticating])

  const forcePwModalShownRef = useRef(false)

  const maybeForcePasswordChange = useCallback(
    (user: Usuario) => {
      const mustChange = Boolean(user?.must_change_password)

      // Si ya no hace falta, reseteamos para que en otro login vuelva a disparar
      if (!mustChange) {
        forcePwModalShownRef.current = false
        return
      }

      // Evita abrirlo en cada poll/focus
      if (forcePwModalShownRef.current) return
      forcePwModalShownRef.current = true

      openModal({
        type: 'force-change-password',
        message: 'Por seguridad, debés cambiar tu contraseña para continuar.',
        button: {
          onClick: async (payload?: unknown) => {
            const { password, new_password, password_confirmation } =
              (payload ?? {}) as {
                password: string
                new_password: string
                password_confirmation: string
              }

            const loadingId = startLoading('Actualizando contraseña')

            try {
              const res = await changePasswordAPI({
                password,
                new_password,
                password_confirmation,
              })

              openToast({
                severity: 'success',
                message:
                  res?.data?.message ?? 'Contraseña actualizada correctamente',
              })

              // refresca el usuario (para que must_change_password pase a false)
              const me = await getAuthenticatedUserAPI()
              login(me.data.data)
            } finally {
              stopLoading(loadingId)
            }
          },
        },
      })
    },
    [openModal, startLoading, stopLoading, openToast, login],
  )

  useEffect(() => {
    if (isNotFound) {
      setIsInitializing(false)
      return
    }

    if (!token) {
      if (!isPublicRoute) {
        router.replace('/ingresar')
        return
      }
      setIsInitializing(false)
      return
    }

    if (!isPublicRoute) {
      if (userReady) {
        setIsInitializing(false)
        return
      }
      void getUserData()
      return
    }

    setIsInitializing(false)
  }, [token, pathname, isPublicRoute, userReady, getUserData, router])

  // Polling de usuario cuando hay token: refresca roles/asignaciones sin re-login - Roles aditivos
  useEffect(() => {
    if (!token || isAuthenticating) return

    let canceled = false
    const POLL_MS = 60000

    const tick = async () => {
      if (canceled || isPollingUserRef.current) return
      isPollingUserRef.current = true
      try {
        const res = await getAuthenticatedUserAPI()
        if (!canceled) {
          login(res.data.data)
          maybeForcePasswordChange(res.data.data)
        }
      } catch {
      } finally {
        isPollingUserRef.current = false
      }
    }

    void tick()
    const onFocus = () => void tick()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    userPollIntervalRef.current = window.setInterval(tick, POLL_MS)

    return () => {
      canceled = true
      if (userPollIntervalRef.current !== null) {
        window.clearInterval(userPollIntervalRef.current)
        userPollIntervalRef.current = null
      }
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [token, isAuthenticating])

  useEffect(() => {
    if (!userReady) return
    if (isNotFound) return
    if (!rolSeleccionado) return
    const expectedBase = paginaDeInicio(rolSeleccionado)
    if (!pathname.startsWith(expectedBase)) {
      router.replace(expectedBase, { scroll: false })
    }
  }, [userReady, pathname, rolSeleccionado, router])

  if (
    !isInitializing &&
    !isAuthenticating &&
    rolSeleccionado &&
    !pathname.startsWith(paginaDeInicio(rolSeleccionado))
  ) {
    return null
  }

  return (
    <>
      <GlobalToast />
      <GlobalLoading />
      <GlobalModal />
      {children}
    </>
  )
}

export default function RootLayoutComponent({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es-AR">
      <body style={{ overflow: 'hidden' }}>
        <NuqsAdapter>
          <ModalProvider>
            <VisualNotificationsProvider>
              <AuthProvider>
                <AuthAxiosInterceptor>
                  <RootLayout>{children}</RootLayout>
                </AuthAxiosInterceptor>
              </AuthProvider>
            </VisualNotificationsProvider>
          </ModalProvider>
        </NuqsAdapter>
      </body>
    </html>
  )
}
