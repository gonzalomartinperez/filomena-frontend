import instance from 'api/AxiosInterceptor'

export type TablaCotejoItem = {
  id?: number
  descripcion: string
  valor: number
  pregunta_id: number
}

export type TablaCotejoPayload = {
  caso_id: number
  seccion_id: number
  items: TablaCotejoItem[]
}

export function getTablasCotejoAPI(examen: number) {
  return instance.get('/tablas-cotejo', { params: { examen } })
}

export function getTablaCotejoAPI(id: string | number) {
  return instance.get(`/tablas-cotejo/${id}`)
}

export function createTablaCotejoAPI(payload: TablaCotejoPayload) {
  return instance.post('/tablas-cotejo', payload)
}

export function updateTablaCotejoAPI(
  id: string | number,
  payload: TablaCotejoPayload,
) {
  return instance.put(`/tablas-cotejo/${id}`, payload)
}

export function deleteTablaCotejoAPI(id: number | string) {
  return instance.delete(`/tablas-cotejo/${id}`)
}

export function getPuntajesTablaCotejoAPI(id: string | number) {
  return instance.get(`/tablas-cotejo/puntajes/${id}`)
}

export function importTablasCotejoAPI(formData: FormData, examen: number) {
  return instance.post('/tablas-cotejo/importar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: { examen },
  })
}
