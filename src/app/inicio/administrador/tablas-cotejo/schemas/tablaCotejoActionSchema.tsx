import * as Yup from 'yup'

const itemSchema = Yup.object({
  id: Yup.number().integer('ID inválido').positive('ID inválido').optional(),
  descripcion: Yup.string().required('La descripción es obligatoria'),
  valor: Yup.number()
    .required('El valor es obligatorio')
    .min(0.5, 'Mínimo 0.5')
    .max(10, 'Máximo 10'),
  pregunta_id: Yup.string().required('Falta la pregunta'),
})

const tablaCotejoActionSchema = Yup.object({
  caso: Yup.string().required('Debe seleccionar un caso'),
  secciones: Yup.array()
    .of(
      Yup.object({
        seccion_id: Yup.string().required('Falta la sección'),
        items: Yup.array().of(itemSchema).min(1, 'Debe haber al menos un ítem'),
      }),
    )
    .min(1, 'Debe haber al menos una sección'),
})

export type TablaCotejoValues = Yup.InferType<typeof tablaCotejoActionSchema>
export default tablaCotejoActionSchema
