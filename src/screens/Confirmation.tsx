import { useApp } from '../store'
import { IconCheck, StatusBar } from '../components/ui'
import { TicketCard } from '../components/cards'
import { downloadIcs } from '../lib/calendar'

export default function Confirmation({ orderId }: { orderId: string }) {
  const { db, eventById, user, navigate, showToast } = useApp()
  const order = db.orders.find((o) => o.id === orderId)
  const event = order ? eventById(order.eventId) : undefined

  if (!order) {
    return (
      <div className="screen" style={{ background: 'var(--canvas)' }}>
        <StatusBar label="CONFIRMED" />
        <div className="pad">
          <p className="body-text" style={{ marginTop: 24 }}>
            Order not found.
          </p>
        </div>
      </div>
    )
  }

  const count = order.items.reduce((s, i) => s + i.qty, 0)

  const share = async () => {
    const text = event ? `I'm going to ${event.title} — see you there.` : 'See you there.'
    try {
      if (navigator.share) await navigator.share({ text })
      else {
        await navigator.clipboard.writeText(text)
        showToast('Copied to clipboard')
      }
    } catch {
      showToast('Could not share right now')
    }
  }

  return (
    <div className="screen" style={{ background: 'var(--canvas)' }}>
      <StatusBar label="CONFIRMED" />
      <div className="body pad" style={{ paddingBottom: 180 }}>
        <div
          className="col"
          style={{ alignItems: 'center', gap: 12, paddingTop: 24, textAlign: 'center' }}
        >
          <div
            style={{
              width: 62,
              height: 62,
              borderRadius: 999,
              background: 'var(--success)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 26px rgba(30,158,90,.34)',
            }}
          >
            <IconCheck size={28} />
          </div>
          <h2 className="title">You&apos;re going.</h2>
          <span className="body-text" style={{ color: 'var(--muted)', maxWidth: '30ch' }}>
            {count} {count === 1 ? 'ticket' : 'tickets'} sent to {user?.email ?? 'your email'} and
            saved to your wallet.
          </span>
        </div>

        <div style={{ marginTop: 26 }}>
          <TicketCard order={order} event={event} />
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: 'calc(30px + var(--safe-bottom))',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <button
          className="btn btn-primary btn-block"
          onClick={() => navigate({ name: 'tickets' }, { reset: true })}
        >
          View my tickets
        </button>
        <div className="row" style={{ gap: 10 }}>
          <button
            className="btn btn-ghost"
            style={{ flex: 1, height: 52, fontSize: 14 }}
            onClick={() => {
              if (!event) return
              downloadIcs(event)
              showToast('Calendar file downloaded')
            }}
          >
            Add to calendar
          </button>
          <button className="btn btn-ghost" style={{ flex: 1, height: 52, fontSize: 14 }} onClick={share}>
            Share
          </button>
        </div>
      </div>
    </div>
  )
}
