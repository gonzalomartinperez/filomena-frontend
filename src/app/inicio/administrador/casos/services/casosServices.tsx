import instance from 'api/AxiosInterceptor'
import { Caso } from '../types/Caso'
import { EVALUADOR } from '../../usuarios/constants/roles'

export function getCasosAPI(examen: number) {
  return instance.get('/casos', {
    params: { examen },
  })
}

export function getCasoAPI(id: number) {
  return instance.get(`/casos/${id}`)
}

export function getEvaluadoresAPI(examen: number) {
  return instance.get('/usuarios', {
    params: { examen, rol: EVALUADOR },
  })
}

export function postCasoAPI(payload: unknown, examen: number) {
  return instance.post('/casos', payload, {
    params: { examen },
  })
}

export function updateCasoAPI(
  id: string,
  payload: Partial<
    Omit<Caso, 'id' | 'evaluador_dni' | 'evaluador_nombre_completo' | 'email'>
  >,
) {
  return instance.put(`/casos/${id}`, payload)
}

export function deleteCasoAPI(id: number) {
  return instance.delete(`/casos/${id}`)
}

export function getPreguntasDeCasoAPI(caso: number) {
  return instance.get('/preguntas', {
    params: { caso },
  })
}

export function importCasosAPI(formData: FormData, examen: number) {
  return instance.post('/casos/importar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: { examen },
  })
}
