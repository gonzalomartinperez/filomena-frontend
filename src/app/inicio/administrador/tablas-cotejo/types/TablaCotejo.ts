export interface TablaCotejo {
  id: number
  caso_id: number
  seccion_id: number
  items?: Item[]
}

export interface Item {
  id: number
  descripcion: string
  valor: number
  examen_id: number
  tabla_cotejo_id: number
  caso_id: number
  seccion_id: number
  pregunta_id: number
}

export interface PuntajesResponse {
  tabla_cotejo_id: number
  caso_id: number
  seccion_id: number
  totales: { caso: number; seccion: number }
  preguntas: { pregunta_id: number; orden_relativo: number; total: number }[]
}

export interface SeccionHeader {
  seccion_nombre: string
  subtotal: number
  total: number
}
