export interface Usuario {
  id: number
  usuario: string
  nombre: string
  apellido: string
  legajo: string
  dni: string
  email: string
  roles: string[]
  roles_examenes: Record<number, string[]>
  created_at: Date
  updated_at: Date
  pseudonimo?: string
  must_change_password?: boolean
}
