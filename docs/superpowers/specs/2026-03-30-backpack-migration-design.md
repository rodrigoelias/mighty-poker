# Mighty Poker × Backpack Design System Migration

## Enhancement Summary

**Deepened on:** 2026-03-30
**Research agents used:** 8 (backpack-docs, migration-practices, typescript-review, performance-oracle, architecture-strategist, code-simplicity-reviewer, frontend-races-reviewer, pattern-recognition-specialist)

### Key Changes From Research
1. **Drop token bridge** — no actual consumers; all colored elements become Backpack components
2. **Drop BpkFieldset** — overkill for 2 simple text inputs; use BpkLabel + BpkInput directly
3. **Use plain `<button>` for voting cards** — BpkCard has no `selected` prop; fighting its defaults adds complexity
4. **Use `BpkInfoBanner`** — `BpkBannerAlert` is deprecated
5. **Use `BpkButtonV2`** — current API with enum-based type/size props
6. **Self-host Nunito Sans** — eliminates 2 cross-origin requests from critical render path
7. **Use `sass-embedded`** — 5-10x faster than `sass` for Vite SCSS compilation
8. **Import `.css` variants** — Vite doesn't transpile SCSS from node_modules; use `bpk-stylesheets/base.css`
9. **React 19 spike required** — `--legacy-peer-deps` is insufficient; type conflicts at call sites need empirical validation
10. **Fix pre-existing bugs first** — duplicate Socket.IO listeners, vote desync race, promise timeouts

### Pre-Existing Bugs Discovered
These should be fixed BEFORE the migration to avoid debugging unfamiliar component animations alongside data flow issues:

1. **Vote desync race (HIGH):** When user casts vote and a `room:updated` arrives before server processes the vote, the card visually deselects then re-selects. Fix: add `pendingVote` optimistic state to Zustand store.
2. **Duplicate event listeners (MEDIUM):** Both `App.tsx` SocketProvider and `RoomPage.tsx` register `room:updated` handlers. Every update triggers `setRoom` twice. Fix: remove duplicate listeners from RoomPage.
3. **Socket promises never reject (MEDIUM):** If server never responds, promises hang forever. Fix: add 5s timeout to each socket emit promise.
4. **`getSocket` re-creation race (LOW):** Checks `socket?.connected` instead of `socket` existence, causing unnecessary reconnection churn during initial connection.

---

## Overview

