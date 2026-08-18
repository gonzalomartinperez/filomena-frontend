import {
  ADMINISTRADOR,
  ESTUDIANTE,
  EVALUADOR,
} from 'app/inicio/administrador/usuarios/constants/roles'
import { todoAMinus } from 'app/utils/stringOperations'

type RoleType =
  | typeof ADMINISTRADOR
  | typeof EVALUADOR
  | typeof ESTUDIANTE
  | 'default'

const ROLE_COLORS = {
  evaluador: '#03bb85',
  estudiante: '#3498db',
  administrador: '#262626',
  default: '#3498db',
}

export const obtenerHeadBarColorPorRol = (role: string): string => {
  const normalizedRole = todoAMinus(role) as RoleType

  const isValidRole =
    normalizedRole && Object.keys(ROLE_COLORS).includes(normalizedRole)

  return isValidRole ? ROLE_COLORS[normalizedRole] : ROLE_COLORS.default
}
