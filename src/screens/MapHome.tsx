import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../store'
import MapView, { type MapHandle } from '../components/MapView'
import Sheet from '../components/Sheet'
import Carousel from '../components/Carousel'
import TabBar from '../components/TabBar'
import ChipRail from '../components/ChipRail'
import { Avatar, IconHeart, IconLocate, IconSearch, StatusBar } from '../components/ui'
import { CATEGORIES, categoryOf, type CategoryId, type WlEvent } from '../lib/types'
import { DEFAULT_CENTER } from '../lib/seed'
import {
  dateTimeLine,
  distanceLabel,
  distanceMi,
  money,
  moneyShort,
} from '../lib/format'
import { fromPrice, ticketsLeft } from '../components/cards'

const isTonight = (event: WlEvent): boolean => {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return event.startsAt <= end.getTime() && event.startsAt >= Date.now() - 3600_000 * 4
}

export default function MapHome({ focus }: { focus?: string }) {
  const { db, user, navigate, isSaved, toggleSaved, showToast } = useApp()
  const [selected, setSelected] = useState<string | null>(focus ?? null)
  const [snapIndex, setSnapIndex] = useState(0)
  const [cats, setCats] = useState<CategoryId[]>([])
  const [tonight, setTonight] = useState(false)
  const [freeOnly, setFreeOnly] = useState(false)
  const [me, setMe] = useState<[number, number] | null>(null)
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER)
  const mapRef = useRef<MapHandle | null>(null)

  const published = useMemo(
    () => db.events.filter((e) => e.status === 'published'),
    [db.events],
  )

  const matches = (e: WlEvent) =>
    (cats.length === 0 || cats.includes(e.category)) &&
    (!tonight || isTonight(e)) &&
    (!freeOnly || fromPrice(e) === 0)

  const dimmedIds = published.filter((e) => !matches(e)).map((e) => e.id)
  const visible = published.filter(matches)
  const event = selected ? published.find((e) => e.id === selected) ?? null : null

  useEffect(() => {
    if (focus) {
      const target = published.find((e) => e.id === focus)
      if (target) {
        setSelected(focus)
        setCenter([target.lat, target.lng])
        setSnapIndex(0)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus])

  const locate = () => {
    if (!navigator.geolocation) {
      showToast('This device has no location services')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const at: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setMe(at)
        setCenter(at)
        mapRef.current?.flyTo(at[0], at[1], 13)
      },
      () => showToast('Location permission denied — showing Brooklyn'),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  const select = (id: string) => {
    const target = published.find((e) => e.id === id)
    if (!target) return
    setSelected(id)
    setSnapIndex(0)
    mapRef.current?.flyTo(target.lat, target.lng)
  }

  const origin = me ?? center
  const snaps = [216, 430, 700]

  const toggleCat = (id: CategoryId) =>
    setCats((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))

  const clearFilters = () => {
    setCats([])
    setTonight(false)
    setFreeOnly(false)
  }

  return (
    <div className="screen">
      <MapView
        events={published}
        dimmedIds={dimmedIds}
        selectedId={selected}
        center={center}
        onSelect={select}
        userLocation={me}
        onBackgroundClick={() => setSelected(null)}
        onReady={(h) => (mapRef.current = h)}
      />

      <StatusBar label={me ? 'NEAR YOU' : 'BROOKLYN, NY'} />

      <div
        style={{
          position: 'absolute',
          top: 58,
          left: 16,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          zIndex: 20,
        }}
      >
        <div className="row" style={{ gap: 10 }}>
          <button
            onClick={() => navigate({ name: 'search' })}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              height: 50,
              background: 'var(--raised)',
              border: 'none',
              borderRadius: 999,
              padding: '0 18px',
              boxShadow: 'var(--e-float)',
              color: 'var(--faint)',
              font: '400 15px/1 var(--sans)',
            }}
          >
            <IconSearch size={17} />
            Search events, venues, vibes
          </button>
          <button
            onClick={() => navigate({ name: user ? 'profile' : 'login' })}
            className="iconbtn"
            style={{ width: 50, height: 50, overflow: 'hidden', boxShadow: 'var(--e-float)' }}
            aria-label={user ? 'Your profile' : 'Log in'}
          >
            {user ? (
              <Avatar src={user.avatar} size={50} />
            ) : (
              <span style={{ font: '700 14px/1 var(--sans)' }}>In</span>
            )}
          </button>
        </div>

        <ChipRail>
          <button
            className={`pill${tonight ? ' active' : ''}`}
            onClick={() => setTonight((v) => !v)}
            style={{ flex: 'none' }}
          >
            Tonight
          </button>
          <button
            className={`pill${freeOnly ? ' active' : ''}`}
            onClick={() => setFreeOnly((v) => !v)}
            style={{ flex: 'none' }}
          >
            Free
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`pill${cats.includes(c.id) ? ' active' : ''}`}
              onClick={() => toggleCat(c.id)}
              style={{ flex: 'none' }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: c.color,
                  display: 'inline-block',
                }}
              />
              {c.label}
            </button>
          ))}
        </ChipRail>
      </div>

      <button
        className="iconbtn"
        onClick={locate}
        aria-label="Center on my location"
        style={{
          position: 'absolute',
          right: 16,
          bottom: event ? snaps[snapIndex] + 16 : 98,
          width: 48,
          height: 48,
          boxShadow: 'var(--e-float)',
          transition: 'bottom .3s cubic-bezier(.22,1,.36,1)',
          zIndex: 30,
        }}
      >
        <IconLocate size={18} />
      </button>

      {visible.length === 0 && (
        <div
          className="card card-lg"
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            top: 190,
            padding: 20,
            textAlign: 'center',
            zIndex: 25,
          }}
        >
          <span style={{ font: '700 16px/1.3 var(--sans)' }}>Nothing matching here</span>
          <p className="body-text" style={{ color: 'var(--muted)', margin: '8px 0 12px' }}>
            Zoom out or clear the filters to see events in other neighbourhoods.
          </p>
          <button className="btn btn-ink btn-sm" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      )}

      {event && (
        <Sheet
          snaps={snaps}
          index={snapIndex}
          onIndexChange={setSnapIndex}
          onDismiss={() => setSelected(null)}
        >
          <EventSheetContent
            event={event}
            expanded={snapIndex > 0}
            distance={distanceMi(origin[0], origin[1], event.lat, event.lng)}
            saved={isSaved(event.id)}
            onSave={() => {
              if (!user) {
                showToast('Log in to save events')
                navigate({ name: 'login' })
                return
              }
              toggleSaved(event.id)
            }}
            onOpen={() => navigate({ name: 'event', id: event.id })}
            onBuy={() => {
              if (!user) {
                showToast('Log in to buy tickets')
                navigate({ name: 'login' })
                return
              }
              navigate({ name: 'checkout', id: event.id })
            }}
          />
        </Sheet>
      )}

      {!event && <TabBar active="map" />}
    </div>
  )
}

