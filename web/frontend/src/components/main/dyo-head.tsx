import useTranslation from 'next-translate/useTranslation'
import Head from 'next/head'

const DyoHead = () => {
  const { t } = useTranslation('head')

  return (
    <Head>
      <meta charSet="utf-8" />
      <meta name="description" content={t('description')} />
      <meta property="og:title" content="darklens" />
      <meta property="og:type" content="article" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta property="og:description" content={t('ogDescription')} />
      <meta name="robots" content="index, follow" />
    </Head>
  )
}

export default DyoHead
