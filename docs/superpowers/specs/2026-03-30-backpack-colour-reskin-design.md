# Mighty Poker — Backpack Colour Reskin

**Date:** 2026-03-30
**Supersedes:** `2026-03-30-backpack-migration-design.md` (sections on visual treatment, card deck, layout)
**Scope:** Visual identity overhaul — apply Skyscanner Backpack foundations, colours, and components so the app looks and feels like a Backpack product, not a white/grey shell with a blue button.

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Visual identity | Full Skyscanner product feel | Dark navy header, hero surfaces, semantic status colours — the whole Backpack language |
| Voting cards | `BpkCheckboxCard` with radio semantics | Purpose-built for selectable cards; gives checked/unchecked/disabled/hover/focus for free |
| Room page layout | Blue hero banner + content below | `surfaceHeroDay` banner with room info, content on layered `canvasContrastDay` below |
| Status badges | Backpack semantic colours | idle=normal (grey), voting=brand (blue), revealed=success (green) |
| Participant avatars | Larger (48px), full Backpack colour palette | More prominent, future-proofed for Jira profile images |
| Approach | Token-first reskin | Replace inline styles and Tailwind colour utilities with Backpack tokens; keep existing JSX structure where possible |

---

## Backpack Tokens Used

### Colour Tokens

| Token | Value | Usage |
|---|---|---|
| `corePrimaryDay` | `rgb(5, 32, 60)` — dark navy | Nav bar background, selected voting card (via BpkCheckboxCard) |
| `coreAccentDay` | `rgb(0, 98, 227)` — sky blue | Interactive elements, current-user highlight border, vote values |
| `coreEcoDay` | `rgb(15, 161, 169)` — teal | Avatar palette |
| `surfaceHeroDay` | `rgb(0, 98, 227)` — sky blue | Room page hero banner |
| `surfaceDefaultDay` | `rgb(255, 255, 255)` — white | Card surfaces |
| `surfaceLowContrastDay` | `rgb(245, 247, 250)` | BpkCheckboxCard unchecked hover (built-in) |
| `surfaceSubtleDay` | `rgb(227, 240, 255)` — light blue | Current user's participant card background |
| `surfaceHighlightDay` | `rgb(224, 228, 233)` — grey | Disabled voting cards |
| `canvasContrastDay` | `rgb(239, 243, 248)` | Page backgrounds below nav/hero |
| `textPrimaryDay` | `rgb(22, 22, 22)` | Default text |
| `textSecondaryDay` | `rgb(98, 105, 113)` | Disabled card text (replaces textDisabledDay for WCAG compliance) |
| `textOnDarkDay` | `rgb(255, 255, 255)` | Text on navy/blue surfaces |
| `textHeroDay` | `rgb(0, 98, 227)` | "You picked X" vote value |
| `textErrorDay` | `rgb(231, 8, 102)` | Error text |
| `lineDay` | `rgb(193, 199, 207)` | Dividers, subtle borders |
| `statusSuccessSpotDay` | `rgb(12, 131, 138)` | Avatar palette, success states |
| `statusDangerSpotDay` | `rgb(231, 8, 102)` — berry | Avatar palette |
| `statusWarningSpotDay` | `rgb(245, 93, 66)` — amber | Avatar palette |

### Elevation Tokens

| Token | Value | Usage |
|---|---|---|
| `boxShadowSm` | `0px 1px 3px 0px rgba(37,32,31,.3)` | Default card elevation |
| `boxShadowLg` | `0px 4px 14px 0px rgba(37,32,31,.25)` | Form card on HomePage/JoinPage |

### Border Radius Tokens

| Token | Value | Usage |
|---|---|---|
| `borderRadiusLg` | `1.5rem` | Form card containers (HomePage/JoinPage) |
| `borderRadiusMd` | `0.75rem` | Spade icon container |
| `borderRadiusFull` | `100%` | Avatars |

---

## Section 1: Global Navigation Bar

**All pages** get a top navigation bar.

