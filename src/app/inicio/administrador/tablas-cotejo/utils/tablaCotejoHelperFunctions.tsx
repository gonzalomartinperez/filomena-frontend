import { TablaCotejo } from '../types/TablaCotejo'

export type CasoRow = { id: number; caso_id: number; tablas: TablaCotejo[] }

export function agruparPorCaso(tablas: TablaCotejo[]): CasoRow[] {
  const map = new Map<number, TablaCotejo[]>()
  tablas.forEach((t) => {
    const cid = Number(t.caso_id)
    if (!map.has(cid)) map.set(cid, [])
    map.get(cid)!.push(t)
  })
  return Array.from(map.entries()).map(([caso_id, tablas]) => ({
    id: caso_id,
    caso_id,
    tablas,
  }))
}
