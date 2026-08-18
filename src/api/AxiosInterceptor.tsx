/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import { useEffect, useState } from 'react'
import { storage, STORAGE_KEYS } from 'app/utils/storage'

const instance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

function AxiosInterceptor({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const {
    actions: { openToast },
  } = useVisualNotifications()

  const handleErrorResponse = (error: AxiosError | any) => {
    let message

    if (error.response) {
      const res = error.response

      if (res.data && typeof res.data === 'object') {
        if ('message' in res.data) {
          message = res.data.message
          console.log('Extracted message in interceptor:', message)
        }
      }

      switch (res.status) {
        case 400:
        case 401:
        case 403:
        case 404:
        case 405:
        case 409:
        case 429:
          break
        case 500:
          message = 'Error inesperado del servidor'
          break
        default:
          break
      }

      if (message) {
        openToast({
          message,
          severity: 'error',
        })
      }
    } else {
      handleNetworkError(error.message)
    }

    return Promise.reject(error)
  }

  const handleNetworkError = (errorMessage: string) => {
    let message = 'Error de red. Por favor, verifica tu conexión a Internet.'
    if (errorMessage === 'Request failed with status code 0') {
      message =
        'Error de CORS. Verifica tu configuración de CORS en el servidor.'
    }

    openToast({
      message,
      severity: 'error',
    })
  }

  useEffect(() => {
    let active = true
    const requestInterceptor = instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = storage.session.get(STORAGE_KEYS.auth.token)
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error: AxiosError) => {
        console.error('Error en solicitud:', error.message)
        return Promise.reject(error)
      },
    )

    const resInterceptor = (response: AxiosResponse) => {
      const maybeToken =
        (response?.data &&
          typeof response.data === 'object' &&
          response.data?.data &&
          typeof response.data.data === 'object' &&
          (response.data.data as any)?.token) ||
        (response.headers?.authorization?.startsWith('Bearer ')
          ? response.headers.authorization.replace('Bearer ', '')
          : undefined)

      if (typeof maybeToken === 'string' && maybeToken.length > 0) {
        storage.session.set(STORAGE_KEYS.auth.token, maybeToken)
        instance.defaults.headers.common.Authorization = `Bearer ${maybeToken}`
      }

      return response
    }

    const errInterceptor = (error: AxiosError) => {
      return handleErrorResponse(error)
    }

    const responseInterceptor = instance.interceptors.response.use(
      resInterceptor,
      errInterceptor,
    )

    queueMicrotask(() => {
      if (active) setIsReady(true)
    })

    return () => {
      active = false
      instance.interceptors.request.eject(requestInterceptor)
      instance.interceptors.response.eject(responseInterceptor)
    }
  }, [])

  return isReady && children
}

export default instance
export { AxiosInterceptor as AuthAxiosInterceptor }
