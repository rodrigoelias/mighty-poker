# Backpack Colour Reskin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Mighty Poker from a generic white/grey app into a full Skyscanner Backpack product — dark navy nav, blue hero banner, proper card components, semantic status colours, and token-driven styling.

**Architecture:** Token-first reskin. Replace all inline hardcoded colours/shadows/radii with Backpack tokens. Replace CardDeck buttons with BpkCheckboxCard compound components. Add BpkNavigationBar to all pages. Refactor RoomHeader into a surfaceHeroDay banner.

**Tech Stack:** React 19, @skyscanner/backpack-web v42.1.0, @skyscanner/bpk-foundations-web, Tailwind (layout only), Vitest + React Testing Library

**Spec:** `docs/superpowers/specs/2026-03-30-backpack-colour-reskin-design.md`

**Test command:** `cd apps/web && pnpm test`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `apps/web/src/components/AppNavBar.tsx` | Create | Shared dark navy BpkNavigationBar wrapper |
| `apps/web/src/components/AppNavBar.test.tsx` | Create | Tests for nav bar rendering |
| `apps/web/src/components/CardDeck.tsx` | Rewrite | BpkCheckboxCard compound component |
| `apps/web/src/components/CardDeck.css` | Create | Custom CSS overrides for checked lift + disabled contrast |
| `apps/web/src/components/__tests__/CardDeck.test.tsx` | Rewrite | Tests for new BpkCheckboxCard API |
| `apps/web/src/components/RoomHeader.tsx` | Modify | Hero banner with surfaceHeroDay background |
| `apps/web/src/components/__tests__/RoomHeader.test.tsx` | Modify | Tests for hero banner |
| `apps/web/src/components/ParticipantList.tsx` | Modify | Larger avatars, new colour palette, left-border highlight |
| `apps/web/src/components/__tests__/ParticipantList.test.tsx` | Modify | Tests for new avatar sizes and palette |
| `apps/web/src/components/RevealedResults.tsx` | Modify | Add avatars, use TEXT_COLORS |
| `apps/web/src/pages/HomePage.tsx` | Modify | Add nav bar, replace hardcoded shadows/radii with tokens |
| `apps/web/src/pages/JoinPage.tsx` | Modify | Add nav bar, replace hardcoded shadows/radii with tokens |
| `apps/web/src/pages/RoomPage.tsx` | Modify | Add nav bar, integrate hero banner |
| `apps/web/src/pages/__tests__/HomePage.test.tsx` | Modify | Update mocks for new imports |
| `apps/web/src/pages/__tests__/JoinPage.test.tsx` | Modify | Update mocks for new imports |
| `apps/web/src/pages/__tests__/RoomPage.test.tsx` | Modify | Update mocks for nav bar + hero banner |

---

### Task 1: Create AppNavBar Component

**Files:**
- Create: `apps/web/src/components/AppNavBar.tsx`
- Create: `apps/web/src/components/__tests__/AppNavBar.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/components/__tests__/AppNavBar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@skyscanner/backpack-web/bpk-component-navigation-bar', () => {
  const BpkNavigationBar = (props: {
    id: string;
    title: React.ReactNode;
    barStyle?: string;
    leadingButton?: React.ReactNode;
    className?: string;
  }) => (
    <nav data-testid="nav-bar" data-bar-style={props.barStyle} id={props.id}>
      {props.leadingButton && <span data-testid="leading-button">{props.leadingButton}</span>}
      <span data-testid="nav-title">{props.title}</span>
    </nav>
  );
  return {
    default: BpkNavigationBar,
    BAR_STYLES: { default: 'default', onDark: 'on-dark' },
  };
});

import { AppNavBar } from '../AppNavBar';

describe('AppNavBar', () => {
  it('renders with onDark bar style', () => {
    render(<AppNavBar />);
    const nav = screen.getByTestId('nav-bar');
    expect(nav).toHaveAttribute('data-bar-style', 'on-dark');
  });

  it('renders "Mighty Poker" as the title', () => {
    render(<AppNavBar />);
    expect(screen.getByTestId('nav-title')).toHaveTextContent('Mighty Poker');
  });

  it('renders the spade icon as leading button', () => {
    render(<AppNavBar />);
    expect(screen.getByTestId('leading-button')).toBeInTheDocument();
  });

  it('has id="main-nav"', () => {
    render(<AppNavBar />);
    expect(screen.getByTestId('nav-bar')).toHaveAttribute('id', 'main-nav');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run src/components/__tests__/AppNavBar.test.tsx`
Expected: FAIL — `AppNavBar` module not found

- [ ] **Step 3: Write minimal implementation**

Create `apps/web/src/components/AppNavBar.tsx`:

