import { getDefaultRole } from 'app/utils/roles'
import CreateDataContext from './CreateDataContext'
import { Usuario } from 'app/inicio/administrador/usuarios/types/Usuario'
import { storage, STORAGE_KEYS } from 'app/utils/storage'

interface AuthState {
  session: boolean
  usuario: Usuario
  rolSeleccionado: string | null
}

const usuarioInitialState: Usuario = {
  id: 0,
  usuario: '',
  nombre: '',
  apellido: '',
  legajo: '',
  dni: '',
  email: '',
  roles: [],
  roles_examenes: {},
  created_at: new Date(),
  updated_at: new Date(),
}

const state: AuthState = {
  session: false,
  usuario: usuarioInitialState,
  rolSeleccionado: null,
}

type Action =
  | {
      type: 'setSession'
      payload: AuthState
    }
  | {
      type: 'updateSession'
      payload: AuthState
    }
  | {
      type: 'setSelectedRole'
      payload: string
    }

const reducer = (state: AuthState, action: Action): AuthState => {
  switch (action.type) {
    case 'setSession':
      return {
        ...state,
        ...action.payload,
      }
    case 'updateSession':
      return {
        ...state,
        ...action.payload,
      }
    case 'setSelectedRole':
      return {
        ...state,
        rolSeleccionado: action.payload,
      }
    default:
      return state
  }
}

const login = (dispatch: React.Dispatch<Action>) => (usuario: Usuario) => {
  const persisted =
    storage.session.get(STORAGE_KEYS.auth.selectedRole) ?? undefined
  const defaultRole = getDefaultRole(usuario.roles || [])
  const rolSeleccionado =
    persisted && (usuario.roles || []).includes(persisted)
      ? persisted
      : defaultRole

  dispatch({
    type: 'setSession',
    payload: {
      session: true,
      usuario,
      rolSeleccionado,
    },
  })
}

const logout = (dispatch: React.Dispatch<Action>) => () => {
  dispatch({
    type: 'updateSession',
    payload: {
      session: false,
      usuario: usuarioInitialState,
      rolSeleccionado: null,
    },
  })
}

const setSelectedRole = (dispatch: React.Dispatch<Action>) => (rol: string) => {
  storage.session.set(STORAGE_KEYS.auth.selectedRole, rol)
  dispatch({ type: 'setSelectedRole', payload: rol })
}

export const { Context, Provider } = CreateDataContext(
  reducer,
  {
    login,
    logout,
    setSelectedRole,
  },
  state,
)
