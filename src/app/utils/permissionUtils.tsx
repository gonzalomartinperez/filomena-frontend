import {
  ADMINISTRADOR,
  ESTUDIANTE,
  EVALUADOR,
} from 'app/inicio/administrador/usuarios/constants/roles'

export function paginaDeInicio(rol: string) {
  let homePage

  switch (rol) {
    case ADMINISTRADOR:
      homePage = '/inicio/administrador'
      break
    case EVALUADOR:
      homePage = '/inicio/evaluador'
      break
    case ESTUDIANTE:
      homePage = '/inicio/estudiante'
      break
    default:
      homePage = '/inicio'
  }

  return homePage
}

export function tienePermisosParaNavegarAPagina(pathname: string, rol: string) {
  const path = pathname?.split('/')
  return path.includes(rol)
}
