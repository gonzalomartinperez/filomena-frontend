import * as Yup from 'yup'

const loginSchema = Yup.object({
  dni: Yup.string()
    .matches(/^[0-9]{7,8}$/, 'DNI inválido')
    .required('El DNI es obligatorio'),
  password: Yup.string()
    .required('La contraseña es obligatoria')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export default loginSchema
