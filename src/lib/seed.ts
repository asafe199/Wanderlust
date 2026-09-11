import type { DbShape, Order, TicketType, User, WlEvent } from './types'
import { ticketCode } from './format'

const photo = (seed: string, w = 900, h = 600) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`

/** n days from today at a given local hour. */
const at = (days: number, hour: number, minute = 0): number => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, minute, 0, 0)
  return d.getTime()
}

const tt = (name: string, price: number, quantity: number, sold = 0): TicketType => ({
  id: `tt_${name.toLowerCase().replace(/\W+/g, '')}_${Math.random().toString(36).slice(2, 6)}`,
  name,
  price,
  quantity,
  sold,
})

export const DEMO_USER: User = {
  id: 'usr_mel',
  name: 'Mel Okafor',
  email: 'mel@wanderlust.co',
  password: 'wanderlust',
  avatar: photo('mel-okafor', 240, 240),
  city: 'Brooklyn, NY',
  joined: new Date('2024-03-08').getTime(),
  verification: {
    status: 'verified',
    documentKind: 'license',
    submittedAt: new Date('2024-03-08').getTime(),
    reviewedAt: new Date('2024-03-09').getTime(),
    reference: 'KYC-4F21-8A3C',
  },
}

const HOSTS: User[] = [
  {
    id: 'usr_sable',
    name: 'Sable Collective',
    email: 'hello@sable.co',
    password: 'wanderlust',
    avatar: photo('sable-collective', 240, 240),
    city: 'Brooklyn, NY',
    joined: new Date('2023-06-01').getTime(),
    verification: { status: 'verified', documentKind: 'id', reference: 'KYC-90B2-1D44' },
  },
  {
    id: 'usr_northside',
    name: 'Northside Sounds',
    email: 'crew@northside.ca',
    password: 'wanderlust',
    avatar: photo('northside-sounds', 240, 240),
    city: 'Toronto, ON',
    joined: new Date('2023-11-19').getTime(),
    verification: { status: 'verified', documentKind: 'license', reference: 'KYC-77C5-0E19' },
  },
]

export const DEFAULT_CENTER: [number, number] = [40.7081, -73.9571] // Williamsburg, Brooklyn

const events: WlEvent[] = [
  {
    id: 'evt_rooftop',
    title: 'Rooftop Session — Bushwick',
    description:
      'Three DJs, an open-air deck over the Williamsburg skyline and a cocktail bar by Sable. No re-entry after 1AM.',
    category: 'nightlife',
    cover: photo('wl-rooftop-session'),
    gallery: [photo('wl-rooftop-session'), photo('wl-rooftop-2'), photo('wl-rooftop-3'), photo('wl-rooftop-4')],
    lat: 40.7089,
    lng: -73.9382,
    venue: 'The Wick Terrace',
    address: '260 Meserole St, Brooklyn NY',
    startsAt: at(2, 23),
    endsAt: at(3, 4),
    ticketTypes: [tt('General', 1800, 260, 118), tt('Terrace VIP', 4500, 40, 28)],
    organizerId: 'usr_sable',
    organizerName: 'Sable Collective',
    status: 'published',
    createdAt: at(-24, 12),
  },
  {
    id: 'evt_warehouse',
    title: 'Warehouse Tape Night',
    description:
      'Cassette-only sets from four selectors, a sound system on loan from Kingston and absolutely no phones on the floor.',
    category: 'music',
    cover: photo('wl-warehouse-tape'),
    gallery: [photo('wl-warehouse-tape'), photo('wl-warehouse-2'), photo('wl-warehouse-3')],
    lat: 40.7142,
    lng: -73.9614,
    venue: 'Meadow St Warehouse',
    address: '88 Meadow St, Brooklyn NY',
    startsAt: at(0, 22),
    endsAt: at(1, 3),
    ticketTypes: [tt('Early bird', 1200, 120, 120), tt('Door', 2000, 180, 64)],
    organizerId: 'usr_sable',
    organizerName: 'Sable Collective',
    status: 'published',
    createdAt: at(-18, 9),
  },
  {
    id: 'evt_supper',
    title: 'Supper Club No. 4',
    description:
      'Eight courses cooked in front of you, wine pairing included, one long table for eighty people who have never met.',
    category: 'food',
    cover: photo('wl-supper-club'),
    gallery: [photo('wl-supper-club'), photo('wl-supper-2'), photo('wl-supper-3')],
    lat: 40.6997,
    lng: -73.9908,
    venue: 'Atlantic Works',
    address: '41 Atlantic Ave, Brooklyn NY',
    startsAt: at(6, 19),
    endsAt: at(6, 23),
    ticketTypes: [tt('Seat at the table', 8500, 80, 68)],
    organizerId: DEMO_USER.id,
    organizerName: DEMO_USER.name,
    status: 'published',
    createdAt: at(-30, 15),
  },
  {
    id: 'evt_riverside',
    title: 'Riverside Morning Run',
    description:
      'Six easy miles along the East River with coffee at the end. Every pace welcome, nobody gets dropped.',
    category: 'sports',
    cover: photo('wl-riverside-run'),
    gallery: [photo('wl-riverside-run'), photo('wl-riverside-2')],
    lat: 40.7215,
    lng: -73.9613,
    venue: 'Domino Park',
    address: '15 River St, Brooklyn NY',
    startsAt: at(3, 8),
    endsAt: at(3, 10),
    ticketTypes: [tt('Free entry', 0, 300, 142)],
    organizerId: 'usr_sable',
    organizerName: 'Sable Collective',
    status: 'published',
    createdAt: at(-12, 10),
  },
  {
    id: 'evt_print',
    title: 'Risograph Open Studio',
    description:
      'Pull your own two-colour print, take it home wet. Paper, ink and a very patient technician included.',
    category: 'art',
    cover: photo('wl-riso-studio'),
    gallery: [photo('wl-riso-studio'), photo('wl-riso-2'), photo('wl-riso-3')],
    lat: 40.6905,
    lng: -73.9668,
    venue: 'Fort Greene Press',
    address: '73 Lafayette Ave, Brooklyn NY',
    startsAt: at(4, 14),
    endsAt: at(4, 18),
    ticketTypes: [tt('Studio pass', 3200, 24, 9)],
    organizerId: 'usr_sable',
    organizerName: 'Sable Collective',
    status: 'published',
    createdAt: at(-9, 11),
  },
  {
    id: 'evt_loft',
    title: 'Lower East Loft Party',
    description:
      'Disco edits until the neighbours complain. Bring a record, skip the line.',
    category: 'nightlife',
    cover: photo('wl-loft-party'),
    gallery: [photo('wl-loft-party'), photo('wl-loft-2')],
    lat: 40.7185,
    lng: -73.9881,
    venue: 'Delancey Loft',
    address: '129 Delancey St, New York NY',
    startsAt: at(1, 23, 30),
    endsAt: at(2, 5),
    ticketTypes: [tt('General', 2500, 200, 176), tt('Guest list', 0, 20, 20)],
    organizerId: 'usr_sable',
    organizerName: 'Sable Collective',
    status: 'published',
    createdAt: at(-7, 16),
  },
  {
    id: 'evt_jazz',
    title: 'Mile End Jazz Night',
    description:
      'A quintet, a small room and two sets with a break for smoked meat sandwiches next door.',
    category: 'music',
    cover: photo('wl-mile-end-jazz'),
    gallery: [photo('wl-mile-end-jazz'), photo('wl-jazz-2'), photo('wl-jazz-3')],
    lat: 45.5231,
    lng: -73.5977,
    venue: 'Cabaret Mile End',
    address: '5240 Av du Parc, Montréal QC',
    startsAt: at(17, 20),
    endsAt: at(17, 23, 30),
    ticketTypes: [tt('General', 2800, 140, 96), tt('Front table', 5200, 16, 11)],
    organizerId: 'usr_northside',
    organizerName: 'Northside Sounds',
    status: 'published',
    createdAt: at(-40, 12),
  },
  {
    id: 'evt_night_market',
    title: 'Kensington Night Market',
    description:
      'Forty vendors, three blocks closed to traffic, and a stage that runs until midnight.',
    category: 'food',
    cover: photo('wl-night-market'),
    gallery: [photo('wl-night-market'), photo('wl-market-2'), photo('wl-market-3')],
    lat: 43.6547,
    lng: -79.4005,
    venue: 'Kensington Market',
    address: 'Augusta Ave, Toronto ON',
    startsAt: at(9, 18),
    endsAt: at(9, 23, 59),
    ticketTypes: [tt('Free entry', 0, 1000, 431), tt('Tasting pass', 3500, 150, 88)],
    organizerId: 'usr_northside',
    organizerName: 'Northside Sounds',
    status: 'published',
    createdAt: at(-22, 13),
  },
  {
    id: 'evt_harbour',
    title: 'Harbourfront Sunset Set',
    description:
      'Ambient and dub on the pier while the sun goes down behind the islands. Blankets encouraged.',
    category: 'music',
    cover: photo('wl-harbourfront'),
    gallery: [photo('wl-harbourfront'), photo('wl-harbour-2')],
    lat: 43.6387,
    lng: -79.3816,
    venue: 'Pier 8',
    address: '235 Queens Quay W, Toronto ON',
    startsAt: at(12, 19),
    endsAt: at(12, 22),
    ticketTypes: [tt('General', 2200, 400, 213)],
    organizerId: 'usr_northside',
    organizerName: 'Northside Sounds',
    status: 'published',
    createdAt: at(-15, 17),
  },
]

const seedOrder = (): Order => {
  const jazz = events.find((e) => e.id === 'evt_jazz')!
  const type = jazz.ticketTypes[0]
  const subtotal = type.price
  const fee = Math.round(subtotal * 0.1)
  return {
    id: 'ord_seed_jazz',
    code: ticketCode(),
    userId: DEMO_USER.id,
    eventId: jazz.id,
    items: [{ ticketTypeId: type.id, name: type.name, price: type.price, qty: 1 }],
    subtotal,
    fee,
    discount: 0,
    total: subtotal + fee,
    status: 'active',
    createdAt: Date.now() - 86400000 * 5,
  }
}

export const seedDb = (): DbShape => ({
  users: [DEMO_USER, ...HOSTS],
  events,
  orders: [seedOrder()],
  saved: { [DEMO_USER.id]: ['evt_rooftop'] },
  sessionUserId: null,
  onboarded: false,
  theme: 'system',
})
