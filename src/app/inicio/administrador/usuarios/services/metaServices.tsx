import instance from 'api/AxiosInterceptor'

export function getRoles() {
  return instance.get<{
    status: number
    message: string
    data: string[]
  }>('/meta/roles')
}
