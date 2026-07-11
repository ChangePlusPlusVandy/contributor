# Frontend Refactor: Expo → Vite + React (PWA)

## Decision

Migrate the frontend from Expo (React Native) to a **Vite + React SPA** with **React Router** and a **PWA** for mobile web users. True native mobile is not a requirement.

```
Browser → Vite/React SPA (static files) → FastAPI
```

**Why not Next.js:** The app is 100% client-interactive (Leaflet map, geolocation, localStorage, auth-gated screens) — every component would be `"use client"`, paying SSR complexity (Leaflet breaks under SSR) for zero benefit. There is no SEO need: all content is API-driven behind auth or a map/list UI. Every Next.js feature the migration would use has a trivial SPA equivalent (`next/font` → `@fontsource`, `next/image` → `<img loading="lazy">`, `next-pwa` → `vite-plugin-pwa`). And deployment is simpler: a Vite build is static files, no Node server.

**Why not Express:** The API server already exists (FastAPI). Express would be a redundant static file server. The built SPA is served either by FastAPI (`StaticFiles`) or any static host.

**Backend changes required (small but unavoidable):** The native app bypasses CORS; a browser client does not. Either add `CORSMiddleware` to `backend/src/main.py` (~5 lines) or serve the built SPA from FastAPI on the same origin. No other backend changes.

---

## What Transfers Directly

These can be moved with little or no modification:

- All API call logic (`lib/api.tsx`) — swap `expo-secure-store` for `localStorage`, otherwise unchanged (see Auth below)
- All utility functions (`lib/utils.tsx`) — pure JS, move as-is
- TypeScript types and constants (resource categories, etc.)
- Context providers (AuthProvider, BookmarksProvider) — plain React, swap storage layer only
- Business logic: role checks, admin approval workflow, vendor clock-in/out, bookmark toggle
- Routing structure — the `(home)`, `(chat)`, `(map)`, `(more)` Expo Router groups become React Router nested routes with shared layouts
- Tailwind config — NativeWind → standard Tailwind CSS, minimal changes
- Axios (used in `auth.tsx`) — already works in any JS environment
- Haversine distance formula, `hoursToString`, `isOpen` helpers
- All Lucide icons — swap `lucide-react-native` for `lucide-react`

---

## What Needs Replacing

### Auth & Storage

| Current | Replacement | Notes |
|---|---|---|
| `expo-secure-store` (auth tokens) | `localStorage` | Same read/write model as SecureStore — `api.tsx` refresh logic ports nearly verbatim |
| `expo-secure-store` (bookmarks) | `localStorage` | Bookmarks are not sensitive |
| `expo-secure-store` (vendor clock-in location) | `localStorage` | Not sensitive |

**Keep Bearer token auth exactly as-is.** The backend returns `access_token`/`refresh_token` in the login response body and expects `Authorization: Bearer` headers (including on `auth/refresh`, which takes the refresh token as a Bearer header). It has no cookie support. httpOnly cookies would require either backend auth changes (cookie setting + CSRF handling) or a server-side proxy tier — neither is worth it for this app. `localStorage` tokens are the standard SPA pattern.

The entire token flow in `lib/api.tsx` — attach access token, retry on 401 with refreshed token, persist updated tokens — stays structurally identical. Only the storage calls change: `SecureStore.getItemAsync("auth")` → `localStorage.getItem("auth")` (sync, so the `await`s can be dropped).

### Maps

| Current | Replacement |
|---|---|
| `react-native-maps` | `react-leaflet` (recommended) or `@vis.gl/react-google-maps` |

The map screen is the most complex screen in the app. Beyond the map library swap, the draggable bottom panel (currently `PanResponder` + manual height animation) needs to be rebuilt as a CSS drawer. The filter UI (animated buttons, color interpolation, distance slider) maps cleanly to CSS transitions and a native `<input type="range">`.

The map screen also has a dual coordinate format for markers (legacy root-level `latitude`/`longitude` vs. `coordinates` object). Keep that normalization logic when migrating.

No SSR in a Vite SPA, so `react-leaflet` works with plain imports — no dynamic-import workarounds needed.

### Location

| Current | Replacement |
|---|---|
| `expo-location` (foreground permission + `getCurrentPositionAsync`) | Browser `navigator.geolocation.getCurrentPosition` |

The permission prompt becomes the browser's native geolocation prompt. No API change needed in the calling code — just swap the call.

### Images

| Current | Replacement |
|---|---|
| `expo-image` | `<img loading="lazy">` |

Native lazy loading covers the current usage. No image-optimization framework needed.

