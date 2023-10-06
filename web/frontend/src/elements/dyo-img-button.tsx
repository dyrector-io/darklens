import clsx from 'clsx'

interface DyoImgButtonProps {
  className?: string
  colorClassName?: string
  imageClassName?: string
  disabled?: boolean
  src: string
  alt: string
  onClick: VoidFunction
  width?: number
  height?: number
  secondary?: boolean
  outlined?: boolean
}

const DyoImgButton = (props: DyoImgButtonProps) => {
  const { outlined, secondary, disabled, colorClassName, imageClassName, className, onClick, alt, width, height, src } =
    props

  const defaultColor = outlined ? (secondary ? 'ring-lens-warning-orange' : 'ring-lens-turquoise') : null
  const disabledColor = outlined ? 'ring-lens-surface-4' : null
  const color = disabled ? disabledColor : colorClassName ?? defaultColor

  const ring = outlined ? 'ring-2' : null

  return (
    /* eslint-disable-next-line react/button-has-type */
    <button
      className={clsx(color, ring, className, 'rounded grid items-center', disabled ? 'opacity-40' : null)}
      disabled={disabled}
      onClick={onClick}
    >
      <img
        className={imageClassName}
        src={src}
        width={width ?? 24}
        height={height ?? 24}
        alt={alt}
        style={!width !== !height ? { width: width ?? 'auto', height: height ?? 'auto' } : null}
      />
    </button>
  )
}

export default DyoImgButton
