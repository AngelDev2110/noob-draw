# 🎨 Noob Draw

A **real-time, multiplayer Pictionary-style drawing & guessing game**. One player draws a secret word on a shared canvas while everyone else races to guess it in the chat — with live strokes, progressive letter hints, synced timers, and a scoreboard, all running in the browser.

Built as a fully client-side SPA: there is **no custom backend server**. Every bit of game logic lives in Postgres functions, and all real-time coordination happens over Supabase Realtime channels.

---

## ✨ Highlights

- 🖌️ **Shared drawing canvas** with pen/eraser tools, colors, and stroke width — streamed live to every player.
- 💬 **Real-time guessing chat** with correct-guess detection, scoring, and celebratory confetti.
- 🔤 **Progressive word hints** — letters reveal over time, deterministically, so every client shows the exact same hint without a server telling them to.
- ⏱️ **Server-synced timers** for turns and rounds, with no server tick loop.
- 🔒 **Host-gated rooms** — players request to join and the host approves them.
- 👤 **Zero-friction auth** — anonymous sign-in, no passwords or accounts.
- 🌐 **Late-joiner friendly** — new players instantly receive the current drawing, chat history, and revealed hints via snapshot requests.

---

## 🧰 Tech Stack

| Layer             | Technology                                                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**     | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)                                                           |
| **Build tool**    | [Vite](https://vite.dev/)                                                                                                                |
| **Routing**       | [TanStack Router](https://tanstack.com/router) (file-based, auto code-splitting)                                                         |
| **Server state**  | [TanStack Query](https://tanstack.com/query)                                                                                             |
| **Styling**       | [Tailwind CSS v4](https://tailwindcss.com/) (config-less) + [shadcn/ui](https://ui.shadcn.com/) on [Radix UI](https://www.radix-ui.com/) |
| **Backend**       | [Supabase](https://supabase.com/) — Auth, Postgres, Realtime                                                                             |
| **Icons / fonts** | [Lucide](https://lucide.dev/) + [Geist](https://vercel.com/font)                                                                         |
| **Extras**        | [canvas-confetti](https://www.kirilv.com/canvas-confetti/) 🎉                                                                            |
| **Tooling**       | ESLint (flat config) · Prettier · pnpm                                                                                                   |
| **Deployment**    | [Vercel](https://vercel.com/)                                                                                                            |

---

### 🧠 Game logic lives in Postgres

Every game action is a Postgres RPC function, wrapped one-to-one in `src/services/`:

- **`rooms.ts`** — room creation, membership, join requests, and host approval.
- **`game.ts`** — the game engine: `start_game`, `get_game_state`, `submit_guess`, `check_and_advance_turn`, `get_server_time`, and more.
- **`auth.ts`** — anonymous sign-in and display-name changes.

The client never trusts itself with authoritative state — it asks Postgres.

### 📡 Realtime is the core

There's **one broadcast channel per room** (`room-game-${roomId}`), created in `useGameChannel` with presence tracking for online players. That single channel is threaded down into focused hooks, each owning one slice of realtime behavior:

| Hook             | Responsibility                                                      |
| ---------------- | ------------------------------------------------------------------- |
| `useGameChannel` | Presence + `game_started` / `turn_changed` events                   |
| `useCanvasSync`  | Drawing strokes, batched every **80 ms** into `stroke_batch` events |
| `useGuessChat`   | Chat messages + history snapshots for late joiners                  |
| `useWordReveal`  | Progressive letter reveals                                          |
| `useCountDown`   | Turn / round timers                                                 |

### ⏱️ A serverless timing model

There is **no server tick loop**. Instead:

- The client clock is **synced to the server** via `get_server_time`, which measures round-trip latency and returns an `offset` so every client agrees on elapsed time.
- Turn and round durations are **computed on the client** from a server timestamp plus shared constants (`TURN_DURATION = 90s`, `REVEAL_INTERVAL = 15s`, …).
- **Turn advancement is driven by clients** polling `check_and_advance_turn` every 2 seconds — whichever client notices the change first broadcasts `turn_changed` so everyone refetches.

### 🔤 Deterministic, offline-friendly hints

The word-reveal system is a neat trick: instead of a server deciding which letters to reveal and when, the **drawer's client is the single source of truth**. It uses a `seededShuffle` keyed on `word + turnStartedAt` to pick reveal positions deterministically. Guessers who join late simply send a `request_hints` event and the drawer replays exactly the right letters — no server round-trip, and everyone stays perfectly in sync.

### 🎨 Late-joiner snapshots

New players don't start from a blank slate. The canvas and chat both implement a **snapshot request/response** pattern over the broadcast channel: on join, a client asks for the current state, and an existing peer replies with the full drawing and message history.

---

## 🚀 Getting Started

**Prerequisites:** [Node.js](https://nodejs.org/), [pnpm](https://pnpm.io/), and a [Supabase](https://supabase.com/) project.

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# then fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY

# Start the dev server
pnpm dev
```

> ⚠️ Anonymous sign-in must be enabled on your Supabase project (`enable_anonymous_sign_ins`) for auth to work.

### 📜 Scripts

| Command                             | Description                                               |
| ----------------------------------- | --------------------------------------------------------- |
| `pnpm dev`                          | Start the Vite dev server                                 |
| `pnpm build`                        | Typecheck (`tsc -b`) then build for production            |
| `pnpm lint` / `pnpm lint:fix`       | Run ESLint                                                |
| `pnpm format` / `pnpm format:check` | Run Prettier                                              |
| `pnpm gen:types`                    | Regenerate TypeScript types from the live Supabase schema |

---

## 📁 Project Structure

```
src/
├── components/     # UI + game views (RoomView orchestrates everything)
│   └── ui/         # shadcn/ui primitives
├── hooks/          # Realtime hooks (canvas, chat, hints, timers, clock)
├── services/       # One-to-one wrappers around Supabase RPCs
├── routes/         # TanStack Router file-based routes
├── constants/      # Shared game timing constants
├── context/        # AuthProvider (anonymous auth)
└── types/          # Ambient client types + generated DB types
```

---

## 📦 Deployment

Deployed to **Vercel**, with `vercel.json` rewriting all routes to `/index.html` for the SPA router. The Supabase project is configured via `supabase/config.toml`.
