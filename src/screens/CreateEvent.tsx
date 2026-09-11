import { useMemo, useRef, useState } from 'react'
import { useApp } from '../store'
import MapView from '../components/MapView'
import {
  IconBack,
  IconClose,
  IconImage,
  IconPlus,
  StatusBar,
} from '../components/ui'
import { CATEGORIES, type CategoryId, type TicketType, type WlEvent } from '../lib/types'
import { DEFAULT_CENTER } from '../lib/seed'
import { readImageCompressed } from '../lib/storage'
import {
  dateTimeLine,
  fromDateTimeInput,
  money,
  toDateInput,
  toTimeInput,
  uid,
} from '../lib/format'

const STEPS = ['Basics', 'Location', 'When', 'Photos', 'Tickets', 'Review'] as const

/** Escape hatch so the flow is usable (and demoable) without a camera roll. */
const STOCK_COVERS = [
  'https://picsum.photos/seed/wl-stock-neon/900/600',
  'https://picsum.photos/seed/wl-stock-stage/900/600',
  'https://picsum.photos/seed/wl-stock-table/900/600',
  'https://picsum.photos/seed/wl-stock-studio/900/600',
]

interface Draft {
  title: string
  category: CategoryId
  description: string
  venue: string
  address: string
  lat: number
  lng: number
  date: string
  startTime: string
  endTime: string
  cover: string
  gallery: string[]
  ticketTypes: TicketType[]
}

const blankDraft = (): Draft => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 7)
  return {
    title: '',
    category: 'nightlife',
    description: '',
    venue: '',
    address: '',
    lat: DEFAULT_CENTER[0],
    lng: DEFAULT_CENTER[1],
    date: toDateInput(tomorrow.getTime()),
    startTime: '21:00',
    endTime: '23:30',
    cover: '',
    gallery: [],
    ticketTypes: [
      { id: uid('tt'), name: 'General', price: 2000, quantity: 100, sold: 0 },
    ],
  }
}

const draftFromEvent = (event: WlEvent): Draft => ({
  title: event.title,
  category: event.category,
  description: event.description,
  venue: event.venue,
  address: event.address,
  lat: event.lat,
  lng: event.lng,
  date: toDateInput(event.startsAt),
  startTime: toTimeInput(event.startsAt),
  endTime: toTimeInput(event.endsAt),
  cover: event.cover,
  gallery: event.gallery,
  ticketTypes: event.ticketTypes,
})

