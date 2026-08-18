/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useReducer,
  createContext,
  ReactNode,
  Dispatch,
  JSX,
} from 'react'

// Tipo para las funciones que manejan el dispatch
type BoundActionsType = Record<string, (...args: any[]) => any>

// Creador de acción tipada
type ActionCreator<ActionType, Func extends (...args: any[]) => any> = (
  dispatch: Dispatch<ActionType>,
) => Func

// Objeto con las acciones tipadas
type ActionsObject<ActionType, T extends BoundActionsType> = {
  [K in keyof T]: ActionCreator<ActionType, T[K]>
}

// Tipo para la función que crea el contexto
type CreateDataContextType<
  StateType,
  ActionType,
  T extends BoundActionsType,
> = {
  Context: React.Context<{
    state: StateType
    dispatch: Dispatch<ActionType>
    actions: T
  }>
  Provider: ({ children }: { children: ReactNode }) => JSX.Element
}

const CreateDataContext = <StateType, ActionType, T extends BoundActionsType>(
  reducer: React.Reducer<StateType, ActionType>,
  actions: ActionsObject<ActionType, T>,
  initialState: StateType,
): CreateDataContextType<StateType, ActionType, T> => {
  const Context = createContext<{
    state: StateType
    dispatch: Dispatch<ActionType>
    actions: T
  }>({
    state: initialState,
    dispatch: () => null,
    actions: {} as T,
  })

  const Provider = ({ children }: { children: ReactNode }): JSX.Element => {
    const [state, dispatch] = useReducer(reducer, initialState)

    // Vincular las acciones al dispatch
    const boundActions = {} as T
    for (const key in actions) {
      boundActions[key] = actions[key](dispatch) as T[typeof key]
    }

    return (
      <Context.Provider value={{ state, dispatch, actions: boundActions }}>
        {children}
      </Context.Provider>
    )
  }

  return { Context, Provider }
}

export default CreateDataContext
