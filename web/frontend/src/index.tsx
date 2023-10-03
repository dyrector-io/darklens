import React from 'react'
import ReactDOM from 'react-dom/client'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LensApp from './pages/app'
import lang from './locales'
import './index.css'

// TODO(@robot9706): Use i18next-backend
i18n.use(initReactI18next).init({
  resources: lang,
  defaultNS: 'common',
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <LensApp />,
)
