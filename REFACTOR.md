# Frontend Refactor: Expo → Next.js + PWA

## Decision

Migrate the frontend from Expo (React Native) to **Next.js (App Router)** with a **PWA** for mobile web users. True native mobile is not a requirement.

The FastAPI backend is untouched. Next.js replaces Expo as the client only.

```
Browser → Next.js (frontend) → FastAPI (unchanged)
```

---

## What Transfers Directly

These can be moved with little or no modification:

- All API call logic (`lib/api.tsx`) — remove `expo-secure-store` dependency, otherwise unchanged
- All utility functions (`lib/utils.tsx`) — pure JS, move as-is
- TypeScript types and constants (resource categories, etc.)
- Context providers (AuthProvider, BookmarksProvider) — plain React, swap storage layer only
- Business logic: role checks, admin approval workflow, vendor clock-in/out, bookmark toggle
- Routing conventions — Next.js App Router uses the same file-based `[param]` and `_layout` patterns as Expo Router
- Tailwind config — NativeWind → standard Tailwind CSS, minimal changes
- Axios (used in `auth.tsx`) — already works in any JS environment
- Haversine distance formula, `hoursToString`, `isOpen` helpers
- All Lucide icons — swap `lucide-react-native` for `lucide-react`

---

## What Needs Replacing

### Storage

| Current | Replacement | Notes |
|---|---|---|
| `expo-secure-store` (auth tokens) | `httpOnly` cookies | More secure than SecureStore — tokens never touch JS |
| `expo-secure-store` (bookmarks) | `localStorage` | Bookmarks are not sensitive |
| `expo-secure-store` (vendor clock-in location) | `localStorage` | Not sensitive |

The auth token refresh flow in `lib/api.tsx` reads/writes SecureStore before every request. This becomes cookie-based — the browser handles sending the cookie automatically, so the manual attach-token step goes away. The refresh-on-401 retry logic stays.

### Maps

| Current | Replacement |
|---|---|
| `react-native-maps` | `react-leaflet` (recommended) or `@vis.gl/react-google-maps` |

The map screen is the most complex screen in the app. Beyond the map library swap, the draggable bottom panel (currently `PanResponder` + manual height animation) needs to be rebuilt as a CSS drawer. The filter UI (animated buttons, color interpolation, distance slider) maps cleanly to CSS transitions and a native `<input type="range">`.

The map screen also has a dual coordinate format for markers (legacy root-level `latitude`/`longitude` vs. `coordinates` object). Keep that normalization logic when migrating.

### Location

| Current | Replacement |
|---|---|
| `expo-location` (foreground permission + `getCurrentPositionAsync`) | Browser `navigator.geolocation.getCurrentPosition` |

The permission prompt becomes the browser's native geolocation prompt. No API change needed in the calling code — just swap the call.

### Images

| Current | Replacement |
|---|---|
| `expo-image` | Next.js `<Image>` (`next/image`) |

`next/image` provides the same lazy loading and optimization. Syntax is nearly identical.

### Fonts

| Current | Replacement |
|---|---|
| `@expo-google-fonts/lexend` + `useFonts` hook | `next/font/google` |

All 9 Lexend weights are currently loaded. With `next/font`, declare them once in the root layout — no hook, no loading state, no flash of unstyled text.

### Animations

| Current | Replacement |
|---|---|
| `react-native-reanimated` (spring/timing) | CSS transitions + `Framer Motion` (optional) |

Reanimated is used for: button scale on press, filter button color interpolation, map panel expand/collapse, announcements post button. All of these are straightforward CSS transitions. Framer Motion is a good drop-in if you want spring physics.

### Navigation

| Current | Replacement |
|---|---|
| `@react-navigation/bottom-tabs` + Expo Router groups | Next.js App Router layouts + CSS nav component |

The `(home)`, `(chat)`, `(map)`, `(more)` route groups map directly to Next.js route groups. The bottom tab bar becomes a responsive nav component — bottom bar on mobile (CSS), top/side nav on desktop.

### Removed Entirely (no web equivalent needed)

