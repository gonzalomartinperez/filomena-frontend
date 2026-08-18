'use client'

import { evaluadorApi } from './evaluadorServices'
import { Seccion } from 'app/inicio/administrador/secciones/types/Seccion'
import {
  TablaCotejo,
  Item,
} from 'app/inicio/administrador/tablas-cotejo/types/TablaCotejo'
import { NotaItem, RespuestaEstudiante } from '../types/modelos'

export type GrupoItems = { seccion: Seccion; items: Item[] }

const keyPregunta = (casoId: number, preguntaId: number) =>
  `${casoId}:${preguntaId}`
const keyAlumno = (preguntaId: number, pseudonimo: string) =>
  `${preguntaId}|${pseudonimo}`

const seccionesCache = new Map<number, Promise<Seccion[]>>()
const gruposCache = new Map<string, Promise<GrupoItems[]>>()
const respuestaCache = new Map<string, Promise<string>>()
const correccionesCache = new Map<
  string,
  Promise<Record<number, boolean | null>>
>()

export const invalidatePregunta = (casoId: number, preguntaId: number) => {
  gruposCache.delete(keyPregunta(casoId, preguntaId))
}

export const invalidateSecciones = (examenId: number) => {
  seccionesCache.delete(examenId)
}

export const invalidateAlumnoPregunta = (
  preguntaId: number,
  pseudonimo: string,
) => {
  const k = keyAlumno(preguntaId, pseudonimo)
  respuestaCache.delete(k)
  correccionesCache.delete(k)
}

export const preloadGrupos = (
  examenId: number,
  casoId: number,
  preguntaId: number,
) => {
  void getGrupos(examenId, casoId, preguntaId)
}

export const getSecciones = (examenId: number): Promise<Seccion[]> => {
  const existing = seccionesCache.get(examenId)
  if (existing) return existing
  const p = evaluadorApi
    .secciones(examenId)
    .then((r) =>
      (r.data.data as Seccion[])
        .slice()
        .sort((a, b) => a.orden_relativo - b.orden_relativo),
    )
  seccionesCache.set(examenId, p)
  return p
}

export const getGrupos = async (
  examenId: number,
  casoId: number,
  preguntaId: number,
): Promise<GrupoItems[]> => {
  const k = keyPregunta(casoId, preguntaId)
  const existing = gruposCache.get(k)
  if (existing) return existing

  const p = (async () => {
    // 1) Tablas para esta (caso, pregunta)
    const tablas = (await evaluadorApi.tablasCotejo(casoId, preguntaId)).data
      .data as TablaCotejo[]

    // 2) Ítems de cada tabla (en paralelo) y mapeo por tabla
    const tablasConItems = await Promise.all(
      (tablas || []).map((t) => evaluadorApi.tablaCotejoById(t.id, preguntaId)),
    )

    const itemsPorTabla: Record<number, Item[]> = {}
    tablasConItems.forEach(({ data }) => {
      const t = data.data as TablaCotejo
      itemsPorTabla[t.id] = t.items || []
    })

    // 3) Secciones del examen + proyección en grupos ordenados
    const secciones = await getSecciones(examenId)

    const grupos: GrupoItems[] = []
    secciones.forEach((s) => {
      const tablasDeSeccion = (tablas || []).filter(
        (t) => t.seccion_id === s.id,
      )
      const items = tablasDeSeccion.flatMap((t) => itemsPorTabla[t.id] || [])
      if (items.length > 0) grupos.push({ seccion: s, items })
    })

    return grupos
  })()

  gruposCache.set(k, p)
  return p
}

export const getRespuestaAlumno = (
  preguntaId: number,
  pseudonimo: string,
): Promise<string> => {
  const k = keyAlumno(preguntaId, pseudonimo)
  const existing = respuestaCache.get(k)
  if (existing) return existing
  const p = evaluadorApi.respuestas(preguntaId, pseudonimo).then((resp) => {
    const r = (resp.data.data as RespuestaEstudiante[]).find(
      (x) => x.pregunta_id === preguntaId,
    )
    return r?.respuesta ?? ''
  })
  respuestaCache.set(k, p)
  return p
}

export const getCorreccionesAlumno = (
  preguntaId: number,
  pseudonimo: string,
): Promise<Record<number, boolean | null>> => {
  const k = keyAlumno(preguntaId, pseudonimo)
  const existing = correccionesCache.get(k)
  if (existing) return existing
  const p = evaluadorApi
    .correccionesByPregunta(preguntaId, pseudonimo)
    .then((notasRes) =>
      (notasRes.data.data as NotaItem[]).reduce(
        (acc, n) => ({
          ...acc,
          [n.item_id]: n.aprobado === null ? null : Boolean(n.aprobado),
        }),
        {} as Record<number, boolean | null>,
      ),
    )
  correccionesCache.set(k, p)
  return p
}

export const setCorreccionesAlumno = (
  preguntaId: number,
  pseudonimo: string,
  values: Record<number, boolean | null>,
) => {
  const k = keyAlumno(preguntaId, pseudonimo)
  correccionesCache.set(k, Promise.resolve({ ...values }))
}