```tsx
import BpkNavigationBar, { BAR_STYLES } from '@skyscanner/backpack-web/bpk-component-navigation-bar';

export function AppNavBar() {
  return (
    <BpkNavigationBar
      id="main-nav"
      title="Mighty Poker"
      barStyle={BAR_STYLES.onDark}
      leadingButton={
        <span style={{ fontSize: '1.25rem' }}>&#9824;</span>
      }
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm vitest run src/components/__tests__/AppNavBar.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/AppNavBar.tsx apps/web/src/components/__tests__/AppNavBar.test.tsx
git commit -m "feat: add AppNavBar component with BpkNavigationBar onDark"
```

---

### Task 2: Add NavBar to HomePage + Replace Hardcoded Tokens

**Files:**
- Modify: `apps/web/src/pages/HomePage.tsx`
- Modify: `apps/web/src/pages/__tests__/HomePage.test.tsx`

- [ ] **Step 1: Write the failing test**

In `apps/web/src/pages/__tests__/HomePage.test.tsx`, add a mock for AppNavBar and a test:

Add this mock at the top (with other mocks):
```tsx
vi.mock('../../components/AppNavBar', () => ({
  AppNavBar: () => <nav data-testid="app-nav-bar">Mighty Poker</nav>,
}));
```

Add this test:
```tsx
it('renders the AppNavBar', () => {
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );
  expect(screen.getByTestId('app-nav-bar')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run src/pages/__tests__/HomePage.test.tsx`
Expected: FAIL — no element with testid `app-nav-bar`

- [ ] **Step 3: Implement the changes to HomePage.tsx**

In `apps/web/src/pages/HomePage.tsx`:

1. Add import at the top:
```tsx
import { AppNavBar } from '../components/AppNavBar.js';
import { boxShadowLg, boxShadowSm, borderRadiusLg, borderRadiusMd } from '@skyscanner/bpk-foundations-web/tokens/base.es6';
```

2. Replace the return JSX. Wrap existing content with a fragment that includes the nav bar, and replace hardcoded values:

```tsx
return (
  <>
    <AppNavBar />
    <div
      className="flex-1 flex items-center justify-center p-4"
      style={{ backgroundColor: canvasContrastDay }}
    >
      <div className="p-8 w-full max-w-md" style={{ backgroundColor: surfaceDefaultDay, borderRadius: borderRadiusLg, boxShadow: boxShadowLg }}>
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: surfaceHeroDay, borderRadius: borderRadiusMd, boxShadow: boxShadowSm }}
          >
            <span style={{ color: textOnDarkDay, fontSize: '1.5rem' }}>&#9824;</span>
          </div>
          {/* ... rest unchanged ... */}
```

3. Update the outer wrapper to include `min-h-screen flex flex-col` to accommodate the nav bar:
```tsx
return (
  <div className="min-h-screen flex flex-col" style={{ backgroundColor: canvasContrastDay }}>
    <AppNavBar />
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="p-8 w-full max-w-md" style={{ backgroundColor: surfaceDefaultDay, borderRadius: borderRadiusLg, boxShadow: boxShadowLg }}>
        {/* form card content unchanged */}
      </div>
    </div>
  </div>
);
```

