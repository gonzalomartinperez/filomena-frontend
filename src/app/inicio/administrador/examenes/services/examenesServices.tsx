import instance from 'api/AxiosInterceptor'
import { Examen } from '../types/Examen'
import { normalizeCodigo } from 'app/utils/normalizeCodigo'

export function getExamenAPI(id: number) {
  return instance.get(`/examenes/${id}`)
}

export function postExamenAPI(payload: Partial<Examen>) {
  return instance.post('/examenes', payload)
}

export function updateExamenAPI(id: string, payload: Partial<Examen>) {
  return instance.put(`/examenes/${id}`, payload)
}

export function deleteExamenAPI(id: number) {
  return instance.delete(`/examenes/${id}`)
}

export function reestablecerExamenAPI(id: number) {
  return instance.put(`/examenes/reestablecer/${id}`)
}

export function buildExamenPayload(values: {
  nombre: string
  fecha: string
  codigo: string
  descargable?: boolean
  retrocedible?: boolean
}): Partial<Examen> {
  return {
    nombre: values.nombre?.trim() ?? '',
    fecha: values.fecha ?? null,
    codigo: normalizeCodigo(values.codigo ?? ''),
    descargable: values.descargable ?? false,
    retrocedible: values.retrocedible ?? false,
  }
}
