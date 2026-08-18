import * as Yup from 'yup'

const CODIGO_REGEX = /^[A-Z0-9_-]+$/

const examActionSchema = Yup.object({
  nombre: Yup.string().required('El nombre es obligatorio'),
  codigo: Yup.string()
    .required(
      'El código es requerido. Solo pueden ser letras en MAYÚSCULAS, números, guion (-) y guion bajo (_), sin espacios ni acentos.',
    )
    .matches(
      CODIGO_REGEX,
      'Solo pueden ser letras en MAYÚSCULAS, números, guion (-) y guion bajo (_), sin espacios ni acentos.',
    ),
  fecha: Yup.string()
    .required('La fecha es obligatoria')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Formato inválido (YYYY-MM-DD)'),
  descargable: Yup.boolean(),
  retrocedible: Yup.boolean(),
})

export default examActionSchema
