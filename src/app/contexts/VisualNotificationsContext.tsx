'use client'

import React from 'react'
import generateId from 'app/utils/generateId'
import CreateDataContext from './CreateDataContext'

export interface ToastState {
  state?: boolean
  severity?: 'success' | 'warning' | 'error' | 'info'
  message?: string
  autoHideDuration?: number
  button?: {
    label: string
    onClick: () => void
  }
}

interface VisualNotificationsState {
  toastState: ToastState
  loadingInstances: LoadingInstance[]
}

interface LoadingInstance {
  id: string
  label: string
}

const initialState: VisualNotificationsState = {
  toastState: {
    state: false,
    severity: 'success',
    message: '',
    autoHideDuration: 3000,
    button: {
      label: '',
      onClick: () => {},
    },
  },
  loadingInstances: [],
}

type Action =
  | { type: 'setToastState'; payload: ToastState }
  | { type: 'updateToastState'; payload: ToastState }
  | { type: 'startLoading'; payload: LoadingInstance }
  | { type: 'stopLoading'; payload: string }

const reducer = (
  state: VisualNotificationsState,
  action: Action,
): VisualNotificationsState => {
  switch (action.type) {
    case 'setToastState':
      return { ...state, toastState: action.payload }
    case 'updateToastState':
      return {
        ...state,
        toastState: { ...state.toastState, ...action.payload },
      }
    case 'startLoading':
      return {
        ...state,
        loadingInstances: [...state.loadingInstances, action.payload],
      }
    case 'stopLoading':
      return {
        ...state,
        loadingInstances: state.loadingInstances.filter(
          (i) => i.id !== action.payload,
        ),
      }
    default:
      return state
  }
}

const openToast =
  (dispatch: React.Dispatch<Action>) => (toastState: ToastState) => {
    dispatch({ type: 'setToastState', payload: { state: true, ...toastState } })
  }

const closeToast =
  (dispatch: React.Dispatch<Action>) => (toastState: ToastState) => {
    dispatch({
      type: 'updateToastState',
      payload: { state: false, ...toastState },
    })
  }

const startLoading = (dispatch: React.Dispatch<Action>) => (label: string) => {
  const id = generateId()
  dispatch({ type: 'startLoading', payload: { id, label } })
  return id
}

const stopLoading = (dispatch: React.Dispatch<Action>) => (id: string) => {
  dispatch({ type: 'stopLoading', payload: id })
}

export const { Context, Provider } = CreateDataContext(
  reducer,
  { openToast, closeToast, startLoading, stopLoading },
  initialState,
)
