export type EstadoExamenEstudiante = {
  examen_id: number
  estudiante_id: number
  inicio: boolean
  finalizado: boolean
  defendido: boolean
  alertado: boolean
  hora_inicio: string | null
  hora_finalizacion: string | null
  posicion_finalizacion: number | null
  caso_id: number | null
  pregunta_id: number | null
}
