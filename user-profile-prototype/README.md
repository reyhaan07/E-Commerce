# ShopSphere — User Profile (Standalone UI Prototype)

A self-contained React prototype of the ShopSphere **User Profile** page.
It is **not** connected to the ShopSphere backend, database, auth, Redux, or any
existing code. All data is static/local and every interaction uses local React
state only. Review it here first; integration is a separate step.

## Run it

```bash
npm install
npm run dev
```

Vite opens it at **http://localhost:5180**. (`npm run build` + `npm run preview`
for a production build.)

Requires Node 18+. No database, no API, nothing else to set up.

## What's included

Full-width store shell with a persistent left account sidebar and a main
profile area:

- **Header** — ShopSphere logo, Categories, a large centered search, and
  Profile / Wishlist / Cart (with a count badge).
- **Sidebar (sticky/persistent)** — identity card (avatar, name, "Customer
  since", last login, Status + Points tiles) and a navigation card
  (My Profile / My Orders / Address Book / Payments + Logout). It stays fixed
  while the main area changes; on mobile it becomes a slide-in drawer.
- **Main area** — a blue/purple hero banner and the **Personal Information**
  card: Full Name + Phone, Profile Picture (upload / remove / paste URL),
  Delivery Instructions (with a live 0/500 counter), Email + SMS notification
  cards, and an Email + **Save Profile** footer.

## Components

| Component | Responsibility |
|---|---|
| `ProfilePage` | Page composition + all local state (nav, edit mode, form, avatar, toasts) |
| `ProfileHeader` | Full-width store header (logo, search, profile/wishlist/cart) |
| `ProfileSidebar` | Sticky identity + navigation sidebar (also the mobile drawer) |
| `ProfileHero` | Blue/purple banner in the main area |
| `PersonalInformationCard` | The main form card |
| `ProfilePictureSection` | Avatar + upload / remove / URL |
| `NotificationCard` | One selectable notification-preference card |

## Interactions (all local, no backend)

- Sidebar navigation with an active state; sidebar never disappears — only the
  main content swaps (other sections show a clean placeholder).
- **Edit Profile** toggles edit mode (enables the fields).
- Profile picture **Upload** (reads a local file as a data-URL preview),
  **Remove**, and paste-an-image-URL.
- Notification cards toggle on/off.
- **Save Profile** shows a confirmation toast.
- Character counter on Delivery Instructions.

## How the layout works

- The header is `sticky` full-width. Below it, `.shell` is a flex row with
  `padding: 26px clamp(16px, 3vw, 44px)` — so the content uses the full browser
  width with comfortable side padding (no large empty margins), and there is no
  narrow centered card.
- `.sidebar` has a fixed **300px** width and is `position: sticky` so it
  persists while the page scrolls; `.main` is `flex: 1` and fills the rest.
- Responsive: sidebar narrows on smaller laptops; below 860px `.shell` stacks
  and the sidebar becomes a fixed off-canvas **drawer** (opened via the header
  hamburger or the "Account menu" button), with an overlay. Notification cards
  and the name/phone grid collapse to one column. Nothing overflows
  horizontally.
- Colours come from CSS variables in `src/styles.css` (one blue/purple brand
  palette), so re-theming is a single-file change.

## Later integration (do not do yet)

The components are plain and prop-driven. To integrate into ShopSphere you would
wire `ProfileSidebar` nav to React Router, replace `src/data.js` +
`ProfilePage` local state with your user data / API, and map the palette
variables to your app's tokens. Nothing here imports from the main project.