### Fonts

| Current | Replacement |
|---|---|
| `@expo-google-fonts/lexend` + `useFonts` hook | `@fontsource/lexend` (one import per weight) or a Google Fonts `<link>` |

All 9 Lexend weights are currently loaded. With `@fontsource`, import each weight once in `main.tsx` — no hook, no loading state.

### Animations

| Current | Replacement |
|---|---|
| `react-native-reanimated` (spring/timing) | CSS transitions + `Framer Motion` (optional) |

Reanimated is used for: button scale on press, filter button color interpolation, map panel expand/collapse, announcements post button. All of these are straightforward CSS transitions. Framer Motion is a good drop-in if you want spring physics.

### Navigation

| Current | Replacement |
|---|---|
| `@react-navigation/bottom-tabs` + Expo Router groups | React Router nested routes + CSS nav component |

The `(home)`, `(chat)`, `(map)`, `(more)` route groups become React Router routes sharing a layout route. The bottom tab bar becomes a responsive nav component — bottom bar on mobile (CSS), top/side nav on desktop.

### Removed Entirely (no web equivalent needed)

- `react-native-safe-area-context` / `SafeAreaView` → CSS `env(safe-area-inset-*)` for mobile Safari notch
- `KeyboardAvoidingView` → not needed on web
- `expo-haptics` → remove (no web equivalent, was installed but impact is minimal)
- `expo-splash-screen` → loading states in React
- `expo-constants`, `expo-linking`, `expo-web-browser` → browser APIs handle this natively
- `PanResponder` → CSS + pointer events
- `@react-native-community/slider` → `<input type="range">`
- All `Platform.OS === 'ios'` / `Platform.OS === 'android'` checks → remove
- Portrait-only orientation lock → responsive CSS

---

## Non-Obvious Implementation Notes

**"Chat" screen is actually Announcements.** It is REST polling (not WebSockets), loaded once on mount. Straightforward migration.

**Time and day are computed once at module load** in `lib/utils.tsx`. This is fine — keep the same pattern.

**Admin and vendor home screens share the same resource grid UI.** The role distinction is only for routing and the admin pending-resource count badge.

**Vendor login uses `vendor_id` stored in the email field** on the login form. Keep this quirk as-is when migrating the login screen — it's intentional.

**Auth initialization validates the stored token on every app load** via `GET admin/me` or `GET auth/me`. Keep this — read the token from `localStorage` on mount and validate it the same way.

**Bookmarks store org names (strings), not full Resource objects.** There is legacy migration logic in `providers/bookmarks.tsx` for users who had full objects stored. Keep this migration shim in `localStorage` reads.

**Resource categories are hardcoded constants**, not API-driven. Move them to a constants file in the new project.

**The vendor clock-in location is persisted to SecureStore** (key: `"clock_in_location"`) and also synced to the backend via `PATCH auth/location`. The localStorage replacement only affects the local persistence — the backend sync stays the same.

**CORS did not matter until now.** Native fetch is not subject to CORS, so the backend has no `CORSMiddleware`. A browser client on a different origin will fail on its first request without it. Add it (or serve the SPA from FastAPI) before testing anything.

---

## Checklist

