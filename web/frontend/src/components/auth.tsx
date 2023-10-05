import React, { useContext, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import LoadingIndicator from 'src/elements/loading-indicator'
import { API_AUTH, ROUTE_INDEX, ROUTE_LOGIN } from 'src/routes'
import { getCookie } from 'src/utils'

interface AuthContextProps {
  hasAuth: boolean
  regRequired: boolean

  registered: () => void
}

export const AuthContext = React.createContext<AuthContextProps>({
  hasAuth: false,
  regRequired: false,
  registered: null,
})

export const ProtectedRoute = (props: React.PropsWithChildren<{}>) => {
  const { children } = props

  const authContext = useContext(AuthContext)
  if (authContext.hasAuth) {
    const cookie = getCookie('auth')
    if (!cookie) {
      return <Navigate to={ROUTE_LOGIN} />
    }
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>
}

export const AuthOnlyRoute = (props: React.PropsWithChildren<{}>) => {
  const { children } = props

  const authContext = useContext(AuthContext)
  if (!authContext.hasAuth) {
    return <Navigate to={ROUTE_INDEX} />
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>
}

export const AuthWrapper = (props: React.PropsWithChildren<{}>) => {
  const { children } = props

  const [authContext, setAuthContext] = useState<AuthContextProps | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(API_AUTH)
        setAuthContext({
          hasAuth: res.status !== 404,
          regRequired: res.status === 410,
          registered: () =>
            setAuthContext(it => ({
              ...it,
              regRequired: false,
              registered: null,
            })),
        })
      } catch (err) {
        console.error(err)
      }
    }
    fetchData()
  }, [])

  if (authContext === null) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <LoadingIndicator size="xl" />
      </div>
    )
  }

  return <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>
}
