import { fromApiError } from '@app/error-responses'
import http from 'http'
import { NextPageContext } from 'next'

export const fetchBackend = async (
  requestOrCookie: http.IncomingMessage | string | null,
  url: string,
  init?: RequestInit,
) => {
  const uiUrl = process.env.UI_URL

  const cookie: string = requestOrCookie
    ? typeof requestOrCookie === 'string'
      ? requestOrCookie
      : requestOrCookie.headers.cookie
    : null

  const res = await fetch(`${uiUrl}${url}`, {
    ...(init ?? {}),
    headers: {
      ...(init?.headers ?? {}),
      cookie,
    },
  })

  if (!res.ok) {
    let body: any = null
    try {
      body = await res.json()
    } catch {
      console.error('[ERROR]: Fetch failed to parse error body of url', url)
    }

    const apiError = fromApiError(res.status, body ?? {})
    throw apiError
  }

  return res
}

export const getBackend = async <Res>(req: http.IncomingMessage, url: string): Promise<Res> => {
  const res = await fetchBackend(req, url)
  const body = await res.json()

  return body
}

export const getBackendFromContext = <Res>(context: NextPageContext, url: string) => getBackend<Res>(context.req, url)

export const postBackendFromContext = async <Res>(context: NextPageContext, url: string): Promise<Res> => {
  const res = await fetchBackend(context.req, url, {
    method: 'POST',
  })

  return await res.json()
}
