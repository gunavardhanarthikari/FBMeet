# FBMeet

A minimal, literary-styled video meeting room — create a room, share the link, talk. Built with
React, TypeScript, Tailwind CSS, and [LiveKit](https://livekit.io/).

> "a room for meeting, slowly"

---

## Overview

FBMeet is a single-purpose video calling app: no accounts, no persistence, no history. Anyone
with a room link can join, turn their camera/mic on or off, share their screen, and leave. The
server only ever does one thing — mint short-lived LiveKit access tokens — everything else
(media capture, the call itself, room state) happens client-side or inside LiveKit's SFU.

**Core features**

- Instant, link-based rooms (no sign-up, no room list)
- Camera/mic preview and toggle before joining, with graceful permission-denied handling
- Real-time video/audio via LiveKit, with per-participant mute and camera-off state synced
  to every viewer
- Screen sharing with a presenter layout (desktop browsers only, feature-detected)
- Connection-quality indicators, reconnect feedback, and offline resilience
- Keyboard-navigable, screen-reader-friendly controls
- A calm, "literary teal" visual language (Cormorant Garamond / EB Garamond / IBM Plex Mono)

**Out of scope for v1** (see [Future roadmap](#future-roadmap)): recording, in-call chat,
reactions, a waiting room, authentication, host moderation actions actually taking effect, and
virtual backgrounds.

---

## Architecture

```
Browser (React SPA)                          Vercel
┌─────────────────────────────┐        ┌──────────────────────┐
│ Home → Lobby → Call → Left  │  POST  │  /api/token.ts        │
│                              │ ─────► │  (Vercel function)   │
│ useLocalMedia (camera/mic/   │        │  validates input,    │
│  screen — owns hardware)     │        │  mints a scoped JWT  │
│                              │ ◄───── │  using the LiveKit    │
│ LiveKitProvider (owns Room,   │  JWT   │  server SDK           │
│  participants, connection)   │        └──────────┬───────────┘
└──────────────┬───────────────┘                   │
               │ room.connect(url, token)           │
               ▼                                    ▼
                    LiveKit server / LiveKit Cloud (SFU)
```

**Two clear ownership boundaries run through the whole app:**

- **`useLocalMedia`** (`src/hooks/useLocalMedia.ts`) owns every local hardware track — camera,
  microphone, and screen-capture. It is the only code that calls `getUserMedia` /
  `getDisplayMedia`, and the only code that calls `.stop()` on a track. Nothing else touches
  hardware directly.
- **`LiveKitProvider`** (`src/contexts/LiveKitProvider.tsx`) owns the LiveKit `Room` instance,
  its event listeners, and the derived list of remote participants. It never stops a local
  media track — leaving that entirely to `useLocalMedia` — so the two systems can be reasoned
  about (and torn down) independently.

`Call.tsx` is the composition layer: a handful of small `useEffect`s translate decisions already
made by `useLocalMedia` (mic on/off, camera on/off, sharing/not) into the LiveKit publish/mute
calls that make those decisions visible to everyone else in the room.

### Data flow for one meeting

1. **Home** generates a random room ID (`nanoid`) and navigates to `/room/:roomId`.
2. **Room.tsx** creates one `useLocalMedia()` instance and wraps the page in `LiveKitProvider`,
   then renders **Lobby** or **Call** depending on `MeetingContext`'s `joined` flag.
3. **Lobby** shows the local camera/mic preview and, on "Join now", calls `LiveKitProvider`'s
   `connect(roomId, name, stream)` — which requests a token from `/api/token`, connects to the
   LiveKit room, and publishes the already-acquired local tracks.
4. **Call** renders the participant grid from `[self, ...remoteParticipants]`, keeps LiveKit's
   publish/mute state in sync with `useLocalMedia`'s toggles, and derives presenter mode from
   whichever participant (self or remote) has an active screen-share publication.
5. **Left** is shown after leaving; it does not reconnect anything, it just offers "Rejoin" or
   "Return home".

---

## Folder structure

```
api/
  token.ts                 # Vercel function: POST { roomId, participantName } → { token }
src/
  components/
    call/                  # Header, ControlBar, ParticipantTile, PresentationStage
    dialogs/                # ScreenShareDialog
    layout/                 # AppLayout
    left/                   # LeaveCard
    lobby/                  # PreviewCard
    ui/                     # Design-system primitives (buttons, inputs, icons, badges…)
    ErrorBoundary.tsx        # App-wide crash recovery screen
  contexts/
    MeetingContext.ts / MeetingProvider.tsx   # displayName, joined (cross-page meeting state)
    LiveKitContext.ts / LiveKitProvider.tsx   # Room instance, participants, connection state
  hooks/
    useLocalMedia.ts        # Camera/mic/screen-share ownership
  lib/                      # roomId, roomUrl, clipboard, participant seed colors
  pages/
    Home/ Lobby/ Call/ Left/ ShareConfirm/
  routes/AppRoutes.tsx
  services/livekit.ts       # requestToken() — the only thing that talks to /api/token
  styles/theme.css          # Tailwind v4 theme tokens (the entire design system)
  types/                    # Participant, ConnectionQualityLevel, token request/response shapes
```

---

## Tech stack

| Layer | Choice |
|---|---|
| UI | React 19 + TypeScript (strict) |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`, no PostCSS config needed) |
| Routing | React Router v7 (client-side SPA routing) |
| Realtime video/audio | `livekit-client` + `@livekit/components-react` |
| Token minting | `livekit-server-sdk`, in a Vercel serverless function |
| IDs | `nanoid` (room IDs, and a unique per-connection identity suffix) |
| Hosting | Vercel (static SPA + one serverless function) |
| Media server | LiveKit Cloud or a self-hosted LiveKit server |

---

## Environment variables

Copy `.env.example` to `.env` and fill in real values for local development. In Vercel, set the
same keys as **Project Settings → Environment Variables**.

| Variable | Where it's used | Exposed to the browser? |
|---|---|---|
| `LIVEKIT_API_KEY` | `api/token.ts` | No — server-only |
| `LIVEKIT_API_SECRET` | `api/token.ts` | No — server-only, never log or return this |
| `LIVEKIT_URL` | `api/token.ts` (currently unused directly by the handler, kept for parity/future use server-side) | No |
| `VITE_LIVEKIT_URL` | `src/contexts/LiveKitProvider.tsx` | **Yes** — Vite inlines any `VITE_*` var into the client bundle. This must be the same LiveKit server the token was signed for, but it is just a WebSocket URL, not a secret. |

`LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET` are only ever read inside `api/token.ts`, which runs on
Vercel's server, not in the browser. `npm run build` never inlines them (see
[Security review](#security-review)).

---

## Creating a LiveKit Cloud project

1. Sign up at [cloud.livekit.io](https://cloud.livekit.io) and create a project.
2. From the project's **Settings → Keys** page, create an API key/secret pair.
3. Note the project's WebSocket URL (looks like `wss://your-project.livekit.cloud`).
4. Set:
   ```
   LIVEKIT_API_KEY=<the key>
   LIVEKIT_API_SECRET=<the secret>
   LIVEKIT_URL=wss://your-project.livekit.cloud
   VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
   ```

Self-hosting LiveKit instead is also fine — point both URLs at your own server's WebSocket
endpoint and use the key/secret you configured for it.

---

## Configuring Vercel

FBMeet needs no special Vercel configuration beyond environment variables — it's a static Vite
build plus one serverless function, which Vercel detects automatically. The included
`vercel.json` adds an SPA fallback so that deep links like `/room/abc123` (opened directly,
rather than navigated to from `/`) resolve to `index.html` instead of a 404, while leaving
`/api/*` routed to the serverless function:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Steps:

1. Import the repository into a new Vercel project.
2. Add the four environment variables above (for Production, and Preview if you want preview
   deployments to work end-to-end).
3. Deploy. Vercel builds with `npm run build` and serves `dist/` plus `api/token.ts` as a
   function automatically.

---

## Local development

```bash
npm install
cp .env.example .env   # then fill in real LiveKit values
npm run dev             # Vite dev server on :5173
```

`vite.config.ts` proxies `/api/*` to `http://localhost:3000`, which is where the Vercel CLI's
local dev server (`vercel dev`) listens. So for the token endpoint to work locally, run
`vercel dev` in a second terminal (first time, it'll ask you to link the project — use
`vercel login` / `vercel link`):

```bash
vercel dev
```

If you don't have Vercel CLI access in your environment, any small Node HTTP server that calls
the default export of `api/token.ts` with a Vercel-shaped `req`/`res` will work as a stand-in for
local testing — the handler itself has no Vercel-specific dependencies beyond the
`@vercel/node` types.

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and produce a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint over the whole project |
| `npm run format` | Prettier — write mode |
| `npm run typecheck:api` | Type-check `api/token.ts` against its own Node-only `tsconfig` |
| `npm run verify:token` | Standalone script that exercises the token endpoint's validation |

---

## Deployment

1. Push to the branch connected to your Vercel project (or run `vercel --prod`).
2. Confirm the four environment variables are set for that environment.
3. Open the deployed URL, create a meeting, and confirm camera/mic/join works end-to-end against
   your real LiveKit project.
4. Open the room URL in a second browser/device to confirm two-way audio/video and screen share.

See the [deployment checklist](#deployment-checklist) below for the full pre-launch pass.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| "The meeting server is not configured." | `VITE_LIVEKIT_URL` is missing at build time — Vite only inlines env vars present *when it builds*, so re-deploy after adding it. |
| "Could not reach the token service." on join | `/api/token` isn't reachable — locally, make sure `vercel dev` (or your stand-in) is running on `:3000`; on Vercel, check the function's logs. |
| Token requests succeed but the room never connects | `LIVEKIT_URL`/`VITE_LIVEKIT_URL` point at a different LiveKit project than the one `LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET` belong to. All four must describe the same project. |
| Camera/mic preview never appears | Browser permission was denied, or the site isn't served over HTTPS (or `localhost`) — `getUserMedia` requires a secure context. The Lobby surfaces a "Retry" link once this happens. |
| "Present now" button is missing | Expected on browsers without `getDisplayMedia` (most mobile browsers) — this is feature-detected, not a bug. |
| Copy-link button says "Copy failed" | The Clipboard API needs a secure context; FBMeet falls back to a manual select-and-copy `<input>` in that case. |
| A blank white screen after a crash | Should not happen — `ErrorBoundary` catches render errors app-wide and shows a "Reload" screen. If you see a truly blank page, check the browser console; it means the error escaped React entirely (e.g. a syntax error in a script tag). |

---

## Known limitations

- **No persistence.** Rooms, chat, and participant history do not survive a page reload beyond
  what LiveKit itself retains server-side; there is no database.
- **No moderation enforcement.** The host badge and the mute/remove buttons in the participant
  tile UI are host-only *affordances*; there is no server-side check preventing any participant
  from calling the same LiveKit APIs. Do not rely on this for meetings with untrusted
  participants.
- **No recording, chat, reactions, or waiting room** — intentionally out of scope for v1 (see
  the original module specs).
- **Screen-share audio** is published as a second track (`ScreenShareAudio`) but LiveKit/Chromium
  support for capturing tab/system audio varies by OS and browser.
- **Token TTL is fixed at 2 hours** server-side; a meeting longer than that will need a fresh
  token, which currently means rejoining rather than a silent refresh.
- **Vercel's default 10s serverless function timeout** applies to `/api/token`; the client also
  times out and surfaces an error at 10s to match.

---

## Future roadmap (v2 ideas)

- Server-enforced host moderation (mute/remove backed by a LiveKit room-admin token, not just UI)
- In-call chat and reactions
- A waiting room / lobby approval flow
- Recording (LiveKit Egress)
- Authenticated accounts and a persistent room list
- Virtual backgrounds / background blur
- Silent token refresh for meetings that outlast the token TTL
- Automated cross-browser test coverage (this module's audits were manual + Playwright scripts,
  not a checked-in test suite)

---

## Security review

- **Secrets never reach the client.** `LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET` are read only inside
  `api/token.ts`, which is excluded from the Vite client build entirely (it lives outside `src/`
  and is never imported by client code). A production build's output has been checked to confirm
  neither value nor the `livekit-server-sdk` package appears in `dist/`.
- **Environment variables are documented** above, with an explicit "exposed to the browser?"
  column so it's clear which of the four is safe to be public.
- **The token endpoint validates its input**: rejects non-POST methods, rejects malformed JSON,
  requires `roomId` to match `^[a-zA-Z0-9_-]{1,64}$`, requires a non-empty `participantName` up
  to 40 characters, and returns structured JSON error bodies (never a stack trace) on every
  failure path.
- **Tokens are minimally scoped**: `roomJoin`, `canPublish`, `canSubscribe` only — no room-admin
  or recording grants — and expire after 2 hours. Each participant's LiveKit *identity* is
  suffixed with a random string server-side, so two people can share a display name without
  colliding, without the client ever choosing its own identity.
- **No sensitive logging**: the only `console.error` calls in `api/token.ts` log a fixed string
  ("LiveKit server environment variables are not configured", "Failed to generate LiveKit
  token:") plus the error object — never the request body, the token, or the API secret.
- **Client-side network calls time out**: `requestToken()` aborts after 10 seconds rather than
  hanging indefinitely.

---

## Final verification checklist

Status against the full set of module specs this project was built from:

### Module 1 — Project setup
- [x] Vite + React + TypeScript + Tailwind v4
- [x] Folder structure, path alias, ESLint + Prettier
- [x] Routes: `/`, `/room/:roomId`, `/left`, `/share-screen`

### Module 2 — Visual design
- [x] Home, Lobby, Call, Screen Share Confirm, Left screens matching the literary-teal language
- [x] Cormorant Garamond / EB Garamond / IBM Plex Mono typography

### Module 3 — Meeting flow & routing
- [x] `nanoid` room IDs, `MeetingContext`, Lobby/Call orchestration in `Room.tsx`
- [x] Copy-link with clipboard fallback, join-name validation, back/forward correctness

### Module 4 — Local media preview
- [x] Explicit-gesture-gated camera/mic preview via `useLocalMedia`
- [x] Asymmetric camera (stop/release) vs. mic (disable) toggle semantics
- [x] Permission-denial fallback + Retry, device-change handling, full cleanup on unmount

### Module 5 — LiveKit infrastructure
- [x] `/api/token.ts` serverless token endpoint, minimally scoped JWTs
- [x] `services/livekit.ts` client, verified no secrets in the client bundle

### Module 6 — Real connection
- [x] `LiveKitProvider` owning the `Room` instance and participant sync
- [x] Local tracks survive the Lobby → Call transition; real `RemoteParticipant` data

### Module 7 — Complete meeting features
- [x] Real mic mute/unmute via LiveKit signaling (remote sees it immediately)
- [x] Real camera on/off with no frozen frames, avatar fallback while off
- [x] Screen sharing (desktop-only, feature-detected) with a presenter layout
- [x] Participant status: muted / camera-off / presenting / connection quality
- [x] Connection UX: connecting / reconnecting / reconnected / offline, never blocking
- [x] Browser lifecycle: tab hidden/restored, temporary network loss, no refresh required
- [x] Accessibility: keyboard nav, ARIA labels, focus states, screen-reader-friendly controls
- [x] Performance: memoized participant tiles, efficient participant updates
- [x] **Explicitly out of scope, confirmed not implemented:** recording, chat, reactions, waiting
      room, authentication, host moderation *enforcement*, virtual backgrounds

### Module 8 — Production polish (this pass)
- [x] Responsive audit across desktop/laptop/tablet/mobile portrait/mobile landscape (real
      Playwright screenshots) — found and fixed a scroll-position-carryover bug from Lobby → Call
      on short viewports, and added iOS safe-area insets to the Header and ControlBar
- [x] Accessibility audit — computed real WCAG contrast ratios for every text/background pairing
      in the theme; found and fixed a primary-button contrast failure (2.44:1 → 4.96:1) using only
      existing design tokens
- [x] React Error Boundary with a friendly recovery screen (`src/components/ErrorBoundary.tsx`)
- [x] Loading/empty-state polish: a "requesting camera and microphone access…" message during
      acquisition, and a "waiting for others to join" hint when alone in a call
- [x] Network resilience reviewed (already solid from Module 7): offline detection, reconnect
      badge, token-request timeout and structured error surfacing — no changes needed
- [x] Performance: memoized `Header` and `ControlBar`, stabilized their callback props with
      `useCallback` in `Call.tsx`
- [x] Browser compatibility reviewed: all hardware/media APIs already feature-detected
      (Module 4/7); no browser-specific code paths needed
- [x] Security review (see above)
- [x] This README
- [x] Code cleanup: removed two unused scaffold components (`Card`, `Input`), an unused mock
      data file, four empty barrel files, and five leftover debug `console.log` calls
- [x] This verification checklist

---

## Deployment checklist

- [ ] `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`, `VITE_LIVEKIT_URL` set in Vercel for
      the target environment
- [ ] All four point at the *same* LiveKit project
- [ ] `npm run build` succeeds locally with production env values
- [ ] `dist/` contains no reference to `LIVEKIT_API_SECRET` or `livekit-server-sdk` (spot-check
      with `grep -r "API_SECRET" dist/` — should return nothing)
- [ ] Deployed URL loads Home, creating a meeting works, and the link it copies is reachable by a
      second device
- [ ] Two-browser test: camera, mic mute, screen share, and leave all work end-to-end
- [ ] Confirm `vercel.json`'s SPA rewrite is in place so a *freshly opened* `/room/:id` link
      (not navigated to from `/`) doesn't 404

---

## Component hierarchy

```
App
└─ ErrorBoundary
   └─ MeetingProvider
      └─ AppLayout
         └─ AppRoutes
            ├─ Home
            ├─ Room                       (LiveKitProvider + useLocalMedia live here)
            │  ├─ Lobby
            │  │  └─ PreviewCard, InputField, PrimaryButton, CopyLinkButton
            │  └─ Call
            │     ├─ Header               (memo)
            │     ├─ PresentationStage    (when someone is presenting)
            │     ├─ ParticipantTile × N  (memo)
            │     ├─ ControlBar           (memo)
            │     └─ ScreenShareDialog    (on demand)
            ├─ Left
            │  └─ LeaveCard
            └─ ShareConfirm               (standalone design-preview route)
```

## LiveKit integration overview

- **Connect**: `LiveKitProvider.connect(roomId, name, localStream)` requests a token, opens a
  `Room`, wires up its event listeners (participant join/leave, track publish/mute/subscribe,
  connection-quality, connection-state, reconnected, disconnected), then publishes whatever
  tracks `useLocalMedia` had already acquired in the Lobby.
- **Sync effects in `Call.tsx`** bridge local intent to LiveKit signaling: camera on/off
  publishes/unpublishes the video track; mic on/off calls `publication.mute()`/`unmute()`;
  screen-share start/stop publishes/unpublishes `Track.Source.ScreenShare` (+ audio).
  `useLocalMedia` never imports LiveKit, and `LiveKitProvider` never imports `useLocalMedia` —
  `Call.tsx` is the only place that knows about both.
- **Remote participants** are derived, not stored piecemeal: every relevant `RoomEvent`
  triggers a full recompute from `room.remoteParticipants` into a plain `Participant[]`, which is
  what all the UI actually renders.
- **Presenter mode** is a pure derivation (`participants.find(p => p.isPresenting)`), so it works
  identically whether the presenter is the local user or a remote one.
- **Reconnection**: LiveKit's own `ConnectionStateChanged`/`Reconnected`/`Disconnected` events
  drive the visible connection badge; a `window.offline` listener gives faster feedback than
  waiting for LiveKit's heartbeat to notice, without taking over the actual reconnect decision.

## Remaining optional improvements for v2

See [Future roadmap](#future-roadmap) above — the short version: server-enforced moderation,
chat/reactions, a waiting room, recording, accounts, virtual backgrounds, silent token refresh,
and a checked-in automated test suite (this project's verification has been thorough but manual
plus ad-hoc Playwright scripts, not CI-gated tests).
