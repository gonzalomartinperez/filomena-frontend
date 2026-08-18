import instance from 'api/AxiosInterceptor'
import { AxiosResponse } from 'axios'
import { ApiResponse } from 'app/types/ApiResponse'
import { ApiFile } from '../../mochila-carga/types/ApiFile'
import { EstadoExamenEstudiante } from 'app/inicio/estudiante/types/modelos'

export type ReportResponse = ApiResponse<ApiFile>

export type ReportService = (
  examenId: number,
  force?: boolean,
) => Promise<AxiosResponse<ReportResponse>>

export const estadosEvaluadores = (examenId: number) =>
  instance.get<ApiResponse<EstadoExamenEstudiante>>(
    `/administrar-examenes/estados-evaluadores/${examenId}`,
  )

export const reporteEstructura: ReportService = (id, force) =>
  instance.get<ReportResponse>(`/reporte-examen/pdf/estructura/${id}`, {
    params: { force },
  })

export const reporteCorrecciones: ReportService = (id, force) =>
  instance.get<ReportResponse>(`/reporte-examen/pdf/correcciones/${id}`, {
    params: { force },
  })

export const reporteNotas: ReportService = (id, force) =>
  instance.get<ReportResponse>(`/reporte-examen/excel/notas/${id}`, {
    params: { force },
  })

export const reporteCorreccionesDetalladas: ReportService = (id, force) =>
  instance.get<ReportResponse>(
    `/reporte-examen/excel/correcciones-detalladas/${id}`,
    { params: { force } },
  )