Migrate the mighty-poker frontend from pure Tailwind CSS to a hybrid setup:
- **Backpack React components** for all UI elements (buttons, inputs, cards, badges, alerts, text, spinners)
- **Tailwind CSS** retained for layout utilities only (flex, grid, spacing, responsive breakpoints)

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Backpack scope | Nearly strict — all UI elements including participant list, results grid | User chose to move all elements to Backpack after visual comparison |
| Card deck | **Plain `<button>` styled with Backpack tokens** | BpkCard has no `selected` prop; layering custom CSS on BpkCardButton fights the component's defaults |
| Font | Nunito Sans — **self-hosted** (woff2 in `/public/fonts/`) | Eliminates cross-origin font loading; avoids FOUT layout shifts |
| Tailwind preflight | Disabled | Backpack's `bpk-stylesheets/base.css` is the only CSS reset |
| Primary color | Backpack Blue (`corePrimaryDay` / #0770e3) | Adopting Backpack's native palette; replaces violet |
| Theme | Light | Backpack is light-first; no native dark mode |
| Token bridge | **Removed** | Post-migration, all colored/styled elements are Backpack components. Tailwind is only used for layout (flex, grid, gap, padding) which doesn't need color tokens |
| Forms | BpkLabel + BpkInput (no BpkFieldset) | Only 2 simple text inputs with no validation, required markers, or grouped fields |

---

## Technical Setup

### Phase 0: Spike Branch (Before Full Migration)

**BLOCKER:** Validate React 19 + Backpack + Vite + SCSS before committing to migration.

Create a throwaway branch and test ONE component (`BpkButtonV2` replacing a `<button>` in `HomePage.tsx`) end-to-end:
- Install Backpack with `--legacy-peer-deps`
- Verify `bpk-stylesheets/base.css` imports correctly in Vite
- Verify `BpkButtonV2` renders and accepts click handlers without type errors
- If React 19 type conflicts surface at call sites, decide: (a) pin `@types/react` to 18.x, (b) downgrade to React 18, or (c) proceed with `// @ts-expect-error` pragmas
- Document the result as a go/no-go decision

### Dependencies

**Add:**
- `@skyscanner/backpack-web` — React components (install with `--legacy-peer-deps`)
- `@skyscanner/bpk-foundations-web` — Design tokens (for custom elements only)
- `sass-embedded` (devDependency) — 5-10x faster than `sass` for Vite SCSS compilation

**Keep:**
- `tailwindcss`, `postcss`, `autoprefixer` — Layout utilities only

**Potentially needed (resolve during spike — update this section with result):**
- `vite-css-modules` — Only if Backpack's non-`.module.scss` imports fail in Vite

### Font (Self-Hosted)

Download Nunito Sans woff2 files (weights 400, 600, 700) and place in `public/fonts/`:

```css
/* src/fonts.css */
@font-face {
  font-family: 'Nunito Sans';
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url('/fonts/nunito-sans-400.woff2') format('woff2');
}
@font-face {
  font-family: 'Nunito Sans';
  font-weight: 600;
  font-style: normal;
  font-display: swap;
  src: url('/fonts/nunito-sans-600.woff2') format('woff2');
}
@font-face {
  font-family: 'Nunito Sans';
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  src: url('/fonts/nunito-sans-700.woff2') format('woff2');
}
```

Preload the primary weight in `index.html`:
```html
<link rel="preload" as="font" type="font/woff2" href="/fonts/nunito-sans-400.woff2" crossorigin>
```

### Base Styles

Import order matters in `main.tsx`:
```typescript
import '@skyscanner/backpack-web/bpk-stylesheets/base.css'; // Backpack reset FIRST
import './fonts.css';                                         // Self-hosted font
import './index.css';                                         // Tailwind utilities SECOND
```

Note: Use the `.css` variant (`bpk-stylesheets/base.css`), not the bare module. Vite doesn't transpile SCSS from node_modules by default.

### Tailwind Config

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  corePlugins: {
    preflight: false, // Backpack's base.css handles the reset
  },
};
```

No `theme.extend` needed — Tailwind is layout-only.

### `index.css` Changes

```css
/* Remove @tailwind base — Backpack provides the reset */
@tailwind components;
@tailwind utilities;
```

### Vite Config

```typescript
// vite.config.ts — add SCSS preprocessor options
export default defineConfig({
  // ...existing config...
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler', // required for sass-embedded
      },
    },
  },
});
```

### Tailwind Retained For

Layout utilities ONLY:
- `flex`, `grid`, `gap-*`, `items-*`, `justify-*` — flexbox/grid
- `p-*`, `m-*`, `space-*` — spacing
- `w-*`, `h-*`, `min-h-*`, `max-w-*` — sizing
- `lg:`, `sm:` — responsive breakpoints

**NEVER** pass Tailwind appearance classes (`bg-*`, `text-*`, `rounded-*`, `shadow-*`, `border-*`) to Backpack components — they conflict with Backpack's internal CSS Modules.

**Allowed on Backpack components:** Layout utilities only (`mt-4`, `w-full`, `flex-1`).

---

## Component Mapping

### Corrected Component Names

| Original Spec | Correct Name | Notes |
|---|---|---|
| `BpkButton` | `BpkButtonV2` | V2 uses enum-based `type`/`size` props |
| `BpkBannerAlert` | `BpkInfoBanner` | `bpk-component-banner-alert` is deprecated |
| `BpkCardButton` | Plain `<button>` | BpkCard has no `selected` prop; custom cards are simpler |

### Import Patterns

```tsx
import { BpkButtonV2, BUTTON_TYPES, SIZE_TYPES } from '@skyscanner/backpack-web/bpk-component-button';
import BpkText, { TEXT_STYLES } from '@skyscanner/backpack-web/bpk-component-text';
import BpkInput, { INPUT_TYPES } from '@skyscanner/backpack-web/bpk-component-input';
import BpkLabel from '@skyscanner/backpack-web/bpk-component-label';
import BpkCard from '@skyscanner/backpack-web/bpk-component-card';
import BpkBadge, { BADGE_TYPES } from '@skyscanner/backpack-web/bpk-component-badge';
import BpkInfoBanner, { ALERT_TYPES } from '@skyscanner/backpack-web/bpk-component-info-banner';
import { BpkSpinner, SPINNER_TYPES } from '@skyscanner/backpack-web/bpk-component-spinner';
```

### Pages

#### HomePage (`/`)
- `BpkText` (`textStyle={TEXT_STYLES.heading2}`, `tagName="h1"`) for "Mighty Poker" title
- `BpkText` (`textStyle={TEXT_STYLES.bodyDefault}`) for subtitle
- `BpkLabel` + `BpkInput` for "Your name" and "Room name" (no BpkFieldset)
- `BpkInput` `valid` prop: `null` (untouched), `true` (valid), `false` (invalid + red border)
- `BpkButtonV2` (`type={BUTTON_TYPES.primary}`, `submit`, `loading={isLoading}`) for "Create Room"
- `BpkInfoBanner` (`type={ALERT_TYPES.ERROR}`, `message={error}`) for error messages
- Background: replace gradient with Backpack `canvasDay` token or flat light background
- Spade logo block: keep as custom element, use Backpack color tokens

#### JoinPage (`/room/:roomId/join`)
- Same form pattern as HomePage
- `BpkSpinner` (`type={SPINNER_TYPES.primary}`) for loading state
- `BpkButtonV2` (`type={BUTTON_TYPES.secondary}`) for "Create a new room" on not-found
- Not-found emoji state: keep as custom element

#### RoomPage (`/room/:roomId`)
- Layout: Tailwind `grid-cols-1 lg:grid-cols-[300px_1fr] gap-6`
- Background: Backpack `canvasDay` token value via inline style or small CSS class

### Components

#### RoomHeader
- `BpkText` (`textStyle={TEXT_STYLES.heading4}`) for room name
- `BpkBadge` for round status with mapping:
  - `idle` → `BADGE_TYPES.normal` (label: "Idle")
  - `voting` → `BADGE_TYPES.brand` (label: "Voting")
  - `revealed` → `BADGE_TYPES.success` (label: "Revealed")
- `BpkText` (`textStyle={TEXT_STYLES.caption}`) for participant count
- `BpkButtonV2` (`type={BUTTON_TYPES.link}`) for "Invite" action
- Inline SVG copy icon: keep as-is (Backpack has icons but no copy icon equivalent needed)

#### ParticipantList
- `BpkCard` (`atomic={false}`, `padded`) wrapping each participant row
- `BpkBadge` (`type={BADGE_TYPES.brand}`) for "facilitator" role — use consistently everywhere (including RevealedResults)
- `BpkBadge` (`type={BADGE_TYPES.normal}`) for "offline" status
- `BpkText` for participant names
- Custom avatar circle: keep existing `avatarColor()` hash function, map 8-color palette to Backpack token values (`corePrimaryDay`, `coreAccentDay`, `statusSuccessSpotDay`, etc.)
- Vote indicators: `BpkBadge` (`type={BADGE_TYPES.success}`) for "voted" checkmark

#### CardDeck
- **Plain `<button>` elements** (not BpkCardButton) with Backpack token-based styling:
  - Default: `surfaceDefaultDay` background, `lineDay` border
  - Selected: `corePrimaryDay` background, white text, `translateY(-4px)`, `boxShadowLg`
  - Disabled: `surfaceHighlightDay` background, `textDisabledDay` color
- Preserve `aria-pressed` attribute for accessibility
- Preserve `transition-all duration-150` micro-interactions
- Preserve `select-none` to prevent text selection during rapid clicking
- Tailwind grid for card layout

#### RevealedResults
- `BpkCard` (`atomic={false}`, `padded`) for each vote cell
- `BpkText` (`textStyle={TEXT_STYLES.heading2}`) for vote values
- `BpkBadge` (`type={BADGE_TYPES.brand}`) for "facilitator" label (normalized — currently inconsistent with ParticipantList)
- `BpkInfoBanner` (`type={ALERT_TYPES.SUCCESS}`, `message="Consensus! Everyone voted X"`) for consensus
- `BpkInfoBanner` (`type={ALERT_TYPES.WARN}`, `message="No consensus — discuss estimates"`) for no-consensus
- Preserve emoji characters (🎉, ⚠️) in messages

#### FacilitatorControls
- `BpkButtonV2` (`type={BUTTON_TYPES.primary}`) for "Start Voting"
- `BpkButtonV2` (`type={BUTTON_TYPES.secondary}`) for "Reveal Votes"
- `BpkButtonV2` (`type={BUTTON_TYPES.secondary}`) for "New Round"

#### ConnectionBanner
- `BpkInfoBanner` (`type={ALERT_TYPES.WARN}`, `message="Reconnecting..."`)
- **Debounce display**: only show after 500ms of continuous disconnection to prevent flicker from transient disconnects
- Preserve `z-50` stacking and `role="status"`

---

## Migration Sequence

Migrate leaf nodes first, then work inward. Each phase produces a green test suite before proceeding.

### Phase 0a — Spike (go/no-go gate, throwaway branch)
1. Create throwaway branch, install Backpack with `--legacy-peer-deps`
2. Replace one `<button>` in `HomePage.tsx` with `BpkButtonV2`
3. Verify `bpk-stylesheets/base.css` imports correctly in Vite
4. Verify component renders without type errors
5. If React 19 type conflicts surface: decide (a) pin `@types/react` to 18.x, (b) downgrade to React 18, or (c) `@ts-expect-error` pragmas
6. Document go/no-go result — if no-go, stop here

**Gate: Do not proceed to Phase 0c until spike passes.**

### Phase 0b — Bug Fixes (independent, can start in parallel with 0a)
7. Fix duplicate `room:updated` listeners in RoomPage (remove redundant handler)
8. Fix vote desync race (add `pendingVote` optimistic state to Zustand store)
9. Fix socket emit promises (add 5s timeout)
10. Fix `getSocket` re-creation race (check `socket` existence, not `socket?.connected`)

### Phase 0c — Infrastructure (after spike passes, no visual changes)
11. Install Backpack dependencies + `sass-embedded`
12. Download and self-host Nunito Sans woff2 files
13. Update `tailwind.config.js` (disable preflight only)
14. Update `vite.config.ts` (add SCSS preprocessor options)
15. Update `main.tsx` (import `bpk-stylesheets/base.css` before `index.css`)
16. Update `index.css` (remove `@tailwind base`)
17. Run full test suite — fix any visual regressions from CSS reset swap

### Phase 1 — Leaf Components (no children that need migration)
18. `ConnectionBanner` → `BpkInfoBanner` + debounce logic
19. `FacilitatorControls` → `BpkButtonV2` (3 buttons, straightforward swap)

### Phase 2 — Form Pages (self-contained)
20. `HomePage` → `BpkText` + `BpkLabel`/`BpkInput` + `BpkButtonV2` + `BpkInfoBanner`
21. `JoinPage` → same pattern + `BpkSpinner`

### Phase 3 — Complex Components
22. `RoomHeader` → `BpkText` + `BpkBadge` + `BpkButtonV2` (link)
23. `CardDeck` → Backpack token-styled `<button>` elements (highest risk — test thoroughly)
24. `ParticipantList` → `BpkCard` + `BpkBadge` + `BpkText` + custom avatar
25. `RevealedResults` → `BpkCard` + `BpkBadge` + `BpkText` + `BpkInfoBanner`

### Phase 4 — Container Page
26. `RoomPage` → update wrapper/layout classes, verify all children compose correctly

---

## What Doesn't Change

### Application Logic
- Zustand store structure and all state management (`room-store.ts`)
- Socket.IO connection management and event handlers (`socket.ts`)
- All socket event names and payloads
- React Router route structure and navigation logic (`App.tsx`)
- `SocketProvider` wrapper pattern
- localStorage token persistence (`room-token-${roomId}`)
- Room existence check via `fetch('/api/rooms/${roomId}')` in JoinPage
- `getConsensus()` function logic in RevealedResults
- All TypeScript interfaces and type imports from `@mighty-poker/core`
- Form validation logic (trim checks, required fields, disabled states)
- Clipboard copy with `prompt()` fallback

### UX Behavior
- Deterministic avatar color assignment algorithm (same hash function, mapped to Backpack token colors)
- Initials extraction logic
- Three-state round flow: idle → voting → revealed
- Facilitator-only visibility of controls
- "(you)" indicator on current participant
- Connected/disconnected participant opacity treatment
- Vote status indicators during voting (voted vs. not-voted visual)
- Consensus vs. no-consensus result display
- Card selection feedback text
- Emoji content characters (♠, 😕, 🃏, 🎉)
- Responsive breakpoint: sidebar-to-single-column at `lg:`

### Accessibility
- `role="alert"` on error messages
- `role="status"` on connection banner
- `aria-pressed` on voting cards
- `htmlFor`/`id` associations on form labels and inputs
- `focus-visible` ring on interactive elements (Backpack provides this natively)

---

## Testing Strategy

### Layer 1: Component Tests (Testing Library)
Existing role-based queries (`getByRole`, `getByText`) should pass unchanged since Backpack components maintain standard HTML semantics. Update any assertions on specific CSS class names.

### Layer 2: Visual Regression (Playwright Screenshots)
**Prerequisite:** If Playwright is not already set up in the project, add it during Phase 0c as a devDependency.

Before starting migration, capture baseline screenshots. After each phase, compare:
```typescript
await expect(page).toHaveScreenshot('home-page.png', { maxDiffPixelRatio: 0.01 });
```

### Layer 3: Accessibility Audit
After migration, run `axe` checks in Playwright to verify no regressions:
```typescript
const results = await new AxeBuilder({ page }).analyze();
expect(results.violations).toEqual([]);
```

### Layer 4: Bundle Size Budget
Measure current bundle size before migration begins (baseline). After migration, compare total JS+CSS increase and evaluate whether the cost is acceptable relative to the UI consistency gained. Use `npx vite-bundle-visualizer` to verify tree-shaking effectiveness.

---

## Risk Register

| Risk | Severity | Mitigation |
|---|---|---|
| React 19 type conflicts at Backpack call sites | **HIGH** | Spike branch validates before committing; choose mitigation strategy (pin @types/react 18, downgrade React, or @ts-expect-error) |
| CSS reset swap causes visual regressions | MEDIUM | Phase 0 deploys infrastructure changes independently; take before/after screenshots |
| Backpack SCSS imports fail in Vite | MEDIUM | Spike branch validates; `vite-css-modules` plugin as fallback |
| Bundle size increase from barrel imports | MEDIUM | Import from individual component paths; verify with bundle visualizer |
| Backpack component animations conflict with rapid Socket.IO updates | LOW | Debounce ConnectionBanner; keep CardDeck as plain buttons (no Backpack animations to conflict) |
| Font FOUT during initial load | LOW | Self-hosted with `font-display: swap` + preload primary weight |
