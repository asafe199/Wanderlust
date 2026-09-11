import { useApp } from '../store'
import Carousel from '../components/Carousel'
import MapView from '../components/MapView'
import {
  Avatar,
  IconBack,
  IconHeart,
  IconShare,
  StatusBar,
} from '../components/ui'
import { categoryOf } from '../lib/types'
import { dateTimeLine, longDate, money, moneyShort } from '../lib/format'
import { fromPrice, ticketsLeft } from '../components/cards'

export default function EventDetail({ id }: { id: string }) {
  const { eventById, db, user, back, navigate, isSaved, toggleSaved, showToast } = useApp()
  const event = eventById(id)

  if (!event) {
    return (
      <div className="screen" style={{ background: 'var(--canvas)' }}>
        <StatusBar label="DETAILS" />
        <div className="pad">
          <button className="iconbtn" onClick={back} aria-label="Go back">
            <IconBack />
          </button>
          <p className="body-text" style={{ marginTop: 24 }}>
            This event is no longer available.
          </p>
        </div>
      </div>
    )
  }

  const cat = categoryOf(event.category)
  const organizer = db.users.find((u) => u.id === event.organizerId)
  const left = ticketsLeft(event)
  const saved = isSaved(event.id)

  const share = async () => {
    const text = `${event.title} — ${longDate(event.startsAt)} at ${event.venue}`
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, text })
        return
      }
      await navigator.clipboard.writeText(text)
      showToast('Event copied to clipboard')
    } catch {
      showToast('Could not share right now')
    }
  }

  const buy = () => {
    if (!user) {
      showToast('Log in to buy tickets')
      navigate({ name: 'login' })
      return
    }
    navigate({ name: 'checkout', id: event.id })
  }

  return (
    <div className="screen" style={{ background: 'var(--canvas)' }}>
      <div className="body" style={{ paddingBottom: 120 }}>
        <div style={{ position: 'relative' }}>
          <Carousel images={event.gallery.length ? event.gallery : [event.cover]} height={280} />
          <StatusBar label="DETAILS" dark />
          <div
            className="row"
            style={{ position: 'absolute', top: 58, left: 16, right: 16, zIndex: 20 }}
          >
            <button className="iconbtn glass" onClick={back} aria-label="Go back">
              <IconBack />
            </button>
            <div className="spacer" />
            <button
              className="iconbtn glass"
              onClick={() => {
                if (!user) {
                  showToast('Log in to save events')
                  navigate({ name: 'login' })
                  return
                }
                toggleSaved(event.id)
              }}
              aria-label={saved ? 'Remove from saved' : 'Save event'}
              style={{ color: saved ? 'var(--action-text)' : 'var(--ink)', marginRight: 8 }}
            >
              <IconHeart style={{ fill: saved ? 'var(--action)' : 'none' }} />
            </button>
            <button className="iconbtn glass" onClick={share} aria-label="Share event">
              <IconShare size={18} />
            </button>
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            marginTop: -26,
            background: 'var(--canvas)',
            borderRadius: '28px 28px 0 0',
            padding: '18px 20px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div className="col" style={{ gap: 8 }}>
            <span className="tag solid" style={{ alignSelf: 'flex-start' }}>
              <span
                style={{ width: 7, height: 7, borderRadius: 999, background: cat.color, marginRight: 7 }}
              />
              {cat.label}
            </span>
            <h2 className="title">{event.title}</h2>
            <span className="meta">
              {dateTimeLine(event.startsAt, event.endsAt).toUpperCase()}
            </span>
          </div>

          <div className="card" style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
            <img
              src={event.cover}
              alt=""
              style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover', flex: 'none' }}
            />
            <div className="col" style={{ gap: 3, minWidth: 0 }}>
              <span style={{ font: '700 14px/1.2 var(--sans)' }}>{event.venue}</span>
              <span style={{ font: '400 12px/1.3 var(--sans)', color: 'var(--muted)' }}>
                {event.address}
              </span>
            </div>
            <div className="spacer" />
            <button
              className="pill flat"
              style={{ height: 32, flex: 'none' }}
              onClick={() => navigate({ name: 'map', focus: event.id }, { reset: true })}
            >
              Map
            </button>
          </div>

          <p className="body-text" style={{ margin: 0 }}>
            {event.description}
          </p>

          <div className="row">
            {organizer && <Avatar src={organizer.avatar} size={36} />}
            <div className="col" style={{ gap: 2 }}>
              <span className="meta" style={{ color: 'var(--faint)' }}>
                HOSTED BY
              </span>
              <span style={{ font: '700 13px/1 var(--sans)' }}>{event.organizerName}</span>
            </div>
            <div className="spacer" />
            <button
              className="btn btn-ghost btn-sm"
              style={{ height: 32 }}
              onClick={() => showToast(`Following ${event.organizerName}`)}
            >
              Follow
            </button>
          </div>

          <div className="col" style={{ gap: 7 }}>
            <span style={{ font: '700 15px/1 var(--sans)' }}>Tickets</span>
            {event.ticketTypes.map((t) => {
              const remaining = Math.max(0, t.quantity - t.sold)
              return (
                <div
                  key={t.id}
                  className="card"
                  style={{
                    padding: '11px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: remaining ? 1 : 0.5,
                  }}
                >
                  <div className="col" style={{ gap: 3 }}>
                    <span style={{ font: '700 14px/1 var(--sans)' }}>{t.name}</span>
                    <span className="meta">{remaining > 0 ? `${remaining} LEFT` : 'SOLD OUT'}</span>
                  </div>
                  <span style={{ font: '800 16px/1 var(--sans)' }}>{money(t.price)}</span>
                </div>
              )
            })}
          </div>

          <div className="col" style={{ gap: 8 }}>
            <span style={{ font: '700 15px/1 var(--sans)' }}>Where</span>
            <div
              style={{
                position: 'relative',
                height: 170,
                borderRadius: 22,
                overflow: 'hidden',
              }}
            >
              <MapView
                events={[event]}
                center={[event.lat, event.lng]}
                zoom={15}
                interactive={false}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '14px 20px calc(26px + var(--safe-bottom))',
          background: 'linear-gradient(180deg, var(--canvas-0), var(--canvas) 28%)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div className="col" style={{ gap: 2 }}>
          <span className="meta">FROM</span>
          <span style={{ font: '800 22px/1 var(--sans)' }}>{moneyShort(fromPrice(event))}</span>
        </div>
        <button
          className="btn btn-primary"
          style={{ flex: 1 }}
          onClick={buy}
          disabled={left === 0}
        >
          {left === 0 ? 'Sold out' : 'Get tickets'}
        </button>
      </div>
    </div>
  )
}