### Project Setup
- [ ] Initialize Vite project with React + TypeScript (`npm create vite@latest -- --template react-ts`)
- [ ] Install and configure React Router
- [ ] Configure Tailwind CSS
- [ ] Install `@fontsource/lexend` and import all 9 weights in `main.tsx`
- [ ] Set up environment variables (`VITE_API_URL` replacing Expo's config)
- [ ] Install `lucide-react` (replaces `lucide-react-native`)
- [ ] Set up path aliases (`@/` → `src/`) in `tsconfig.json` and `vite.config.ts`

### Backend (one-time, small)
- [ ] Add `CORSMiddleware` to `backend/src/main.py` with the frontend origin — OR mount the built SPA via `StaticFiles` for same-origin serving
- [ ] Verify a browser `fetch` from the dev server (`localhost:5173`) reaches the API

### PWA
- [ ] Install and configure `vite-plugin-pwa`
- [ ] Create `public/manifest.json` (name, icons, `display: standalone`, `start_url`)
- [ ] Add PWA meta tags to `index.html` (viewport, theme-color, apple-mobile-web-app tags)
- [ ] Generate app icons at required sizes (192x192, 512x512 minimum)
- [ ] Test "Add to Home Screen" on iOS Safari and Android Chrome
- [ ] Configure service worker caching strategy for API routes vs static assets

### Routing & Layout
- [ ] Recreate route structure: home, chat, map, more (React Router nested routes replacing the `(home)`, `(chat)`, `(map)`, `(more)` groups)
- [ ] Build root layout with font, providers, and nav
- [ ] Build responsive nav component (bottom bar on mobile, top nav on desktop)
- [ ] Migrate `(home)/index.tsx` — three role-based views (admin, vendor, user)
- [ ] Migrate `(home)/bookmarks.tsx`
- [ ] Migrate `(home)/category.tsx`
- [ ] Migrate `(chat)/chat.tsx` (announcements board)
- [ ] Migrate `(map)/map.tsx`
- [ ] Migrate `(more)/more.tsx` — three role-based views
- [ ] Migrate `(more)/login.tsx`
- [ ] Migrate `(more)/change-password.tsx`
- [ ] Migrate `(more)/vendor-list.tsx`

### Auth & Storage
- [ ] Update `lib/api.tsx` — replace SecureStore reads/writes with `localStorage` (drop the now-unneeded `await`s)
- [ ] Keep the Bearer attach + 401 refresh-and-retry logic unchanged
- [ ] Migrate AuthProvider — replace SecureStore with `localStorage`, keep the `/me` validation on mount
- [ ] Migrate BookmarksProvider — replace SecureStore with `localStorage`, keep the legacy-object migration shim
- [ ] Migrate vendor clock-in location persistence — replace SecureStore with `localStorage`

### Maps
- [ ] Install `react-leaflet` and `leaflet`
- [ ] Add Leaflet CSS to the app entry
- [ ] Rebuild `MapView` + `Marker` usage with `react-leaflet` equivalents
- [ ] Rebuild draggable bottom panel (vendor resource list) as a CSS drawer
- [ ] Rebuild the draggable vendor marker in the more/vendor page using Leaflet's draggable marker API
- [ ] Keep coordinate normalization logic (legacy vs. `coordinates` object format)
- [ ] Migrate filter UI: animated filter buttons → CSS transitions, distance slider → `<input type="range">`
- [ ] Replace `PanResponder` expand/collapse with CSS transitions + pointer events

### Location
- [ ] Replace `expo-location` with `navigator.geolocation.getCurrentPosition`
- [ ] Handle permission denied state (browser prompt vs. Expo prompt UX difference)
- [ ] Test geolocation in both desktop Chrome and mobile Safari

### Components & Primitives
- [ ] Replace all `View` → `div` / semantic HTML (`section`, `nav`, `main`, etc.)
- [ ] Replace all `Text` → `p`, `h1`–`h6`, `span` as appropriate
- [ ] Replace `FlatList` / `ScrollView` → `div` with CSS overflow + `map()`
- [ ] Replace `TouchableOpacity` / `Pressable` → `button` or `a`
- [ ] Replace `expo-image` `<Image>` → `<img loading="lazy">`
- [ ] Replace `<input>` wrappers → native HTML `<input>` styled with Tailwind
- [ ] Replace `KeyboardAvoidingView` → remove entirely
- [ ] Replace `SafeAreaView` → CSS `padding: env(safe-area-inset-top) ...` in root layout
- [ ] Remove all `Platform.OS` checks

### Animations
- [ ] Replace button spring scale animations → CSS `active:scale-95` or Framer Motion
- [ ] Replace filter button color interpolation → CSS transition on `background-color`
- [ ] Replace map panel expand/collapse animation → CSS `transition: height`
- [ ] Replace announcements post button animation → CSS or Framer Motion

### Utilities & Logic
- [ ] Move `lib/utils.tsx` as-is
- [ ] Move resource category constants
- [ ] Move all TypeScript types

### Testing & Validation
- [ ] Verify all three role-based home views (admin, vendor, unauthenticated)
- [ ] Verify admin resource approval/denial workflow
- [ ] Verify vendor clock-in/out and location sync
- [ ] Verify bookmark persistence across page refreshes
- [ ] Verify auth token refresh on 401 (let a token expire and confirm retry works)
- [ ] Verify auth survives a page refresh (`localStorage` token + `/me` validation)
- [ ] Verify map loads, filters, and distance slider work
- [ ] Verify geolocation permission flow on desktop and mobile browser
- [ ] Verify announcements load and admin post works
- [ ] Test PWA install on iOS Safari (Add to Home Screen)
- [ ] Test PWA install on Android Chrome
- [ ] Run Lighthouse audit — target PWA score ≥ 90, Performance ≥ 80
- [ ] Verify responsive layout at mobile (375px), tablet (768px), and desktop (1280px) breakpoints
