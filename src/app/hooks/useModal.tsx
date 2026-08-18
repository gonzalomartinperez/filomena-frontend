import { useContext } from 'react'
import { Context as ModalContext } from 'app/contexts/ModalContext'

const useModal = () => {
  return useContext(ModalContext)
}

export default useModal
