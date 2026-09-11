import { useState } from 'react'
import { PROMOS, SERVICE_FEE_RATE, useApp } from '../store'
import { IconBack, StatusBar } from '../components/ui'
import { dateTimeLine, money } from '../lib/format'
import type { OrderItem } from '../lib/types'

const PAYMENT_METHODS = [
  { id: 'visa', label: 'Visa ·· 4417', note: 'DEFAULT' },
  { id: 'pix', label: 'Instant bank transfer', note: 'NO FEE' },
  { id: 'apple', label: 'Apple Pay', note: 'TOUCH TO CONFIRM' },
]

export default function Checkout({ id }: { id: string }) {
  const { eventById, back, navigate, purchase, showToast } = useApp()
  const event = eventById(id)
  const [qty, setQty] = useState<Record<string, number>>({})
  const [promoInput, setPromoInput] = useState('')
  const [promo, setPromo] = useState<string | null>(null)
  const [method, setMethod] = useState(PAYMENT_METHODS[0].id)
  const [busy, setBusy] = useState(false)

  if (!event) {
    return (
      <div className="screen" style={{ background: 'var(--canvas)' }}>
        <StatusBar label="CHECKOUT" />
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

  const items: OrderItem[] = event.ticketTypes
    .filter((t) => (qty[t.id] ?? 0) > 0)
    .map((t) => ({ ticketTypeId: t.id, name: t.name, price: t.price, qty: qty[t.id] }))

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const rate = promo ? (PROMOS[promo] ?? 0) : 0
  const discount = Math.round(subtotal * rate)
  const fee = Math.round((subtotal - discount) * SERVICE_FEE_RATE)
  const total = subtotal - discount + fee
  const count = items.reduce((s, i) => s + i.qty, 0)

  const bump = (ticketId: string, delta: number, max: number) =>
    setQty((prev) => {
      const next = Math.max(0, Math.min(max, (prev[ticketId] ?? 0) + delta))
      return { ...prev, [ticketId]: next }
    })

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase()
    if (!code) return
    if (PROMOS[code]) {
      setPromo(code)
      showToast(`${code} applied — ${Math.round(PROMOS[code] * 100)}% off`)
    } else {
      setPromo(null)
      showToast('That code is not valid')
    }
  }

  const pay = async () => {
    if (count === 0) return
    setBusy(true)
    try {
      // Stand-in for the payment gateway round trip.
      await new Promise((resolve) => setTimeout(resolve, 900))
      const order = await purchase(event.id, items, promo)
      navigate({ name: 'confirmation', orderId: order.id }, { replace: true })
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="screen" style={{ background: 'var(--canvas)' }}>
      <StatusBar label="CHECKOUT" />
      <div className="row" style={{ padding: '4px 16px 12px', gap: 12 }}>
        <button className="iconbtn" onClick={back} aria-label="Go back">
          <IconBack />
        </button>
        <span style={{ font: '700 17px/1 var(--sans)' }}>Your order</span>
      </div>

      <div className="body" style={{ padding: '0 16px 140px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="card card-lg" style={{ padding: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
          <img
            src={event.cover}
            alt=""
            style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover', flex: 'none' }}
          />
          <div className="col" style={{ gap: 4, minWidth: 0 }}>
            <span style={{ font: '700 15px/1.1 var(--sans)' }}>{event.title}</span>
            <span className="meta">
              {dateTimeLine(event.startsAt).toUpperCase()} · {event.venue.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="card card-lg" style={{ padding: 6 }}>
          {event.ticketTypes.map((t, i) => {
            const remaining = Math.max(0, t.quantity - t.sold)
            const value = qty[t.id] ?? 0
            return (
              <div key={t.id}>
                {i > 0 && <div style={{ height: 1, background: 'var(--line)', margin: '0 12px' }} />}
                <div className="row" style={{ padding: 12, justifyContent: 'space-between' }}>
                  <div className="col" style={{ gap: 3 }}>
                    <span style={{ font: '700 14px/1 var(--sans)' }}>{t.name}</span>
                    <span className="meta">
                      {money(t.price)} · {remaining > 0 ? `${remaining} LEFT` : 'SOLD OUT'}
                    </span>
                  </div>
                  <div className="stepper">
                    <button
                      onClick={() => bump(t.id, -1, remaining)}
                      disabled={value === 0}
                      aria-label={`One less ${t.name}`}
                    >
                      −
                    </button>
                    <span className="qty" style={{ color: value ? 'var(--ink)' : 'var(--faint)' }}>
                      {value}
                    </span>
                    <button
                      className={value < remaining ? 'plus' : undefined}
                      onClick={() => bump(t.id, 1, Math.min(remaining, 10))}
                      disabled={value >= Math.min(remaining, 10)}
                      aria-label={`One more ${t.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="row" style={{ gap: 8 }}>
          <input
            className="input"
            style={{ height: 48, flex: 1 }}
            placeholder="Promo code"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            aria-label="Promo code"
          />
          <button className="btn btn-ink" style={{ height: 48, padding: '0 20px', fontSize: 14 }} onClick={applyPromo}>
            Apply
          </button>
        </div>

        <div className="card card-lg" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.length === 0 && (
            <span className="body-text" style={{ color: 'var(--muted)' }}>
              Pick at least one ticket to see the total.
            </span>
          )}
          {items.map((i) => (
            <div key={i.ticketTypeId} className="row" style={{ justifyContent: 'space-between' }}>
              <span style={{ font: '400 14px/1 var(--sans)', color: 'var(--ink-soft)' }}>
                {i.qty} × {i.name}
              </span>
              <span className="mono" style={{ fontSize: 13 }}>
                {money(i.price * i.qty)}
              </span>
            </div>
          ))}
          {discount > 0 && (
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span style={{ font: '400 14px/1 var(--sans)', color: 'var(--success)' }}>
                Promo {promo}
              </span>
              <span className="mono" style={{ fontSize: 13, color: 'var(--success)' }}>
                −{money(discount)}
              </span>
            </div>
          )}
          {items.length > 0 && (
            <>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span style={{ font: '400 14px/1 var(--sans)', color: 'var(--ink-soft)' }}>
                  Service fee
                </span>
                <span className="mono" style={{ fontSize: 13 }}>
                  {money(fee)}
                </span>
              </div>
              <div style={{ height: 1, background: 'var(--line)' }} />
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ font: '700 15px/1 var(--sans)' }}>Total</span>
                <span style={{ font: '800 22px/1 var(--sans)' }}>{money(total)}</span>
              </div>
            </>
          )}
        </div>

        <div className="card card-lg" style={{ padding: 6 }}>
          {PAYMENT_METHODS.map((m, i) => (
            <div key={m.id}>
              {i > 0 && <div style={{ height: 1, background: 'var(--line)', margin: '0 12px' }} />}
              <button
                onClick={() => setMethod(m.id)}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <span
                  style={{
                    width: 40,
                    height: 28,
                    borderRadius: 6,
                    background: method === m.id ? 'var(--action)' : 'var(--contrast)',
                    flex: 'none',
                  }}
                />
                <div className="col" style={{ gap: 2 }}>
                  <span style={{ font: '700 13px/1 var(--sans)' }}>{m.label}</span>
                  <span className="meta">{m.note}</span>
                </div>
                <div className="spacer" />
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    border: `2px solid ${method === m.id ? 'var(--action)' : 'var(--line-strong)'}`,
                    background:
                      method === m.id
                        ? 'radial-gradient(circle, var(--action) 0 42%, transparent 44%)'
                        : 'transparent',
                    flex: 'none',
                  }}
                />
              </button>
            </div>
          ))}
        </div>

        <span className="body-text" style={{ color: 'var(--faint)', fontSize: 12 }}>
          Demo checkout — no card is charged and no card data is stored. Wire this screen to a
          certified gateway before going live.
        </span>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 'calc(26px + var(--safe-bottom))',
        }}
      >
        <button
          className="btn btn-primary btn-block"
          style={{ height: 58 }}
          onClick={pay}
          disabled={count === 0 || busy}
        >
          {busy ? 'Processing…' : count === 0 ? 'Select tickets' : `Pay ${money(total)}`}
        </button>
      </div>
    </div>
  )
}
