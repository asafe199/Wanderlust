import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

/* ------------------------------------------------------------------ icons */
type IconProps = { size?: number; stroke?: number; style?: CSSProperties }

const svg = (size: number, stroke: number, style: CSSProperties | undefined, d: ReactNode) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
    aria-hidden="true"
  >
    {d}
  </svg>
)

export const IconMap = ({ size = 20, stroke = 2, style }: IconProps) =>
  svg(size, stroke, style, (
    <>
      <path d="M9 3 3 5.5v15L9 18l6 3 6-2.5v-15L15 6 9 3Z" />
      <path d="M9 3v15M15 6v15" />
    </>
  ))

export const IconSearch = ({ size = 20, stroke = 2, style }: IconProps) =>
  svg(size, stroke, style, (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </>
  ))

export const IconPlus = ({ size = 22, stroke = 2, style }: IconProps) =>
  svg(size, stroke, style, <path d="M12 5v14M5 12h14" />)

export const IconTicket = ({ size = 20, stroke = 2, style }: IconProps) =>
  svg(size, stroke, style, (
    <>
      <path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6Z" />
      <path d="M14 5v14" strokeDasharray="2 3" />
    </>
  ))

export const IconUser = ({ size = 20, stroke = 2, style }: IconProps) =>
  svg(size, stroke, style, (
    <>
      <circle cx="12" cy="8.5" r="3.7" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ))

export const IconBack = ({ size = 20, stroke = 2, style }: IconProps) =>
  svg(size, stroke, style, <path d="M15 5 8 12l7 7" />)

export const IconHeart = ({ size = 20, stroke = 2, style }: IconProps) =>
  svg(size, stroke, style, (
    <path d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 7.8a4.1 4.1 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z" />
  ))

export const IconShare = ({ size = 20, stroke = 2, style }: IconProps) =>
  svg(size, stroke, style, (
    <>
      <path d="M12 3v12" />
      <path d="m8 7 4-4 4 4" />
      <path d="M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" />
    </>
  ))

export const IconGear = ({ size = 20, stroke = 2, style }: IconProps) =>
  svg(size, stroke, style, (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v2.4M12 18.8v2.4M4.5 4.5l1.7 1.7M17.8 17.8l1.7 1.7M2.8 12h2.4M18.8 12h2.4M4.5 19.5l1.7-1.7M17.8 6.2l1.7-1.7" />
    </>
  ))

export const IconLocate = ({ size = 20, stroke = 2, style }: IconProps) =>
  svg(size, stroke, style, (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ))

export const IconCalendar = ({ size = 20, stroke = 2, style }: IconProps) =>
  svg(size, stroke, style, (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ))

export const IconCheck = ({ size = 20, stroke = 2.4, style }: IconProps) =>
  svg(size, stroke, style, <path d="m5 12.5 4.5 4.5L19 7" />)

export const IconClose = ({ size = 20, stroke = 2, style }: IconProps) =>
  svg(size, stroke, style, <path d="M6 6l12 12M18 6 6 18" />)

export const IconPin = ({ size = 20, stroke = 2, style }: IconProps) =>
  svg(size, stroke, style, (
    <>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ))

export const IconSun = ({ size = 20, stroke = 2, style }: IconProps) =>
  svg(size, stroke, style, (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.6v2.2M12 19.2v2.2M4.4 4.4l1.6 1.6M18 18l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.4 19.6 6 18M18 6l1.6-1.6" />
    </>
  ))

export const IconMoon = ({ size = 20, stroke = 2, style }: IconProps) =>
  svg(size, stroke, style, (
    <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.4 8.4 0 1 0 20 14.2Z" />
  ))

export const IconImage = ({ size = 20, stroke = 2, style }: IconProps) =>
  svg(size, stroke, style, (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m4 17 4.5-4.5L13 17l3-2.7 4 3.7" />
    </>
  ))

/* ------------------------------------------------------------- primitives */

export function StatusBar({ label, dark = false }: { label: string; dark?: boolean }) {
  const now = useClock()
  return (
    <div className="statusbar" style={{ color: dark ? '#fff' : 'var(--ink)' }}>
      <span>{now}</span>
      <span className="label">{label}</span>
    </div>
  )
}


function useClock(): string {
  const fmt = () =>
    new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const [value, setValue] = useState(fmt)
  useEffect(() => {
    const id = window.setInterval(() => setValue(fmt()), 20000)
    return () => window.clearInterval(id)
  }, [])
  return value
}

export function TopBar({
  title,
  subtitle,
  onBack,
  right,
}: {
  title?: string
  subtitle?: string
  onBack?: () => void
  right?: ReactNode
}) {
  return (
    <div
      className="row"
      style={{ padding: '4px 16px 12px', gap: 12, flex: 'none' }}
    >
      {onBack && (
        <button className="iconbtn" onClick={onBack} aria-label="Go back">
          <IconBack />
        </button>
      )}
      <div className="col" style={{ gap: 2, minWidth: 0 }}>
        {title && <h3 className="sub">{title}</h3>}
        {subtitle && <span className="meta">{subtitle}</span>}
      </div>
      <div className="spacer" />
      {right}
    </div>
  )
}

export function Avatar({
  src,
  size = 44,
  radius,
}: {
  src: string
  size?: number
  radius?: number
}) {
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        flex: 'none',
        borderRadius: radius ?? 999,
        objectFit: 'cover',
        background: 'var(--field)',
      }}
    />
  )
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div
      className="card card-lg"
      style={{
        padding: '34px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 66,
          height: 66,
          borderRadius: 999,
          background: 'var(--field)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#b4b4b2',
        }}
      >
        <IconSearch size={24} />
      </div>
      <span style={{ font: '700 18px/1.2 var(--sans)' }}>{title}</span>
      <span
        className="body-text"
        style={{ color: 'var(--muted)', maxWidth: '32ch' }}
      >
        {body}
      </span>
      {action}
    </div>
  )
}

export function Toast({ message }: { message: string }) {
  return (
    <div className="toast" role="status">
      {message}
    </div>
  )
}
