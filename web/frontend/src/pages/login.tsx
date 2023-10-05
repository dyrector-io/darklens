import { useTranslation } from 'react-i18next'
import { SingleFormLayout } from 'src/components/layout'
import DyoButton from 'src/elements/dyo-button'
import { DyoCard } from 'src/elements/dyo-card'
import DyoForm from 'src/elements/dyo-form'
import { DyoInput } from 'src/elements/dyo-input'
import useDyoFormik from 'src/hooks/use-dyo-formik'
import logo from 'src/assets/darklens_logo.svg'
import { loginSchema } from 'src/validations'
import { Login } from 'src/models'
import { API_AUTH_LOGIN, ROUTE_INDEX } from 'src/routes'
import { useNavigate } from 'react-router-dom'
import { useContext, useState } from 'react'
import DyoMessage from 'src/elements/dyo-message'
import { DyoHeading } from 'src/elements/dyo-heading'
import { AuthContext } from 'src/components/auth'
import { DyoLabel } from 'src/elements/dyo-label'

const LoginPage = () => {
  const { t } = useTranslation('login')
  const nav = useNavigate()
  const auth = useContext(AuthContext)

  const [invalid, setInvalid] = useState<boolean>(false)

  const formik = useDyoFormik({
    validationSchema: loginSchema,
    t,
    initialValues: {
      name: '',
      password: '',
    },
    onSubmit: async values => {
      setInvalid(false)

      const data: Login = {
        ...values,
      }

      const res = await fetch(API_AUTH_LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (res.ok || res.status === 404) {
        if (auth.regRequired) {
          auth.registered()
        }
        nav(ROUTE_INDEX)
      } else {
        setInvalid(true)
      }
    },
  })

  return (
    <SingleFormLayout title={t(auth.regRequired ? 'register' : 'logIn')}>
      <img src={logo} alt="" className="w-80" />

      <DyoCard className="text-bright p-8 mt-4 max-w-sm">
        <DyoHeading className="text-lens-bright font-extrabold text-3xl text-center mb-4">
          {t(auth.regRequired ? 'register' : 'logIn')}
        </DyoHeading>
        {auth.regRequired && (
          <div className="text-center mb-4">
            <DyoLabel className="whitespace-normal">{t('registerHint')}</DyoLabel>
          </div>
        )}

        <DyoForm className="flex flex-col" onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
          <DyoInput
            label={t('name')}
            labelClassName="mb-2.5"
            name="name"
            type="name"
            onChange={formik.handleChange}
            value={formik.values.name}
            message={formik.errors.name}
          />

          <DyoInput
            label={t('password')}
            name="password"
            type="password"
            onChange={formik.handleChange}
            value={formik.values.password}
            message={formik.errors.password}
          />

          {invalid && <DyoMessage className="mt-4 text-center" message={t('invalidCredentials')} messageType="error" />}

          <DyoButton className="mt-8" type="submit">
            {t(auth.regRequired ? 'register' : 'logIn')}
          </DyoButton>
        </DyoForm>
      </DyoCard>
    </SingleFormLayout>
  )
}

export default LoginPage
