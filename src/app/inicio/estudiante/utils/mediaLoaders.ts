import type { Pregunta } from 'app/inicio/administrador/preguntas/types/Pregunta'
import type { ApiFile } from 'app/inicio/administrador/mochila-carga/types/ApiFile'
import { estudianteApi } from '../services/estudianteServices'

/**
 * Obtiene imágenes de una pregunta con cache local en memoria.
 */
async function fetchImagenesPregunta(
  preguntaId: number,
  cache: Map<number, ApiFile[]>,
): Promise<ApiFile[]> {
  const hit = cache.get(preguntaId)
  if (hit) return hit
  const res = await estudianteApi.imagenesPregunta(preguntaId)
  const files = (res?.data?.data ?? []) as ApiFile[]
  cache.set(preguntaId, files)
  return files
}

/**
 * Devuelve un arreglo por posición (pregunta1..preguntaN) con sus imágenes.
 * Útil para renderizar: [desc1 - imgs1] | [desc2 - imgs2] | ...
 */
export async function cargarImagenesPorPregunta(
  listaCaso: Pregunta[],
  hastaOrden: number,
  cache: Map<number, ApiFile[]>,
): Promise<ApiFile[][]> {
  const incluidas = listaCaso.filter(
    (q) => (q.orden_relativo ?? 0) <= (hastaOrden ?? 0),
  )
  const res: ApiFile[][] = []
  for (const q of incluidas) {
    const imgs = await fetchImagenesPregunta(q.id, cache)
    res.push(imgs)
  }
  return res
}

/**
 * Compat: mismas imágenes pero en una sola lista aplanada.
 */
export async function cargarImagenesAcumuladas(
  listaCaso: Pregunta[],
  hastaOrden: number,
  cache: Map<number, ApiFile[]>,
): Promise<ApiFile[]> {
  const porPregunta = await cargarImagenesPorPregunta(
    listaCaso,
    hastaOrden,
    cache,
  )
  return porPregunta.flat()
}
