/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerHeadBarColorPorRol } from './headBarStyles'
import useAuth from 'app/hooks/useAuth'
import useVisualNotifications from 'app/hooks/useVisualNotifications'
import { changePasswordAPI, logoutAPI } from 'app/services/authServices'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBriefcase,
  faCalendar,
  faClipboardCheck,
  faGraduationCap,
  faKey,
  faRightFromBracket,
  faShieldHalved,
  faUser,
  faUserDoctor,
  faWrench,
  faHouse,
} from '@fortawesome/free-solid-svg-icons'
import { convertirNombre } from 'app/utils/stringOperations'
import type { ApiResponse } from 'app/types/ApiResponse'
import {
  ADMINISTRADOR,
  ESTUDIANTE,
  EVALUADOR,
} from 'app/inicio/administrador/usuarios/constants/roles'
import useModal from 'app/hooks/useModal'
import { MenuGroup, MenuItem } from 'app/types/Components'
import ToolsDropdownButton from './ToolsDropdownButtonComponent'
import ToolButton from './ToolButtonComponent'
import { paginaDeInicio } from 'app/utils/permissionUtils'
import Tooltip from '../tooltip/Tooltip'
import { getDefaultRole } from 'app/utils/roles'
import { storage, STORAGE_KEYS } from 'app/utils/storage'

const styles = {
  header: 'w-full text-white shadow-sm',
  container: 'w-full px-1 sm:px-2 md:px-4 lg:px-6',
  wrapper: 'flex h-12 items-center justify-between',
  userInfoContainer: 'flex flex-1 items-center justify-start',
  userName: 'text-sm font-medium',
  userEmail: 'text-xs opacity-90',
  appnameContainer: 'flex flex-1 items-center justify-center',
  icon: 'mr-2',
  title: 'text-center text-xl font-medium',
  navigationButton:
    'ml-2 cursor-pointer rounded bg-white/10 px-2 py-1 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-60 disabled:cursor-not-allowed',
}

/** Helpers de sesión por rol — usando únicamente STORAGE_KEYS del utils */
const clearStudentSession = () => {
  storage.session.remove(STORAGE_KEYS.estudiante.codigo)
  storage.session.remove(STORAGE_KEYS.estudiante.examenId)
  if (typeof window !== 'undefined') {
    const prefix = `${STORAGE_KEYS.estudiante.confirmOnce}:`
    for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
      const k = window.sessionStorage.key(i)
      if (k && k.startsWith(prefix)) window.sessionStorage.removeItem(k)
    }
  }
}
const clearEvaluatorSession = () => {
  storage.session.remove(STORAGE_KEYS.evaluador.codigo)
  storage.session.remove(STORAGE_KEYS.evaluador.examenId)
  storage.session.remove(STORAGE_KEYS.evaluador.evaluadorId)
}
const clearRoleSession = (r: string) => {
  if (r === ESTUDIANTE) return clearStudentSession()
  if (r === EVALUADOR) return clearEvaluatorSession()
}

const roleHasSession = (r: string): boolean => {
  if (typeof window === 'undefined') return false
  if (r === ESTUDIANTE) {
    return (
      storage.session.has(STORAGE_KEYS.estudiante.codigo) ||
      storage.session.has(STORAGE_KEYS.estudiante.examenId)
    )
  }
  if (r === EVALUADOR) {
    return (
      storage.session.has(STORAGE_KEYS.evaluador.codigo) ||
      storage.session.has(STORAGE_KEYS.evaluador.examenId)
    )
  }
  return false
}

const iconForRole = (r: string) => {
  if (r === ADMINISTRADOR) return faShieldHalved
  if (r === EVALUADOR) return faClipboardCheck
  return faGraduationCap
}
const labelForRole = (r: string) => {
  if (r === ADMINISTRADOR) return 'Administrador'
  if (r === EVALUADOR) return 'Evaluador'
  return 'Estudiante'
}
const descriptionForRole = (r: string) => {
  if (r === ADMINISTRADOR) return 'Rol de administrador.'
  if (r === EVALUADOR) return 'Rol de evaluador.'
  return 'Rol de estudiante'
}

const roleStoresSession = (r: string) => r === ESTUDIANTE || r === EVALUADOR

