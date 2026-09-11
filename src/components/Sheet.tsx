import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  /** Snap heights in px, smallest first. */
  snaps: number[]
  index: number
  onIndexChange: (index: number) => void
  onDismiss?: () => void
  children: ReactNode
}

/**
 * Draggable bottom sheet. The gesture is the core interaction of the product,
 * so it is hand-rolled: pointer drag with velocity-aware snapping, and a
 * scroll-lock so the inner content only scrolls once the sheet is fully open.
 */
export default function Sheet({ snaps, index, onIndexChange, onDismiss, children }: Props) {
  const [height, setHeight] = useState(snaps[index] ?? snaps[0])
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ startY: number; startH: number; lastY: number; lastT: number; v: number } | null>(null)

  useEffect(() => {
    if (!dragging) setHeight(snaps[index] ?? snaps[0])
  }, [index, snaps, dragging])

  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    drag.current = {
      startY: e.clientY,
      startH: height,
      lastY: e.clientY,
      lastT: performance.now(),
      v: 0,
    }
    setDragging(true)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const now = performance.now()
    const dt = Math.max(1, now - d.lastT)
    d.v = (e.clientY - d.lastY) / dt
    d.lastY = e.clientY
    d.lastT = now
    const max = snaps[snaps.length - 1]
    const next = Math.min(max + 40, Math.max(24, d.startH - (e.clientY - d.startY)))
    setHeight(next)
  }

  const onPointerUp = () => {
    const d = drag.current
    if (!d) return
    drag.current = null
    setDragging(false)
    const flingDown = d.v > 0.55
    const flingUp = d.v < -0.55
    let target = index
    if (flingUp) target = Math.min(snaps.length - 1, index + 1)
    else if (flingDown) target = index - 1
    else {
      let best = 0
      snaps.forEach((s, i) => {
        if (Math.abs(s - height) < Math.abs(snaps[best] - height)) best = i
      })
      target = best
      if (height < snaps[0] * 0.6) target = -1
    }
    if (target < 0 && onDismiss) {
      onDismiss()
      return
    }
    const clamped = Math.max(0, Math.min(snaps.length - 1, target))
    setHeight(snaps[clamped])
    onIndexChange(clamped)
  }

  return (
    <div
      className={`sheet${dragging ? '' : ' animate'}`}
      style={{ height }}
      role="dialog"
      aria-label="Event details"
    >
      <div
        className="grabber-hit"
        style={{
          flex: 'none',
          display: 'flex',
          justifyContent: 'center',
          padding: '0 0 4px',
          touchAction: 'none',
          cursor: 'grab',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="grabber" />
      </div>
      {children}
    </div>
  )
}
