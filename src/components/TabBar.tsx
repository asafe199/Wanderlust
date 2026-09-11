import { useApp, type Route } from '../store'
import { IconMap, IconPlus, IconSearch, IconTicket, IconUser } from './ui'

type TabId = 'map' | 'search' | 'tickets' | 'profile'

const TABS: { id: TabId; label: string; icon: () => JSX.Element }[] = [
  { id: 'map', label: 'Map', icon: () => <IconMap size={18} /> },
  { id: 'search', label: 'Search', icon: () => <IconSearch size={18} /> },
  { id: 'tickets', label: 'Tickets', icon: () => <IconTicket size={18} /> },
  { id: 'profile', label: 'You', icon: () => <IconUser size={18} /> },
]

export default function TabBar({ active }: { active: TabId }) {
  const { navigate, user, showToast, startHosting } = useApp()

  const go = (id: TabId) => {
    if ((id === 'tickets' || id === 'profile') && !user) {
      showToast('Log in to see your tickets')
      navigate({ name: 'login' })
      return
    }
    navigate({ name: id } as Route, { reset: true })
  }

  const create = () => startHosting()

  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.slice(0, 2).map((t) => (
        <button
          key={t.id}
          className={active === t.id ? 'on' : undefined}
          onClick={() => go(t.id)}
          aria-current={active === t.id}
        >
          {t.icon()}
          {active === t.id && t.label}
        </button>
      ))}
      <button className="create" onClick={create} aria-label="Create event">
        <IconPlus size={22} />
      </button>
      {TABS.slice(2).map((t) => (
        <button
          key={t.id}
          className={active === t.id ? 'on' : undefined}
          onClick={() => go(t.id)}
          aria-current={active === t.id}
        >
          {t.icon()}
          {active === t.id && t.label}
        </button>
      ))}
    </nav>
  )
}
