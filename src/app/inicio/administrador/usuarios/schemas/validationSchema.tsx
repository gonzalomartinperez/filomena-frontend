import * as Yup from 'yup'

const validationSchema = Yup.object({
  usuario: Yup.string().required('El nombre de usuario es obligatorio'),
  nombre: Yup.string().required('El nombre es obligatorio'),
  apellido: Yup.string().required('El apellido es obligatorio'),
  dni: Yup.string()
    .matches(/^[0-9]{7,8}$/, 'DNI inválido')
    .required('El DNI es obligatorio'),
  legajo: Yup.string()
    .matches(/^[0-9]{1,6}$/, 'Legajo inválido')
    .required('El legajo es obligatorio'),
  email: Yup.string()
    .email('Email inválido')
    .required('El email es obligatorio'),
  roles: Yup.array()
    .of(Yup.string().required())
    .min(1, 'Seleccioná al menos un rol'),
})

export default validationSchema
