import { useMemo, useState } from 'react'
import { useApp } from '../store'
import TabBar from '../components/TabBar'
import ChipRail from '../components/ChipRail'
import { EventCard, fromPrice } from '../components/cards'
import { EmptyState, IconClose, IconSearch, StatusBar } from '../components/ui'
import { CATEGORIES, type CategoryId } from '../lib/types'
import { DEFAULT_CENTER } from '../lib/seed'

type Sort = 'soon' | 'near' | 'cheap'

export default function Search() {
  const { db, navigate, isSaved, toggleSaved, user, showToast } = useApp()
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<CategoryId | null>(null)
  const [sort, setSort] = useState<Sort>('soon')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = db.events
      .filter((e) => e.status === 'published')
      .filter((e) => !cat || e.category === cat)
      .filter(
        (e) =>
          !q ||
          e.title.toLowerCase().includes(q) ||
          e.venue.toLowerCase().includes(q) ||
          e.address.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.organizerName.toLowerCase().includes(q),
      )
    const sorted = [...list]
    if (sort === 'soon') sorted.sort((a, b) => a.startsAt - b.startsAt)
    if (sort === 'cheap') sorted.sort((a, b) => fromPrice(a) - fromPrice(b))
    if (sort === 'near')
      sorted.sort(
        (a, b) =>
          Math.hypot(a.lat - DEFAULT_CENTER[0], a.lng - DEFAULT_CENTER[1]) -
          Math.hypot(b.lat - DEFAULT_CENTER[0], b.lng - DEFAULT_CENTER[1]),
      )
    return sorted
  }, [db.events, query, cat, sort])

  return (
    <div className="screen" style={{ background: 'var(--canvas)' }}>
      <StatusBar label="SEARCH" />
      <div className="pad" style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 12 }}>
        <div style={{ position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: 16,
              top: 17,
              color: 'var(--faint)',
              pointerEvents: 'none',
            }}
          >
            <IconSearch size={18} />
          </span>
          <input
            className="input"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, venues, vibes"
            style={{ paddingLeft: 44, paddingRight: 44 }}
            aria-label="Search events"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear search"
              style={{
                position: 'absolute',
                right: 10,
                top: 10,
                width: 34,
                height: 34,
                border: 'none',
                borderRadius: 999,
                background: 'var(--field)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconClose size={16} />
            </button>
          )}
        </div>

        <ChipRail>
          <button
            className={`pill${cat === null ? ' active' : ''}`}
            onClick={() => setCat(null)}
            style={{ flex: 'none' }}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`pill${cat === c.id ? ' active' : ''}`}
              onClick={() => setCat(c.id)}
              style={{ flex: 'none' }}
            >
              <span
                style={{ width: 8, height: 8, borderRadius: 999, background: c.color, display: 'inline-block' }}
              />
              {c.label}
            </button>
          ))}
        </ChipRail>

        <div className="row" style={{ gap: 8 }}>
          <span className="meta">SORT</span>
          {(['soon', 'near', 'cheap'] as Sort[]).map((s) => (
            <button
              key={s}
              className={`pill flat${sort === s ? ' active' : ''}`}
              style={{ height: 30, fontSize: 12 }}
              onClick={() => setSort(s)}
            >
              {s === 'soon' ? 'Soonest' : s === 'near' ? 'Closest' : 'Cheapest'}
            </button>
          ))}
        </div>
      </div>

      <div
        className="body pad"
        style={{ paddingBottom: 120, display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        <span className="meta">
          {results.length} {results.length === 1 ? 'EVENT' : 'EVENTS'}
        </span>
        {results.length === 0 ? (
          <EmptyState
            title="No events found"
            body="Try a different word, or clear the category filter to widen the search."
            action={
              <button
                className="btn btn-ink btn-sm"
                style={{ marginTop: 4 }}
                onClick={() => {
                  setQuery('')
                  setCat(null)
                }}
              >
                Clear filters
              </button>
            }
          />
        ) : (
          results.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              from={DEFAULT_CENTER}
              saved={isSaved(e.id)}
              onToggleSave={() => {
                if (!user) {
                  showToast('Log in to save events')
                  navigate({ name: 'login' })
                  return
                }
                toggleSaved(e.id)
              }}
              onOpen={() => navigate({ name: 'event', id: e.id })}
            />
          ))
        )}
      </div>
      <TabBar active="search" />
    </div>
  )
}
