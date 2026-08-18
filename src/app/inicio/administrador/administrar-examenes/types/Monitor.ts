import { Caso } from '../../casos/types/Caso'

export interface MonitorEstudiante {
  estudiante_id: number
  estudiante_pseudonimo: string
  ultima_pregunta_respondida: number
  caso_titulo: string
  caso_orden: number
  ultima_pregunta_caso: number
  porcentaje: number
  alertado: boolean
  alertas_disponibles: number
  finalizado: boolean
}

export interface MonitorEvaluador {
  evaluador_id: number
  evaluador_nombre: string
  evaluador_email: string
  casos_asignados: Partial<Caso[]>
  porcentaje: number
  finalizado: boolean
}
