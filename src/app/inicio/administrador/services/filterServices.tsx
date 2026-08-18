import instance from 'api/AxiosInterceptor'

export function getExamenesAPI() {
  return instance.get(`/examenes/`)
}
