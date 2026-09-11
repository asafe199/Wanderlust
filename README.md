# Wanderlust

Mobile-first event discovery and ticketing app: every event is a pin on the map carrying its own
cover photo. Tap a pin, the sheet expands into photos and details, buy the ticket without leaving
the screen — and any logged-in user can publish their own event from the same account.

Built from the Claude Design project *Mobile app for md file* (`Wanderlust App.dc.html` +
`EventMap Design System.dc.html`) and the specification in
`docs/especificacao-design-app-eventos.md`.

## Run it

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173. `npm run build` type-checks and produces `dist/`.

Demo account: **mel@wanderlust.co** / **wanderlust** (or create a new one — signup is real).
Promo codes that work at checkout: `WANDER10`, `FIRSTPIN`.

## What is implemented

| Flow | Screen | State |
| --- | --- | --- |
| Onboarding | `screens/Onboarding.tsx` | live map behind the promise, enters as guest or logs in |
| Auth | `screens/Auth.tsx` | email/password login, signup with validation, session persisted |
| Home / map | `screens/MapHome.tsx` | real Leaflet map, photo pins, clustering, filters, geolocation, draggable sheet |
| Event detail | `screens/EventDetail.tsx` | photo carousel, organizer, ticket types, static location map, share |
| Checkout | `screens/Checkout.tsx` | per-type steppers, promo codes, service fee, payment method |
| Confirmation | `screens/Confirmation.tsx` | real QR code, `.ics` calendar export, share |
| Tickets | `screens/Tickets.tsx` | upcoming / past, full-screen QR, mark as used |
| Profile | `screens/Profile.tsx` | tickets, hosted events with live sales, saved events, settings, sales breakdown |
| Dark mode | `styles.css` + `store.tsx` | System / Light / Dark, persisted; one-tap toggle in the profile header |
| Identity check | `screens/Verify.tsx` | selfie + ID card or driver's licence + a photo holding it by your face; camera capture with upload fallback — required before hosting |
| Create event | `screens/CreateEvent.tsx` | 6 steps, address lookup + draggable pin, photo upload with compression, ticket tiers, draft or publish |

Inventory is real: buying decrements the ticket type, and the organizer's sales numbers move with it.

Hosting is gated on identity: an unverified account tapping "+" is routed through the verification
flow first. The three captures (you, your document, and you holding it) never touch storage — only the outcome (status,
document kind, timestamps, provider reference) is kept. See [CLAUDE.md](CLAUDE.md) for the full set
of business rules.

## Architecture

- **Vite + React + TypeScript**, no router dependency — a small typed navigation stack in
  `src/store.tsx` (`navigate` / `back`, `replace` and `reset` options) that mirrors how a native
  stack behaves.
- **State**: one `AppProvider` context over a single `DbShape` document (users, events, orders,
  saved, session) persisted to `localStorage` on every change (`src/lib/storage.ts`). Swapping this
  for Supabase/Firebase means replacing `loadDb`/`saveDb` and the mutators in the store — nothing in
  the screens talks to storage directly.
- **Map**: Leaflet driven imperatively from `components/MapView.tsx`. Pins are `divIcon`s holding the
  event's cover photo; clustering is greedy pixel-space grouping recomputed on every zoom/move, so it
  stays readable with many events. Tiles are OpenStreetMap, desaturated in CSS to the off-white map
  the design specifies. The same component handles pin-drop mode for the create flow.
- **Bottom sheet**: hand-rolled pointer-drag with velocity-aware snapping over three heights
  (peek → mid → full), since that gesture is the core of the product.
- **Money** is stored in cents everywhere; `lib/format.ts` owns all display formatting (the mono
  `FRI SEP 12 · 11PM · 0.8 MI` metadata line, prices, distances, ticket codes).
- **QR codes** are generated at purchase time and cached as data URLs on the order, so a ticket
  renders with no connection.
- **Images** picked in the create flow are downscaled and re-encoded through a canvas before they are
  stored, which keeps `localStorage` inside quota.

## Design system

Tokens live at the top of `src/styles.css`, straight from the Claude Design system:

- Action `#4B32E8` (purchase, selection, saved) — used nowhere else, so it never competes with photos
- Ink `#0A0A0A`, Canvas `#F1F1EF`, Surface `#FFFFFF`, Muted `#6B6B6B`
- Category colours: nightlife, live music, food, sports, art
- Radius 12 / 18 / 26 / pill; spacing on a 4px base; three elevation steps
- Archivo for everything, IBM Plex Mono for data (times, distances, ticket codes)
- Floating pill controls over the map, 44–48px touch targets

**Dark mode** follows variation 2a of the design: surfaces invert (canvas `#0E0E0E`, sheet `#1C1C1C`,
floating controls `#232323`), the map tiles are inverted so the streets fall away and the pin photo
is the only source of light, and purple-as-text lightens to `#A996FF` so it stays legible on dark
ground while the action button keeps `#4B32E8`. Every token has exactly one definition per theme —
light on `:root`, dark on `:root[data-theme="dark"]`. The preference (`system` / `light` / `dark`)
lives in the same persisted document as the rest of the state; `system` is resolved against
`prefers-color-scheme` and follows the OS live.

## Not wired up

- Payments are simulated (900 ms, no gateway). No card data is collected or stored — plug in
  Stripe/Pix at `purchase()` in `src/store.tsx`.
- Identity verification is simulated: the review takes ~2.4 s and always approves. Point
  `submitVerification()` at a real KYC provider before going live, and handle rejection.
- Social sign-in buttons need provider keys.
- Push notifications and a shared backend: today the database is per-device, so events you publish
  are visible on that device only.
- Address lookup uses Nominatim and degrades to dragging the pin when it is unavailable.

## Packaging as a hybrid app

The build is a static SPA sized for a phone, so Capacitor is a short step:
`npm i -D @capacitor/cli && npx cap init && npx cap add ios android`, pointing `webDir` at `dist`.
