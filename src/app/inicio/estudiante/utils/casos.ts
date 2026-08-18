import type { Caso } from 'app/inicio/administrador/casos/types/Caso'

/** Mapa rápido (idCaso -> orden_relativo) */
export const buildCaseOrderMap = (list: Caso[]) => {
  const m = new Map<number, number>()
  list.forEach((c) => m.set(c.id, c.orden_relativo ?? 0))
  return m
}
