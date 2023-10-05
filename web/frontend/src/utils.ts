import { FormikErrors, FormikHandlers, FormikState } from 'formik'
import toast from 'react-hot-toast'
import { Audit, DyoApiError, DyoErrorDto } from './models'
import { TFunction } from 'i18next'

export type AsyncVoidFunction = () => Promise<void>

export const isServerSide = () => typeof window === 'undefined'

// date
export const dateToUtcTime = (date: Date): number =>
  Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds(),
  )

export const utcNow = (): number => dateToUtcTime(new Date())

// TODO: singular time formats
export const timeAgo = (t: TFunction, seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  if (minutes < 1) {
    return t('common:secondsAgo', { seconds })
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 1) {
    return t('common:minutesAgo', { minutes })
  }

  const days = Math.floor(hours / 24)
  if (days < 1) {
    return t('common:hoursAgo', { hours })
  }

  return t('common:daysAgo', { days })
}

export const terminalDateFormat = (date: Date): string => {
  const numberFormat = {
    minimumIntegerDigits: 2,
    useGrouping: true,
  }

  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toLocaleString(undefined, numberFormat)
  const day = date.getDate().toLocaleString(undefined, numberFormat)
  const hours = date.getHours().toLocaleString(undefined, numberFormat)
  const minutes = date.getMinutes().toLocaleString(undefined, numberFormat)
  const seconds = date.getSeconds().toLocaleString(undefined, numberFormat)

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// TODO(@m8vago): check after react update if there is still a hydration error with narrow spaces
export const utcDateToLocale = (date: string) => new Date(date).toLocaleString().replace(/\u202f/g, ' ')

export const auditToLocaleDate = (audit: Audit) => utcDateToLocale(audit.updatedAt ?? audit.createdAt)

export const getUserDateFormat = (fallback: string) => {
  let dateFormat: string
  if (!isServerSide()) {
    dateFormat = new Intl.DateTimeFormat(window.navigator.language)
      .formatToParts(new Date(0))
      .map(o => {
        switch (o.type) {
          case 'day':
            return o.value.length > 1 ? 'dd' : 'd' // checking if there is a leading zero to single digits
          case 'month':
            return o.value.length > 1 ? 'MM' : 'M'
          case 'year':
            return 'yyyy'
          default: // separator character(s)
            return o.value
        }
      })
      .join('')
  }
  return dateFormat?.indexOf('yyyy') > -1 ? dateFormat : fallback // if the format is invalid, use fallback
}

export type FormikSetFieldValue = (
  field: string,
  value: any,
  shouldValidate?: boolean | undefined,
) => Promise<FormikErrors<any>> | Promise<void>

export type FormikProps<T> = FormikState<T> &
  FormikHandlers & {
    setFieldValue: FormikSetFieldValue
  }

export const writeToClipboard = async (t: TFunction, content: string) => {
  if (window.isSecureContext) {
    await navigator.clipboard.writeText(content)
    toast(t('common:copiedToClipboard'))
  } else {
    toast(t('errors:insecure'))
  }
}

export const getEndOfToday = () => {
  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)
  return endOfToday
}

export const getCookie = (name: string): string => {
  const cookieString = document.cookie
  const cookies = cookieString.split('; ')
  const keyValuePairs = cookies.map(it => {
    const split = it.split('=')
    if (split.length === 1) {
      return [split[0], '']
    }
    return split
  })

  const findCookie = keyValuePairs.find(([cookieName, _]) => cookieName === name)
  return findCookie?.[1] ?? null
}

export const fetcher = (init?: RequestInit) => {
  if (init && init.method in ['POST', 'PUT'] && !init.headers['Content-Type']) {
    init.headers['Content-Type'] = 'application/json'
  }
  return async url => {
    const res = await fetch(url, init)
    if (!res.ok) {
      const dto: DyoErrorDto = (await res.json()) ?? {
        error: 'UNKNOWN',
        description: 'Unknown error',
      }
      const error: DyoApiError = {
        ...dto,
        status: res.status,
      }
      throw error
    }
    return res.json()
  }
}

export const configuredFetcher = fetcher()
