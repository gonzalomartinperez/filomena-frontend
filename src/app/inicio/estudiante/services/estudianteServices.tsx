'use client'

import instance from 'api/AxiosInterceptor'
import { ApiResponse } from 'app/types/ApiResponse'
import { Examen } from 'app/inicio/administrador/examenes/types/Examen'
import { Pregunta } from 'app/inicio/administrador/preguntas/types/Pregunta'
import { RespuestaEstudiante } from 'app/inicio/evaluador/types/modelos'
import { Pseudonimo } from 'app/inicio/administrador/pseudonimos/types/Pseudonimo'
import { EstadoExamenEstudiante } from '../types/modelos'
import { Caso } from 'app/inicio/administrador/casos/types/Caso'
import { ApiFile } from 'app/inicio/administrador/mochila-carga/types/ApiFile'

export type Direccion = 'siguiente' | 'anterior'

export type MetaNavegacion = {
  casoActual: number
  casosTotal: number
  preguntaActual: number
  preguntasEnCaso: number
  ultimaDelCaso: boolean
  ultimaDelExamen: boolean
}

export const estudianteApi = {
  examenByCodigo: (codigo: string) =>
    instance.get<ApiResponse<Examen>>(
      `/examenes/codigo/${encodeURIComponent(codigo)}`,
    ),

  pseudonimo: (examenId: number) =>
    instance.get<ApiResponse<Pseudonimo>>(
      `/estudiantes/pseudonimo-examen/${examenId}`,
    ),

  estado: (examenId: number) =>
    instance.get<ApiResponse<EstadoExamenEstudiante>>(
      `/estudiantes/estado-examen/${examenId}`,
    ),

  iniciar: (examenId: number) =>
    instance.put<ApiResponse<EstadoExamenEstudiante>>(
      `/estudiantes/iniciar-examen/${examenId}`,
    ),

  finalizar: (examenId: number) =>
    instance.put<ApiResponse<EstadoExamenEstudiante>>(
      `/estudiantes/finalizar-examen/${examenId}`,
    ),

  desactivarAlerta: (examenId: number) =>
    instance.put<ApiResponse<EstadoExamenEstudiante>>(
      `/estudiantes/desactivar-alerta-examen/${examenId}`,
    ),

  actualizarPuntero: (
    examenId: number,
    params: { caso_id: number; pregunta_id: number },
  ) =>
    instance.put<ApiResponse<EstadoExamenEstudiante>>(
      `/estudiantes/actualizar-puntero-examen/${examenId}`,
      params,
    ),

  navegar: (examenId: number, direccion: Direccion) =>
    instance.get<ApiResponse<Pregunta>>(
      `/estudiantes/navegar-examen/${examenId}?direccion=${encodeURIComponent(direccion)}`,
    ),

  casosExamen: (examenId: number) =>
    instance.get<ApiResponse<Caso[]>>(
      `/casos?examen=${encodeURIComponent(examenId)}`,
    ),

  caso: (casoId: number) => instance.get<ApiResponse<Caso>>(`/casos/${casoId}`),

  preguntasExamen: (examenId: number) =>
    instance.get<ApiResponse<Pregunta[]>>(
      `/preguntas?examen=${encodeURIComponent(examenId)}`,
    ),

  preguntasCaso: (casoId: number) =>
    instance.get<ApiResponse<Pregunta[]>>(
      `/preguntas?caso=${encodeURIComponent(casoId)}`,
    ),

  pregunta: (preguntaId: number, signal?: AbortSignal) =>
    instance.get<ApiResponse<Pregunta>>(`/preguntas/${preguntaId}`, { signal }),

  miRespuesta: (preguntaId: number) =>
    instance.get<ApiResponse<RespuestaEstudiante | null>>(
      `/estudiantes/respuesta-pregunta/${preguntaId}`,
    ),

  responder: (preguntaId: number, respuesta: string) =>
    instance.put<ApiResponse<EstadoExamenEstudiante>>(
      `/estudiantes/responder-pregunta/${preguntaId}`,
      { respuesta },
    ),

  reporteRespuestas: (examenId: number, force: boolean = false) =>
    instance.get<ApiResponse<ApiFile>>(
      `/reporte-examen/pdf/respuestas/${examenId}`,
      { params: { force } },
    ),

  imagenesPregunta: (preguntaId: number) =>
    instance.get<ApiResponse<ApiFile[]>>(`/archivos`, {
      params: { pregunta: preguntaId },
    }),
}

export type EstudianteApi = typeof estudianteApi
