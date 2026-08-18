import Carga from './components/carga/CargaComponent'
import useVisualNotifications from './hooks/useVisualNotifications'

export default function GlobalLoading() {
  const {
    state: { loadingInstances },
  } = useVisualNotifications()

  return <Carga loadingInstances={loadingInstances} />
}
