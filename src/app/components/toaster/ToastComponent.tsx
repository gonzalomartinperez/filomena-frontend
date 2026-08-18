import { toast, Toaster } from 'sonner'
import { ToastState } from 'app/contexts/VisualNotificationsContext'
import { useEffect } from 'react'

interface ToastProps {
  severity?: 'success' | 'warning' | 'error' | 'info'
  message?: string
  open: ToastState
  handleClose: () => void
  autoHideDuration?: number
}

export default function Toast({
  severity = 'success',
  message,
  open,
  handleClose,
  autoHideDuration = 4000,
}: ToastProps) {
  useEffect(() => {
    if (open.state) {
      const severityToUse = open.severity || severity

      const toastType = (() => {
        switch (severityToUse) {
          case 'success':
            return 'green'
          case 'error':
            return 'red'
          case 'warning':
            return 'orange'
          default:
            return 'blue'
        }
      })()

      const toastMessage = open.message || message
      const duration = open.autoHideDuration || autoHideDuration

      const toastOptions = {
        duration: duration,
        style: {
          background: toastType,
          color: 'white',
          borderRadius: '10px',
        },
        onAutoClose: handleClose,
      }

      if (open.button) {
        toast(toastMessage, {
          ...toastOptions,
          action: {
            label: open.button.label,
            onClick: open.button.onClick,
          },
        })
      } else {
        toast(toastMessage, toastOptions)
      }
    }
  }, [open.state])

  return <Toaster visibleToasts={1} position="bottom-center" />
}
