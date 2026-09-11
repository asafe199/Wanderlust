import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import QRCode from 'qrcode'
import type {
  DbShape,
  DocumentKind,
  Order,
  OrderItem,
  ThemePref,
  User,
  WlEvent,
} from './lib/types'
import { loadDb, resetDb, saveDb } from './lib/storage'
import { seedDb } from './lib/seed'
import { ticketCode, uid } from './lib/format'

export const SERVICE_FEE_RATE = 0.1
export const PROMOS: Record<string, number> = { WANDER10: 0.1, FIRSTPIN: 0.15 }

export type Route =
  | { name: 'onboarding' }
  | { name: 'login' }
  | { name: 'signup' }
  | { name: 'map'; focus?: string }
  | { name: 'search' }
  | { name: 'event'; id: string }
  | { name: 'checkout'; id: string }
  | { name: 'confirmation'; orderId: string }
  | { name: 'tickets' }
  | { name: 'ticket'; orderId: string }
  | { name: 'profile' }
  | { name: 'settings' }
  | { name: 'create'; eventId?: string }
  | { name: 'verify' }
  | { name: 'sales'; eventId: string }

interface Ctx {
  db: DbShape
  user: User | null
  route: Route
  toast: string | null
  navigate: (route: Route, opts?: { replace?: boolean; reset?: boolean }) => void
  back: () => void
  canGoBack: boolean
  showToast: (message: string) => void
  login: (email: string, password: string) => { ok: boolean; error?: string }
  signup: (name: string, email: string, password: string) => { ok: boolean; error?: string }
  logout: () => void
  completeOnboarding: () => void
  toggleSaved: (eventId: string) => void
  isSaved: (eventId: string) => boolean
  upsertEvent: (event: WlEvent) => void
  deleteEvent: (eventId: string) => void
  purchase: (eventId: string, items: OrderItem[], promo?: string | null) => Promise<Order>
  useTicket: (orderId: string) => void
  updateUser: (patch: Partial<User>) => void
  /** Hosting is gated on a cleared identity check. */
  isVerified: boolean
  submitVerification: (documentKind: DocumentKind) => Promise<void>
  resetVerification: () => void
  /** Sends the user to login, to the identity check, or into the create flow. */
  startHosting: (eventId?: string) => void
  /** 'system' follows the OS; the resolved value is what the UI is painted in. */
  theme: ThemePref
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: ThemePref) => void
  factoryReset: () => void
  eventById: (id: string) => WlEvent | undefined
  ordersOfUser: () => Order[]
  eventsOfUser: () => WlEvent[]
  soldFor: (event: WlEvent) => { sold: number; total: number; revenue: number }
}

const AppContext = createContext<Ctx | null>(null)