export default function CreateEvent({ eventId }: { eventId?: string }) {
  const { user, eventById, upsertEvent, deleteEvent, navigate, back, showToast } = useApp()
  const existing = eventId ? eventById(eventId) : undefined
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>(() => (existing ? draftFromEvent(existing) : blankDraft()))
  const [error, setError] = useState<string | null>(null)
  const [geocoding, setGeocoding] = useState(false)
  const coverInput = useRef<HTMLInputElement | null>(null)
  const galleryInput = useRef<HTMLInputElement | null>(null)

  const patch = (values: Partial<Draft>) => {
    setDraft((prev) => ({ ...prev, ...values }))
    setError(null)
  }

  const startsAt = useMemo(
    () => fromDateTimeInput(draft.date, draft.startTime),
    [draft.date, draft.startTime],
  )
  const endsAt = useMemo(() => {
    const end = fromDateTimeInput(draft.date, draft.endTime)
    return end <= startsAt ? end + 86400000 : end
  }, [draft.date, draft.endTime, startsAt])

  if (!user) {
    return (
      <div className="screen" style={{ background: 'var(--canvas)' }}>
        <StatusBar label="NEW EVENT" />
        <div className="pad" style={{ paddingTop: 24 }}>
          <p className="body-text">Log in to publish an event.</p>
          <button className="btn btn-primary btn-block" onClick={() => navigate({ name: 'login' })}>
            Log in
          </button>
        </div>
      </div>
    )
  }

  /* Hosting is gated on identity — this also covers landing here directly. */
  if (user.verification.status !== 'verified') {
    return (
      <div className="screen" style={{ background: 'var(--canvas)' }}>
        <StatusBar label="NEW EVENT" />
        <div className="row" style={{ padding: '4px 16px 12px', gap: 12 }}>
          <button className="iconbtn" onClick={back} aria-label="Go back">
            <IconBack />
          </button>
        </div>
        <div className="body pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 className="title" style={{ fontSize: 26 }}>
            Verify your identity first.
          </h2>
          <p className="body-text">
            {user.verification.status === 'pending'
              ? 'Your documents are being checked. Hosting unlocks as soon as that clears.'
              : 'Publishing an event means selling tickets, so we check who you are: a photo of you, a photo of your ID or driver’s licence, and one of you holding it next to your face.'}
          </p>
          {user.verification.status !== 'pending' && (
            <button
              className="btn btn-primary btn-block"
              onClick={() => navigate({ name: 'verify' }, { replace: true })}
            >
              Start verification
            </button>
          )}
        </div>
      </div>
    )
  }

  const validate = (index: number): string | null => {
    if (index === 0) {
      if (draft.title.trim().length < 3) return 'Give the event a name.'
      if (draft.description.trim().length < 12) return 'Describe it in at least a sentence.'
    }
    if (index === 1) {
      if (draft.venue.trim().length < 2) return 'Name the venue.'
      if (draft.address.trim().length < 4) return 'Add a street address.'
    }
    if (index === 2) {
      if (!draft.date) return 'Pick a date.'
      if (startsAt < Date.now()) return 'That date is already in the past.'
    }
    if (index === 3) {
      if (!draft.cover) return 'A cover photo is required — it becomes your map pin.'
    }
    if (index === 4) {
      if (draft.ticketTypes.length === 0) return 'Add at least one ticket type.'
      if (draft.ticketTypes.some((t) => !t.name.trim())) return 'Every ticket type needs a name.'
      if (draft.ticketTypes.some((t) => t.quantity <= 0)) return 'Quantity must be at least 1.'
    }
    return null
  }

  const next = () => {
    const problem = validate(step)
    if (problem) return setError(problem)
    setError(null)
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
  }

  const buildEvent = (status: WlEvent['status']): WlEvent => ({
    id: existing?.id ?? uid('evt'),
    title: draft.title.trim(),
    description: draft.description.trim(),
    category: draft.category,
    cover: draft.cover,
    gallery: draft.gallery.length ? draft.gallery : [draft.cover],
    lat: draft.lat,
    lng: draft.lng,
    venue: draft.venue.trim(),
    address: draft.address.trim(),
    startsAt,
    endsAt,
    ticketTypes: draft.ticketTypes,
    organizerId: user.id,
    organizerName: user.name,
    status,
    createdAt: existing?.createdAt ?? Date.now(),
  })

  const saveDraft = () => {
    if (!draft.title.trim()) return setError('Name it before saving a draft.')
    upsertEvent(buildEvent('draft'))
    showToast('Draft saved to My events')
    navigate({ name: 'profile' }, { reset: true })
  }

  const publish = () => {
    for (let i = 0; i < STEPS.length - 1; i += 1) {
      const problem = validate(i)
      if (problem) {
        setStep(i)
        return setError(problem)
      }
    }
    const event = buildEvent('published')
    upsertEvent(event)
    showToast(existing ? 'Event updated' : 'Event published — it is on the map')
    navigate({ name: 'map', focus: event.id }, { reset: true })
  }

  const pickCover = async (file?: File) => {
    if (!file) return
    try {
      patch({ cover: await readImageCompressed(file) })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read that image')
    }
  }

  const addGallery = async (files: FileList | null) => {
    if (!files?.length) return
    try {
      const shots = await Promise.all(
        Array.from(files).slice(0, 8 - draft.gallery.length).map((f) => readImageCompressed(f, 1000, 0.7)),
      )
      patch({ gallery: [...draft.gallery, ...shots].slice(0, 8) })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read those images')
    }
  }

  const geocode = async () => {
    const query = `${draft.venue} ${draft.address}`.trim()
    if (query.length < 4) return setError('Type a venue or address to look up.')
    setGeocoding(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
        { headers: { Accept: 'application/json' } },
      )
      const hits = (await res.json()) as { lat: string; lon: string; display_name: string }[]
      if (!hits.length) {
        showToast('No match — drag the pin instead')
        return
      }
      patch({ lat: Number(hits[0].lat), lng: Number(hits[0].lon) })
      showToast('Pin moved to that address')
    } catch {
      showToast('Lookup unavailable — drag the pin instead')
    } finally {
      setGeocoding(false)
    }
  }

  const updateTicket = (id: string, values: Partial<TicketType>) =>
    patch({
      ticketTypes: draft.ticketTypes.map((t) => (t.id === id ? { ...t, ...values } : t)),
    })

  return (
    <div className="screen" style={{ background: 'var(--canvas)' }}>
      <StatusBar label={existing ? 'EDIT EVENT' : 'NEW EVENT'} />

      <div className="pad" style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 14 }}>
        <div className="row" style={{ gap: 12 }}>
          <button
            className="iconbtn"
            onClick={() => (step === 0 ? back() : setStep((s) => s - 1))}
            aria-label="Go back"
          >
            <IconBack />
          </button>
          <div className="col" style={{ gap: 2 }}>
            <span style={{ font: '700 16px/1 var(--sans)' }}>{STEPS[step]}</span>
            <span className="meta">
              STEP {step + 1} OF {STEPS.length}
            </span>
          </div>
          <div className="spacer" />
          <button className="pill" onClick={saveDraft} style={{ flex: 'none' }}>
            Save draft
          </button>
        </div>
        <div className="progress">
          {STEPS.map((s, i) => (
            <span key={s} className={i <= step ? 'on' : undefined} />
          ))}
        </div>
      </div>

      <div
        className="body pad"
        style={{ paddingBottom: 120, display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        {step === 0 && (
          <>
            <div className="field">
              <label htmlFor="c-title">Event name</label>
              <input
                id="c-title"
                className="input"
                value={draft.title}
                onChange={(e) => patch({ title: e.target.value })}
                placeholder="Supper Club No. 5"
              />
            </div>
            <div className="field">
              <label>Category</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    className={`pill${draft.category === c.id ? ' active' : ''}`}
                    onClick={() => patch({ category: c.id })}
                  >
                    <span
                      style={{ width: 8, height: 8, borderRadius: 999, background: c.color, display: 'inline-block' }}
                    />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label htmlFor="c-desc">Description</label>
              <textarea
                id="c-desc"
                className="input"
                value={draft.description}
                onChange={(e) => patch({ description: e.target.value })}
                placeholder="What happens, who is playing, what to bring."
              />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="field">
              <label htmlFor="c-venue">Venue</label>
              <input
                id="c-venue"
                className="input"
                value={draft.venue}
                onChange={(e) => patch({ venue: e.target.value })}
                placeholder="The Wick Terrace"
              />
            </div>
            <div className="field">
              <label htmlFor="c-address">Address</label>
              <input
                id="c-address"
                className="input"
                value={draft.address}
                onChange={(e) => patch({ address: e.target.value })}
                placeholder="260 Meserole St, Brooklyn NY"
              />
            </div>
            <button className="btn btn-ink btn-block" style={{ height: 48 }} onClick={geocode} disabled={geocoding}>
              {geocoding ? 'Looking up…' : 'Find this address on the map'}
            </button>
            <div style={{ position: 'relative', height: 280, borderRadius: 22, overflow: 'hidden' }}>
              <MapView
                events={[]}
                center={[draft.lat, draft.lng]}
                zoom={15}
                pickMode
                pickAt={[draft.lat, draft.lng]}
                onPick={(lat, lng) => patch({ lat, lng })}
              />
            </div>
            <span className="meta">
              TAP OR DRAG THE PIN · {draft.lat.toFixed(4)}, {draft.lng.toFixed(4)}
            </span>
          </>
        )}

        {step === 2 && (
          <>
            <div className="field">
              <label htmlFor="c-date">Date</label>
              <input
                id="c-date"
                className="input"
                type="date"
                value={draft.date}
                onChange={(e) => patch({ date: e.target.value })}
              />
            </div>
            <div className="row" style={{ gap: 12, alignItems: 'flex-end' }}>
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="c-start">Starts</label>
                <input
                  id="c-start"
                  className="input"
                  type="time"
                  value={draft.startTime}
                  onChange={(e) => patch({ startTime: e.target.value })}
                />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="c-end">Ends</label>
                <input
                  id="c-end"
                  className="input"
                  type="time"
                  value={draft.endTime}
                  onChange={(e) => patch({ endTime: e.target.value })}
                />
              </div>
            </div>
            <div className="card card-lg" style={{ padding: 16 }}>
              <span className="meta">PREVIEW</span>
              <div style={{ font: '700 15px/1.3 var(--sans)', marginTop: 8 }}>
                {dateTimeLine(startsAt, endsAt)}
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="col" style={{ gap: 8 }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ font: '700 15px/1 var(--sans)' }}>Cover photo</span>
                <span className="mono" style={{ font: '500 10px/1 var(--mono)', color: 'var(--action-text)' }}>
                  BECOMES YOUR MAP PIN
                </span>
              </div>
              <input
                ref={coverInput}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => pickCover(e.target.files?.[0])}
              />
              {draft.cover ? (
                <div style={{ position: 'relative', height: 180, borderRadius: 22, overflow: 'hidden' }}>
                  <img
                    src={draft.cover}
                    alt="Cover preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    className="pill"
                    style={{ position: 'absolute', top: 12, right: 12 }}
                    onClick={() => coverInput.current?.click()}
                  >
                    Replace
                  </button>
                  <div
                    className="row"
                    style={{ position: 'absolute', left: 14, bottom: 14, gap: 10 }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 999,
                        background: '#fff',
                        padding: 3,
                        boxShadow: '0 8px 18px rgba(0,0,0,.24)',
                      }}
                    >
                      <img
                        src={draft.cover}
                        alt=""
                        style={{ width: '100%', height: '100%', borderRadius: 999, objectFit: 'cover' }}
                      />
                    </div>
                    <span
                      className="mono"
                      style={{
                        font: '500 10px/1.4 var(--mono)',
                        color: '#fff',
                        background: 'rgba(10,10,10,.6)',
                        padding: '6px 9px',
                        borderRadius: 8,
                      }}
                    >
                      PIN PREVIEW
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => coverInput.current?.click()}
                  style={{
                    height: 180,
                    borderRadius: 22,
                    border: '2px dashed var(--line-strong)',
                    background: 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    color: 'var(--muted)',
                  }}
                >
                  <IconImage size={22} />
                  <span style={{ font: '600 13px/1 var(--sans)', color: 'var(--ink)' }}>
                    Upload cover photo
                  </span>
                  <span className="meta">COMPRESSED AUTOMATICALLY</span>
                </button>
              )}
            </div>

            <div className="col" style={{ gap: 8 }}>
              <span className="meta">OR PICK A STOCK COVER</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {STOCK_COVERS.map((src) => (
                  <button
                    key={src}
                    onClick={() => patch({ cover: src })}
                    aria-label="Use this cover"
                    style={{
                      aspectRatio: '1',
                      borderRadius: 14,
                      overflow: 'hidden',
                      border: draft.cover === src ? '2px solid var(--action)' : 'none',
                      padding: 0,
                      background: 'none',
                    }}
                  >
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            </div>

            <div className="col" style={{ gap: 8 }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ font: '700 15px/1 var(--sans)' }}>Gallery</span>
                <span className="meta">{draft.gallery.length}/8</span>
              </div>
              <input
                ref={galleryInput}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => addGallery(e.target.files)}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {draft.gallery.map((src, i) => (
                  <div key={`${src.slice(-12)}-${i}`} style={{ position: 'relative', aspectRatio: '1', borderRadius: 14, overflow: 'hidden' }}>
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      onClick={() => patch({ gallery: draft.gallery.filter((_, j) => j !== i) })}
                      aria-label="Remove photo"
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 22,
                        height: 22,
                        border: 'none',
                        borderRadius: 999,
                        background: 'rgba(10,10,10,.7)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconClose size={12} />
                    </button>
                  </div>
                ))}
                {draft.gallery.length < 8 && (
                  <button
                    onClick={() => galleryInput.current?.click()}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 14,
                      border: '2px dashed var(--line-strong)',
                      background: 'transparent',
                      color: 'var(--faint)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-label="Add gallery photos"
                  >
                    <IconPlus size={20} />
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            {draft.ticketTypes.map((t) => (
              <div key={t.id} className="card card-lg" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="row">
                  <input
                    className="input"
                    style={{ background: 'var(--field)', height: 48, flex: 1 }}
                    value={t.name}
                    onChange={(e) => updateTicket(t.id, { name: e.target.value })}
                    placeholder="General"
                    aria-label="Ticket name"
                  />
                  {draft.ticketTypes.length > 1 && (
                    <button
                      className="iconbtn"
                      style={{ background: 'var(--field)', boxShadow: 'none' }}
                      onClick={() =>
                        patch({ ticketTypes: draft.ticketTypes.filter((x) => x.id !== t.id) })
                      }
                      aria-label={`Remove ${t.name}`}
                    >
                      <IconClose size={16} />
                    </button>
                  )}
                </div>
                <div className="row" style={{ gap: 12 }}>
                  <div className="field" style={{ flex: 1 }}>
                    <label>Price (USD)</label>
                    <input
                      className="input"
                      style={{ background: 'var(--field)', height: 48 }}
                      type="number"
                      min={0}
                      step="0.5"
                      value={(t.price / 100).toString()}
                      onChange={(e) =>
                        updateTicket(t.id, { price: Math.max(0, Math.round(Number(e.target.value) * 100)) })
                      }
                    />
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <label>Quantity</label>
                    <input
                      className="input"
                      style={{ background: 'var(--field)', height: 48 }}
                      type="number"
                      min={1}
                      value={t.quantity}
                      onChange={(e) =>
                        updateTicket(t.id, { quantity: Math.max(1, Math.round(Number(e.target.value))) })
                      }
                    />
                  </div>
                </div>
                <label className="row" style={{ gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={t.price === 0}
                    onChange={(e) => updateTicket(t.id, { price: e.target.checked ? 0 : 2000 })}
                    style={{ width: 20, height: 20, accentColor: 'var(--action)', appearance: 'auto' }}
                  />
                  <span className="body-text">Free ticket</span>
                </label>
                {t.sold > 0 && <span className="meta">{t.sold} ALREADY SOLD</span>}
              </div>
            ))}
            <button
              className="btn btn-ghost btn-block"
              style={{ height: 48 }}
              onClick={() =>
                patch({
                  ticketTypes: [
                    ...draft.ticketTypes,
                    { id: uid('tt'), name: '', price: 4500, quantity: 50, sold: 0 },
                  ],
                })
              }
            >
              <IconPlus size={18} /> Add ticket type
            </button>
          </>
        )}

        {step === 5 && (
          <>
            {draft.cover && (
              <div style={{ height: 180, borderRadius: 22, overflow: 'hidden' }}>
                <img src={draft.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div className="card card-lg" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ font: '700 14px/1 var(--sans)' }}>Recap</span>
              {[
                ['Name', draft.title || '—'],
                ['Category', CATEGORIES.find((c) => c.id === draft.category)?.label ?? '—'],
                ['Where', draft.venue ? `${draft.venue} · ${draft.address}` : '—'],
                ['When', dateTimeLine(startsAt, endsAt)],
                ['Photos', `${draft.cover ? 1 : 0} cover · ${draft.gallery.length} gallery`],
              ].map(([label, value]) => (
                <div key={label} className="row" style={{ justifyContent: 'space-between', gap: 16 }}>
                  <span style={{ font: '400 13px/1.3 var(--sans)', color: 'var(--ink-soft)' }}>{label}</span>
                  <span style={{ font: '600 13px/1.3 var(--sans)', textAlign: 'right' }}>{value}</span>
                </div>
              ))}
            </div>
            <div className="card card-lg" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ font: '700 14px/1 var(--sans)' }}>Tickets</span>
              {draft.ticketTypes.map((t) => (
                <div key={t.id} className="row" style={{ justifyContent: 'space-between' }}>
                  <span style={{ font: '400 13px/1 var(--sans)', color: 'var(--ink-soft)' }}>
                    {t.name || 'Unnamed'} · {t.quantity}
                  </span>
                  <span className="mono" style={{ fontSize: 13 }}>
                    {money(t.price)}
                  </span>
                </div>
              ))}
            </div>
            {existing && (
              <button
                className="btn btn-block"
                style={{ background: 'var(--error-bg)', color: 'var(--error-fg)', height: 48 }}
                onClick={() => {
                  if (confirm('Delete this event for good?')) {
                    deleteEvent(existing.id)
                    showToast('Event deleted')
                    navigate({ name: 'profile' }, { reset: true })
                  }
                }}
              >
                Delete event
              </button>
            )}
          </>
        )}

        {error && <span className="error-text">{error}</span>}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 'calc(26px + var(--safe-bottom))',
        }}
      >
        {step < STEPS.length - 1 ? (
          <button className="btn btn-primary btn-block" onClick={next}>
            Continue
          </button>
        ) : (
          <button className="btn btn-primary btn-block" onClick={publish}>
            {existing?.status === 'published' ? 'Save changes' : 'Publish event'}
          </button>
        )}
      </div>
    </div>
  )
}