export default function HeadBar() {
  const router = useRouter()

  const {
    state: { usuario, rolSeleccionado },
    actions: { logout, setSelectedRole },
  } = useAuth()

  const {
    actions: { startLoading, stopLoading, openToast },
  } = useVisualNotifications()

  const {
    actions: { openModal },
  } = useModal()

  const [expandedGroups, setExpandedGroups] = useState<{
    [key: string]: boolean
  }>({
    herramientas: false,
    cuenta: false,
  })

  const herramientasRef = useRef<HTMLDivElement>(null)
  const cuentaRef = useRef<HTMLDivElement>(null)

  const PRIORIDAD = [ADMINISTRADOR, EVALUADOR, ESTUDIANTE] as const
  const rolesDisponibles = (usuario.roles || [])
    .filter(Boolean)
    .sort((a, b) => PRIORIDAD.indexOf(a as any) - PRIORIDAD.indexOf(b as any))

  const rolActual = rolSeleccionado ?? getDefaultRole(rolesDisponibles)
  const mostrarSwitcher = rolesDisponibles.length > 1

  const headerColor = obtenerHeadBarColorPorRol(rolActual)
  const mostrarHerramientas =
    (rolActual === ESTUDIANTE || rolActual === EVALUADOR) &&
    roleHasSession(rolActual)

  const mostrarInicio = rolActual === ESTUDIANTE || rolActual === EVALUADOR

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (
        herramientasRef.current &&
        !herramientasRef.current.contains(target) &&
        expandedGroups.herramientas
      ) {
        setExpandedGroups((prev) => ({ ...prev, herramientas: false }))
      }

      if (
        cuentaRef.current &&
        !cuentaRef.current.contains(target) &&
        expandedGroups.cuenta
      ) {
        setExpandedGroups((prev) => ({ ...prev, cuenta: false }))
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [expandedGroups])

  /** Cambiar de rol con confirmación si el ORIGEN y/o DESTINO tienen sesión activa */
  const handleChangeRole = (r: string) => {
    if (r === rolActual) return

    const sourceIsPersistent = roleStoresSession(rolActual)
    const targetIsPersistent = roleStoresSession(r)

    const sourceHas = sourceIsPersistent && roleHasSession(rolActual)
    const targetHas = targetIsPersistent && roleHasSession(r)

    if (sourceHas || targetHas) {
      const parts: string[] = []

      if (sourceHas) {
        parts.push(
          `Tenés un ${rolActual === ESTUDIANTE ? 'examen en curso como Estudiante' : 'examen abierto como Evaluador'}.`,
        )
      }
      if (targetHas) {
        parts.push(
          `Además, hay una sesión activa en ${labelForRole(r)} que se limpiará para evitar inconsistencias.`,
        )
      }

      const message = `${parts.join('\n')}\n¿Cambiar de rol igualmente?`

      openModal({
        type: 'confirmacion',
        message,
        button: {
          onClick: () => {
            // limpiar origen si tenía sesión
            if (sourceHas) clearRoleSession(rolActual)
            // limpiar destino si ya tenía sesión previa
            if (targetHas) clearRoleSession(r)

            setSelectedRole(r)
            router.replace(paginaDeInicio(r), { scroll: false })
          },
        },
      })
      return
    }

    // Sin sesiones involucradas: cambio directo
    setSelectedRole(r)
    router.replace(paginaDeInicio(r), { scroll: false })
  }

  /** Botón Inicio (solo Estudiante/Evaluador). Confirma si hay sesión activa de ese rol. */
  const handleGoHome = () => {
    const haySesion = roleHasSession(rolActual)
    if (haySesion) {
      openModal({
        type: 'confirmacion',
        message:
          `Tenés un ${rolActual === ESTUDIANTE ? 'examen en curso.' : 'examen de corrección abierto.'}\n` +
          `Al ir al inicio se limpiará esa sesión.\n¿Continuar?`,
        button: {
          onClick: () => {
            goToHome()
          },
        },
      })
      return
    }
    goToHome()
    return
  }

  const goToHome = () => {
    if (rolActual === ESTUDIANTE) {
      storage.session.set(STORAGE_KEYS.estudiante.goHome, '1')
    } else if (rolActual === EVALUADOR) {
      storage.session.set(STORAGE_KEYS.evaluador.goHome, '1')
    }
    clearRoleSession(rolActual)
    router.replace(paginaDeInicio(rolActual), { scroll: false })
    router.refresh()
    return
  }

  const handleLogout = async () => {
    const loadingId = startLoading('Cerrando sesión')

    await logoutAPI()
      .then((res) => {
        openToast({
          severity: 'success',
          message: res?.data?.message ?? 'Sesión cerrada',
        })
      })
      .catch((e: ApiResponse<unknown>) => {
        openToast({
          severity: 'success',
          message: e?.message ?? 'Sesión cerrada localmente',
        })
      })
      .finally(() => {
        logout()
        storage.session.clear()
        storage.local.clear()
        router.replace('/ingresar', { scroll: false })
        stopLoading(loadingId)
      })
  }

  const toggleGroup = (groupId: string): void => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  const handleGestograma = () => openModal({ type: 'gestograma' })
  const handleMochilaArchivos = () => openModal({ type: 'mochila-archivos' })

  const handleOpenChangePassword = () => {
    openModal({
      type: 'change-password',
      button: {
        onClick: async (payload?: unknown) => {
          const { password, new_password, password_confirmation } = (payload ??
            {}) as {
            password: string
            new_password: string
            password_confirmation: string
          }
          const loadingId = startLoading('Actualizando contraseña')

          await changePasswordAPI({
            password,
            new_password,
            password_confirmation,
          })
            .then((res) => {
              openToast({
                severity: 'success',
                message:
                  res?.data?.message ?? 'Contraseña actualizada correctamente',
              })
            })
            .finally(() => stopLoading(loadingId))
        },
      },
    })
  }

  const tools: MenuItem[] = [
    {
      id: 'gestograma',
      label: 'Gestograma',
      icon: faCalendar,
      action: handleGestograma,
    },
    {
      id: 'mochila',
      label: 'Mochila de archivos',
      icon: faBriefcase,
      action: handleMochilaArchivos,
    },
  ]
  const actions: MenuItem[] = [
    {
      id: 'password',
      label: 'Cambiar contraseña',
      icon: faKey,
      action: handleOpenChangePassword,
    },
    {
      id: 'logout',
      label: 'Salir',
      icon: faRightFromBracket,
      action: handleLogout,
    },
  ]

  const dropDown: MenuGroup = {
    id: 'herramientas',
    label: 'Herramientas',
    icon: faWrench,
    items: tools,
  }
  const accDropDown: MenuGroup = {
    id: 'cuenta',
    label: 'Cuenta',
    icon: faUser,
    items: actions,
  }

  return (
    <header className={styles.header} style={{ backgroundColor: headerColor }}>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          {/* Usuario */}
          <div className={styles.userInfoContainer}>
            <div>
              <div className={styles.userName}>
                {convertirNombre(usuario.nombre, usuario.apellido)}
              </div>
              <div className={styles.userEmail}>{usuario.email}</div>
            </div>

            {mostrarSwitcher && (
              <div className="ml-4 flex items-center rounded-full border border-white/25 bg-white/10 px-1 py-1 shadow-sm">
                {rolesDisponibles.map((r) => {
                  const active = r === rolActual
                  return (
                    <Tooltip
                      key={r}
                      title={labelForRole(r)}
                      content={descriptionForRole(r)}
                      variant="info"
                      side="bottom"
                      align="center"
                    >
                      <button
                        onClick={() => handleChangeRole(r)}
                        className={`mx-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition ${active ? 'bg-white text-black' : 'text-white/85 hover:bg-white/20'}`}
                        role="button"
                        aria-pressed={active}
                        aria-label={`Cambiar a rol ${labelForRole(r)}`}
                      >
                        <FontAwesomeIcon icon={iconForRole(r)} />
                      </button>
                    </Tooltip>
                  )
                })}
              </div>
            )}
          </div>

          {/* Marca */}
          <div className={styles.appnameContainer}>
            <FontAwesomeIcon
              icon={faUserDoctor}
              className={styles.icon}
              size="2x"
            />
            <div className={styles.title}>Filomena</div>
          </div>

          {/* Acciones */}
          <div className="flex flex-1 items-center justify-end">
            {mostrarInicio && (
              <button
                onClick={handleGoHome}
                className={styles.navigationButton}
                title="Ir al inicio"
              >
                <FontAwesomeIcon icon={faHouse} className="mr-1" />
                <span className="hidden sm:inline">Inicio</span>
              </button>
            )}

            {mostrarHerramientas && (
              <div className="relative" ref={herramientasRef}>
                <ToolsDropdownButton
                  group={dropDown}
                  expandedGroups={expandedGroups}
                  toggleGroup={toggleGroup}
                />
                {expandedGroups[dropDown.id] && (
                  <ul className="absolute top-full left-0 z-10 mt-1 w-full rounded border border-transparent shadow-lg">
                    {dropDown.items.map((item) => (
                      <li key={item.id} className="w-full">
                        <ToolButton
                          item={item}
                          color={headerColor}
                          action={item.action!}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="relative" ref={cuentaRef}>
              <ToolsDropdownButton
                group={accDropDown}
                expandedGroups={expandedGroups}
                toggleGroup={toggleGroup}
              />
              {expandedGroups[accDropDown.id] && (
                <ul className="absolute top-full left-0 z-10 mt-1 w-full rounded border border-transparent shadow-lg">
                  {accDropDown.items.map((item) => (
                    <li key={item.id} className="w-full">
                      <ToolButton
                        item={item}
                        color={headerColor}
                        action={item.action!}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
