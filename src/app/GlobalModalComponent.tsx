import Modal from './components/modal/ModalComponent'
import useModal from './hooks/useModal'

export default function GlobalModal() {
  const {
    state,
    actions: { closeModal },
  } = useModal()

  const handleCloseModal = () => {
    closeModal()
  }

  return <Modal open={state} handleClose={handleCloseModal} />
}
