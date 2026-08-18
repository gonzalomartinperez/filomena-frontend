'use client'

import instance from 'api/AxiosInterceptor'
import { ApiResponse } from 'app/types/ApiResponse'
import { EstadoExamenEstudiante } from 'app/inicio/estudiante/types/modelos'
import { EstadoExamenEvaluador } from 'app/inicio/evaluador/types/modelos'
import { Usuario } from 'app/inicio/administrador/usuarios/types/Usuario'
import { ESTUDIANTE } from 'app/inicio/administrador/usuarios/constants/roles'

export type NotaDefensa = {
  estudiante_id: number
  caso_id: number
  seccion_id: number
  nota: number
}

export type NotaDefensaPayload = {
  caso_id: number
  seccion_id: number
  nota: number
}

const roundToHalf = (n: number): number => {
  const x = Math.max(0, n)
  return Math.round(x * 2) / 2
}

const normalize = (list: NotaDefensaPayload[]): NotaDefensaPayload[] =>
  list.map((d) => ({ ...d, nota: roundToHalf(d.nota) }))

export function getDefensasAPI(caso: number, pseudonimo: string | number) {
  return instance.get<ApiResponse<NotaDefensa[]>>('/defensas', {
    params: { caso, pseudonimo },
  })
}

export function putDefensasAPI(
  caso: number,
  pseudonimo: string | number,
  defensas: NotaDefensaPayload[],
) {
  return instance.put<ApiResponse<NotaDefensa[]>>(
    '/defensas',
    { defensas: normalize(defensas) },
    { params: { caso, pseudonimo } },
  )
}

export function marcarEstudianteDefendido(
  examen: number,
  pseudonimo: string | number,
) {
  return instance.put<ApiResponse<EstadoExamenEstudiante>>(
    '/defensas/marcar-estudiante-defendido',
    {},
    { params: { examen, pseudonimo } },
  )
}

export function getEstadosEstudiantesAPI(examen: number) {
  return instance.get<ApiResponse<EstadoExamenEstudiante>>(
    `/administrar-examenes/estados-estudiantes/${examen}`,
  )
}

export function getEstadosEvaluadoresAPI(examen: number) {
  return instance.get<ApiResponse<EstadoExamenEvaluador[]>>(
    `/administrar-examenes/estados-evaluadores/${examen}`,
  )
}

export function getEstudiantesPorExamenAPI(examenId: number) {
  return instance.get<ApiResponse<Usuario[]>>('/usuarios', {
    params: { examen: examenId, rol: ESTUDIANTE },
  })
}

export function defenderExamenAPI(id: number) {
  return instance.put(`/examenes/defender/${id}`)
}
