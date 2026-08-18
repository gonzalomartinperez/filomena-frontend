import * as Yup from 'yup'

export type TopesPorSeccion = Record<number, number>

export function buildDefensasSchema(topes: TopesPorSeccion) {
  const shape: Record<string, Yup.NumberSchema<number | undefined>> = {}

  Object.entries(topes).forEach(([sid, tope]) => {
    shape[sid] = Yup.number()
      .typeError('Número inválido')
      .min(0, 'No puede ser negativo')
      .max(tope, `No puede superar el tope (${tope})`)
      .test('step-05', 'Usá valores múltiplos de 0.5', (val) => {
        if (val == null) return true
        return Math.abs(val * 2 - Math.round(val * 2)) < 1e-9
      })
      .required('Requerido')
  })

  return Yup.object().shape(shape)
}