- **Component:** `BpkNavigationBar` with `barStyle={BAR_STYLES.onDark}` (available in backpack-web v42)
- **Required props:** `id="main-nav"`, `title="Mighty Poker"`
- **Background:** `corePrimaryDay` (dark navy) — provided by the `onDark` bar style
- **Content:** "Mighty Poker" app name (`title` prop) + spade icon (`leadingButton` prop), both rendered in white via the onDark style
- **Height:** BpkNavigationBar default
- **Position:** static (not sticky), sits above page content

This is the single most recognisable Backpack visual element — the dark navy chrome.

---

## Section 2: Room Page Hero Banner

Full-width banner below the nav bar on the room page.

- **Background:** `surfaceHeroDay` (`rgb(0, 98, 227)` — sky blue)
- **Content:**
  - Room name: `BpkText` `TEXT_STYLES.heading3`, `textOnDarkDay`
  - Status badge: `BpkBadge` next to room name
    - idle: `BADGE_TYPES.normal`
    - voting: `BADGE_TYPES.brand`
    - revealed: `BADGE_TYPES.success`
  - Participant count: `BpkText` `TEXT_STYLES.caption`, `textOnDarkDay`
  - Invite button: `BpkButton` `BUTTON_TYPES.primaryOnDark`
- **Below the hero:** content area on `canvasContrastDay` with the sidebar/main grid layout preserved

The existing `RoomHeader` component is **refactored in place** — its JSX changes from plain text on a white background to a `surfaceHeroDay` banner container. The component keeps its name, props, and file location. No new component is created.

---

## Section 3: Voting Cards (CardDeck)

Replace custom `<button>` elements with `BpkCheckboxCard`.

### Component Choice

`BpkCheckboxCard` (not `BpkCard` atomic) — purpose-built for selectable cards. Provides checked/unchecked/disabled/hover/focus states with proper animations, accessibility, and focus indicators out of the box.

- **Variant:** `CHECKBOX_CARD_VARIANTS.onCanvasDefault` — for use on `canvasContrastDay` backgrounds. Selected state uses `corePrimaryDay` (navy `#05203C`).
- **Radius:** `CHECKBOX_CARD_RADIUS.rounded`
- **Import:** `import { BpkCheckboxCard, CHECKBOX_CARD_VARIANTS, CHECKBOX_CARD_RADIUS } from '@skyscanner/backpack-web/bpk-component-checkbox-card'`

### Container

- `role="radiogroup"` with `aria-label="Estimation values"` (single-select behaviour)
- Flex layout: `flex flex-wrap gap-4 justify-center`

### Card Sizing

- Minimum 60x84px per card
- `gap-4` (16px) between cards

### States

**Built-in (no custom CSS needed):** BpkCheckboxCard with `variant=onCanvasDefault` handles these automatically:

| State | Behaviour | Source |
|---|---|---|
| Default (unchecked) | White surface, shadow, no border | Component default |
| Hover (unchecked) | `surfaceLowContrastDay` tint | Component CSS |
| Selected (checked) | `corePrimaryDay` (navy) bg, white text, navy border | Component CSS |
| Disabled | Grey surface, `cursor: not-allowed` | Component `disabled` prop |

**Custom CSS overrides needed** for the selected card lift effect:

| Override | Value | Why |
|---|---|---|
| `transform` | `translateY(-6px) scale(1.05)` | BpkCheckboxCard doesn't lift on select — this adds physical emphasis |
| `box-shadow` | `0 8px 20px -4px rgba(5, 32, 60, 0.35)` | Tinted navy shadow instead of default grey |
| `transition` | `all 200ms ease-in-out` | Smooth the lift animation |

Target these via `[data-state="checked"]` CSS selector on the BpkCheckboxCard root.

**Disabled text contrast fix:** BpkCheckboxCard's built-in disabled state uses `textDisabledDay` which fails WCAG on `surfaceHighlightDay`. Override with `textSecondaryDay` (`rgb(98, 105, 113)`) via CSS.

**Why `textSecondaryDay` for disabled?** `textDisabledDay` (`rgba(0, 0, 0, 0.2)`) on `surfaceHighlightDay` (`rgb(224, 228, 233)`) has ~1.4:1 contrast ratio — fails WCAG AA (needs 3:1 minimum). `textSecondaryDay` (`rgb(98, 105, 113)`) passes.

