import { useApp } from './store'
import { Toast } from './components/ui'
import Onboarding from './screens/Onboarding'
import { Login, Signup } from './screens/Auth'
import MapHome from './screens/MapHome'
import Search from './screens/Search'
import EventDetail from './screens/EventDetail'
import Checkout from './screens/Checkout'
import Confirmation from './screens/Confirmation'
import Tickets, { TicketDetail } from './screens/Tickets'
import Profile, { Sales, Settings } from './screens/Profile'
import CreateEvent from './screens/CreateEvent'
import Verify from './screens/Verify'

export default function App() {
  const { route, toast } = useApp()

  const screen = (() => {
    switch (route.name) {
      case 'onboarding':
        return <Onboarding />
      case 'login':
        return <Login />
      case 'signup':
        return <Signup />
      case 'map':
        return <MapHome key={route.focus ?? 'map'} focus={route.focus} />
      case 'search':
        return <Search />
      case 'event':
        return <EventDetail key={route.id} id={route.id} />
      case 'checkout':
        return <Checkout key={route.id} id={route.id} />
      case 'confirmation':
        return <Confirmation orderId={route.orderId} />
      case 'tickets':
        return <Tickets />
      case 'ticket':
        return <TicketDetail orderId={route.orderId} />
      case 'profile':
        return <Profile />
      case 'settings':
        return <Settings />
      case 'sales':
        return <Sales eventId={route.eventId} />
      case 'verify':
        return <Verify />
      case 'create':
        return <CreateEvent key={route.eventId ?? 'new'} eventId={route.eventId} />
      default:
        return <MapHome />
    }
  })()

  return (
    <div className="shell">
      <div className="phone">
        {screen}
        {toast && <Toast message={toast} />}
      </div>
    </div>
  )
}
