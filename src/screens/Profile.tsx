import { useState } from 'react'
import { useApp } from '../store'
import TabBar from '../components/TabBar'
import { EventCard } from '../components/cards'
import {
  Avatar,
  EmptyState,
  IconBack,
  IconGear,
  IconMoon,
  IconSun,
  StatusBar,
} from '../components/ui'
import { dateTimeLine, money, longDate } from '../lib/format'
import { DOCUMENT_LABEL, type ThemePref } from '../lib/types'
import { DEFAULT_CENTER } from '../lib/seed'

type Tab = 'tickets' | 'events' | 'saved'

export default function Profile() {
  const {
    user,
    db,
    navigate,
    ordersOfUser,
    eventsOfUser,
    eventById,
    soldFor,
    isSaved,
    toggleSaved,
    resolvedTheme,
    setTheme,
    startHosting,
  } = useApp()
  const [tab, setTab] = useState<Tab>('tickets')

  if (!user) {
    return (
      <div className="screen" style={{ background: 'var(--canvas)' }}>
        <StatusBar label="PROFILE" />
        <div className="body pad" style={{ paddingTop: 40 }}>
          <EmptyState
            title="You are browsing as a guest"
            body="Log in to keep your tickets, save events and publish your own."
            action={
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 6 }}
                onClick={() => navigate({ name: 'login' })}
              >
                Log in or sign up
              </button>
            }
          />
        </div>
        <TabBar active="profile" />
      </div>
    )
  }

  const orders = ordersOfUser()
  const hosted = eventsOfUser()
  const savedIds = db.saved[user.id] ?? []
  const savedEvents = savedIds
    .map((id) => eventById(id))
    .filter((e): e is NonNullable<typeof e> => Boolean(e))

  return (
    <div className="screen" style={{ background: 'var(--canvas)' }}>
      <StatusBar label="PROFILE" />

      <div className="row" style={{ padding: '4px 20px 14px', gap: 14 }}>
        <Avatar src={user.avatar} size={62} />
        <div className="col" style={{ gap: 3, minWidth: 0 }}>
          <span style={{ font: '800 22px/1.05 var(--sans)', letterSpacing: '-0.02em' }}>
            {user.name}
          </span>
          <span className="meta">
            {user.city.toUpperCase()} · JOINED {new Date(user.joined).getFullYear()}
          </span>
          {user.verification.status === 'verified' ? (
            <span
              className="tag ok"
              style={{ alignSelf: 'flex-start', height: 20, fontSize: 10, padding: '0 8px', marginTop: 2 }}
            >
              Verified host
            </span>
          ) : (
            <button
              className="tag quiet"
              style={{
                alignSelf: 'flex-start',
                height: 20,
                fontSize: 10,
                padding: '0 8px',
                marginTop: 2,
                border: 'none',
              }}
              onClick={() => navigate({ name: 'verify' })}
            >
              {user.verification.status === 'pending' ? 'Verification in review' : 'Verify to host →'}
            </button>
          )}
        </div>
        <div className="spacer" />
        <button
          className="iconbtn"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{ marginRight: 8 }}
        >
          {resolvedTheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
        </button>
        <button
          className="iconbtn"
          onClick={() => navigate({ name: 'settings' })}
          aria-label="Settings"
        >
          <IconGear size={18} />
        </button>
      </div>

      <div className="pad" style={{ paddingBottom: 12 }}>
        <div className="segmented">
          <button className={tab === 'tickets' ? 'on' : undefined} onClick={() => setTab('tickets')}>
            Tickets
          </button>
          <button className={tab === 'events' ? 'on' : undefined} onClick={() => setTab('events')}>
            My events
          </button>
          <button className={tab === 'saved' ? 'on' : undefined} onClick={() => setTab('saved')}>
            Saved
          </button>
        </div>
      </div>

      <div
        className="body pad"
        style={{ paddingBottom: 120, display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {tab === 'tickets' && (
          <>
            <span className="meta">UPCOMING</span>
            {orders.length === 0 ? (
              <EmptyState
                title="No tickets yet"
                body="Anything you buy shows up here with its QR code."
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
              orders.map((order) => {
                const event = eventById(order.eventId)
                const count = order.items.reduce((s, i) => s + i.qty, 0)
                return (
                  <div
                    key={order.id}
                    className="card card-lg"
                    style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    <img
                      src={event?.cover ?? ''}
                      alt=""
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: 16,
                        objectFit: 'cover',
                        flex: 'none',
                        background: 'var(--field)',
                      }}
                    />
                    <div className="col" style={{ gap: 4, minWidth: 0 }}>
                      <span className="meta">
                        {event ? dateTimeLine(event.startsAt).toUpperCase() : '—'}
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
                    <button
                      className="pill flat"
                      style={{ height: 32, flex: 'none' }}
                      onClick={() => navigate({ name: 'ticket', orderId: order.id })}
                    >
                      QR
                    </button>
                  </div>
                )
              })
            )}
          </>
        )}

        {tab === 'events' && (
          <>
            <span className="meta">HOSTING</span>
            {hosted.length === 0 ? (
              <EmptyState
                title="You have not hosted yet"
                body="Publishing takes six short steps. Your cover photo becomes the pin on the map."
                action={
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: 4 }}
                    onClick={() => startHosting()}
                  >
                    Create an event
                  </button>
                }
              />
            ) : (
              hosted.map((event) => {
                const { sold, total, revenue } = soldFor(event)
                const pct = total ? Math.round((sold / total) * 100) : 0
                return (
                  <div
                    key={event.id}
                    style={{
                      background: 'var(--panel)',
                      borderRadius: 22,
                      padding: 16,
                      color: 'var(--panel-text)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div className="row" style={{ alignItems: 'flex-start' }}>
                      <div className="col" style={{ gap: 4, minWidth: 0 }}>
                        <span className="meta" style={{ color: 'var(--panel-sub)' }}>
                          {event.status.toUpperCase()}
                        </span>
                        <span style={{ font: '700 16px/1.1 var(--sans)' }}>{event.title}</span>
                        <span className="meta" style={{ color: 'var(--panel-sub)' }}>
                          {dateTimeLine(event.startsAt).toUpperCase()}
                        </span>
                      </div>
                      <div className="spacer" />
                      <button
                        className="pill"
                        style={{ background: 'var(--panel-2)', color: 'var(--panel-text)', boxShadow: 'none', height: 30, flex: 'none' }}
                        onClick={() => startHosting(event.id)}
                      >
                        Edit
                      </button>
                    </div>
                    <div className="row" style={{ alignItems: 'flex-end', gap: 14 }}>
                      <div className="col" style={{ gap: 2 }}>
                        <span style={{ font: '800 24px/1 var(--sans)' }}>{sold}</span>
                        <span className="meta" style={{ color: 'var(--panel-sub)', fontSize: 9 }}>
                          SOLD / {total}
                        </span>
                      </div>
                      <div className="col" style={{ gap: 2 }}>
                        <span style={{ font: '800 24px/1 var(--sans)' }}>{money(revenue)}</span>
                        <span className="meta" style={{ color: 'var(--panel-sub)', fontSize: 9 }}>
                          REVENUE
                        </span>
                      </div>
                      <span
                        style={{
                          flex: 1,
                          height: 6,
                          borderRadius: 3,
                          background: 'var(--panel-track)',
                          marginBottom: 6,
                          overflow: 'hidden',
                        }}
                      >
                        <span
                          style={{
                            display: 'block',
                            width: `${pct}%`,
                            height: '100%',
                            background: 'var(--action)',
                            borderRadius: 3,
                          }}
                        />
                      </span>
                    </div>
                    <button
                      className="btn btn-soft btn-block"
                      style={{ height: 44, fontSize: 14, background: 'var(--panel-2)', color: 'var(--panel-text)' }}
                      onClick={() => navigate({ name: 'sales', eventId: event.id })}
                    >
                      See sales
                    </button>
                  </div>
                )
              })
            )}
            <button
              className="btn btn-primary btn-block"
              style={{ marginTop: 4 }}
              onClick={() => startHosting()}
            >
              Create an event
            </button>
          </>
        )}

        {tab === 'saved' && (
          <>
            <span className="meta">SAVED</span>
            {savedEvents.length === 0 ? (
              <EmptyState
                title="Nothing saved"
                body="Tap the heart on any event to keep it here for later."
              />
            ) : (
              savedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  from={DEFAULT_CENTER}
                  saved={isSaved(event.id)}
                  onToggleSave={() => toggleSaved(event.id)}
                  onOpen={() => navigate({ name: 'event', id: event.id })}
                />
              ))
            )}
          </>
        )}
      </div>

      <TabBar active="profile" />
    </div>
  )
}

