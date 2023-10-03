import { defaultWsErrorHandler } from 'src/errors'
import { isServerSide } from 'src/utils'
import WebSocketClient from 'src/websockets/websocket-client'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
// import { useNavigate } from 'react-router-dom'

interface WebSocketContextInterface {
  client: WebSocketClient
}

export const WebSocketContext = React.createContext<WebSocketContextInterface>({ client: null })

export const WebSocketProvider = (props: React.PropsWithChildren<{}>) => {
  const { children } = props

  const { t } = useTranslation('common')
  // const nav = useNavigate()

  const [wsClient] = useState(() => {
    if (isServerSide()) {
      return null
    }

    const client = new WebSocketClient()

    const wsErrorHandler = defaultWsErrorHandler(t, null as any)
    client.setErrorHandler(wsErrorHandler)

    return client
  })

  // eslint-disable-next-line react/jsx-no-constructed-context-values
  return <WebSocketContext.Provider value={{ client: wsClient }}>{children}</WebSocketContext.Provider>
}
