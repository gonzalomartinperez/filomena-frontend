import CreateDataContext from './CreateDataContext'

type ModalType =
  | 'confirmacion'
  | 'filtrado-examen'
  | 'confirmacion-alerta'
  | 'gestograma'
  | 'mochila-archivos'
  | 'change-password'
  | 'force-change-password'

export interface ModalState {
  render?: boolean
  type: ModalType
  title?: string
  message?: string
  button?: {
    onClick: (payload?: unknown) => void
  }
}

const state: ModalState = {
  render: false,
  type: 'confirmacion',
  title: '',
  message: '',
  button: {
    onClick: () => {},
  },
}

type Action =
  | {
      type: 'openModal'
      payload: Partial<ModalState>
    }
  | {
      type: 'closeModal'
    }

const reducer = (state: ModalState, action: Action): ModalState => {
  switch (action.type) {
    case 'openModal':
      return {
        ...state,
        ...action.payload,
      }
    case 'closeModal':
      return {
        ...state,
        render: false,
      }
    default:
      return state
  }
}

const openModal =
  (dispatch: React.Dispatch<Action>) => (modalState: ModalState) => {
    dispatch({
      type: 'openModal',
      payload: {
        render: true,
        ...modalState,
      },
    })
  }

const closeModal = (dispatch: React.Dispatch<Action>) => () => {
  dispatch({
    type: 'closeModal',
  })
}

export const { Context, Provider } = CreateDataContext(
  reducer,
  {
    openModal,
    closeModal,
  },
  state,
)
