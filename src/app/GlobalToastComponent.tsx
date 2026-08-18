import Toast from './components/toaster/ToastComponent'
import useVisualNotifications from './hooks/useVisualNotifications'

export default function GlobalToast() {
  const {
    actions: { closeToast },
    state: { toastState },
  } = useVisualNotifications()

  const handleCloseToast = () => {
    closeToast({
      state: false,
    })
  }

  return <Toast open={toastState} handleClose={handleCloseToast} />
}
