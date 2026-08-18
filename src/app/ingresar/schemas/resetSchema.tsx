import * as Yup from 'yup'

const resetSchema = Yup.object({
  password: Yup.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .required('Escribe tu nueva contraseña'),
  password_confirmation: Yup.string()
    .oneOf([Yup.ref('password')], 'Las contraseñas deben coincidir')
    .required('Repetir la contraseña'),
})

export default resetSchema
