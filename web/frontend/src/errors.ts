import toast, { ToastOptions } from 'react-hot-toast'
import { fromApiError } from './error-responses'
import { DyoErrorDto, WsErrorMessage } from './models'
import WebSocketClient from './websockets/websocket-client'
import { ROUTE_INDEX } from './routes'
import { TFunction } from 'i18next'
import { NavigateFunction } from 'react-router-dom'

export type DyoApiErrorHandler = (res: Response, setErrorValue?: FormikSetErrorValue) => Promise<void>

type Translation = {
  input?: string
  toastOptions?: ToastOptions
  toast: string
}

type FormikSetErrorValue = (field: string, message: string | undefined) => void

type Translator = (stringId: string, status: number, dto: DyoErrorDto) => Translation

type ApiError = {
  message: string
  property?: string
  value?: string
  error: string
}

export const defaultTranslator: (t: TFunction) => Translator = t => (stringId, status, dto) => {
  if (status < 500) {
    t(`errors.${stringId}`)
    const translation = t(`errors.${stringId}`, dto.description, dto)
    return {
      input: translation,
      toast: translation,
    }
  }
  return {
    toast: t('errors:oops'),
  }
}

export const apiErrorHandler =
  (translator: Translator) => async (res: Response, setErrorValue?: FormikSetErrorValue) => {
    const toaster = (message, options) => toast.error(message, options)

    const { status } = res
    let translation = null

    try {
      const apiError = (await res.json()) as ApiError
      const dyoError = fromApiError(status, apiError)

      translation = translator(dyoError.error, status, dyoError)

      if (setErrorValue && translation.input) {
        setErrorValue(dyoError.property, translation.input)
      }
    } catch (err) {
      console.error('Failed to handle api error', res.status, res.url)
      translation = translator(null, 500, null)
    }

    toaster(translation.toast, translation.toastOptions)
  }

export const defaultApiErrorHandler = (t: TFunction) => apiErrorHandler(defaultTranslator(t))

export const wsErrorHandler = (translator: Translator) => (message: WsErrorMessage) => {
  const toaster = text => toast.error(text)

  // TODO(@m8vago): get rid of DyoApiError's error property and use the status and 'property' fields instead
  const translation = translator(message.property, message.status, {
    error: '',
    description: message.message,
    property: message.property,
    value: message.value,
  })
  toaster(translation.toast)
}

export const defaultWsErrorHandler = (t: TFunction, router: NavigateFunction) => (msg: WsErrorMessage) => {
  const defaultErrorHandler = wsErrorHandler(defaultTranslator(t))
  if (msg.status === WebSocketClient.ERROR_UNAUTHORIZE) {
    router(ROUTE_INDEX)
    return
  }
  defaultErrorHandler(msg)
}
