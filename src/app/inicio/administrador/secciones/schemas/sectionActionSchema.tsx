import * as Yup from 'yup'

const sectionActionSchema = Yup.object({
  nombre: Yup.string().required('El nombre es obligatorio'),
  orden_relativo: Yup.number()
    .transform((value, original) => {
      if (typeof original === 'string') {
        const v = original.replace(',', '.').trim()
        if (v === '') return undefined
        const n = Number(v)
        return Number.isNaN(n) ? NaN : n
      }
      return value
    })
    .typeError('El orden relativo debe ser un número válido')
    .required('El orden relativo es obligatorio')
    .min(1, 'El orden relativo mínimo es 1'),
})

export default sectionActionSchema
