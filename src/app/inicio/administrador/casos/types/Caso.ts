import { Usuario } from 'app/inicio/administrador/usuarios/types/Usuario'

export interface Caso {
  id: number
  titulo: string
  orden_relativo: number
  evaluador_id: string
  evaluador: Usuario
  email: string
}
