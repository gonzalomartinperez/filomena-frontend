import { ESTUDIANTE } from 'app/inicio/administrador/usuarios/constants/roles'
import { Usuario } from 'app/inicio/administrador/usuarios/types/Usuario'

export type Estudiante = {
  id: number
  pseudonimo: string
  rol: string
}

export const toPseudonimo = (usuario: Usuario): Estudiante => ({
  id: Number(usuario.id),
  pseudonimo: String(usuario.pseudonimo ?? ''),
  rol: ESTUDIANTE,
})

export type EstadoExamenEvaluador = {
  id?: number
  examen_id?: number
  evaluador_id?: number
  finalizado: boolean
  correcciones_asignadas: number
  correcciones_realizadas: number
  created_at?: string
  updated_at?: string
  casos?: {
    id: number
    finalizado: boolean
    preguntas_totales: number
    preguntas_corregidas: number
  }[]
  preguntas?: {
    id: number
    caso_id: number
    finalizada: boolean
    items_totales: number
    items_corregidos: number
  }[]
  estudiantes?: {
    id: number
    pseudonimo: string
    casos_finalizados: number[]
    preguntas_finalizadas: number[]
  }[]
}

export type RespuestaEstudiante = {
  estudiante_id: number
  pregunta_id: number
  respuesta: string
}

export type NotaItem = {
  estudiante_id: number
  item_id: number
  aprobado: boolean
  comentario?: string | null
}