- `react-native-safe-area-context` / `SafeAreaView` → CSS `env(safe-area-inset-*)` for mobile Safari notch
- `KeyboardAvoidingView` → not needed on web
- `expo-haptics` → remove (no web equivalent, was installed but impact is minimal)
- `expo-splash-screen` → Next.js handles this with loading states or `loading.tsx`
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

**Auth initialization validates the stored token on every app load** via `GET admin/me` or `GET auth/me`. With cookie-based auth this becomes a single `GET /auth/me` call on page load (the cookie is sent automatically).

**Bookmarks store org names (strings), not full Resource objects.** There is legacy migration logic in `providers/bookmarks.tsx` for users who had full objects stored. Keep this migration shim in `localStorage` reads.

**Resource categories are hardcoded constants**, not API-driven. Move them to a constants file in the Next.js project.

**The vendor clock-in location is persisted to SecureStore** (key: `"clock_in_location"`) and also synced to the backend via `PATCH auth/location`. The localStorage replacement only affects the local persistence — the backend sync stays the same.

---

## Checklist

### Project Setup
- [ ] Initialize Next.js project with App Router and TypeScript (`npx create-next-app@latest`)
- [ ] Configure Tailwind CSS
- [ ] Configure `next/font` with all 9 Lexend weights
- [ ] Set up environment variables (`NEXT_PUBLIC_API_URL` replacing Expo's config)
- [ ] Install `lucide-react` (replaces `lucide-react-native`)
- [ ] Set up path aliases (`@/` → `src/`) in `tsconfig.json`

### PWA
- [ ] Install and configure `@ducanh2912/next-pwa` (or `next-pwa`)
- [ ] Create `public/manifest.json` (name, icons, `display: standalone`, `start_url`)
- [ ] Add PWA meta tags to root layout (viewport, theme-color, apple-mobile-web-app tags)
- [ ] Generate app icons at required sizes (192x192, 512x512 minimum)
- [ ] Test "Add to Home Screen" on iOS Safari and Android Chrome
- [ ] Configure service worker caching strategy for API routes vs static assets

### Routing & Layout
- [ ] Recreate route group structure: `(home)`, `(chat)`, `(map)`, `(more)`
- [ ] Build root layout (`app/layout.tsx`) with font, providers, and nav
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
- [ ] Implement cookie-based auth (set `httpOnly` cookie on login response, or proxy through a Next.js Route Handler)
- [ ] Update `lib/api.tsx` — remove SecureStore reads/writes, rely on browser cookie passthrough
- [ ] Remove 401 manual token attach logic (browser sends cookie automatically)
- [ ] Keep 401 refresh-and-retry logic — update it to use cookie refresh endpoint
- [ ] Migrate AuthProvider — replace SecureStore with `GET /auth/me` on mount
- [ ] Migrate BookmarksProvider — replace SecureStore with `localStorage`
- [ ] Migrate vendor clock-in location persistence — replace SecureStore with `localStorage`

### Maps
- [ ] Install `react-leaflet` and `leaflet`
- [ ] Add Leaflet CSS to root layout
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
- [ ] Replace `expo-image` `<Image>` → `next/image` `<Image>`
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
- [ ] Verify `hoursToString` and `isOpen` render correctly server-side (no `window` dependency — they're fine)

### Testing & Validation
- [ ] Verify all three role-based home views (admin, vendor, unauthenticated)
- [ ] Verify admin resource approval/denial workflow
- [ ] Verify vendor clock-in/out and location sync
- [ ] Verify bookmark persistence across page refreshes
- [ ] Verify auth token refresh on 401 (let a token expire and confirm retry works)
- [ ] Verify map loads, filters, and distance slider work
- [ ] Verify geolocation permission flow on desktop and mobile browser
- [ ] Verify announcements load and admin post works
- [ ] Test PWA install on iOS Safari (Add to Home Screen)
- [ ] Test PWA install on Android Chrome
- [ ] Run Lighthouse audit — target PWA score ≥ 90, Performance ≥ 80
- [ ] Verify responsive layout at mobile (375px), tablet (768px), and desktop (1280px) breakpoints
