'use client'

import type { TablaCotejo } from 'app/inicio/administrador/tablas-cotejo/types/TablaCotejo'
import type { Seccion } from 'app/inicio/administrador/secciones/types/Seccion'
import { getTablaCotejoAPI } from 'app/inicio/administrador/tablas-cotejo/services/tablasCotejoServices'

/**
 * Cache en memoria (por tab) para estructura estática de Defensas.
 * - Tablas de cotejo (show) por ID.
 * - Nombres de secciones por ID.
 */
const tablasById = new Map<number, TablaCotejo>()
const seccionesById = new Map<number, Seccion>()

export function primeSecciones(list: Seccion[]) {
  list.forEach((s) => seccionesById.set(Number(s.id), s))
}

export function getSeccionNombre(id: number): string {
  const s = seccionesById.get(Number(id))
  return s?.nombre ?? `Sección ${id}`
}

export function primeTablas(list: TablaCotejo[]) {
  list.forEach((t) => tablasById.set(Number(t.id), t))
}

export async function getOrFetchTablas(ids: number[]): Promise<TablaCotejo[]> {
  const faltantes: number[] = []
  const out: TablaCotejo[] = []

  ids.forEach((id) => {
    const t = tablasById.get(Number(id))
    if (t) out.push(t)
    else faltantes.push(Number(id))
  })

  if (faltantes.length) {
    const shows = await Promise.all(
      faltantes.map((id) => getTablaCotejoAPI(id)),
    )
    const nuevos = shows.map((r) => r.data?.data as TablaCotejo)
    primeTablas(nuevos)
    out.push(...nuevos)
  }

  // preservar el orden solicitado
  const order = new Map<number, number>()
  ids.forEach((id, i) => order.set(Number(id), i))
  return out
    .slice()
    .sort(
      (a, b) => (order.get(Number(a.id)) ?? 0) - (order.get(Number(b.id)) ?? 0),
    )
}
