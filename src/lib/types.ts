export type CategoryId = 'nightlife' | 'music' | 'food' | 'sports' | 'art'

export interface Category {
  id: CategoryId
  label: string
  color: string
}

export const CATEGORIES: Category[] = [
  { id: 'nightlife', label: 'Nightlife', color: '#e8407a' },
  { id: 'music', label: 'Live music', color: '#2e9b8f' },
  { id: 'food', label: 'Food', color: '#e08a1e' },
  { id: 'sports', label: 'Sports', color: '#3a6fd8' },
  { id: 'art', label: 'Art', color: '#7a5cd0' },
]

export const categoryOf = (id: CategoryId): Category =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0]

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected'

export type DocumentKind = 'id' | 'license'

export const DOCUMENT_LABEL: Record<DocumentKind, string> = {
  id: 'ID card',
  license: "Driver's license",
}

/**
 * Identity check an account must clear before it can publish events.
 * The captured selfie and document images are deliberately NOT kept here —
 * they go to the verification provider and are dropped once reviewed.
 */
export interface Verification {
  status: VerificationStatus
  documentKind?: DocumentKind
  submittedAt?: number
  reviewedAt?: number
  /** Provider-side reference, the only trace we keep of the submission. */
  reference?: string
  reason?: string
}

export interface User {
  id: string
  name: string
  email: string
  /** Demo-only credential store. A real build delegates this to an auth provider. */
  password: string
  avatar: string
  city: string
  joined: number
  verification: Verification
}

export interface TicketType {
  id: string
  name: string
  /** In cents, so money never touches a float. */
  price: number
  quantity: number
  sold: number
}

export type EventStatus = 'draft' | 'published' | 'ended'

export interface WlEvent {
  id: string
  title: string
  description: string
  category: CategoryId
  cover: string
  gallery: string[]
  lat: number
  lng: number
  venue: string
  address: string
  startsAt: number
  endsAt: number
  ticketTypes: TicketType[]
  organizerId: string
  organizerName: string
  status: EventStatus
  createdAt: number
}

export interface OrderItem {
  ticketTypeId: string
  name: string
  price: number
  qty: number
}

export type OrderStatus = 'active' | 'used' | 'cancelled'

export interface Order {
  id: string
  code: string
  userId: string
  eventId: string
  items: OrderItem[]
  subtotal: number
  fee: number
  discount: number
  total: number
  status: OrderStatus
  createdAt: number
  /** Cached QR data URL so a ticket still renders with no connection. */
  qr?: string
}

export type ThemePref = 'system' | 'light' | 'dark'

export interface DbShape {
  users: User[]
  events: WlEvent[]
  orders: Order[]
  saved: Record<string, string[]>
  sessionUserId: string | null
  onboarded: boolean
  theme: ThemePref
}
