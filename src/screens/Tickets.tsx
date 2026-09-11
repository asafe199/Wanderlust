import { useState } from 'react'
import { useApp } from '../store'
import TabBar from '../components/TabBar'
import { TicketCard } from '../components/cards'
import { EmptyState, IconBack, StatusBar } from '../components/ui'
import { dateTimeLine } from '../lib/format'

type Filter = 'active' | 'past'

export default function Tickets() {
  const { ordersOfUser, eventById, navigate } = useApp()
  const [filter, setFilter] = useState<Filter>('active')
  const orders = ordersOfUser()

  const shown = orders.filter((o) => {
    const event = eventById(o.eventId)
    const past = !event || event.startsAt < Date.now() || o.status !== 'active'
    return filter === 'active' ? !past : past
  })

  return (
    <div className="screen" style={{ background: 'var(--canvas)' }}>
      <StatusBar label="TICKETS" />
      <div className="pad" style={{ paddingBottom: 12 }}>
        <h2 className="title" style={{ marginBottom: 14 }}>
          My tickets
        </h2>
        <div className="segmented">
          <button className={filter === 'active' ? 'on' : undefined} onClick={() => setFilter('active')}>
            Upcoming
          </button>
          <button className={filter === 'past' ? 'on' : undefined} onClick={() => setFilter('past')}>
            Past &amp; used
          </button>
        </div>
      </div>

      <div className="body pad" style={{ paddingBottom: 120, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {shown.length === 0 ? (
          <EmptyState
            title={filter === 'active' ? 'No tickets yet' : 'Nothing in the archive'}
            body={
              filter === 'active'
                ? 'Everything you buy lands here with a QR code that works offline.'
                : 'Used and expired tickets show up here after the night is over.'
            }
            action={
              <button
                className="btn btn-ink btn-sm"
                style={{ marginTop: 4 }}
                onClick={() => navigate({ name: 'map' }, { reset: true })}
              >
                Explore the map
              </button>
            }
          />
        ) : (
          shown.map((order) => {
            const event = eventById(order.eventId)
            const count = order.items.reduce((s, i) => s + i.qty, 0)
            return (
              <button
                key={order.id}
                onClick={() => navigate({ name: 'ticket', orderId: order.id })}
                style={{ all: 'unset', cursor: 'pointer', display: 'block' }}
              >
                <div
                  className="card card-lg"
                  style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  <img
                    src={event?.cover ?? ''}
                    alt=""
                    style={{ width: 70, height: 70, borderRadius: 16, objectFit: 'cover', flex: 'none', background: 'var(--field)' }}
                  />
                  <div className="col" style={{ gap: 4, minWidth: 0 }}>
                    <span className="meta">
                      {event ? dateTimeLine(event.startsAt).toUpperCase() : 'EVENT REMOVED'}
                    </span>
                    <span style={{ font: '700 15px/1.15 var(--sans)' }}>
                      {event?.title ?? 'Event removed'}
                    </span>
                    <span
                      className={`tag ${order.status === 'active' ? 'ok' : 'quiet'}`}
                      style={{ alignSelf: 'flex-start', height: 20, fontSize: 10, padding: '0 8px' }}
                    >
                      {order.status === 'active' ? `Active · ${count}` : `Used · ${count}`}
                    </span>
                  </div>
                  <div className="spacer" />
                  {order.qr && (
                    <img
                      src={order.qr}
                      alt=""
                      style={{ width: 34, height: 34, borderRadius: 10, marginRight: 6, flex: 'none' }}
                    />
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>
      <TabBar active="tickets" />
    </div>
  )
}

export function TicketDetail({ orderId }: { orderId: string }) {
  const { db, eventById, back, useTicket, showToast } = useApp()
  const order = db.orders.find((o) => o.id === orderId)
  const event = order ? eventById(order.eventId) : undefined

  return (
    <div className="screen" style={{ background: 'var(--canvas)' }}>
      <StatusBar label="TICKET" />
      <div className="row" style={{ padding: '4px 16px 12px', gap: 12 }}>
        <button className="iconbtn" onClick={back} aria-label="Go back">
          <IconBack />
        </button>
        <span style={{ font: '700 17px/1 var(--sans)' }}>Your ticket</span>
      </div>
      <div className="body pad" style={{ paddingBottom: 40 }}>
        {order ? (
          <TicketCard
            order={order}
            event={event}
            onUse={() => {
              useTicket(order.id)
              showToast('Ticket marked as used')
            }}
          />
        ) : (
          <p className="body-text">Ticket not found.</p>
        )}
      </div>
    </div>
  )
}
