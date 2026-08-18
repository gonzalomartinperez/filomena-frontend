import instance from 'api/AxiosInterceptor'
import { Usuario } from 'app/inicio/administrador/usuarios/types/Usuario'

export function getUsuarios(examen?: number) {
  return instance.get('/usuarios', { params: { examen } })
}

export function getUsuario(dni: string) {
  return instance.get(`/usuarios/${dni}`)
}

export function upsertUsuario(payload: Partial<Usuario>, examen: number) {
  return instance.put('/usuarios', payload, { params: { examen } })
}

export function deleteUsuario(dni: string, examen: number) {
  return instance.delete(`/usuarios/${dni}`, { params: { examen } })
}

export function importUsuarios(
  formData: FormData,
  examen: number,
  rol?: 'estudiante' | 'evaluador' | 'administrador',
) {
  return instance.post('/usuarios/importar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: { examen, rol },
  })
}
