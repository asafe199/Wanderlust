import type { Order, WlEvent } from '../lib/types'
import { categoryOf } from '../lib/types'
import { dateTimeLine, distanceLabel, distanceMi, moneyShort } from '../lib/format'
import { IconHeart, IconTicket } from './ui'

export const fromPrice = (event: WlEvent): number =>
  event.ticketTypes.length ? Math.min(...event.ticketTypes.map((t) => t.price)) : 0

export const ticketsLeft = (event: WlEvent): number =>
  event.ticketTypes.reduce((sum, t) => sum + Math.max(0, t.quantity - t.sold), 0)

export function EventCard({
  event,
  from,
  onOpen,
  onToggleSave,
  saved,
}: {
  event: WlEvent
  from?: [number, number]
  onOpen: () => void
  onToggleSave?: () => void
  saved?: boolean
}) {
  const cat = categoryOf(event.category)
  const dist = from ? distanceMi(from[0], from[1], event.lat, event.lng) : null
  return (
    <div className="card card-lg" style={{ padding: 10, position: 'relative' }}>
      <button
        onClick={onOpen}
        style={{
          all: 'unset',
          cursor: 'pointer',
          display: 'block',
          width: '100%',
          position: 'relative',
        }}
      >
        <div style={{ position: 'relative', height: 170, borderRadius: 18, overflow: 'hidden' }}>
          <img
            src={event.cover}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <span className="tag" style={{ position: 'absolute', top: 10, left: 10 }}>
            {cat.label}
          </span>
        </div>
      </button>
      {onToggleSave && (
        <button
          className="iconbtn glass"
          onClick={onToggleSave}
          aria-label={saved ? 'Remove from saved' : 'Save event'}
          style={{
            position: 'absolute',
            top: 142,
            right: 20,
            width: 38,
            height: 38,
            color: saved ? 'var(--action-text)' : 'var(--ink)',
          }}
        >
          <IconHeart size={18} style={{ fill: saved ? 'var(--action)' : 'none' }} />
        </button>
      )}
      <button
        onClick={onOpen}
        style={{
          all: 'unset',
          cursor: 'pointer',
          display: 'block',
          width: '100%',
          padding: '12px 8px 10px',
          boxSizing: 'border-box',
        }}
      >
        <div className="col" style={{ gap: 7 }}>
          <span className="meta">
            {dateTimeLine(event.startsAt).toUpperCase()}
            {dist !== null ? ` · ${distanceLabel(dist)}` : ''}
          </span>
          <span style={{ font: '700 20px/1.15 var(--sans)', letterSpacing: '-0.02em' }}>
            {event.title}
          </span>
          <div className="row" style={{ justifyContent: 'space-between', marginTop: 3 }}>
            <span style={{ font: '400 13px/1 var(--sans)', color: 'var(--muted)' }}>
              {event.venue}
            </span>
            <span style={{ font: '800 17px/1 var(--sans)', color: 'var(--action-text)' }}>
              {moneyShort(fromPrice(event))}
            </span>
          </div>
        </div>
      </button>
    </div>
  )
}

export function EventRow({
  event,
  onOpen,
  trailing,
}: {
  event: WlEvent
  onOpen: () => void
  trailing?: React.ReactNode
}) {
  return (
    <div className="card" style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
      <button
        onClick={onOpen}
        style={{
          all: 'unset',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flex: 1,
          minWidth: 0,
        }}
      >
        <img
          src={event.cover}
          alt=""
          style={{ width: 70, height: 70, borderRadius: 16, objectFit: 'cover', flex: 'none' }}
        />
        <div className="col" style={{ gap: 4, minWidth: 0 }}>
          <span className="meta">{dateTimeLine(event.startsAt).toUpperCase()}</span>
          <span style={{ font: '700 15px/1.15 var(--sans)' }}>{event.title}</span>
          <span style={{ font: '400 12px/1 var(--sans)', color: 'var(--muted)' }}>
            {event.venue}
          </span>
        </div>
      </button>
      {trailing}
    </div>
  )
}

export function TicketCard({
  order,
  event,
  onUse,
}: {
  order: Order
  event: WlEvent | undefined
  onUse?: () => void
}) {
  const count = order.items.reduce((s, i) => s + i.qty, 0)
  const label = order.items.map((i) => i.name).join(' + ').toUpperCase()
  const statusTone =
    order.status === 'active' ? 'var(--success)' : order.status === 'used' ? '#3a3a3a' : '#a3221c'
  return (
    <div
      style={{
        background: 'var(--panel)',
        borderRadius: 28,
        padding: 22,
        color: 'var(--panel-text)',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="col" style={{ gap: 5, minWidth: 0 }}>
          <span className="meta" style={{ color: 'var(--panel-sub)' }}>
            {label} · {count} {count === 1 ? 'TICKET' : 'TICKETS'}
          </span>
          <span style={{ font: '700 19px/1.15 var(--sans)', letterSpacing: '-0.02em' }}>
            {event?.title ?? 'Event removed'}
          </span>
          {event && (
            <span className="meta" style={{ color: 'var(--panel-sub)' }}>
              {dateTimeLine(event.startsAt).toUpperCase()} · {event.venue.toUpperCase()}
            </span>
          )}
        </div>
        <div className="spacer" />
        <span className="tag" style={{ background: statusTone, flex: 'none' }}>
          {order.status === 'active' ? 'Active' : order.status === 'used' ? 'Used' : 'Cancelled'}
        </span>
      </div>

      <div
        style={{
          position: 'relative',
          height: 1,
          background:
            'repeating-linear-gradient(90deg, rgba(255,255,255,.3) 0 6px, transparent 6px 12px)',
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: -33,
            top: -11,
            width: 22,
            height: 22,
            borderRadius: 999,
            background: 'var(--canvas)',
          }}
        />
        <span
          style={{
            position: 'absolute',
            right: -33,
            top: -11,
            width: 22,
            height: 22,
            borderRadius: 999,
            background: 'var(--canvas)',
          }}
        />
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {order.qr ? (
          <img
            src={order.qr}
            alt={`QR code ${order.code}`}
            style={{ width: 150, height: 150, borderRadius: 8, imageRendering: 'pixelated' }}
          />
        ) : (
          <div
            style={{
              width: 150,
              height: 150,
              borderRadius: 8,
              background: 'repeating-conic-gradient(#0A0A0A 0 25%, #fff 0 50%) 0 0 / 15px 15px',
            }}
          />
        )}
        <span className="meta">{order.code}</span>
      </div>

      <span style={{ font: '400 12px/1.4 var(--sans)', color: 'var(--panel-sub)', textAlign: 'center' }}>
        Works offline — cached on this device.
      </span>

      {onUse && order.status === 'active' && (
        <button className="btn btn-soft btn-block" onClick={onUse} style={{ height: 48 }}>
          <IconTicket size={18} /> Mark as used
        </button>
      )}
    </div>
  )
}
