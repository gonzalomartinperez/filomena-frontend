import instance from 'api/AxiosInterceptor'

export function getPseudonimosAPI(examen: number) {
  return instance.get('/pseudonimos', {
    params: { examen },
  })
}
