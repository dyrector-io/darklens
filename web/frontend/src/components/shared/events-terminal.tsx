import DyoIcon from 'src/elements/dyo-icon'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import arrowDown from 'src/assets/arrow_down.svg'

const SCROLL_LOCK_MARGIN = 10

interface EventsTerminalProps<T> {
  events: T[]
  formatEvent: (event: T) => string[]
}

const EventsTerminal = <T,>(props: EventsTerminalProps<T>) => {
  const { events, formatEvent } = props

  const { t } = useTranslation('common')

  const containerRef = useRef<HTMLDivElement>(undefined)
  const preventScrollEvent = useRef<boolean>(false)
  const [autoScroll, setAutoScroll] = useState<boolean>(true)

  const onScroll = () => {
    if (preventScrollEvent.current) {
      preventScrollEvent.current = false
      return
    }

    const container = containerRef.current
    setAutoScroll(
      container && container.scrollTop >= container.scrollHeight - container.clientHeight - SCROLL_LOCK_MARGIN,
    )
  }

  const scrollToBottom = () => {
    setAutoScroll(true)

    preventScrollEvent.current = true
    containerRef.current.scrollTop = containerRef.current.scrollHeight
  }

  useEffect(() => {
    if (!autoScroll || containerRef.current === null) {
      return
    }

    preventScrollEvent.current = true
    containerRef.current.scrollTop = containerRef.current.scrollHeight
  }, [events, containerRef, autoScroll])

  const eventStrings: string[] = events.flatMap(it => formatEvent(it))

  return (
    <div className="relative">
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="flex flex-col h-full overflow-y-auto bg-lens-surface-6 ring-2 ring-lens-surface-4 rounded-md px-4 py-1 mt-4 h-128 font-roboto"
      >
        {eventStrings.map((it, index) => (
          <span className="text-lens-text-0 tracking-widest py-2 text-sm" key={`event-${index}`}>
            {it}
          </span>
        ))}
      </div>
      {!autoScroll && (
        <div
          onClick={scrollToBottom}
          className="absolute right-0 bottom-0 mr-6 mb-3 cursor-pointer animate-bounce flex items-center justify-center"
        >
          <DyoIcon src={arrowDown} alt={t('down')} size="md" />
        </div>
      )}
    </div>
  )
}

export default EventsTerminal
