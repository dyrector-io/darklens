/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import clsx from 'clsx'

export type DyoIconSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

interface DyoIconProps {
  className?: string
  imageClassName?: string
  src: string
  alt: string
  size?: DyoIconSize
  onClick?: VoidFunction
}

const DyoIcon = (props: DyoIconProps) => {
  const { className, imageClassName, src, alt, size: propsSize = 'sm', onClick } = props

  const size = propsSize === 'sm' ? 16 : propsSize === 'md' ? 24 : propsSize === 'lg' ? 32 : propsSize == 'xl' ? 36 : 46

  return (
    <span
      className={clsx('inline-block', className)}
      style={{
        minWidth: size,
        minHeight: size,
      }}
    >
      <img
        className={clsx(
          'aspect-square object-contain object-center',
          imageClassName,
          onClick ? 'cursor-pointer' : null,
        )}
        title={alt}
        src={src}
        alt={alt}
        width={size}
        height={size}
        onClick={onClick}
      />
    </span>
  )
}

export default DyoIcon
