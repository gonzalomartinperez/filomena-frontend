'use client'

import {
  ESTUDIANTE,
  EVALUADOR,
} from 'app/inicio/administrador/usuarios/constants/roles'
import { ReactNode, useMemo } from 'react'
import {
  HiLockClosed,
  HiRefresh,
  HiBan,
  HiInformationCircle,
} from 'react-icons/hi'

export const STATUS = {
  NOT_FINALIZED: 'notFinalized',
  NOT_PUBLISHED: 'notPublished',
  FORBIDDEN: 'forbidden',
  INFO: 'info',
} as const
export type Status = (typeof STATUS)[keyof typeof STATUS]

type Action = {
  label: string
  onClick: () => void
  icon?: ReactNode
  ariaLabel?: string
  disabled?: boolean
}

type Props = {
  context?: typeof ESTUDIANTE | typeof EVALUADOR
  status?: Status
  title?: string
  description?: string
  primary: Action
  secondary?: Action
  children?: ReactNode
  overlay?: boolean
  className?: string
  icon?: ReactNode
  'data-testid'?: string
}

const iconByStatus: Record<Status, ReactNode> = {
  [STATUS.NOT_FINALIZED]: <HiLockClosed className="h-7 w-7" aria-hidden />,
  [STATUS.NOT_PUBLISHED]: (
    <HiInformationCircle className="h-7 w-7" aria-hidden />
  ),
  [STATUS.FORBIDDEN]: <HiBan className="h-7 w-7" aria-hidden />,
  [STATUS.INFO]: <HiInformationCircle className="h-7 w-7" aria-hidden />,
}

export default function ExamenStatusGate({
  context = EVALUADOR,
  status = STATUS.NOT_FINALIZED,
  title,
  description,
  primary,
  secondary,
  children,
  overlay = false,
  className,
  icon,
  'data-testid': dataTestId,
}: Props) {
  const defaults = useMemo(() => {
    if (status === STATUS.NOT_FINALIZED) {
      return {
        title: 'Examen no finalizado',
        description:
          context === EVALUADOR
            ? 'Solo se pueden corregir exámenes finalizados.'
            : 'Aún no podés rendir este examen porque no fue finalizado.',
      }
    }
    if (status === STATUS.NOT_PUBLISHED) {
      return {
        title: 'Examen no publicado',
        description:
          context === EVALUADOR
            ? 'Este examen todavía no está publicado.'
            : 'El examen todavía no está disponible para rendir.',
      }
    }
    if (status === STATUS.FORBIDDEN) {
      return {
        title: 'Acceso restringido',
        description:
          context === EVALUADOR
            ? 'No tenés permisos para corregir este examen.'
            : 'No tenés permisos para rendir este examen.',
      }
    }
    return {
      title: 'Información',
      description: 'Revisá los detalles antes de continuar.',
    }
  }, [context, status])

  const resolvedTitle = title ?? defaults.title
  const resolvedDescription = description ?? defaults.description
  const resolvedIcon = icon ?? iconByStatus[status]

  const wrapper = overlay
    ? 'fixed inset-x-0 top-16 bottom-0 grid place-items-center p-6'
    : 'mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center p-6'

  return (
    <section
      data-testid={dataTestId}
      aria-labelledby="examen-gate-title"
      aria-describedby="examen-gate-desc"
      role="status"
      aria-live="polite"
      className={`${wrapper} ${className ?? ''}`}
    >
      <div className="w-full max-w-2xl rounded-3xl border border-black/10 bg-white p-8 shadow-xl ring-1 ring-black/5">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gray-100 text-gray-700">
          {resolvedIcon}
        </div>

        <h1
          id="examen-gate-title"
          className="text-center text-2xl font-semibold text-gray-900"
        >
          {resolvedTitle}
        </h1>

        <p
          id="examen-gate-desc"
          className="mt-2 text-center text-sm leading-relaxed text-gray-600"
        >
          {resolvedDescription}
        </p>

        {children && <div className="mt-4">{children}</div>}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            aria-label={primary.ariaLabel ?? primary.label}
            onClick={primary.onClick}
            disabled={primary.disabled}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {primary.icon ?? <HiRefresh className="h-4 w-4" aria-hidden />}
            {primary.label}
          </button>

          {secondary && (
            <button
              type="button"
              aria-label={secondary.ariaLabel ?? secondary.label}
              onClick={secondary.onClick}
              disabled={secondary.disabled}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {secondary.icon}
              {secondary.label}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
