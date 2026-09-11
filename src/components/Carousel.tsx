import { useRef, useState } from 'react'

export default function Carousel({
  images,
  height,
  radius = 0,
  overlay,
}: {
  images: string[]
  height: number | string
  radius?: number
  overlay?: React.ReactNode
}) {
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement | null>(null)
  const shots = images.length ? images : ['']

  const onScroll = () => {
    const el = ref.current
    if (!el) return
    const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth))
    if (i !== active) setActive(i)
  }

  return (
    <div style={{ position: 'relative', height, flex: 'none' }}>
      <div
        className="carousel"
        ref={ref}
        onScroll={onScroll}
        style={{ height: '100%', borderRadius: radius }}
      >
        {shots.map((src, i) => (
          <div key={`${src}-${i}`} style={{ height: '100%' }}>
            {src ? (
              <img
                src={src}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div className="skeleton" style={{ width: '100%', height: '100%' }} />
            )}
          </div>
        ))}
      </div>
      {overlay}
      {shots.length > 1 && (
        <div className="dots" style={{ position: 'absolute', bottom: 12, left: 0, right: 0 }}>
          {shots.map((_, i) => (
            <span key={i} className={i === active ? 'on' : undefined} />
          ))}
        </div>
      )}
    </div>
  )
}
