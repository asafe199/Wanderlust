import type { WlEvent } from './types'

const stamp = (ts: number): string =>
  new Date(ts).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

const escape = (text: string): string =>
  text.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')

export const icsFor = (event: WlEvent): string =>
  [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wanderlust//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@wanderlust.app`,
    `DTSTAMP:${stamp(Date.now())}`,
    `DTSTART:${stamp(event.startsAt)}`,
    `DTEND:${stamp(event.endsAt)}`,
    `SUMMARY:${escape(event.title)}`,
    `DESCRIPTION:${escape(event.description)}`,
    `LOCATION:${escape(`${event.venue}, ${event.address}`)}`,
    `GEO:${event.lat};${event.lng}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

export const downloadIcs = (event: WlEvent): void => {
  const blob = new Blob([icsFor(event)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${event.title.toLowerCase().replace(/\W+/g, '-')}.ics`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
