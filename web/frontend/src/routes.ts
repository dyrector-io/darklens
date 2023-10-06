/* eslint-disable no-underscore-dangle */

import { PaginationQuery } from './models'

// Routes:
export const ROUTE_DOCS = 'https://docs.dyrector.io' // TODO(@robot9706): Replace with GitHub readme

export const ROUTE_INDEX = '/'
export const ROUTE_STATUS = '/status'
export const ROUTE_404 = '/404'
export const ROUTE_NODES = '/nodes'
export const ROUTE_LOGIN = '/login'

export const API_ROOT = '/api'
export const API_NODES = `${API_ROOT}/nodes`
export const API_HEALTH = `${API_ROOT}/health`

export const API_AUTH = `${API_ROOT}/auth`
export const API_AUTH_LOGIN = `${API_AUTH}/login`
export const API_AUTH_LOGOUT = `${API_AUTH}/logout`

export const WS_NODES = '/nodes'

export type AnchorUrlParams = {
  anchor?: string
}

export const appendUrlParams = <T extends AnchorUrlParams>(url: string, params: T): string => {
  let result = url
  const paramMap: Map<string, any> = new Map()
  const anchor = params?.anchor

  if (params) {
    delete params.anchor

    Object.entries(params)
      .filter(([_, value]) => value)
      .map(entry => {
        const [key, value] = entry
        if (key) {
          paramMap.set(key, value)
        }

        return entry
      })
  }

  if (paramMap.size > 0) {
    const entries = Array.from(paramMap.entries())
    const [firstKey, firstValue] = entries[0]
    result = `${result}?${firstKey}=${firstValue}`

    if (entries.length > 1) {
      const rest = entries.slice(1)

      result = rest.reduce((prev, current) => {
        const [key, value] = current
        return `${prev}&${key}=${value}`
      }, result)
    }
  }

  return anchor ? `${result}#${anchor}` : result
}

const urlQuery = (url: string, query: object) => {
  const params = Object.entries(query)
    .map(it => {
      const [key, value] = it

      if (value === undefined || value === null) {
        return null
      }

      return `${key}=${value}`
    })
    .filter(it => it !== null)

  if (params.length < 1) {
    return url
  }

  url = `${url}?${params[0]}`

  if (params.length > 1) {
    url = params.slice(1).reduce((prev, it) => `${prev}&${it}`, url)
  }

  return url
}

export type AuditLogQuery = PaginationQuery & {
  filter?: string
}

// node
export type ContainerLogParams = {
  prefix?: string
  name?: string
}

export const nodeContainerLogUrl = (id: string, params: ContainerLogParams) =>
  appendUrlParams(`/nodes/${id}/log`, {
    ...params,
    anchor: null,
  })

export const nodeContainerInspectUrl = (id: string, params: ContainerLogParams) =>
  appendUrlParams(`/nodes/${id}/inspect`, {
    ...params,
    anchor: null,
  })

export const nodeDetailsUrl = (id: string) => `/nodes/${id}`

export const nodeApiDetailsUrl = (id: string) => `${API_NODES}/${id}`

export const nodeApiScriptUrl = (id: string) => `${nodeApiDetailsUrl(id)}/script`

export const nodeApiAuditUrl = (id: string, query: AuditLogQuery) => urlQuery(`${nodeApiDetailsUrl(id)}/audit`, query)

export const nodeApiTokenUrl = (id: string) => `${nodeApiDetailsUrl(id)}/token`

export const nodeApiInspectUrl = (id: string, prefix?: string, name?: string) =>
  prefix
    ? `${nodeApiDetailsUrl(id)}/${prefix}/containers/${name}/inspect`
    : `${nodeApiDetailsUrl(id)}/containers/${name}/inspect`

export const nodeWsDetailsUrl = (id: string) => `${WS_NODES}/${id}`
