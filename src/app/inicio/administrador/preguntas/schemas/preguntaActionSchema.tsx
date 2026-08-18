import * as Yup from 'yup'

const preguntaActionSchema = Yup.object({
  caso: Yup.string(),
  descripcion: Yup.string().required('La descripción es obligatoria'),
  consigna: Yup.string(),
  orden_relativo: Yup.number()
    .required('El orden relativo es obligatorio')
    .min(1, 'El orden relativo mínimo es 1'),
})

export default preguntaActionSchema
