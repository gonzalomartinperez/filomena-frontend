'use client'

import PdfReportButton, {
  FetchOnce,
} from 'app/components/buttons/PdfReportButton'
import { estudianteApi } from '../services/estudianteServices'

type Props = {
  examenId: number
  enabled: boolean
  className?: string
}

export default function ReporteRespuestasButton({
  examenId,
  enabled,
  className,
}: Props) {
  const fetchOnce: FetchOnce = async (force) => {
    const res = await estudianteApi.reporteRespuestas(examenId, force)
    const ok = res?.data?.status === 200
    const url: string | undefined = res?.data?.data?.url
    return ok && url ? url : null
  }

  return (
    <PdfReportButton
      enabled={enabled}
      fetchOnce={fetchOnce}
      className={className}
      texts={{
        tooltipDisabled:
          'La descarga se habilita cuando el examen esté cerrado para todos los estudiantes. Solo disponible hoy.',
        idleLabel: 'Reporte de respuestas',
        readyLabel: 'Descargar respuestas',
        warnFail: 'No se pudo generar el reporte de respuestas.',
        errorFail: 'Error al generar el reporte de respuestas.',
      }}
      polling={{ maxAttempts: 12, intervalMs: 5000 }}
    />
  )
}
