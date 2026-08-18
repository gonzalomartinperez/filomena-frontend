import * as Yup from 'yup'

const casoActionSchema = Yup.object({
  evaluador: Yup.string(),
  titulo: Yup.string().required('El titulo es obligatorio'),
  orden_relativo: Yup.number()
    .required('El orden relativo es obligatorio')
    .min(1, 'El orden relativo mínimo es 1'),
})

export default casoActionSchema
