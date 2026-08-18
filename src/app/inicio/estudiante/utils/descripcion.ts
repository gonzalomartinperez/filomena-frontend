'use client'

import type { Pregunta } from 'app/inicio/administrador/preguntas/types/Pregunta'
import type { Caso } from 'app/inicio/administrador/casos/types/Caso'

/** Ordena preguntas del examen por `orden_relativo` (copia defensiva). */
export const sortExamQuestions = (list: Pregunta[]): Pregunta[] =>
  list.slice().sort((a, b) => (a.orden_relativo ?? 0) - (b.orden_relativo ?? 0))

/** Ordena casos por `orden_relativo` (copia defensiva). */
export const sortCases = (list: Caso[]): Caso[] =>
  list.slice().sort((a, b) => (a.orden_relativo ?? 0) - (b.orden_relativo ?? 0))

/**
 * Devuelve el stack de descripciones del caso hasta la pregunta actual (incluida).
 */
export const buildDescripcionAcumulada = (
  lista: Pregunta[],
  actual: Pregunta,
): string[] => {
  const ord = actual.orden_relativo ?? 0
  return lista
    .filter((q) => (q.orden_relativo ?? 0) <= ord)
    .map((q) => (q.descripcion ?? '').trim())
    .filter((d) => d.length > 0)
}
