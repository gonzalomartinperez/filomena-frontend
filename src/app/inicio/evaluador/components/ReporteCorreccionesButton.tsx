'use client'

import PdfReportButton, {
  FetchOnce,
} from 'app/components/buttons/PdfReportButton'
import { evaluadorApi } from '../services/evaluadorServices'

type Props = {
  examenId: number
  enabled: boolean
  className?: string
}

export default function ReporteCorreccionesButton({
  examenId,
  enabled,
  className,
}: Props) {
  const fetchOnce: FetchOnce = async (force) => {
    const res = await evaluadorApi.reporteCorrecciones(examenId, force)
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
          'Debes finalizar todos los casos para generar el reporte',
        idleLabel: 'Reporte de correcciones',
        readyLabel: 'Descargar reporte',
        warnFail: 'No se pudo generar el reporte de correcciones.',
        errorFail: 'Error al generar el reporte de correcciones.',
      }}
      polling={{ maxAttempts: 12, intervalMs: 5000 }}
    />
  )
}
