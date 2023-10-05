import yup from './yup'

// eslint-disable-next-line import/prefer-default-export
export const loginSchema = yup.object().shape({
  name: yup.string().required().label('login:name'),
  password: yup.string().required().label('login:password'),
})
