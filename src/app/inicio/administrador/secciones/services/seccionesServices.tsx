import instance from 'api/AxiosInterceptor'
import { Seccion } from '../types/Seccion'

export function getSeccionesAPI(examen: number) {
  return instance.get('/secciones', {
    params: { examen },
  })
}

export function getSeccionAPI(id: string) {
  return instance.get(`/secciones/${id}`)
}

export function postSeccionAPI(payload: unknown, examen: number) {
  return instance.post('/secciones', payload, {
    params: { examen },
  })
}

export function updateSeccionAPI(
  id: string,
  payload: Partial<Omit<Seccion, 'id'>>,
) {
  return instance.put(`/secciones/${id}`, payload)
}

export function deleteSeccionAPI(id: number) {
  return instance.delete(`/secciones/${id}`)
}

export function importSeccionesAPI(formData: FormData, examen: number) {
  return instance.post('/secciones/importar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: { examen },
  })
}
