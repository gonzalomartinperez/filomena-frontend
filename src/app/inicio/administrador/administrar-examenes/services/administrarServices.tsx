import instance from 'api/AxiosInterceptor'

export function publicarExamenAPI(id: number) {
  return instance.put(`/examenes/publicar/${id}`)
}

export function finalizarExamenAPI(id: number) {
  return instance.put(`/examenes/finalizar/${id}`)
}

export function monitorEstudiantesAPI(id: number) {
  return instance.get(`administrar-examenes/examen-progreso-estudiantes/${id}`)
}

export function alertarEstudianteAPI(examenId: number, estudianteId: number) {
  return instance.put(
    `administrar-examenes/alertar-estudiante/${examenId}/${estudianteId}`,
  )
}

export function monitorEvaluadoresAPI(id: number) {
  return instance.get(`administrar-examenes/examen-progreso-evaluadores/${id}`)
}
