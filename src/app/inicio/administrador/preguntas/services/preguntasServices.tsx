import instance from 'api/AxiosInterceptor'
import { Pregunta } from '../types/Pregunta'

export function getPreguntasAPI(examen: number) {
  return instance.get('/preguntas', {
    params: { examen },
  })
}

export function getPreguntaAPI(id: string) {
  return instance.get(`/preguntas/${id}`)
}

export function postPreguntaAPI(payload: unknown, examen: number) {
  return instance.post('/preguntas', payload, {
    params: { examen },
  })
}

export function updatePreguntaAPI(
  id: string,
  payload: Partial<Omit<Pregunta, 'id' | 'caso'>>,
) {
  return instance.put(`/preguntas/${id}`, payload)
}

export function deletePreguntaAPI(id: number) {
  return instance.delete(`/preguntas/${id}`)
}

export function getTablaCotejoDePreguntaAPI(id: number, pregunta: number) {
  return instance.get(`/tablas-cotejo/${id}`, { params: { pregunta } })
}

export function importPreguntasAPI(formData: FormData, examen: number) {
  return instance.post('/preguntas/importar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: { examen },
  })
}
