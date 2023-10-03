import { fromApiError } from 'src/error-responses'

export const fetchBackend = async (url: string, init?: RequestInit) => {
  const res = await fetch(`${url}`, {
    ...(init ?? {}),
    headers: {
      ...(init?.headers ?? {}),
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

export const getBackend = async <Res>(url: string): Promise<Res> => {
  const res = await fetchBackend(url)
  const body = await res.json()

  return body
}

export const getBackendFromContext = <Res>(url: string) => getBackend<Res>(url)

export const postBackendFromContext = async <Res>(url: string): Promise<Res> => {
  const res = await fetchBackend(url, {
    method: 'POST',
  })

  return await res.json()
}
