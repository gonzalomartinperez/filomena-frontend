import * as Yup from 'yup'

const forgotSchema = Yup.object({
  email: Yup.string()
    .email('El correo no es válido')
    .required('El correo es requerido'),
})

export default forgotSchema