4. Remove unused `canvasContrastDay` from the inner div (it's now on the outer wrapper).

5. Update the foundations import to include the new tokens:
```tsx
import { canvasContrastDay, surfaceHeroDay, surfaceDefaultDay, textOnDarkDay, boxShadowLg, boxShadowSm, borderRadiusLg, borderRadiusMd } from '@skyscanner/bpk-foundations-web/tokens/base.es6';
```

- [ ] **Step 4: Update test mocks**

In `apps/web/src/pages/__tests__/HomePage.test.tsx`, update the `@skyscanner/bpk-foundations-web/tokens/base.es6` mock to include the new tokens:

```tsx
vi.mock('@skyscanner/bpk-foundations-web/tokens/base.es6', () => ({
  canvasContrastDay: 'rgb(239, 243, 248)',
  surfaceHeroDay: 'rgb(0, 98, 227)',
  surfaceDefaultDay: 'rgb(255, 255, 255)',
  textOnDarkDay: 'rgb(255, 255, 255)',
  boxShadowLg: '0px 4px 14px 0px rgba(37,32,31,.25)',
  boxShadowSm: '0px 1px 3px 0px rgba(37,32,31,.3)',
  borderRadiusLg: '1.5rem',
  borderRadiusMd: '0.75rem',
}));
```

- [ ] **Step 5: Run tests**

Run: `cd apps/web && pnpm vitest run src/pages/__tests__/HomePage.test.tsx`
Expected: PASS (all existing tests + new nav bar test)

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/HomePage.tsx apps/web/src/pages/__tests__/HomePage.test.tsx
git commit -m "feat: add nav bar to HomePage, replace hardcoded shadows/radii with tokens"
```

---

### Task 3: Add NavBar to JoinPage + Replace Hardcoded Tokens

**Files:**
- Modify: `apps/web/src/pages/JoinPage.tsx`
- Modify: `apps/web/src/pages/__tests__/JoinPage.test.tsx`

- [ ] **Step 1: Write the failing test**

In `apps/web/src/pages/__tests__/JoinPage.test.tsx`, add the AppNavBar mock and test — same pattern as HomePage:

```tsx
vi.mock('../../components/AppNavBar', () => ({
  AppNavBar: () => <nav data-testid="app-nav-bar">Mighty Poker</nav>,
}));
```

Add test:
```tsx
it('renders the AppNavBar', () => {
  render(
    <MemoryRouter initialEntries={['/room/test-room/join']}>
      <Routes>
        <Route path="/room/:roomId/join" element={<JoinPage />} />
      </Routes>
    </MemoryRouter>
  );
  expect(screen.getByTestId('app-nav-bar')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run src/pages/__tests__/JoinPage.test.tsx`
Expected: FAIL — no element with testid `app-nav-bar`

- [ ] **Step 3: Implement the changes to JoinPage.tsx**

Same pattern as HomePage:

1. Add imports:
```tsx
import { AppNavBar } from '../components/AppNavBar.js';
import { boxShadowLg, boxShadowSm, borderRadiusLg, borderRadiusMd } from '@skyscanner/bpk-foundations-web/tokens/base.es6';
```

2. Wrap each return branch (loading, not-found, join form) with `<div className="min-h-screen flex flex-col" style={{ backgroundColor: canvasContrastDay }}><AppNavBar />...content...</div>`.

3. Replace all hardcoded `borderRadius: '1rem'` with `borderRadiusLg`, `boxShadow: '0 10px 15px...'` with `boxShadowLg`, `boxShadow: '0 4px 6px...'` with `boxShadowSm`, `borderRadius: '1rem'` on icon container with `borderRadiusMd`.

4. Update the foundations import to include new tokens.

- [ ] **Step 4: Update test mocks**

Update the `@skyscanner/bpk-foundations-web/tokens/base.es6` mock in `JoinPage.test.tsx` to include `boxShadowLg`, `boxShadowSm`, `borderRadiusLg`, `borderRadiusMd`.

Add AppNavBar mock.

- [ ] **Step 5: Run tests**

Run: `cd apps/web && pnpm vitest run src/pages/__tests__/JoinPage.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/JoinPage.tsx apps/web/src/pages/__tests__/JoinPage.test.tsx
git commit -m "feat: add nav bar to JoinPage, replace hardcoded shadows/radii with tokens"
```

---

### Task 4: Refactor RoomHeader into Hero Banner

**Files:**
- Modify: `apps/web/src/components/RoomHeader.tsx`
- Modify: `apps/web/src/components/__tests__/RoomHeader.test.tsx`

- [ ] **Step 1: Write the failing test**

In `apps/web/src/components/__tests__/RoomHeader.test.tsx`, add a test for the hero banner background:

```tsx
it('renders with surfaceHeroDay background', () => {
  render(<RoomHeader {...defaultProps} />);
  const header = screen.getByRole('banner');
  expect(header).toHaveStyle({ backgroundColor: 'rgb(0, 98, 227)' });
});
```

Update the mock for `@skyscanner/bpk-foundations-web/tokens/base.es6` to include `surfaceHeroDay`:
```tsx
vi.mock('@skyscanner/bpk-foundations-web/tokens/base.es6', () => ({
  textErrorDay: 'rgb(231, 8, 102)',
  surfaceHeroDay: 'rgb(0, 98, 227)',
}));
```

Also add a test for the invite button type:
```tsx
it('renders invite button with primaryOnDark type', () => {
  render(<RoomHeader {...defaultProps} />);
  const button = screen.getByRole('button', { name: /invite/i });
  expect(button).toHaveAttribute('data-type', 'primary-on-dark');
});
```

Update the BpkButton mock to expose the type prop:
```tsx
vi.mock('@skyscanner/backpack-web/bpk-component-button', () => {
  const BpkButton = (props: {
    type?: string;
    onClick?: () => void;
    children: React.ReactNode;
  }) => (
    <button onClick={props.onClick} data-type={props.type}>
      {props.children}
    </button>
  );
  return { default: BpkButton, BUTTON_TYPES: { link: 'link', primary: 'primary', secondary: 'secondary', primaryOnDark: 'primary-on-dark' } };
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run src/components/__tests__/RoomHeader.test.tsx`
Expected: FAIL — header doesn't have backgroundColor, button type is 'link' not 'primary-on-dark'

- [ ] **Step 3: Implement the hero banner**

Replace `apps/web/src/components/RoomHeader.tsx`:

```tsx
import React from 'react';
import type { RoundStatus } from '@mighty-poker/core';
import BpkText, { TEXT_STYLES, TEXT_COLORS } from '@skyscanner/backpack-web/bpk-component-text';
import BpkBadge, { BADGE_TYPES } from '@skyscanner/backpack-web/bpk-component-badge';
import BpkButton, { BUTTON_TYPES } from '@skyscanner/backpack-web/bpk-component-button';
import { surfaceHeroDay } from '@skyscanner/bpk-foundations-web/tokens/base.es6';

interface Props {
  roomName: string;
  roomId: string;
  participantCount: number;
  roundStatus: RoundStatus;
  connected: boolean;
}

const badgeTypeMap: Record<RoundStatus, (typeof BADGE_TYPES)[keyof typeof BADGE_TYPES]> = {
  idle: BADGE_TYPES.normal,
  voting: BADGE_TYPES.brand,
  revealed: BADGE_TYPES.success,
};

const badgeLabelMap: Record<RoundStatus, string> = {
  idle: 'Idle',
  voting: 'Voting',
  revealed: 'Revealed',
};

export function RoomHeader({ roomName, roomId, participantCount, roundStatus, connected }: Props) {
  function copyInviteLink() {
    const url = `${window.location.origin}/room/${roomId}/join`;
    navigator.clipboard.writeText(url).catch(() => {
      prompt('Copy this link:', url);
    });
  }

  return (
    <header
      className="flex items-center justify-between px-6 py-4"
      style={{ backgroundColor: surfaceHeroDay }}
    >
      <div className="flex items-center gap-4">
        <div>
          <BpkText textStyle={TEXT_STYLES.heading3} tagName="h1" color={TEXT_COLORS.textOnDark}>
            {roomName}
          </BpkText>
          <div className="flex items-center gap-2 mt-0.5">
            <BpkBadge type={badgeTypeMap[roundStatus]}>
              {badgeLabelMap[roundStatus]}
            </BpkBadge>
            <BpkText textStyle={TEXT_STYLES.caption} tagName="span" color={TEXT_COLORS.textOnDark}>
              {participantCount} participant{participantCount !== 1 ? 's' : ''}
            </BpkText>
            {!connected && (
              <BpkText textStyle={TEXT_STYLES.caption} tagName="span" color={TEXT_COLORS.textError}>
                &bull; Reconnecting...
              </BpkText>
            )}
          </div>
        </div>
      </div>
      <BpkButton type={BUTTON_TYPES.primaryOnDark} onClick={copyInviteLink}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        Invite
      </BpkButton>
    </header>
  );
}
```

Key changes:
- `surfaceHeroDay` background on `<header>`
- `TEXT_STYLES.heading3` (up from heading4) for room name
- `TEXT_COLORS.textOnDark` on all text (replaces inline `style={{ color: textErrorDay }}`)
- `BUTTON_TYPES.primaryOnDark` for invite button (was `BUTTON_TYPES.link`)
- Removed `textErrorDay` import, using `TEXT_COLORS.textError` instead

- [ ] **Step 4: Update tests**

Update the `BpkText` mock in `RoomHeader.test.tsx` to handle the `color` prop:
```tsx
const BpkText = (props: {
  textStyle?: string;
  tagName?: string;
  children: React.ReactNode;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
}) => {
  const Tag = (props.tagName || 'span') as keyof JSX.IntrinsicElements;
  return <Tag data-text-style={props.textStyle} data-color={props.color}>{props.children}</Tag>;
};
return { default: BpkText, TEXT_STYLES, TEXT_COLORS: { textOnDark: 'text-on-dark', textError: 'text-error' } };
```

Update existing tests that check for `heading4` to check for `heading3` on the room name.

- [ ] **Step 5: Run tests**

Run: `cd apps/web && pnpm vitest run src/components/__tests__/RoomHeader.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/RoomHeader.tsx apps/web/src/components/__tests__/RoomHeader.test.tsx
git commit -m "feat: refactor RoomHeader into surfaceHeroDay hero banner"
```

---

### Task 5: Add NavBar to RoomPage + Integrate Hero Banner

**Files:**
- Modify: `apps/web/src/pages/RoomPage.tsx`
- Modify: `apps/web/src/pages/__tests__/RoomPage.test.tsx`

- [ ] **Step 1: Write the failing test**

In `apps/web/src/pages/__tests__/RoomPage.test.tsx`, add AppNavBar mock and test:

```tsx
vi.mock('../../components/AppNavBar', () => ({
  AppNavBar: () => <nav data-testid="app-nav-bar">Mighty Poker</nav>,
}));
```

Add test:
```tsx
it('renders the AppNavBar', () => {
  // ... render with room state set up ...
  expect(screen.getByTestId('app-nav-bar')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run src/pages/__tests__/RoomPage.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement changes**

In `apps/web/src/pages/RoomPage.tsx`:

1. Add import:
```tsx
import { AppNavBar } from '../components/AppNavBar.js';
```

2. In the return JSX, add `<AppNavBar />` after `<ConnectionBanner>` and before `<RoomHeader>`:

```tsx
return (
  <div className="min-h-screen flex flex-col" style={{ backgroundColor: canvasContrastDay }}>
    <ConnectionBanner connected={connected} />
    <AppNavBar />
    <RoomHeader
      roomName={room.name}
      roomId={room.id}
      participantCount={room.participants.filter((p) => p.connected).length}
      roundStatus={room.currentRound.status}
      connected={connected}
    />
    <main className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 p-6 max-w-6xl mx-auto w-full">
      {/* ... rest unchanged ... */}
    </main>
  </div>
);
```

3. Also add the nav bar to the loading state:
```tsx
if (!room) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: canvasContrastDay }}>
      <AppNavBar />
      <div className="flex-1 flex items-center justify-center">
        <BpkSpinner type={SPINNER_TYPES.primary} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `cd apps/web && pnpm vitest run src/pages/__tests__/RoomPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/RoomPage.tsx apps/web/src/pages/__tests__/RoomPage.test.tsx
git commit -m "feat: add nav bar to RoomPage, hero banner now below nav"
```

---

### Task 6: Rewrite CardDeck with BpkCheckboxCard

**Files:**
- Rewrite: `apps/web/src/components/CardDeck.tsx`
- Create: `apps/web/src/components/CardDeck.css`
- Rewrite: `apps/web/src/components/__tests__/CardDeck.test.tsx`

This is the highest-risk task. Read the spec Section 3 carefully.

- [ ] **Step 1: Create the CSS override file**

Create `apps/web/src/components/CardDeck.css`:

```css
.card-deck-item [data-state="checked"] {
  transform: translateY(-6px) scale(1.05);
  box-shadow: 0 8px 20px -4px rgba(5, 32, 60, 0.35);
  transition: all 200ms ease-in-out;
}

.card-deck-item [data-state="unchecked"] {
  transition: all 200ms ease-in-out;
}

/* WCAG fix: BpkCheckboxCard's disabled text has insufficient contrast */
.card-deck-item [data-disabled] {
  color: rgb(98, 105, 113); /* textSecondaryDay */
}
```

- [ ] **Step 2: Write the failing tests**

Rewrite `apps/web/src/components/__tests__/CardDeck.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@skyscanner/backpack-web/bpk-component-checkbox-card', () => {
  const Root = (props: {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    variant?: string;
    radius?: string;
    value?: string;
    'aria-label'?: string;
    children: React.ReactNode;
  }) => (
    <label
      data-testid={`card-${props.value}`}
      data-state={props.checked ? 'checked' : 'unchecked'}
      data-disabled={props.disabled || undefined}
      data-variant={props.variant}
    >
      <input
        type="checkbox"
        checked={props.checked}
        disabled={props.disabled}
        onChange={() => props.onCheckedChange?.(!props.checked)}
        aria-label={props['aria-label'] || props.value}
      />
      {props.children}
    </label>
  );
  const HiddenInput = () => null;
  const Content = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  const Label = ({ children }: { children: string; textStyle?: string }) => <span>{children}</span>;

  const BpkCheckboxCard = Object.assign(Root, { Root, HiddenInput, Content, Label });
  return {
    default: BpkCheckboxCard,
    BpkCheckboxCard,
    CHECKBOX_CARD_VARIANTS: {
      onCanvasDefault: 'on-canvas-default',
      onCanvasContrast: 'on-canvas-contrast',
      onSurfaceContrast: 'on-surface-contrast',
      cars: 'cars',
    },
    CHECKBOX_CARD_RADIUS: { square: 'square', rounded: 'rounded' },
  };
});

vi.mock('@skyscanner/backpack-web/bpk-component-text', () => {
  const BpkText = (props: { children: React.ReactNode; tagName?: string; textStyle?: string; color?: string }) => {
    const Tag = (props.tagName || 'span') as keyof JSX.IntrinsicElements;
    return <Tag data-text-style={props.textStyle} data-color={props.color}>{props.children}</Tag>;
  };
  return {
    default: BpkText,
    TEXT_STYLES: { heading4: 'heading-4', label1: 'label-1', caption: 'caption' },
    TEXT_COLORS: { textHero: 'text-hero' },
  };
});

import { CardDeck } from '../CardDeck';

const defaultDeck = ['1', '2', '3', '5', '8', '13', '21', '?', '☕'];

describe('CardDeck', () => {
  it('renders all deck values as checkbox cards', () => {
    render(<CardDeck deck={defaultDeck} selectedValue={null} disabled={false} onSelect={vi.fn()} />);
    defaultDeck.forEach((value) => {
      expect(screen.getByTestId(`card-${value}`)).toBeInTheDocument();
    });
  });

  it('marks selected card as checked', () => {
    render(<CardDeck deck={defaultDeck} selectedValue="5" disabled={false} onSelect={vi.fn()} />);
    expect(screen.getByTestId('card-5')).toHaveAttribute('data-state', 'checked');
    expect(screen.getByTestId('card-3')).toHaveAttribute('data-state', 'unchecked');
  });

  it('calls onSelect with the value when a card is checked', () => {
    const onSelect = vi.fn();
    render(<CardDeck deck={defaultDeck} selectedValue={null} disabled={false} onSelect={onSelect} />);
    const checkbox = screen.getByTestId('card-3').querySelector('input');
    fireEvent.click(checkbox!);
    expect(onSelect).toHaveBeenCalledWith('3');
  });

  it('calls onSelect with null when a selected card is unchecked (deselection)', () => {
    const onSelect = vi.fn();
    render(<CardDeck deck={defaultDeck} selectedValue="5" disabled={false} onSelect={onSelect} />);
    const checkbox = screen.getByTestId('card-5').querySelector('input');
    fireEvent.click(checkbox!);
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('disables all cards when disabled prop is true', () => {
    render(<CardDeck deck={defaultDeck} selectedValue={null} disabled={true} onSelect={vi.fn()} />);
    defaultDeck.forEach((value) => {
      expect(screen.getByTestId(`card-${value}`)).toHaveAttribute('data-disabled');
    });
  });

  it('renders container with radiogroup role', () => {
    render(<CardDeck deck={defaultDeck} selectedValue={null} disabled={false} onSelect={vi.fn()} />);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('uses onCanvasDefault variant', () => {
    render(<CardDeck deck={defaultDeck} selectedValue={null} disabled={false} onSelect={vi.fn()} />);
    expect(screen.getByTestId('card-1')).toHaveAttribute('data-variant', 'on-canvas-default');
  });

  it('renders selection feedback when a card is selected', () => {
    render(<CardDeck deck={defaultDeck} selectedValue="8" disabled={false} onSelect={vi.fn()} />);
    expect(screen.getByText(/You selected/)).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('renders heading with label1 text style', () => {
    render(<CardDeck deck={defaultDeck} selectedValue={null} disabled={false} onSelect={vi.fn()} />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveAttribute('data-text-style', 'label-1');
  });

  it('provides aria-label for ? card', () => {
    render(<CardDeck deck={defaultDeck} selectedValue={null} disabled={false} onSelect={vi.fn()} />);
    expect(screen.getByLabelText('Pass')).toBeInTheDocument();
  });

  it('provides aria-label for coffee card', () => {
    render(<CardDeck deck={defaultDeck} selectedValue={null} disabled={false} onSelect={vi.fn()} />);
    expect(screen.getByLabelText('Coffee break')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd apps/web && pnpm vitest run src/components/__tests__/CardDeck.test.tsx`
Expected: FAIL — CardDeck still uses `<button>` elements

- [ ] **Step 4: Rewrite CardDeck.tsx**

Replace `apps/web/src/components/CardDeck.tsx`:

```tsx
import BpkText, { TEXT_STYLES, TEXT_COLORS } from '@skyscanner/backpack-web/bpk-component-text';
import {
  BpkCheckboxCard,
  CHECKBOX_CARD_VARIANTS,
  CHECKBOX_CARD_RADIUS,
} from '@skyscanner/backpack-web/bpk-component-checkbox-card';
import './CardDeck.css';

interface Props {
  deck: string[];
  selectedValue: string | null;
  disabled: boolean;
  onSelect: (value: string | null) => void;
}

const specialLabels: Record<string, string> = {
  '?': 'Pass',
  '☕': 'Coffee break',
};

export function CardDeck({ deck, selectedValue, disabled, onSelect }: Props) {
  return (
    <div className="space-y-3">
      <BpkText textStyle={TEXT_STYLES.label1} tagName="h2" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
        Choose your estimate
      </BpkText>
      <div className="flex flex-wrap gap-4 justify-center" role="radiogroup" aria-label="Estimation values">
        {deck.map((value) => {
          const isSelected = selectedValue === value;
          const ariaLabel = specialLabels[value];
          return (
            <div key={value} className="card-deck-item" style={{ minWidth: 60, minHeight: 84 }}>
              <BpkCheckboxCard.Root
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(checked ? value : null)}
                disabled={disabled}
                variant={CHECKBOX_CARD_VARIANTS.onCanvasDefault}
                radius={CHECKBOX_CARD_RADIUS.rounded}
                aria-label={ariaLabel}
                value={value}
              >
                <BpkCheckboxCard.HiddenInput />
                <BpkCheckboxCard.Content>
                  <BpkCheckboxCard.Label textStyle={TEXT_STYLES.heading4}>
                    {value}
                  </BpkCheckboxCard.Label>
                </BpkCheckboxCard.Content>
              </BpkCheckboxCard.Root>
            </div>
          );
        })}
      </div>
      {selectedValue && (
        <BpkText textStyle={TEXT_STYLES.caption} tagName="p" style={{ textAlign: 'center' }}>
          You selected{' '}
          <BpkText textStyle={TEXT_STYLES.caption} tagName="strong" color={TEXT_COLORS.textHero}>
            {selectedValue}
          </BpkText>
          {' '}— click another card to change
        </BpkText>
      )}
    </div>
  );
}
```

Key changes:
- `<button>` replaced with `BpkCheckboxCard` compound component
- All inline style objects removed (handled by component + CSS overrides)
- `onSelect` signature changed to `(value: string | null)` to support deselection
- `role="radiogroup"` + `aria-label` on container
- `specialLabels` map for ? and coffee emoji
- `TEXT_STYLES.label1` for heading (was caption)
- `TEXT_COLORS.textHero` for selected value text (was inline `style={{ color: coreAccentDay }}`)

- [ ] **Step 5: Run tests**

Run: `cd apps/web && pnpm vitest run src/components/__tests__/CardDeck.test.tsx`
Expected: PASS (11 tests)

- [ ] **Step 6: Update RoomPage to match new onSelect signature**

In `apps/web/src/pages/RoomPage.tsx`, the `onSelect` callback currently passes a string. Update it to handle null (deselection):

```tsx
onSelect={(value) => roomId && value && castVote(roomId, value)}
```

This keeps the existing behaviour — deselection (null) is ignored at the socket level.

- [ ] **Step 7: Run full test suite**

Run: `cd apps/web && pnpm test`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/components/CardDeck.tsx apps/web/src/components/CardDeck.css apps/web/src/components/__tests__/CardDeck.test.tsx apps/web/src/pages/RoomPage.tsx
git commit -m "feat: replace CardDeck buttons with BpkCheckboxCard compound component"
```

---

### Task 7: Extract Avatar Helpers + Update ParticipantList — Larger Avatars + New Palette + Current User Highlight

**Files:**
- Create: `apps/web/src/lib/avatar.ts`
- Modify: `apps/web/src/components/ParticipantList.tsx`
- Modify: `apps/web/src/components/__tests__/ParticipantList.test.tsx`

**Note:** This task extracts `initials()` and `avatarColor()` from ParticipantList into `apps/web/src/lib/avatar.ts` so RevealedResults (Task 8) can reuse them.

- [ ] **Step 1: Write the failing tests**

In `apps/web/src/components/__tests__/ParticipantList.test.tsx`:

Update avatar size test:
```tsx
it('renders 48x48 avatars', () => {
  render(<ParticipantList {...makeProps([makeParticipant('Alice')])} />);
  const avatar = screen.getByText('AL').closest('div');
  expect(avatar).toHaveClass('w-12', 'h-12');
});
```

Add current-user highlight test:
```tsx
it('highlights current user with surfaceSubtleDay background and coreAccentDay left border', () => {
  const props = makeProps([makeParticipant('Alice', { id: 'p1' })]);
  render(<ParticipantList {...props} currentParticipantId="p1" />);
  // The BpkCard wrapping the current user should have the highlight styles
  const card = screen.getByText('Alice').closest('[data-testid="bpk-card"]');
  expect(card).toHaveStyle({
    backgroundColor: 'rgb(227, 240, 255)',
    borderLeft: '4px solid rgb(0, 98, 227)',
  });
});
```

Update the avatar palette test to check 8 distinct colours:
```tsx
it('uses an 8-color avatar palette with all distinct colours', () => {
  const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const participants = names.map((n) => makeParticipant(n));
  render(<ParticipantList {...makeProps(participants)} />);
  const avatars = document.querySelectorAll('[data-testid="avatar"]');
  const colors = new Set(Array.from(avatars).map((el) => (el as HTMLElement).style.backgroundColor));
  expect(colors.size).toBeGreaterThanOrEqual(8);
});
```

Update heading text style test:
```tsx
it('renders heading with label1 text style', () => {
  render(<ParticipantList {...makeProps([makeParticipant('Alice')])} />);
  const heading = screen.getByRole('heading', { level: 2 });
  expect(heading).toHaveAttribute('data-text-style', 'label-1');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && pnpm vitest run src/components/__tests__/ParticipantList.test.tsx`
Expected: FAIL

- [ ] **Step 3: Create shared avatar helper module**

Create `apps/web/src/lib/avatar.ts`:

```tsx
import {
  corePrimaryDay,
  coreAccentDay,
  coreEcoDay,
  statusSuccessSpotDay,
  statusDangerSpotDay,
  statusWarningSpotDay,
  textErrorDay,
  textSecondaryDay,
} from '@skyscanner/bpk-foundations-web/tokens/base.es6';

const avatarColors = [
  corePrimaryDay,
  coreAccentDay,
  coreEcoDay,
  statusSuccessSpotDay,
  statusDangerSpotDay,
  statusWarningSpotDay,
  textErrorDay,
  textSecondaryDay,
];

export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}
```

- [ ] **Step 4: Implement the changes to ParticipantList.tsx**

In `apps/web/src/components/ParticipantList.tsx`:

1. Replace the local `initials()` and `avatarColor()` functions with imports:
```tsx
import { avatarColor, initials } from '../lib/avatar.js';
```

2. Remove the local `avatarColors` array and both local functions.

3. Remove now-unused token imports that were only used by the avatar palette (keep the ones still used for styles).

4. Change avatar size from `w-9 h-9` to `w-12 h-12` (48px).

5. Add `data-testid="avatar"` to avatar div.

6. Change heading from `TEXT_STYLES.caption` to `TEXT_STYLES.label1`.

7. Replace the current-user highlight from box-shadow inset to:
```tsx
style={
  isMe
    ? {
        backgroundColor: surfaceSubtleDay,
        borderLeft: `4px solid ${coreAccentDay}`,
      }
    : undefined
}
```

8. Use `TEXT_COLORS.textHero` instead of `style={{ color: coreAccentDay }}` for the "(you)" label.

- [ ] **Step 4: Run tests**

Run: `cd apps/web && pnpm vitest run src/components/__tests__/ParticipantList.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/avatar.ts apps/web/src/components/ParticipantList.tsx apps/web/src/components/__tests__/ParticipantList.test.tsx
git commit -m "feat: extract avatar helpers, larger avatars, new 8-colour palette, left-border highlight"
```

---

### Task 8: Update RevealedResults — Add Avatars + TEXT_COLORS

**Files:**
- Modify: `apps/web/src/components/RevealedResults.tsx`
- Modify: `apps/web/src/components/__tests__/RevealedResults.test.tsx`

- [ ] **Step 1: Write the failing test**

In `apps/web/src/components/__tests__/RevealedResults.test.tsx`, add:

```tsx
it('renders participant avatars next to vote values', () => {
  const votes = [{ participantId: 'p1', value: '5' }];
  const participants = [makeParticipant('Alice Baker', { id: 'p1' })];
  render(<RevealedResults votes={votes} participants={participants} />);
  expect(screen.getByText('AB')).toBeInTheDocument(); // two-letter initials
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm vitest run src/components/__tests__/RevealedResults.test.tsx`
Expected: FAIL — no 'AB' text found

- [ ] **Step 3: Implement the changes**

In `apps/web/src/components/RevealedResults.tsx`:

1. Import the shared avatar helpers (extracted in Task 7):
```tsx
import { avatarColor, initials } from '../lib/avatar.js';
import { textOnDarkDay } from '@skyscanner/bpk-foundations-web/tokens/base.es6';
```

2. Add avatar rendering next to each vote card participant name:

```tsx
import { avatarColor, initials } from '../lib/avatar.js';
import { textOnDarkDay } from '@skyscanner/bpk-foundations-web/tokens/base.es6';
```

Add avatar div next to participant name in each vote card.

4. Replace `style={{ color: coreAccentDay }}` with `color={TEXT_COLORS.textHero}` on vote value text.

- [ ] **Step 4: Run tests**

Run: `cd apps/web && pnpm vitest run src/components/__tests__/RevealedResults.test.tsx`
Expected: PASS

- [ ] **Step 5: Run full suite to verify ParticipantList still passes**

Run: `cd apps/web && pnpm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/RevealedResults.tsx apps/web/src/components/__tests__/RevealedResults.test.tsx
git commit -m "feat: add avatars to RevealedResults, use TEXT_COLORS"
```

---

### Task 9: Final Full Test Suite + Visual Verification

**Files:** None (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `cd apps/web && pnpm test`
Expected: All tests PASS

- [ ] **Step 2: Start the dev server and visually verify**

Run: `cd apps/web && pnpm dev` (if not already running)

Check each page in the browser:
1. **HomePage** — dark navy nav bar at top, form card with proper shadow/radius, spade icon
2. **JoinPage** — same nav bar, form card styling
3. **RoomPage** — nav bar + blue hero banner with room name, status badge, invite button. Content area below with participant cards and voting area
4. **CardDeck** — BpkCheckboxCard cards, navy when selected with lift effect, disabled state legible
5. **ParticipantList** — 48px avatars, diverse colour palette, current user with blue left border
6. **RevealedResults** — avatars next to vote values

- [ ] **Step 3: Commit any final tweaks**

If visual issues are found, fix and commit separately.

- [ ] **Step 4: Run full suite one last time**

Run: `cd apps/web && pnpm test`
Expected: PASS
