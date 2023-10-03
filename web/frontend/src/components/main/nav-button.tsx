import clsx from 'clsx'
import { Link, useLocation } from 'react-router-dom'

interface NavButtonProps {
  children: React.ReactNode
  href: string
  target?: string
  icon?: JSX.Element
}

const NavButton = (props: NavButtonProps) => {
  const { children, href, target, icon } = props

  const location = useLocation()

  const active = location.pathname.startsWith(href)

  return (
    <>
      <div className={clsx('pl-8 py-2', active ? 'bg-lens-dark w-full' : null)}>
        <Link to={href} target={target}>
          <div className="flex flex-row">
            <div className="flex items-center mr-2 text-lens-bright text-sm font-semibold">{icon}</div>
            {children}
          </div>
        </Link>
      </div>

      <div className={clsx('w-1 py-2', active ? 'bg-lens-turquoise opacity-50' : null)}>&nbsp;</div>
    </>
  )
}

export default NavButton
