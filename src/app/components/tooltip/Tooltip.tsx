/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import {
  ReactNode,
  isValidElement,
  cloneElement,
  useMemo,
  Fragment,
} from 'react'
import {
  HiInformationCircle,
  HiCheckCircle,
  HiExclamationCircle,
  HiXCircle,
} from 'react-icons/hi'

type Variant = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

type Props = {
  content: ReactNode
  title?: ReactNode
  variant?: Variant
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'center' | 'start' | 'end'
  delay?: number
  sideOffset?: number
  className?: string
  children: ReactNode
  maxWidth?: number
}

export default function Tooltip({
  content,
  title,
  variant = 'neutral',
  side = 'top',
  align = 'center',
  delay = 120,
  sideOffset = 8,
  className,
  children,
  maxWidth = 280,
}: Props) {
  let triggerEl: React.ReactElement

  if (isValidElement(children)) {
    const props = (children.props ?? {}) as {
      title?: string
      ['aria-label']?: string
      [k: string]: any
    }
    const { title: nativeTitle, ...rest } = props
    const patched: Record<string, any> = { ...rest }
    if (nativeTitle) {
      if (!patched['aria-label']) patched['aria-label'] = String(nativeTitle)
      patched.title = undefined
    }
    triggerEl = cloneElement(children, patched)
  } else {
    triggerEl = <span>{children}</span>
  }

  const v = useMemo(() => {
    switch (variant) {
      case 'info':
        return {
          bg: 'bg-sky-800',
          text: 'text-white',
          icon: <HiInformationCircle className="h-4 w-4 text-sky-200" />,
          arrow: 'fill-sky-800',
        }
      case 'success':
        return {
          bg: 'bg-emerald-800',
          text: 'text-white',
          icon: <HiCheckCircle className="h-4 w-4 text-emerald-200" />,
          arrow: 'fill-emerald-800',
        }
      case 'warning':
        return {
          bg: 'bg-amber-800',
          text: 'text-white',
          icon: <HiExclamationCircle className="h-4 w-4 text-amber-200" />,
          arrow: 'fill-amber-800',
        }
      case 'danger':
        return {
          bg: 'bg-rose-800',
          text: 'text-white',
          icon: <HiXCircle className="h-4 w-4 text-rose-200" />,
          arrow: 'fill-rose-800',
        }
      default:
        return {
          bg: 'bg-slate-900',
          text: 'text-white',
          icon: <HiInformationCircle className="h-4 w-4 text-slate-300" />,
          arrow: 'fill-slate-900',
        }
    }
  }, [variant])

  return (
    <TooltipPrimitive.Provider delayDuration={delay}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{triggerEl}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={sideOffset}
            className={[
              'z-[60] rounded-xl shadow-lg ring-1 ring-black/10 backdrop-blur select-none',
              'data-[state=delayed-open]:data-[side=top]:animate-slideDownAndFade',
              'data-[state=delayed-open]:data-[side=right]:animate-slideLeftAndFade',
              'data-[state=delayed-open]:data-[side=bottom]:animate-slideUpAndFade',
              'data-[state=delayed-open]:data-[side=left]:animate-slideRightAndFade',
              v.bg,
              v.text,
              className ?? '',
            ].join(' ')}
            style={{ maxWidth }}
          >
            <div className="flex items-start gap-2 px-3.5 py-2.5 text-xs leading-relaxed">
              <span aria-hidden className="mt-0.5 shrink-0">
                {v.icon}
              </span>
              <div className="min-w-0">
                {title ? (
                  <Fragment>
                    <div className="mb-0.5 font-semibold opacity-95">
                      {title}
                    </div>
                    <div className="opacity-90">{content}</div>
                  </Fragment>
                ) : (
                  <div className="opacity-95">{content}</div>
                )}
              </div>
            </div>
            <TooltipPrimitive.Arrow className={v.arrow} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>

      {/* Animaciones */}
      <style jsx global>{`
        @keyframes slideUpAndFade {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideRightAndFade {
          from {
            opacity: 0;
            transform: translateX(-4px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideDownAndFade {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideLeftAndFade {
          from {
            opacity: 0;
            transform: translateX(4px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideUpAndFade {
          animation: slideUpAndFade 120ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-slideRightAndFade {
          animation: slideRightAndFade 120ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-slideDownAndFade {
          animation: slideDownAndFade 120ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-slideLeftAndFade {
          animation: slideLeftAndFade 120ms cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </TooltipPrimitive.Provider>
  )
}
