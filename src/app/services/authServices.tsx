import instance from 'api/AxiosInterceptor'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''
const BACKEND_ROOT = API_URL.replace(/\/api\/?$/, '')

export async function loginAPI(dni: string, password: string) {
  await instance.get('/sanctum/csrf-cookie', {
    baseURL: BACKEND_ROOT,
    withCredentials: true,
  })

  return instance.post('/login', { dni, password })
}

export function getAuthenticatedUserAPI() {
  return instance.get('/usuarios/yo')
}

export function logoutAPI() {
  return instance.post('/logout')
}

export function forgotPasswordAPI(email: string) {
  return instance.post('/forgot-password', { email })
}

export function resetPasswordAPI(payload: {
  token: string
  email: string
  password: string
  password_confirmation: string
}) {
  return instance.post('/reset-password', payload)
}

export function changePasswordAPI(payload: {
  password: string
  new_password: string
  password_confirmation: string
}) {
  return instance.put('/change-password', payload)
}