**Why `corePrimaryDay` (navy) for selected, not `coreAccentDay` (blue)?** BpkCheckboxCard uses navy for its checked state by default. Navy reads as "locked in"; blue reads as "interactive/link". This comes free with the component.

### Selected Card Shadow

Standard `boxShadowLg` looks disconnected on a navy card (grey shadow on blue). Use a tinted shadow:
```
0 8px 20px -4px rgba(5, 32, 60, 0.35)
```

### Typography

- Card values (1, 2, 3, 5, 8...): `TEXT_STYLES.heading4`, centred
- Section heading "Choose your estimate": `TEXT_STYLES.label1` (not caption — caption is too small for a section label)
- "You picked X" confirmation: value in `textHeroDay` (`rgb(0, 98, 227)`)

### Component Structure

`BpkCheckboxCard` is a **compound component** with slots. Each voting card renders as:

```tsx
<BpkCheckboxCard.Root
  checked={selectedValue === value}
  onCheckedChange={(checked) => onSelect(checked ? value : null)}
  disabled={disabled}
  variant={CHECKBOX_CARD_VARIANTS.onCanvasDefault}
  radius={CHECKBOX_CARD_RADIUS.rounded}
  aria-label={ariaLabel}  // for "?" and coffee emoji cards
  value={value}
>
  <BpkCheckboxCard.HiddenInput />
  <BpkCheckboxCard.Content>
    <BpkCheckboxCard.Label textStyle={TEXT_STYLES.heading4}>
      {value}
    </BpkCheckboxCard.Label>
  </BpkCheckboxCard.Content>
</BpkCheckboxCard.Root>
```

Note: `BpkCheckboxCard.Label` only accepts a **plain string** child. The `textStyle` prop overrides the default `heading-5` to `heading-4` for larger card values.

### Accessibility

- Container: `role="radiogroup"`, `aria-label="Estimation values"`
- Each card: `checked={selectedValue === value}` on `BpkCheckboxCard.Root`
- Special cards: `aria-label="Pass"` on "?" card, `aria-label="Coffee break"` on coffee emoji (on `BpkCheckboxCard.Root`)
- Focus indicator: BpkCheckboxCard provides `0.125rem solid #0062e3` outline with offset (replaces Tailwind `focus-visible:ring-2`)
- Transitions: 200ms ease-in-out (matches Backpack convention)
- Form integration: `BpkCheckboxCard.HiddenInput` renders a visually hidden `<input type="checkbox">` for form submission

### Deselection

Tapping the already-selected card deselects it (clears the vote). The current behaviour allows this and it should be preserved.

---

## Section 4: Participant List & Avatars

### Avatars

- **Size:** 48x48px (up from 36x36). `borderRadiusFull` for circular.
- **Initials:** Two letters (first + last name initial). `TEXT_STYLES.label1`, `textOnDarkDay`.
- **Colour palette:** 8 visually distinct exported Backpack tokens, hashed by participant name for consistency:
  - `corePrimaryDay` (navy `#05203C`)
  - `coreAccentDay` (sky blue `#0062E3`)
  - `coreEcoDay` (teal `#0FA1A9`)
  - `statusSuccessSpotDay` (green `#0C838A`)
  - `statusDangerSpotDay` (berry `#E70866`)
  - `statusWarningSpotDay` (amber `#F55D42`)
  - `textErrorDay` (berry — same as statusDangerSpotDay but semantically distinct; swap for a second berry shade or keep the existing `corePrimaryDay` dark variant)
  - `textSecondaryDay` (grey `#626971` — provides a neutral option)

  Note: The previous code used `surfaceHeroDay` which is visually identical to `coreAccentDay` (both `#0062E3`). Replaced with `textSecondaryDay` for a distinct 8th colour. Purple (`#8E47BA`) exists in Backpack primitives but is not exported as a token — avoid hardcoding it.
- **Future:** When Jira images are available, avatar becomes `<img>` with same dimensions and `borderRadiusFull`, falling back to initials on load error.

### Participant Rows

- Each row: `BpkCard` (non-atomic, padded), `surfaceDefaultDay`, `boxShadowSm`
- **Current user highlight:** `surfaceSubtleDay` (`rgb(227, 240, 255)`) background + `coreAccentDay` left border (4px solid) — replaces the current full box-shadow highlight
- Row gap: `gap-3` (12px)

