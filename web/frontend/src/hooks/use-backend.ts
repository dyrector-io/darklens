import { TFunction } from 'i18next'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { NavigateFunction, useNavigate } from 'react-router-dom'
import { FormikSetErrorValue, defaultApiErrorHandler } from 'src/errors'
import { ROUTE_LOGIN, ROUTE_STATUS } from 'src/routes'

type HandleFetchOptions = {
  t: TFunction
  nav: NavigateFunction
  url: string
  request: RequestInit
  errorHandler: (res: Response) => Promise<void>

  rawResponse?: boolean
}

export type BackendFetch<TRes> = {
  ok: boolean
  data?: TRes
}

const handleFetch = <TRes>(opts: HandleFetchOptions) => {
  const { t, nav, url, request, errorHandler, rawResponse } = opts

  return new Promise<BackendFetch<TRes | Response>>(resolve => {
    try {
      fetch(url, request)
        .then(res => {
          if (res.ok) {
            if (rawResponse) {
              resolve({
                ok: true,
                data: res,
              })
              return
            }

            if (res.status === 204) {
              resolve({
                ok: true,
              })
              return
            }

            res.json().then(data =>
              resolve({
                ok: true,
                data,
              }),
            )
            return
          }

          if (res.status === 401) {
            nav(ROUTE_LOGIN)
            resolve({
              ok: false,
            })
            return
          }

          errorHandler(res)
          resolve({
            ok: false,
          })
        })
        .catch(() => {
          toast(t('oops'))
          nav(ROUTE_STATUS)

          resolve({
            ok: false,
          })
        })
    } catch (err) {
      if (err.status === 401) {
        nav(ROUTE_LOGIN)
        resolve({
          ok: false,
        })
        return
      }

      toast(t('oops'))
      nav(ROUTE_STATUS)

      resolve({
        ok: false,
      })
    }
  })
}

export const useBackendGet = (t?: TFunction) => {
  const { t: tError } = useTranslation('errors')
  const nav = useNavigate()

  const errorHandler = defaultApiErrorHandler(t ?? tError)

  return async <TRes>(url: string, setErrorValues?: FormikSetErrorValue): Promise<BackendFetch<TRes>> =>
    handleFetch({
      t: t ?? tError,
      nav,
      url,
      request: {
        method: 'GET',
      },
      errorHandler: res => errorHandler(res, setErrorValues),
    }) as Promise<BackendFetch<TRes>>
}

export const useBackendFetch = (t?: TFunction) => {
  const { t: tError } = useTranslation('errors')
  const nav = useNavigate()

  const errorHandler = defaultApiErrorHandler(t ?? tError)

  return async <TReq, TRes>(
    method: 'POST' | 'PUT' | 'PATCH',
    url: string,
    body?: TReq,
    setErrorValues?: FormikSetErrorValue,
  ): Promise<BackendFetch<TRes>> =>
    handleFetch({
      t: t ?? tError,
      nav,
      url,
      request: {
        method,
        headers: body
          ? {
              'Content-Type': 'application/json',
            }
          : undefined,
        body: body ? JSON.stringify(body) : null,
      },
      errorHandler: res => errorHandler(res, setErrorValues),
    }) as Promise<BackendFetch<TRes>>
}

export const useBackendDelete = (t?: TFunction) => {
  const { t: tError } = useTranslation('errors')
  const nav = useNavigate()

  const errorHandler = defaultApiErrorHandler(t ?? tError)

  return async <TReq>(url: string, body?: TReq): Promise<boolean> => {
    const res = await handleFetch({
      t: t ?? tError,
      nav,
      url,
      request: {
        method: 'DELETE',
        headers: body
          ? {
              'Content-Type': 'application/json',
            }
          : undefined,
        body: body ? JSON.stringify(body) : null,
      },
      errorHandler: it => errorHandler(it),
    })

    return res.ok
  }
}