function EventSheetContent({
  event,
  expanded,
  distance,
  saved,
  onSave,
  onOpen,
  onBuy,
}: {
  event: WlEvent
  expanded: boolean
  distance: number
  saved: boolean
  onSave: () => void
  onOpen: () => void
  onBuy: () => void
}) {
  const cat = categoryOf(event.category)
  const left = ticketsLeft(event)

  return (
    <>
      <div
        className="body"
        style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <div className="row" style={{ gap: 12 }}>
          <img
            src={event.cover}
            alt=""
            style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'cover', flex: 'none' }}
          />
          <div className="col" style={{ gap: 5, minWidth: 0 }}>
            <span style={{ font: '700 17px/1.1 var(--sans)', letterSpacing: '-0.015em' }}>
              {event.title}
            </span>
            <span className="meta">
              {dateTimeLine(event.startsAt).toUpperCase()} · {distanceLabel(distance)}
            </span>
            <span
              className="tag quiet"
              style={{ alignSelf: 'flex-start', height: 22, fontSize: 10, padding: '0 9px' }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  background: cat.color,
                  marginRight: 6,
                }}
              />
              {cat.label}
            </span>
          </div>
          <div className="spacer" />
          <span style={{ font: '800 17px/1 var(--sans)', color: 'var(--action-text)', flex: 'none' }}>
            {moneyShort(fromPrice(event))}
          </span>
        </div>

        {expanded && (
          <>
            <Carousel images={event.gallery.length ? event.gallery : [event.cover]} height={190} radius={18} />
            <p className="body-text" style={{ margin: 0 }}>
              {event.description}
            </p>
            <div className="card" style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
              <div
                className="col"
                style={{ gap: 3, minWidth: 0, flex: 1, background: 'transparent' }}
              >
                <span style={{ font: '700 14px/1.2 var(--sans)' }}>{event.venue}</span>
                <span style={{ font: '400 12px/1.3 var(--sans)', color: 'var(--muted)' }}>
                  {event.address}
                </span>
              </div>
              <span className="meta">{distanceLabel(distance)}</span>
            </div>
            <div className="col" style={{ gap: 7 }}>
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
                    }}
                  >
                    <div className="col" style={{ gap: 3 }}>
                      <span style={{ font: '700 14px/1 var(--sans)' }}>{t.name}</span>
                      <span className="meta">
                        {remaining > 0 ? `${remaining} LEFT` : 'SOLD OUT'}
                      </span>
                    </div>
                    <span style={{ font: '800 16px/1 var(--sans)' }}>{money(t.price)}</span>
                  </div>
                )
              })}
            </div>
            <button className="btn btn-ghost btn-block" style={{ height: 48 }} onClick={onOpen}>
              Open full details
            </button>
          </>
        )}
      </div>

      <div
        style={{
          flex: 'none',
          padding: '10px 16px calc(18px + var(--safe-bottom))',
          display: 'flex',
          gap: 10,
          background: 'var(--surface)',
        }}
      >
        <button
          className="iconbtn"
          onClick={onSave}
          aria-label={saved ? 'Saved' : 'Save event'}
          style={{
            width: 50,
            height: 50,
            background: 'var(--field)',
            boxShadow: 'none',
            color: saved ? 'var(--action-text)' : 'var(--ink)',
          }}
        >
          <IconHeart size={20} style={{ fill: saved ? 'var(--action)' : 'none' }} />
        </button>
        <button
          className="btn btn-primary"
          style={{ flex: 1, height: 50, fontSize: 15 }}
          onClick={onBuy}
          disabled={left === 0}
        >
          {left === 0 ? 'Sold out' : 'Get tickets'}
        </button>
      </div>
    </>
  )
}
