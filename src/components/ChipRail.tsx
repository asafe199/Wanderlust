import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Horizontal filter rail. The scrollbar is hidden by design, so the rail has to
 * provide the affordances itself: a vertical mouse wheel scrolls it sideways,
 * and it can be dragged with a pointer. Touch keeps its native swipe.
 */
export default function ChipRail({
  children,
  className = '',
  style,
}: {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const canScroll = () => el.scrollWidth - el.clientWidth > 1

    /* React registers wheel handlers as passive, so this one is native. */
    const onWheel = (e: WheelEvent) => {
      if (!canScroll()) return
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (!delta) return
      el.scrollLeft += delta
      e.preventDefault()
    }

    /* Swallow the click that ends a drag, so dragging never toggles a filter. */
    const onClickCapture = (e: MouseEvent) => {
      if (!drag.current.moved) return
      e.stopPropagation()
      e.preventDefault()
      drag.current.moved = false
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('click', onClickCapture, true)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('click', onClickCapture, true)
    }
  }, [])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return // native swipe handles it
    const el = ref.current
    if (!el || el.scrollWidth - el.clientWidth <= 1) return
    drag.current = { active: true, startX: e.clientX, startLeft: el.scrollLeft, moved: false }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el || !drag.current.active) return
    const dx = e.clientX - drag.current.startX
    if (!drag.current.moved && Math.abs(dx) > 4) {
      drag.current.moved = true
      el.setPointerCapture?.(e.pointerId)
    }
    if (drag.current.moved) el.scrollLeft = drag.current.startLeft - dx
  }

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return
    drag.current.active = false
    ref.current?.releasePointerCapture?.(e.pointerId)
  }

  return (
    <div
      ref={ref}
      className={`chips ${className}`.trim()}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
    >
      {children}
    </div>
  )
}
