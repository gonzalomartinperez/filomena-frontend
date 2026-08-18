import {
  ADMINISTRADOR,
  ESTUDIANTE,
  EVALUADOR,
} from 'app/inicio/administrador/usuarios/constants/roles'
import { Usuario } from 'app/inicio/administrador/usuarios/types/Usuario'

export function getDefaultRole(roles: string[] = []) {
  const order = [ADMINISTRADOR, EVALUADOR, ESTUDIANTE]
  return order.find((r) => roles.includes(r)) ?? ''
}

export function toRolesExamen(
  examenId: number,
  roles?: string[],
): Record<number, string[]> {
  return { [examenId]: roles ?? [] }
}

export function hasRoleInExam(
  usuario: Usuario,
  rol: string,
  examenId: number,
): boolean {
  const rolesDeExamen = usuario?.roles_examenes?.[examenId] ?? []
  if (rolesDeExamen.includes(rol)) return true
  return false
}
