import instance from 'api/AxiosInterceptor'
import { ApiFile } from 'app/inicio/administrador/mochila-carga/types/ApiFile'

export function getArchivosAPI(examenId: number) {
  return instance.get(`/archivos`, {
    params: { examen: examenId },
  })
}

export function uploadArchivoAPI(examenId: number, file: File) {
  const form = new FormData()
  form.append('archivo', file)

  return instance.post<File>(`/archivos`, form, {
    params: { examen: examenId },
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function getArchivoAPI(id: number) {
  return instance.get<ApiFile>(`/archivos/${id}`)
}

export function deleteArchivoAPI(id: number) {
  return instance.delete(`/archivos/${id}`)
}

export function getArchivosPreguntaAPI(preguntaId: number) {
  return instance.get(`/archivos`, {
    params: { pregunta: preguntaId },
  })
}

export function uploadArchivoPreguntaAPI(preguntaId: number, file: File) {
  const form = new FormData()
  form.append('archivo', file)

  return instance.post<File>(`/archivos`, form, {
    params: { pregunta: preguntaId },
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
