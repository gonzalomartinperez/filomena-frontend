import instance from 'api/AxiosInterceptor'
import { ApiResponse } from '../../../types/ApiResponse'
import {
  EstadoExamenEvaluador,
  NotaItem,
  RespuestaEstudiante,
} from '../types/modelos'
import { Examen } from 'app/inicio/administrador/examenes/types/Examen'
import { Caso } from 'app/inicio/administrador/casos/types/Caso'
import { Pregunta } from 'app/inicio/administrador/preguntas/types/Pregunta'
import { Usuario } from 'app/inicio/administrador/usuarios/types/Usuario'
import { TablaCotejo } from 'app/inicio/administrador/tablas-cotejo/types/TablaCotejo'
import { ApiFile } from 'app/inicio/administrador/mochila-carga/types/ApiFile'
import { Seccion } from 'app/inicio/administrador/secciones/types/Seccion'
import { ESTUDIANTE } from 'app/inicio/administrador/usuarios/constants/roles'

export const evaluadorApi = {
  examenByCodigo: (codigo: string) =>
    instance.get<ApiResponse<Examen>>(
      `/examenes/codigo/${encodeURIComponent(codigo)}`,
    ),

  casos: (examenId: number, evaluadorId: number) =>
    instance.get<ApiResponse<Caso[]>>('/casos', {
      params: { examen: examenId, evaluador: evaluadorId },
    }),

  preguntas: (examenId: number, casoId: number) =>
    instance.get<ApiResponse<Pregunta[]>>('/preguntas', {
      params: { examen: examenId, caso: casoId },
    }),

  estudiantesPorExamen: (examenId: number) =>
    instance.get<ApiResponse<Usuario[]>>('/usuarios', {
      params: { examen: examenId, rol: ESTUDIANTE },
    }),

  estadoCorreccionEvaluador: (examenId: number) =>
    instance.get<ApiResponse<EstadoExamenEvaluador>>(
      '/evaluador/estado-correccion-examen',
      {
        params: { examen: examenId },
      },
    ),

  secciones: (examenId: number) =>
    instance.get<ApiResponse<Seccion[]>>('/secciones', {
      params: { examen: examenId },
    }),

  tablasCotejo: (casoId: number, preguntaId: number) =>
    instance.get<ApiResponse<TablaCotejo[]>>('/tablas-cotejo', {
      params: { caso: casoId, pregunta: preguntaId },
    }),

  tablaCotejoById: (tablaId: number, preguntaId: number) =>
    instance.get<ApiResponse<TablaCotejo>>(`/tablas-cotejo/${tablaId}`, {
      params: { pregunta: preguntaId },
    }),

  respuestas: (preguntaId: number, pseudonimo: string) =>
    instance.get<ApiResponse<RespuestaEstudiante[]>>(
      '/evaluador/respuestas-estudiantes',
      {
        params: { pregunta: preguntaId, pseudonimo },
      },
    ),

  correccionesByPregunta: (preguntaId: number, pseudonimo: string) =>
    instance.get<ApiResponse<NotaItem[]>>('/evaluador/correcciones', {
      params: { pregunta: preguntaId, pseudonimo },
    }),

  cargarNotaPregunta: (
    preguntaId: number,
    pseudonimo: string,
    items: Pick<NotaItem, 'item_id' | 'aprobado' | 'comentario'>[],
  ) =>
    instance.put<ApiResponse<void>>(
      '/evaluador/cargar-correcciones-pregunta',
      { items },
      { params: { pregunta: preguntaId, pseudonimo } },
    ),

  finalizarCorreccion: (examenId: number) =>
    instance.put('/evaluador/finalizar-correccion-examen', null, {
      params: { examen: examenId },
    }),

  reporteCorrecciones: (examenId: number, force: boolean = false) =>
    instance.get<ApiResponse<ApiFile>>(
      `/reporte-examen/pdf/correcciones/${examenId}`,
      { params: { force } },
    ),

  imagenesPregunta: (preguntaId: number) =>
    instance.get<ApiResponse<ApiFile[]>>(`/archivos`, {
      params: { pregunta: preguntaId },
    }),
}

export type EvaluadorApi = typeof evaluadorApi
