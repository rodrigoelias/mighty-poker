# Mighty Poker × Backpack Design System Migration

## Overview

Migrate the mighty-poker frontend from pure Tailwind CSS to a hybrid setup:
- **Backpack React components** for all UI elements (buttons, inputs, cards, badges, alerts, text, spinners)
- **Tailwind CSS** retained for layout utilities only (flex, grid, spacing, responsive breakpoints)
- **Backpack design tokens** bridged into Tailwind config for color/spacing consistency

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Backpack scope | Nearly strict — all UI elements including card deck, participant list, results grid | User chose to move all three "custom" elements to Backpack after visual comparison |
| Font | Nunito Sans (Google Fonts) | Substitute for proprietary Skyscanner Relative; similar rounded geometry |
| Tailwind preflight | Disabled | Backpack's base stylesheet (`bpk-stylesheets`) is the only CSS reset; avoids conflicts |
| Primary color | Backpack Blue (#0770e3) | Adopting Backpack's native palette for cohesion; replaces current violet (#7c3aed) |
| Theme | Light | Backpack is designed light-first; no native dark mode support |

## Technical Setup

### Dependencies

**Add:**
- `@skyscanner/backpack-web` — React components
- `@skyscanner/bpk-foundations-web` — Design tokens
- `sass` — Required for Backpack's SCSS imports

**Keep:**
- `tailwindcss`, `postcss`, `autoprefixer` — Layout utilities only

### Font

Load Nunito Sans via Google Fonts `<link>` tag in `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
```

### Base Styles

Import Backpack's base stylesheet once in `main.tsx`:
```typescript
import '@skyscanner/backpack-web/bpk-stylesheets';
```

### Token Bridge

Import Backpack tokens from `@skyscanner/bpk-foundations-web/tokens/base.es6` into `tailwind.config.js` under `theme.extend` for colors and spacing. This ensures any custom Tailwind utilities use Backpack-consistent values.

### Tailwind Config Changes

```javascript
// tailwind.config.js
module.exports = {
  corePlugins: {
    preflight: false, // Backpack's bpk-stylesheets handles the reset
  },
  theme: {
    extend: {
      // Backpack tokens bridged here
    },
  },
};
```

### Tailwind Retained For

- `flex`, `grid`, `gap-*` — layout
- `p-*`, `m-*` — spacing
- `w-*`, `h-*`, `min-h-*` — sizing
- `lg:`, `sm:` — responsive breakpoints
- `rounded-*`, `shadow-*` — only where Backpack components don't apply

## Component Mapping

### Pages

#### HomePage (`/`)
- `BpkText` (heading style) for "Mighty Poker" title and subtitle
- `BpkFieldset` + `BpkLabel` + `BpkInput` for "Your name" and "Room name" fields
- `BpkButton` (primary) for "Create Room" submit
- `BpkBannerAlert` (error type) for error messages
- Background and centering: Tailwind layout utilities

#### JoinPage (`/room/:roomId/join`)
- Same form pattern as HomePage
- `BpkSpinner` for loading state
- `BpkButton` (secondary) for "Create a new room" link when room not found

#### RoomPage (`/room/:roomId`)
- Layout: Tailwind `grid-cols-1 lg:grid-cols-[300px_1fr] gap-6`
- Background: Tailwind `bg-gray-50` (or Backpack equivalent token)

### Components

#### RoomHeader
- `BpkText` for room name
- `BpkBadge` for round status (idle/voting/revealed)
- `BpkText` (caption style) for participant count
- `BpkButton` (secondary/link) for "Invite" action

#### ParticipantList
- `BpkCard` wrapping each participant row
- `BpkBadge` for facilitator role and offline status
- `BpkText` for participant names
- Custom avatar circle (Backpack has no avatar component) — initials with deterministic color

#### CardDeck
- `BpkCardButton` for each voting card
- Custom CSS layered on top for selected state (lifted, color accent, shadow)
- Tailwind grid for card layout

#### RevealedResults
- `BpkCard` for each vote cell
- `BpkText` (heading style) for vote values
- `BpkBadge` for facilitator label
- `BpkBannerAlert` (success type) for consensus message
- `BpkBannerAlert` (warning type) for no-consensus message
- Tailwind grid for results layout

#### FacilitatorControls
- `BpkButton` (primary) for "Start Voting"
- `BpkButton` (secondary) for "Reveal Votes"
- `BpkButton` (secondary) for "New Round"

#### ConnectionBanner
- `BpkBannerAlert` (warning type) with `BpkSpinner` for reconnection indicator

## What Doesn't Change

- **State management:** Zustand store (`room-store.ts`) — untouched
- **Socket.IO integration:** `socket.ts` — untouched
- **Routing:** React Router config in `App.tsx` — untouched
- **Core package:** `@mighty-poker/core` — untouched
- **Server:** `@mighty-poker/server` — untouched
- **Data flow:** All props, events, and state shapes remain identical

## Testing Impact

- Component tests may need minor updates if they assert on specific CSS classes or DOM structure
- E2E tests (Playwright) should largely pass since they target user-visible behavior, not styling
- Run full test suite after migration to verify

## React Compatibility Note

Backpack targets React 18; this project uses React 19. Install with `--legacy-peer-deps` to bypass peer dependency warnings. No known breaking incompatibilities exist between Backpack and React 19.
