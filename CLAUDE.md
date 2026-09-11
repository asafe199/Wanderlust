# Wanderlust

Mobile-first event discovery and ticketing app. Every event is a pin on a map carrying its cover
photo; tapping a pin opens a draggable sheet with photos, details and ticket purchase. Any verified
account can publish its own events.

**This file is the source of truth for the business rules** — what the app must do and why. The code
is the source of truth for *how*. When a rule changes, change it here in the same commit and add a
line to the change log at the bottom.

Supporting documents:

- [README.md](README.md) — how to run it, what is implemented, what is not wired up.
- [docs/especificacao-design-app-eventos.md](docs/especificacao-design-app-eventos.md) — the original
  product/design specification (Portuguese).

---

## Commands

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

`npm run build` type-checks (`tsc -b`) and bundles. There is no test suite — verify changes by
running the app and exercising the affected flow.

Demo account: `mel@wanderlust.co` / `wanderlust`. Promo codes: `WANDER10`, `FIRSTPIN`.

---

## Origin

- **Source design**: Claude Design project *Mobile app for md file*
  (`aa3822b8-c5a9-41c2-8d40-62ab2b2a4d6b`) — `Wanderlust App.dc.html` (8 MVP screens + variations)
  and `EventMap Design System.dc.html` (tokens), imported through the `claude_design` MCP.
- **Source spec**: `docs/especificacao-design-app-eventos.md`.
- **Product name**: Wanderlust (the spec's provisional "EventMap" is retired; the design system file
  keeps the old name in its title only).
- **UI language**: English, with sample content in the USA/Canada — as fixed by the design
  ("Conteúdo de exemplo em EUA/Canadá e interface em inglês (mercado-alvo)").
- **Requirement from the start**: the app has to be *functional*, not a mockup.

---

## Business rules

### Accounts

| Rule | Where |
| --- | --- |
| One account type. The same user buys tickets and hosts events — there are no separate roles. | `lib/types.ts` |
| Signup requires name, valid email, password of 6+ characters, matching confirmation, and accepting the terms. | `screens/Auth.tsx` |
| Browsing the map and opening events works logged out. Buying, saving, hosting and tickets require login. | `components/TabBar.tsx`, `screens/*` |
| A new account starts **unverified**. | `store.tsx` (`signup`) |

### Identity verification

| Rule | Where |
| --- | --- |
| **Publishing an event requires a verified account.** Unverified users who tap "+", "Create an event" or "Edit" are routed to the verification flow instead. | `store.tsx` (`startHosting`), `screens/CreateEvent.tsx` |
| Verification needs three captures: **a photo of the user (selfie)**, **a photo of an accepted document — ID card or driver's licence**, and **a photo of the user holding that document next to their face**. | `screens/Verify.tsx` |
| The third capture is the liveness/ownership proof: it ties the document to the person, so a photo of someone else's document does not pass. It always uses the front camera. | `screens/Verify.tsx`, `components/CameraCapture.tsx` |
| The user chooses the document kind; switching the kind clears both the document photo and the holding photo. | `screens/Verify.tsx` |
| Capture uses the device camera (`getUserMedia`, front camera for the selfie, rear for the document) and falls back to a file upload when no camera is available or permission is denied. | `components/CameraCapture.tsx` |
| Status machine: `unverified → pending → verified` (a `rejected` state exists in the model for a real provider to use). Hosting unlocks only on `verified`. | `lib/types.ts`, `store.tsx` |
| While `pending` the user can keep browsing and buying; only hosting stays locked. | `screens/Verify.tsx` |
| **All three captured images are never persisted.** They live in component state, go to the verification provider, and only the outcome is kept: status, document kind, submitted/reviewed timestamps and the provider reference. | `store.tsx` (`submitVerification`) |
| Verification state is per account and survives logout; the profile shows "Verified host" or a "Verify to host" shortcut. | `screens/Profile.tsx` |
| Buying tickets does **not** require verification — only hosting does. | — |

> Demo-build caveat: review is simulated (≈2.4 s) and always approves. A production build must call a
> real KYC provider, must not upload documents from a client that stores them, and must handle
> rejection and re-submission.

### Events

| Rule | Where |
| --- | --- |
| Cover photo is mandatory — it is what becomes the pin on the map. | `screens/CreateEvent.tsx` (step 4) |
| Creation is six steps: Basics → Location → When → Photos → Tickets → Review. Each step validates before advancing, and publishing re-validates every step. | `screens/CreateEvent.tsx` |
| Location is set by address lookup (Nominatim) or by dragging the pin; the stored coordinates are what the map uses. | `components/MapView.tsx` (pick mode) |
| An event can be saved as a **draft** at any point; drafts never appear on the map. Only `published` events do. | `store.tsx`, `screens/MapHome.tsx` |
| Gallery holds up to 8 photos; uploads are downscaled and re-encoded before storage. | `lib/storage.ts` |
| An event needs at least one ticket type; every type needs a name and a quantity of at least 1. Price 0 means a free ticket. | `screens/CreateEvent.tsx` (step 5) |
| Only the organizer sees Edit / See sales for their own events. | `screens/Profile.tsx` |

### Tickets and money

