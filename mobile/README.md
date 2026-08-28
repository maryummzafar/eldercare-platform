# Eldercare — Mobile App

React Native client for the Eldercare API. Expo SDK 57 · React 19 · TypeScript · expo-router.

## Running it

The backend must be running first — see [`../demo/README.md`](../demo/README.md).

```sh
npm install
npm start
```

Then scan the QR code with **Expo Go** on your phone, or press `a` for an Android
emulator.

**Your phone and laptop must be on the same Wi-Fi.** The app derives the backend
address from the host Expo is already serving the bundle over, so `localhost` on the
laptop resolves correctly from the phone with no configuration.

### The port 8081 collision

Metro's default port is 8081 and so is the backend's, so the dev server is pinned to
**8082** in the `start` scripts. The API client only borrows the *host* from Expo and
always talks to port 8081, so the two stay independent.

To point at a deployed backend instead, set `extra.apiUrl` in `app.json`:

```json
"extra": { "apiUrl": "https://api.yourdomain.com" }
```

## What works

| Flow   | Screens                                                                  |
|--------|--------------------------------------------------------------------------|
| Auth   | Login, register as elder or helper, session restored from the keystore    |
| Elder  | Search verified helpers by city and service, view a profile, request a booking, see and cancel bookings |
| Helper | Create/edit profile with rate and offered services, accept/decline requests, start and complete visits |
| Chat   | One thread per booking, reachable from any booking card and from a message notification |
| Alerts | Bell with unread badge on every screen, plus a notification centre        |

### Chat and notifications

Both are **polled**, not pushed — there is no device push yet, so the poll is the
delivery mechanism. An open chat refreshes every 5s; the unread badge every 20s and
whenever the app returns to the foreground. Both intervals are torn down on unmount,
so a backgrounded screen costs nothing.

Threads are keyed by booking id, so `/chat/[bookingId]` is the whole routing story
and the server rejects anyone who is not on that booking.

Routing is decided once, in [`app/index.tsx`](app/index.tsx), from the `role` the API
returns at login. Admins land on an explanatory screen — vetting happens through the
API, not here.

## Design constraints

The paying users are elderly, so the defaults are deliberately not the mobile norm:

- Body text starts at **18sp**; nothing user-facing is smaller than 16.
- Every tap target is at least **48dp** tall, enforced by `minHeight` in
  [`src/theme.ts`](src/theme.ts) rather than by padding arithmetic.
- No text colour falls below **4.5:1** contrast on its background.
- Selection is signalled by border weight *and* fill, never colour alone.
- Navigation is explicit on-screen buttons — no gesture-only paths.
- Content is capped at `CONTENT_MAX_WIDTH` and centred, so a tablet, a landscape
  phone or the laptop web preview gets one readable column instead of 1400px lines.

Prefer the tokens in `src/theme.ts` and the components in `src/components/ui.tsx` over
ad-hoc styles, so these floors hold as screens get added.

## Layout

```
app/                 routes (expo-router, file-based)
  index.tsx          decides where a launch lands, based on role
  (auth)/            login, register
  (elder)/           search, helper detail + booking, my bookings
  (helper)/          visits with lifecycle actions, profile editor
src/
  api/               typed client + types mirrored from the Java DTOs
  auth/              session context; JWT in Keychain/Keystore
  components/        shared UI that enforces the accessibility floors
  theme.ts           design tokens
  format.ts          money and date rendering
```

`src/api/types.ts` is hand-written to mirror `com.eldercare_platform.dto`. If a DTO
changes on the backend, change it there in the same commit.

## Checks

```sh
npm run typecheck              # tsc --noEmit
npx expo export --platform android   # verifies the bundle builds
```

## Not built yet

- No automated tests.
- Money is rendered as `₹` throughout ([`src/format.ts`](src/format.ts)) — change it
  there if you launch outside India.
- Bookings do not refresh on their own; there is a Refresh button. Push notifications
  are the real fix for a helper waiting on a request.
- No payment step — the API computes a total but nothing charges anything.
- No app icon or splash screen of your own; still the Expo defaults.
