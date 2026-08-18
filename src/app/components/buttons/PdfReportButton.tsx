'use client'

import { useRef, useState } from 'react'
import { FaFilePdf, FaCircleNotch, FaDownload } from 'react-icons/fa'
import Tooltip from 'app/components/tooltip/Tooltip'
import useVisualNotifications from 'app/hooks/useVisualNotifications'

export type FetchOnce = (force: boolean) => Promise<string | null | undefined>

type Props = {
  enabled: boolean
  fetchOnce: FetchOnce
  texts?: {
    tooltipDisabled?: string
    tooltipGenerating?: string
    tooltipReady?: string
    badge?: string
    idleLabel?: string
    generatingLabel?: string
    readyLabel?: string
    warnFail?: string
    errorFail?: string
  }
  className?: string
  polling?: {
    maxAttempts?: number
    intervalMs?: number
  }
}

type Status = 'idle' | 'generating' | 'ready' | 'error'

export default function PdfReportButton({
  enabled,
  fetchOnce,
  texts,
  className,
  polling,
}: Props) {
  const {
    actions: { openToast },
  } = useVisualNotifications()

  const firstForceRef = useRef(true)
  const [status, setStatus] = useState<Status>('idle')
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  const isClickable = status === 'ready'
  const showLoader = status === 'generating'

  const t = {
    tooltipDisabled: 'Acción no disponible',
    tooltipGenerating: 'Generando reporte…',
    tooltipReady: 'Click para descargar',
    badge: 'PDF',
    idleLabel: 'Generar reporte',
    generatingLabel: 'Generando…',
    readyLabel: 'Descargar reporte',
    warnFail: 'No se pudo generar el reporte.',
    errorFail: 'Error al generar el reporte.',
    ...texts,
  }

  const tooltipText = (() => {
    if (!enabled) return t.tooltipDisabled
    if (showLoader) return t.tooltipGenerating
    if (isClickable) return t.tooltipReady
    return t.idleLabel
  })()

  const generate = async () => {
    if (!enabled) return
    setStatus('generating')
    setDownloadUrl(null)

    try {
      const MAX_ATTEMPTS = polling?.maxAttempts ?? 12
      const INTERVAL_MS = polling?.intervalMs ?? 5000

      let attempts = 0
      let url: string | null | undefined
      let force = firstForceRef.current
      firstForceRef.current = false

      while (attempts < MAX_ATTEMPTS && !url) {
        url = await fetchOnce(force)
        force = false
        if (url) break
        attempts += 1
        await new Promise((r) => setTimeout(r, INTERVAL_MS))
      }

      if (url) {
        setDownloadUrl(url)
        setStatus('ready')
      } else {
        setStatus('error')
        openToast({ severity: 'warning', message: t.warnFail })
      }
    } catch {
      setStatus('error')
      openToast({ severity: 'error', message: t.errorFail })
    }
  }

  const onClick = () => {
    if (!enabled) return
    if (downloadUrl) {
      window.open(downloadUrl, '_blank')
      return
    }
    void generate()
  }

  const base =
    'inline-flex items-center gap-3 rounded-full border bg-white/80 px-4 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-black/5 transition ' +
    'hover:shadow-md hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ' +
    'backdrop-blur supports-[backdrop-filter]:bg-white/60'
  const disabled =
    'cursor-not-allowed opacity-60 hover:shadow-sm hover:bg-white/80 focus:ring-0'
  const enabledCls = enabled ? 'cursor-pointer' : disabled

  return (
    <Tooltip
      content={tooltipText}
      side="bottom"
      variant={enabled ? 'info' : 'warning'}
    >
      <button
        type="button"
        onClick={onClick}
        aria-disabled={!enabled}
        disabled={!enabled}
        className={`${base} ${enabledCls} ${className ?? ''}`}
      >
        <span className="rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white uppercase">
          {t.badge}
        </span>

        {showLoader ? (
          <FaCircleNotch className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <FaFilePdf className="h-4 w-4" aria-hidden />
        )}

        <span className="whitespace-nowrap">
          {isClickable
            ? t.readyLabel
            : showLoader
              ? t.generatingLabel
              : t.idleLabel}
        </span>

        {isClickable && <FaDownload className="h-4 w-4 opacity-80" />}
      </button>
    </Tooltip>
  )
}