| Rule | Where |
| --- | --- |
| All money is stored in **cents**; formatting happens only at display time. | `lib/format.ts` |
| Service fee is **10%**, charged on the discounted subtotal: `total = subtotal − discount + round((subtotal − discount) × 0.10)`. | `store.tsx` (`SERVICE_FEE_RATE`) |
| Promo codes: `WANDER10` (10%), `FIRSTPIN` (15%). Applied to the subtotal before the fee. | `store.tsx` (`PROMOS`) |
| A purchase may not exceed the remaining stock of a ticket type, capped at 10 per type per order. | `screens/Checkout.tsx` |
| A purchase decrements the ticket type's `sold`, which immediately moves the organizer's sales numbers. | `store.tsx` (`purchase`) |
| Every order gets a unique human-readable code (`WDL-XXXX-XXXX`) and a QR code rendered at purchase time and cached on the order, so the ticket works with no connection. | `store.tsx`, `components/cards.tsx` |
| Ticket status: `active → used` (`cancelled` exists in the model). Tickets for past events move to the "Past & used" tab. | `screens/Tickets.tsx` |
| No card data is collected or stored anywhere. Payment is simulated. | `screens/Checkout.tsx` |

### Map and discovery

| Rule | Where |
| --- | --- |
| The map is the home screen; every published event is a pin carrying its cover photo. | `screens/MapHome.tsx` |
| Pins closer than 64px at the current zoom are clustered into a count badge; tapping it zooms in. | `components/MapView.tsx` |
| Filters (Tonight, Free, and the five categories) dim non-matching pins rather than removing them. | `screens/MapHome.tsx` |
| The bottom sheet has three snap heights — peek, mid, full — and is dismissed by dragging down or tapping the map. | `components/Sheet.tsx` |
| Categories are fixed: nightlife, live music, food, sports, art. | `lib/types.ts` |

---

## Design rules

- One action colour (`#4B32E8`) reserved for primary actions; if two purples share a screen, one is
  wrong. Purple as *text* lightens to `#A996FF` in dark mode.
- Photos lead; overlays on images are translucent black only, never tinted.
- Controls floating over the map are white (dark: `#232323`) pills with a shadow — never an
  edge-to-edge bar.
- IBM Plex Mono is for data only: times, distances, ticket codes, references. Archivo for everything
  else.
- Touch targets of at least 44px.
- Dark mode follows variation 2a of the design: surfaces invert, the map tiles are inverted so the
  streets fall away and the pin photo is the only light. Preference is `system` / `light` / `dark`,
  persisted, with `system` resolved against `prefers-color-scheme`.

---

## Layout

```
src/
  store.tsx            app context: state, navigation stack, all mutations
  App.tsx              route switch
  styles.css           design tokens (light + dark) and every shared class
  lib/                 types, seed data, localStorage, formatting, .ics export
  components/          MapView, Sheet, Carousel, CameraCapture, ChipRail, cards, ui (icons)
  screens/             one file per screen; Profile.tsx also exports Settings and Sales
```

## Conventions

- **State lives in `store.tsx`.** Screens never touch `localStorage` directly — they call store
  mutators. Swapping in a backend means replacing `loadDb`/`saveDb` plus the mutators.
- **Navigation is a typed stack** in `store.tsx` (`navigate`, `back`, with `replace` / `reset`).
  Adding a screen means adding a variant to `Route` and a case in `App.tsx`.
- **Money is in cents** everywhere. All display formatting lives in `lib/format.ts`.
- **Colours come from tokens only.** Never hardcode a colour in a component — every value has a light
  and a dark definition at the top of `styles.css`. `--ink` is text, `--contrast` is the inverted
  block (black on light, white on dark), `--panel` is the editorial dark card, `--action-text` is
  purple used as text.
- **Layout is inline styles + shared classes.** There is no CSS-in-JS library and no utility
  framework; follow the existing pattern in neighbouring files.
- Persisted shape changes need a backfill in `loadDb` (`lib/storage.ts`) so existing local data keeps
  working.

## Technical decisions

- Vite + React + TypeScript; no router — a typed navigation stack in `store.tsx`.
- One persisted document (`DbShape`) in `localStorage`; swapping in a backend means replacing
  `loadDb`/`saveDb` and the store mutators. Screens never touch storage directly.
- Leaflet with OpenStreetMap tiles, recoloured in CSS to match the design's off-white (and dark) map.
- State is per-device today — events you publish are only visible on that device until a shared
  backend exists.

## Gotchas

- Leaflet forces `width: auto` on images inside its marker pane; the pin photo rule in `styles.css`
  overrides it with `!important`. Don't remove that.
- Leaflet panes create their own stacking; `.map` keeps `z-index: 0` so UI chrome paints above it.
- React registers `wheel` handlers as passive — `ChipRail` attaches its own native listener so
  `preventDefault()` works.
- Verification captures (selfie, document, document-in-hand) must stay in component state and never
  reach storage. Only the outcome is persisted.

---

## Change log

| Date | Change |
| --- | --- |
| 2026-09-10 | Initial build: import of the Claude Design project, all 8 MVP screens plus search, tickets, settings and sales, wired to a persisted local database. |
| 2026-09-10 | Removed the scrollbar under the filter chips; fixed pin photos being stretched out of their circle by Leaflet's `width:auto` rule. |
| 2026-09-10 | Filter rails made scrollable without a scrollbar: wheel-to-horizontal and pointer drag, with the drag-ending click suppressed. |
| 2026-09-10 | Dark mode added (System / Light / Dark), following design variation 2a. |
| 2026-09-10 | **Identity verification required before hosting**: selfie + ID card or driver's licence, with status machine, camera capture, and no client-side storage of the captured images. |
| 2026-09-10 | Added the third verification capture — the user holding the document next to their face — making the flow four steps (Selfie → Document → Face + doc → Review). |
| 2026-09-10 | `prompt.md` merged into this file and deleted — one document for rules, conventions and history, loaded automatically whenever the project is opened. |
