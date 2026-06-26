# ShopSphere — E-Commerce User Module (Frontend Only)

React.js + Vite + Tailwind CSS frontend UI. No backend, no database, no real APIs — all data is dummy/mock data in `src/data/dummyData.js`.

## Setup

```bash
npm install
npm run dev
```

Then open the printed local URL (typically http://localhost:5173).

## Build for production

```bash
npm run build
npm run preview
```

## Structure

- `src/components/` — Navbar, Footer, SearchBar, ProductCard, CategoryCard, Banner, CartItem, Rating, plus StateHelpers (skeleton loaders + empty states)
- `src/pages/` — Home, Login, Register, ProductListing, ProductDetails, Cart, Checkout, Orders, Wishlist, Profile
- `src/routes/AppRoutes.jsx` — all route definitions
- `src/context/ShopContext.jsx` — cart + wishlist state shared across the app (in-memory only, resets on refresh)
- `src/data/dummyData.js` — mock products, categories, orders, addresses, user

## Notes

- Cart and Wishlist start pre-populated with sample items so pages aren't empty on first load — clear them via the UI to see empty states.
- Image URLs point to Unsplash placeholders.
- Mobile gets a bottom tab bar (Home/Shop/Cart/Orders/Profile); desktop gets a full top navbar + sidebar filters on the listing page.
