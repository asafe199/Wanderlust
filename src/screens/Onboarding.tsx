import { useApp } from '../store'
import { StatusBar } from '../components/ui'
import { DEFAULT_CENTER } from '../lib/seed'
import MapView from '../components/MapView'

export default function Onboarding() {
  const { db, navigate, completeOnboarding } = useApp()
  const published = db.events.filter((e) => e.status === 'published').slice(0, 6)

  const enter = () => {
    completeOnboarding()
    navigate({ name: 'map' }, { reset: true })
  }

  return (
    <div className="screen">
      <div style={{ position: 'absolute', inset: 0 }}>
        <MapView events={published} center={DEFAULT_CENTER} zoom={13} interactive={false} />
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, var(--canvas-0) 26%, var(--canvas) 62%)',
          pointerEvents: 'none',
        }}
      />
      <StatusBar label="WANDERLUST" />
      <div className="spacer" />
      <div
        style={{
          position: 'relative',
          padding: '0 24px calc(40px + var(--safe-bottom))',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <h1 className="display">
          What&apos;s happening
          <br />
          around you
          <br />
          tonight.
        </h1>
        <p
          style={{
            margin: 0,
            font: '400 16px/1.5 var(--sans)',
            color: '#5a5a58',
            maxWidth: '30ch',
          }}
        >
          Every pin is a real event with real photos. Tap one, see it, get in.
        </p>
        <div className="col" style={{ gap: 10, marginTop: 6 }}>
          <button className="btn btn-primary btn-block" onClick={enter}>
            Explore the map
          </button>
          <button
            className="btn btn-ghost btn-block"
            onClick={() => {
              completeOnboarding()
              navigate({ name: 'login' })
            }}
          >
            I have an account
          </button>
        </div>
      </div>
    </div>
  )
}