export const useApp = (): Ctx => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DbShape>(() => loadDb())
  const [stack, setStack] = useState<Route[]>(() => {
    const initial = loadDb()
    if (!initial.onboarded) return [{ name: 'onboarding' }]
    return [{ name: 'map' }]
  })
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  useEffect(() => saveDb(db), [db])
  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  const route = stack[stack.length - 1]
  const user = useMemo(
    () => db.users.find((u) => u.id === db.sessionUserId) ?? null,
    [db.users, db.sessionUserId],
  )

  const navigate = useCallback<Ctx['navigate']>((next, opts) => {
    setStack((prev) => {
      if (opts?.reset) return [next]
      if (opts?.replace) return [...prev.slice(0, -1), next]
      return [...prev, next]
    })
  }, [])

  const back = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
  }, [])

  const showToast = useCallback((message: string) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])

  const login = useCallback<Ctx['login']>(
    (email, password) => {
      const found = db.users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
      )
      if (!found) return { ok: false, error: 'No account with that email.' }
      if (found.password !== password) return { ok: false, error: 'Wrong password.' }
      setDb((prev) => ({ ...prev, sessionUserId: found.id, onboarded: true }))
      return { ok: true }
    },
    [db.users],
  )

  const signup = useCallback<Ctx['signup']>(
    (name, email, password) => {
      const clean = email.trim().toLowerCase()
      if (db.users.some((u) => u.email.toLowerCase() === clean))
        return { ok: false, error: 'That email already has an account.' }
      const created: User = {
        id: uid('usr'),
        name: name.trim(),
        email: clean,
        password,
        avatar: `https://picsum.photos/seed/${encodeURIComponent(clean)}/240/240`,
        city: 'Brooklyn, NY',
        joined: Date.now(),
        verification: { status: 'unverified' },
      }
      setDb((prev) => ({
        ...prev,
        users: [...prev.users, created],
        sessionUserId: created.id,
        onboarded: true,
      }))
      return { ok: true }
    },
    [db.users],
  )

  const logout = useCallback(() => {
    setDb((prev) => ({ ...prev, sessionUserId: null }))
    setStack([{ name: 'map' }])
  }, [])

  const completeOnboarding = useCallback(
    () => setDb((prev) => ({ ...prev, onboarded: true })),
    [],
  )

  const toggleSaved = useCallback(
    (eventId: string) => {
      if (!user) return
      setDb((prev) => {
        const current = prev.saved[user.id] ?? []
        const next = current.includes(eventId)
          ? current.filter((id) => id !== eventId)
          : [...current, eventId]
        return { ...prev, saved: { ...prev.saved, [user.id]: next } }
      })
    },
    [user],
  )

  const isSaved = useCallback(
    (eventId: string) => Boolean(user && (db.saved[user.id] ?? []).includes(eventId)),
    [db.saved, user],
  )

  const upsertEvent = useCallback((event: WlEvent) => {
    setDb((prev) => {
      const exists = prev.events.some((e) => e.id === event.id)
      return {
        ...prev,
        events: exists
          ? prev.events.map((e) => (e.id === event.id ? event : e))
          : [event, ...prev.events],
      }
    })
  }, [])

  const deleteEvent = useCallback((eventId: string) => {
    setDb((prev) => ({ ...prev, events: prev.events.filter((e) => e.id !== eventId) }))
  }, [])

  const purchase = useCallback<Ctx['purchase']>(
    async (eventId, items, promo) => {
      if (!user) throw new Error('Log in to buy tickets')
      const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
      const rate = promo ? (PROMOS[promo.toUpperCase()] ?? 0) : 0
      const discount = Math.round(subtotal * rate)
      const fee = Math.round((subtotal - discount) * SERVICE_FEE_RATE)
      const code = ticketCode()
      let qr: string | undefined
      try {
        qr = await QRCode.toDataURL(`wanderlust://ticket/${code}`, {
          margin: 1,
          width: 480,
          color: { dark: '#0A0A0AFF', light: '#FFFFFFFF' },
        })
      } catch {
        qr = undefined
      }
      const order: Order = {
        id: uid('ord'),
        code,
        userId: user.id,
        eventId,
        items,
        subtotal,
        fee,
        discount,
        total: subtotal - discount + fee,
        status: 'active',
        createdAt: Date.now(),
        qr,
      }
      setDb((prev) => ({
        ...prev,
        orders: [order, ...prev.orders],
        events: prev.events.map((e) =>
          e.id !== eventId
            ? e
            : {
                ...e,
                ticketTypes: e.ticketTypes.map((t) => {
                  const bought = items.find((i) => i.ticketTypeId === t.id)
                  return bought ? { ...t, sold: t.sold + bought.qty } : t
                }),
              },
        ),
      }))
      return order
    },
    [user],
  )

  const useTicket = useCallback((orderId: string) => {
    setDb((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.id === orderId ? { ...o, status: 'used' } : o)),
    }))
  }, [])

  const updateUser = useCallback(
    (patch: Partial<User>) => {
      if (!user) return
      setDb((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === user.id ? { ...u, ...patch } : u)),
      }))
    },
    [user],
  )

  const isVerified = user?.verification.status === 'verified'

  /**
   * Stands in for a KYC provider: the captured images are handed over and never
   * stored locally — only the outcome and its reference are kept. Review is
   * simulated with a short delay and always approves in this build.
   */
  const submitVerification = useCallback(
    async (documentKind: DocumentKind) => {
      if (!user) throw new Error('Log in first')
      const submittedAt = Date.now()
      setDb((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === user.id
            ? { ...u, verification: { status: 'pending', documentKind, submittedAt } }
            : u,
        ),
      }))
      await new Promise((resolve) => setTimeout(resolve, 2400))
      setDb((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === user.id
            ? {
                ...u,
                verification: {
                  status: 'verified',
                  documentKind,
                  submittedAt,
                  reviewedAt: Date.now(),
                  reference: `KYC-${ticketCode().slice(4)}`,
                },
              }
            : u,
        ),
      }))
    },
    [user],
  )

  const resetVerification = useCallback(() => {
    if (!user) return
    setDb((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === user.id ? { ...u, verification: { status: 'unverified' } } : u,
      ),
    }))
  }, [user])

  const startHosting = useCallback(
    (eventId?: string) => {
      if (!user) {
        showToast('Log in to host an event')
        navigate({ name: 'login' })
        return
      }
      if (user.verification.status !== 'verified') {
        navigate({ name: 'verify' })
        return
      }
      navigate({ name: 'create', eventId })
    },
    [navigate, showToast, user],
  )

  /* ---- theme: resolve "system" against the OS and stamp it on <html> ---- */
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  )

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!query) return
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const resolvedTheme: 'light' | 'dark' =
    db.theme === 'system' ? (systemDark ? 'dark' : 'light') : db.theme

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', resolvedTheme === 'dark' ? '#0E0E0E' : '#F1F1EF')
  }, [resolvedTheme])

  const setTheme = useCallback(
    (theme: ThemePref) => setDb((prev) => ({ ...prev, theme })),
    [],
  )

  const factoryReset = useCallback(() => {
    resetDb()
    setDb(seedDb())
    setStack([{ name: 'onboarding' }])
  }, [])

  const eventById = useCallback(
    (id: string) => db.events.find((e) => e.id === id),
    [db.events],
  )

  const ordersOfUser = useCallback(
    () => (user ? db.orders.filter((o) => o.userId === user.id) : []),
    [db.orders, user],
  )

  const eventsOfUser = useCallback(
    () => (user ? db.events.filter((e) => e.organizerId === user.id) : []),
    [db.events, user],
  )

  const soldFor = useCallback((event: WlEvent) => {
    const sold = event.ticketTypes.reduce((s, t) => s + t.sold, 0)
    const total = event.ticketTypes.reduce((s, t) => s + t.quantity, 0)
    const revenue = event.ticketTypes.reduce((s, t) => s + t.sold * t.price, 0)
    return { sold, total, revenue }
  }, [])

  const value: Ctx = {
    db,
    user,
    route,
    toast,
    navigate,
    back,
    canGoBack: stack.length > 1,
    showToast,
    login,
    signup,
    logout,
    completeOnboarding,
    toggleSaved,
    isSaved,
    upsertEvent,
    deleteEvent,
    purchase,
    useTicket,
    updateUser,
    isVerified,
    submitVerification,
    resetVerification,
    startHosting,
    theme: db.theme,
    resolvedTheme,
    setTheme,
    factoryReset,
    eventById,
    ordersOfUser,
    eventsOfUser,
    soldFor,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