export function Settings() {
  const {
    user,
    back,
    navigate,
    updateUser,
    logout,
    factoryReset,
    showToast,
    resetVerification,
    theme,
    resolvedTheme,
    setTheme,
  } = useApp()
  const [name, setName] = useState(user?.name ?? '')
  const [city, setCity] = useState(user?.city ?? '')
  const [notify, setNotify] = useState(true)

  if (!user) {
    return (
      <div className="screen" style={{ background: 'var(--canvas)' }}>
        <StatusBar label="SETTINGS" />
        <div className="pad">
          <button className="iconbtn" onClick={back} aria-label="Go back">
            <IconBack />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen" style={{ background: 'var(--canvas)' }}>
      <StatusBar label="SETTINGS" />
      <div className="row" style={{ padding: '4px 16px 12px', gap: 12 }}>
        <button className="iconbtn" onClick={back} aria-label="Go back">
          <IconBack />
        </button>
        <span style={{ font: '700 17px/1 var(--sans)' }}>Settings</span>
      </div>

      <div className="body pad" style={{ paddingBottom: 60, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card card-lg" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span style={{ font: '700 15px/1 var(--sans)' }}>Profile</span>
          <div className="field">
            <label htmlFor="set-name">Name</label>
            <input
              id="set-name"
              className="input"
              style={{ background: 'var(--field)' }}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="set-city">City</label>
            <input
              id="set-city"
              className="input"
              style={{ background: 'var(--field)' }}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Email</label>
            <div
              className="input"
              style={{
                background: 'var(--field)',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--muted)',
              }}
            >
              {user.email}
            </div>
          </div>
          <button
            className="btn btn-ink btn-block"
            style={{ height: 48 }}
            onClick={() => {
              updateUser({ name: name.trim() || user.name, city: city.trim() || user.city })
              showToast('Profile saved')
            }}
          >
            Save changes
          </button>
        </div>

        <div className="card card-lg" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span style={{ font: '700 15px/1 var(--sans)' }}>Identity</span>
            <span
              className={`tag ${user.verification.status === 'verified' ? 'ok' : 'quiet'}`}
              style={{ height: 22, fontSize: 10 }}
            >
              {user.verification.status === 'verified'
                ? 'Verified'
                : user.verification.status === 'pending'
                  ? 'In review'
                  : 'Not verified'}
            </span>
          </div>
          <span className="body-text">
            {user.verification.status === 'verified'
              ? `Cleared with your ${user.verification.documentKind ? DOCUMENT_LABEL[user.verification.documentKind].toLowerCase() : 'document'}. Hosting is unlocked.`
              : 'Three photos — you, your ID or driver’s licence, and you holding it — unlock event hosting.'}
          </span>
          <div className="row" style={{ gap: 8 }}>
            <button
              className="btn btn-soft"
              style={{ flex: 1, height: 44, fontSize: 14 }}
              onClick={() => navigate({ name: 'verify' })}
            >
              {user.verification.status === 'verified' ? 'View verification' : 'Verify now'}
            </button>
            {user.verification.status === 'verified' && (
              <button
                className="btn btn-ghost"
                style={{ flex: 'none', height: 44, fontSize: 14, padding: '0 16px' }}
                onClick={() => {
                  resetVerification()
                  showToast('Verification cleared — you can run it again')
                }}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="card card-lg" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span style={{ font: '700 15px/1 var(--sans)' }}>Appearance</span>
            <span className="meta">
              {theme === 'system' ? `SYSTEM · ${resolvedTheme.toUpperCase()}` : theme.toUpperCase()}
            </span>
          </div>
          <div className="segmented">
            {(['system', 'light', 'dark'] as ThemePref[]).map((option) => (
              <button
                key={option}
                className={theme === option ? 'on' : undefined}
                onClick={() => setTheme(option)}
                aria-pressed={theme === option}
              >
                {option === 'system' ? 'System' : option === 'light' ? 'Light' : 'Dark'}
              </button>
            ))}
          </div>
          <span className="meta">
            Dark inverts every surface — the streets fall away and the pin photo is the only light.
          </span>
        </div>

        <div className="card card-lg" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ font: '700 15px/1 var(--sans)' }}>Notifications</span>
          <label className="row" style={{ justifyContent: 'space-between' }}>
            <span className="body-text">Event reminders and purchase receipts</span>
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => {
                setNotify(e.target.checked)
                showToast(e.target.checked ? 'Reminders on' : 'Reminders off')
              }}
              style={{ width: 22, height: 22, accentColor: 'var(--action)', appearance: 'auto' }}
            />
          </label>
          <span className="meta">Member since {longDate(user.joined)}</span>
        </div>

        <button className="btn btn-ghost btn-block" onClick={logout}>
          Log out
        </button>
        <button
          className="btn btn-block"
          style={{ background: 'var(--error-bg)', color: 'var(--error-fg)' }}
          onClick={() => {
            if (confirm('Reset all local data back to the demo seed?')) factoryReset()
          }}
        >
          Reset demo data
        </button>
      </div>
    </div>
  )
}

export function Sales({ eventId }: { eventId: string }) {
  const { eventById, db, back, soldFor } = useApp()
  const event = eventById(eventId)

  if (!event) {
    return (
      <div className="screen" style={{ background: 'var(--canvas)' }}>
        <StatusBar label="SALES" />
        <div className="pad">
          <button className="iconbtn" onClick={back} aria-label="Go back">
            <IconBack />
          </button>
        </div>
      </div>
    )
  }

  const { sold, total, revenue } = soldFor(event)
  const orders = db.orders.filter((o) => o.eventId === event.id)

  return (
    <div className="screen" style={{ background: 'var(--canvas)' }}>
      <StatusBar label="SALES" />
      <div className="row" style={{ padding: '4px 16px 12px', gap: 12 }}>
        <button className="iconbtn" onClick={back} aria-label="Go back">
          <IconBack />
        </button>
        <div className="col" style={{ gap: 2, minWidth: 0 }}>
          <span style={{ font: '700 17px/1 var(--sans)' }}>{event.title}</span>
          <span className="meta">{dateTimeLine(event.startsAt).toUpperCase()}</span>
        </div>
      </div>

      <div className="body pad" style={{ paddingBottom: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="row" style={{ gap: 12 }}>
          <div className="card card-lg" style={{ flex: 1, padding: 16 }}>
            <span style={{ font: '800 26px/1 var(--sans)' }}>{sold}</span>
            <div className="meta" style={{ marginTop: 6 }}>
              SOLD / {total}
            </div>
          </div>
          <div className="card card-lg" style={{ flex: 1, padding: 16 }}>
            <span style={{ font: '800 26px/1 var(--sans)' }}>{money(revenue)}</span>
            <div className="meta" style={{ marginTop: 6 }}>
              GROSS REVENUE
            </div>
          </div>
        </div>

        <span className="meta">BY TICKET TYPE</span>
        {event.ticketTypes.map((t) => {
          const pct = t.quantity ? Math.round((t.sold / t.quantity) * 100) : 0
          return (
            <div key={t.id} className="card card-lg" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span style={{ font: '700 14px/1 var(--sans)' }}>{t.name}</span>
                <span className="mono" style={{ fontSize: 13 }}>
                  {money(t.price * t.sold)}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'var(--field)', overflow: 'hidden' }}>
                <span
                  style={{
                    display: 'block',
                    width: `${pct}%`,
                    height: '100%',
                    background: 'var(--action)',
                  }}
                />
              </div>
              <span className="meta">
                {t.sold} / {t.quantity} · {pct}%
              </span>
            </div>
          )
        })}

        <span className="meta" style={{ marginTop: 4 }}>
          ORDERS IN THIS APP
        </span>
        {orders.length === 0 ? (
          <span className="body-text" style={{ color: 'var(--muted)' }}>
            No orders placed through this device yet.
          </span>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="col" style={{ gap: 3, minWidth: 0 }}>
                <span className="mono" style={{ font: '500 12px/1 var(--mono)' }}>
                  {o.code}
                </span>
                <span className="meta">
                  {o.items.map((i) => `${i.qty}× ${i.name}`).join(' · ').toUpperCase()}
                </span>
              </div>
              <div className="spacer" />
              <span style={{ font: '700 14px/1 var(--sans)' }}>{money(o.total)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
