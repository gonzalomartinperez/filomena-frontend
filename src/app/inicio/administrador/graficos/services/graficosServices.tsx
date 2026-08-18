import instance from 'api/AxiosInterceptor'

export function getPorcentajeFinalizacionAlumnosAPI(examen: number) {
  return instance.get(
    `/administrar-examenes/porcentaje-finalizacion-alumnos/${examen}`,
  )
}

export function getOrdenEntregaAlumnosAPI(examen: number) {
  return instance.get(
    `/administrar-examenes/alumnos-estado-finalizado/${examen}`,
  )
}

export function getPorcentajeFinalizacionEvaluadoresAPI(examen: number) {
  return instance.get(
    `/administrar-examenes/porcentaje-finalizacion-evaluadores/${examen}`,
  )
}
