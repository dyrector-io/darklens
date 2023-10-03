import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

const Footer = (props: React.HTMLProps<HTMLDivElement>) => {
  const { className, ...forwardProps } = props

  const { t } = useTranslation('common')

  return (
    <footer className={clsx('font-poppins items-center flex py-6 justify-between', className)} {...forwardProps}>
      <div className="flex items-stretch text-sm">
        <span className="text-lens-light pr-2">Copyright © {new Date().getFullYear()}</span>
      </div>

      <div className="flex items-stretch text-sm">
        <span className="text-lens-light pr-2">
          <Link to="https://github.com/dyrector-io/darklens" target="_blank">
            <span className="text-lens-turquoise font-bold">Darklens</span>
          </Link>{' '}
          {t('openSource')}
        </span>
      </div>
    </footer>
  )
}

export default Footer
