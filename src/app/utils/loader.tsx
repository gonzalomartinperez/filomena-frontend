import { useCallback } from 'react'
import useVisualNotifications from 'app/hooks/useVisualNotifications'

export type LoaderTask<T> = () => Promise<T>
export type WithLoader = <T>(label: string, task: LoaderTask<T>) => Promise<T>

/**
 * Hook para ejecutar una promesa mostrando/ocultando el loader global.
 * Uso:
 *   const withLoader = useWithLoader()
 *   await withLoader('Cargando...', () => api.llamada())
 */
export const useWithLoader = (): WithLoader => {
  const {
    actions: { startLoading, stopLoading },
  } = useVisualNotifications()

  return useCallback(
    async <T,>(label: string, task: LoaderTask<T>): Promise<T> => {
      const id = startLoading(label)
      try {
        return await task()
      } finally {
        stopLoading(id)
      }
    },
    [startLoading, stopLoading],
  )
}

/**
 * Fábrica para obtener un withLoader fuera de React (servicios/helpers),
 * inyectando start/stop que ya tengas a mano.
 */
export const withLoaderFactory =
  (
    startLoading: (label: string) => string,
    stopLoading: (id: string) => void,
  ): WithLoader =>
  async <T,>(label: string, task: LoaderTask<T>): Promise<T> => {
    const id = startLoading(label)
    try {
      return await task()
    } finally {
      stopLoading(id)
    }
  }
