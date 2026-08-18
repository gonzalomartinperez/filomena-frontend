import * as Yup from 'yup'

const changePasswordSchema = Yup.object({
  password: Yup.string().required('La contraseña actual es obligatoria'),
  new_password: Yup.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .notOneOf(
      [Yup.ref('password')],
      'La nueva contraseña debe ser distinta a la actual',
    )
    .required('Escribe tu nueva contraseña'),
  password_confirmation: Yup.string()
    .oneOf([Yup.ref('new_password')], 'Las contraseñas deben coincidir')
    .required('Repetir la contraseña'),
})

export default changePasswordSchema