### State Indicators

| State | Badge |
|---|---|
| Facilitator | `BADGE_TYPES.brand` (blue) |
| Voted (during voting) | `BADGE_TYPES.success` (green checkmark) |
| Offline | `BADGE_TYPES.normal` (grey) |
| Waiting to vote | No badge — clean absence |

### Section Heading

"Participants (N)": `BpkText` `TEXT_STYLES.label1` (up from caption).

---

## Section 5: HomePage & JoinPage

### Navigation

Same `corePrimaryDay` nav bar as all pages.

### Form Card

- Background: `surfaceDefaultDay` (white)
- Shadow: `boxShadowLg` (replaces hardcoded `rgba(0,0,0,0.1)` shadows)
- Border radius: `borderRadiusLg` (replaces hardcoded `1rem`)

### Spade Icon Container

- Background: `surfaceHeroDay` (blue) — stays
- Border radius: `borderRadiusMd` token
- Shadow: `boxShadowSm` token

### Page Background

`canvasContrastDay` — already correct, no change.

### Form Components

Already using `BpkButton`, `BpkInput`, `BpkLabel`, `BpkInfoBanner` — no changes needed to these.

### JoinPage

Structurally identical to HomePage. Same nav bar, same token swaps.

---

## Section 6: RevealedResults

### Vote Cards

- `BpkCard` (non-atomic, padded), `surfaceDefaultDay`, `boxShadowSm`
- Vote value: `TEXT_STYLES.heading4`, `coreAccentDay`
- Participant name: `BpkText` default, `textPrimaryDay`
- Avatar: same 48x48 avatar as participant list, same colour assignment per name

### Banners

- Consensus: `BpkInfoBanner` `ALERT_TYPES.SUCCESS` — already correct
- No consensus: `BpkInfoBanner` `ALERT_TYPES.WARN` — already correct

### Badges

- Facilitator: `BADGE_TYPES.brand` — consistent with participant list

---

## Section 7: ConnectionBanner

No changes. Already uses `BpkInfoBanner` with appropriate `ALERT_TYPES` correctly.

---

## Hardcoded Values to Replace

All hardcoded appearance values must be replaced with Backpack tokens:

| Current Hardcoded Value | Replace With |
|---|---|
| `borderRadius: '1rem'` | `borderRadiusLg` (`1.5rem`) — intentionally rounder than current; `borderRadiusMd` (`0.75rem`) is too tight for a form card |
| `borderRadius: '0.75rem'` | `borderRadiusMd` |
| `boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)...'` | `boxShadowLg` |
| `boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'` | `boxShadowSm` |
| `transition: 'all 150ms'` | `transition: 'all 200ms ease-in-out'` (Backpack convention) |

---

## Implementation Notes

### BpkText `color` prop

`BpkText` exports `TEXT_COLORS` with semantic values (`textHero`, `textOnDark`, `textPrimary`, etc.). Prefer `<BpkText color={TEXT_COLORS.textHero}>` over `style={{ color: textHeroDay }}`. This is the Backpack-native approach and avoids importing raw token values.

### Relationship to previous migration spec

This spec **supersedes** the visual treatment sections of `2026-03-30-backpack-migration-design.md`. Specifically:
- CardDeck: previous spec said plain `<button>`, this spec says `BpkCheckboxCard`
- Layout: previous spec had no nav bar or hero banner, this spec adds both
- Infrastructure (dependencies, Vite config, font hosting, base CSS): **still governed by the previous spec** — not duplicated here

### Migration order

Defer to the implementation plan (writing-plans skill). The general principle: infrastructure first (previous spec), then leaf components, then pages, then the CardDeck (highest risk).

---

## What Doesn't Change

- All application logic, state management, socket handling
- React Router routes
- Form validation logic
- Tailwind for layout (flex, grid, gap, spacing, responsive breakpoints)
- Clipboard copy with fallback
- Consensus calculation logic
- Emoji content characters
- `@tailwind base` removal (already handled in previous migration spec)
- Font self-hosting (already handled)
- Vite/SCSS config (already handled)
