# Mighty Poker

Real-time planning poker for agile teams. Create a room, share the link, vote on story points, reveal together.

## Features

- Create a room and share the invite link
- Join anonymously (no accounts required)
- Fibonacci deck (0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ?)
- Real-time updates via WebSockets
- Auto-reveal after all participants vote (5s delay)
- Facilitator controls: start voting, reveal, new round
- No persistence — rooms live in memory

## Tech Stack

| Layer | Tech |
|-------|------|
| Monorepo | pnpm workspaces + Turborepo |
| Backend | Node.js + Express + Socket.IO |
| Frontend | React + Vite + Tailwind CSS |
| State | Zustand |
| Routing | React Router v7 |
| Core logic | Pure TypeScript (no deps) |

## Setup

```bash
# Install dependencies
pnpm install

# Start both server and web in dev mode
pnpm dev

# Server: http://localhost:3001
# Web:    http://localhost:5173
```

## Testing

```bash
# Unit + integration tests
pnpm test

# E2E tests (requires dev servers running or will start them)
pnpm exec playwright test
```

## Structure

```
mighty-poker/
├── apps/
│   ├── server/     Express + Socket.IO backend (port 3001)
│   └── web/        React + Vite frontend (port 5173)
└── packages/
    └── core/       Pure domain types, deck, room state machine
```

## How It Works

1. Facilitator creates a room → gets an invite link
2. Participants open the link → enter name → join
3. Facilitator clicks **Start Voting** → cards appear
4. Everyone picks a card → auto-reveals after 5s once all voted
5. Facilitator can also **Reveal Votes** manually at any time
6. **New Round** resets and loops back to step 3
