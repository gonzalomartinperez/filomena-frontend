/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * SSR-safe helpers para session/local storage + catálogo de claves.
 */

export const STORAGE_KEYS = {
  auth: {
    token: 'auth:token',
    selectedRole: 'auth:selectedRole',
  },
  estudiante: {
    codigo: 'estudiante:examen:codigo',
    examenId: 'estudiante:examen:id',
    confirmOnce: 'estudiante:ui:avanceConfirmado',
    goHome: 'estudiante:ui:goHome',
  },
  evaluador: {
    codigo: 'evaluador:examen:codigo',
    examenId: 'evaluador:examen:id',
    evaluadorId: 'evaluador:usuario:id',
    goHome: 'evaluador:ui:goHome',
  },
  administrador: {
    examenListToastSeen: 'administrador:examenList:toastSeen',
  },
} as const

type StoreAPI = {
  get: (k: string) => string | null
  set: (k: string, v: string) => void
  remove: (k: string) => void
  clear: () => void
  has: (k: string) => boolean
  getJSON: <T>(k: string, fallback?: T) => T
  setJSON: <T>(k: string, v: T) => void
}

const createStore = (which: 'sessionStorage' | 'localStorage'): StoreAPI => {
  const box = () =>
    typeof window === 'undefined' ? null : ((window as any)[which] as Storage)

  return {
    get: (k) => {
      try {
        return box()?.getItem(k) ?? null
      } catch {
        return null
      }
    },
    set: (k, v) => {
      try {
        box()?.setItem(k, v)
      } catch {}
    },
    remove: (k) => {
      try {
        box()?.removeItem(k)
      } catch {}
    },
    clear: () => {
      try {
        box()?.clear()
      } catch {}
    },
    has: (k) => {
      try {
        return box()?.getItem(k) != null
      } catch {
        return false
      }
    },
    getJSON: <T,>(k: string, fallback?: T) => {
      try {
        const raw = box()?.getItem(k)
        return raw == null ? (fallback as T) : (JSON.parse(raw) as T)
      } catch {
        return fallback as T
      }
    },
    setJSON: <T,>(k: string, v: T) => {
      try {
        box()?.setItem(k, JSON.stringify(v))
      } catch {}
    },
  }
}

export const storage = {
  session: createStore('sessionStorage'),
  local: createStore('localStorage'),
}

/** Clave namespaced de “confirmar una sola vez” por examen (estudiante). */
export const buildConfirmOnceKey = (examenId: number) =>
  `${STORAGE_KEYS.estudiante.confirmOnce}:${examenId}`

/** Obtiene examenId activo del contexto estudiante/evaluador (o null). */
export const getCurrentExamenId = (): number | null => {
  const raw =
    storage.session.get(STORAGE_KEYS.estudiante.examenId) ??
    storage.session.get(STORAGE_KEYS.evaluador.examenId)
  const n = Number(raw || '')
  return Number.isFinite(n) && n > 0 ? n : null
}
