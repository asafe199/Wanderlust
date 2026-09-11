const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export const money = (cents: number): string =>
  cents === 0 ? 'Free' : `$${(cents / 100).toFixed(2)}`

export const moneyShort = (cents: number): string =>
  cents === 0 ? 'Free' : cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`

export const hour = (ts: number): string => {
  const d = new Date(ts)
  const h = d.getHours()
  const m = d.getMinutes()
  const suffix = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, '0')}${suffix}`
}

/** "FRI SEP 12 · 11PM" — the mono metadata line used all over the design. */
export const shortDate = (ts: number): string => {
  const d = new Date(ts)
  return `${DAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export const dateTimeLine = (startsAt: number, endsAt?: number): string =>
  endsAt
    ? `${shortDate(startsAt)} · ${hour(startsAt)} – ${hour(endsAt)}`
    : `${shortDate(startsAt)} · ${hour(startsAt)}`

export const longDate = (ts: number): string =>
  new Date(ts).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

/** Great-circle distance in miles. */
export const distanceMi = (
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number => {
  const R = 3958.8
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export const distanceLabel = (mi: number): string =>
  mi < 0.1 ? 'HERE' : mi < 10 ? `${mi.toFixed(1)} MI` : `${Math.round(mi)} MI`

export const relativeDay = (ts: number): string => {
  const now = new Date()
  const d = new Date(ts)
  const days = Math.round((d.setHours(12, 0, 0, 0) - now.setHours(12, 0, 0, 0)) / 86400000)
  if (days === 0) return 'Tonight'
  if (days === 1) return 'Tomorrow'
  if (days < 0) return 'Past'
  if (days < 7) return `In ${days} days`
  return shortDate(ts)
}

export const toDateInput = (ts: number): string => {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const toTimeInput = (ts: number): string => {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const fromDateTimeInput = (date: string, time: string): number => {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0).getTime()
}

export const uid = (prefix = 'id'): string =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`

/** Ticket codes read like WDL-7F42-91KQ, as specified in the design. */
export const ticketCode = (): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'
  const block = (n: number) =>
    Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
  return `WDL-${block(4)}-${block(4)}`
}
