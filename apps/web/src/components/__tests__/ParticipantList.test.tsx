import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ParticipantList } from '../ParticipantList';
import type { Participant, VotingRound } from '@mighty-poker/core';

vi.mock('@skyscanner/backpack-web/bpk-component-text', () => {
  const TEXT_STYLES = {
    heading2: 'heading-2',
    heading3: 'heading-3',
    heading4: 'heading-4',
    bodyDefault: 'body-default',
    caption: 'caption',
    label1: 'label-1',
  } as const;

  const TEXT_COLORS = {
    textHero: 'text-hero',
  } as const;

  const BpkText = (props: {
    textStyle?: string;
    tagName?: string;
    children: React.ReactNode;
    color?: string;
    style?: React.CSSProperties;
    className?: string;
  }) => {
    const Tag = (props.tagName || 'span') as keyof JSX.IntrinsicElements;
    return (
      <Tag data-testid="bpk-text" data-text-style={props.textStyle} data-color={props.color} style={props.style}>
        {props.children}
      </Tag>
    );
  };

  return { default: BpkText, TEXT_STYLES, TEXT_COLORS };
});

vi.mock('@skyscanner/backpack-web/bpk-component-badge', () => {
  const BADGE_TYPES = {
    normal: 'normal',
    brand: 'brand',
    success: 'success',
    warning: 'warning',
    critical: 'critical',
    inverse: 'inverse',
    outline: 'outline',
    strong: 'strong',
  } as const;

  const BpkBadge = (props: { type?: string; children: React.ReactNode }) => (
    <span data-testid="bpk-badge" data-type={props.type}>
      {props.children}
    </span>
  );

  return { default: BpkBadge, BADGE_TYPES };
});

vi.mock('@skyscanner/backpack-web/bpk-component-card', () => {
  const BpkCard = (props: { atomic?: boolean; padded?: boolean; children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
    <div data-testid="bpk-card" data-atomic={String(props.atomic)} data-padded={String(props.padded)} className={props.className} style={props.style}>
      {props.children}
    </div>
  );
  return { default: BpkCard };
});

vi.mock('@skyscanner/bpk-foundations-web/tokens/base.es6', () => ({
  coreAccentDay: 'rgb(0, 98, 227)',
  coreEcoDay: 'rgb(15, 161, 169)',
  statusSuccessSpotDay: 'rgb(12, 131, 138)',
  statusWarningSpotDay: 'rgb(245, 93, 66)',
  statusDangerSpotDay: 'rgb(231, 8, 102)',
  surfaceHeroDay: 'rgb(0, 98, 227)',
  surfaceSubtleDay: 'rgb(227, 240, 255)',
  corePrimaryDay: 'rgb(5, 32, 60)',
  lineDay: 'rgb(193, 199, 207)',
  textOnDarkDay: 'rgb(255, 255, 255)',
  textHeroDay: 'rgb(0, 98, 227)',
  textErrorDay: 'rgb(209, 67, 91)',
  textSecondaryDay: 'rgb(104, 113, 127)',
}));

function makeParticipant(nameOrOverrides?: string | Partial<Participant>, overrides: Partial<Participant> = {}): Participant {
  const base: Participant = {
    id: 'p1',
    name: 'Alice Smith',
    role: 'voter',
    connected: true,
  };
  if (typeof nameOrOverrides === 'string') {
    return { ...base, name: nameOrOverrides, ...overrides };
  }
  return { ...base, ...(nameOrOverrides ?? {}) };
}

function makeProps(participants: Participant[], extra: Partial<{ currentRound: VotingRound; currentParticipantId: string | null }> = {}) {
  return {
    participants,
    currentRound: extra.currentRound ?? makeRound(),
    currentParticipantId: extra.currentParticipantId ?? null,
  };
}

function makeRound(overrides: Partial<VotingRound> = {}): VotingRound {
  return {
    status: 'idle',
    votes: [],
    ...overrides,
  };
}

describe('ParticipantList', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders all participant names', () => {
    const participants = [
      makeParticipant({ id: 'p1', name: 'Alice Smith' }),
      makeParticipant({ id: 'p2', name: 'Bob Jones' }),
      makeParticipant({ id: 'p3', name: 'Carol White' }),
    ];

    render(
      <ParticipantList
        participants={participants}
        currentRound={makeRound()}
        currentParticipantId={null}
      />,
    );

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    expect(screen.getByText('Carol White')).toBeInTheDocument();
  });

  it('renders the participant count in the heading', () => {
    const participants = [
      makeParticipant({ id: 'p1', name: 'Alice' }),
      makeParticipant({ id: 'p2', name: 'Bob' }),
    ];

    render(
      <ParticipantList
        participants={participants}
        currentRound={makeRound()}
        currentParticipantId={null}
      />,
    );

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Participants (2)');
  });

  it('shows "(you)" for the current participant', () => {
    const participants = [makeParticipant({ id: 'p1', name: 'Alice' })];

    render(
      <ParticipantList
        participants={participants}
        currentRound={makeRound()}
        currentParticipantId="p1"
      />,
    );

    expect(screen.getByText('(you)')).toBeInTheDocument();
  });

  it('does not show "(you)" for other participants', () => {
    const participants = [makeParticipant({ id: 'p1', name: 'Alice' })];

    render(
      <ParticipantList
        participants={participants}
        currentRound={makeRound()}
        currentParticipantId="p2"
      />,
    );

    expect(screen.queryByText('(you)')).not.toBeInTheDocument();
  });

  it('shows "facilitator" badge for facilitator role', () => {
    const participants = [makeParticipant({ id: 'p1', name: 'Alice', role: 'facilitator' })];

    render(
      <ParticipantList
        participants={participants}
        currentRound={makeRound()}
        currentParticipantId={null}
      />,
    );

    const badge = screen.getByText('facilitator');
    expect(badge.closest('[data-testid="bpk-badge"]')).toHaveAttribute('data-type', 'brand');
  });

  it('shows "offline" badge when participant is not connected', () => {
    const participants = [makeParticipant({ id: 'p1', name: 'Alice', connected: false })];

    render(
      <ParticipantList
        participants={participants}
        currentRound={makeRound()}
        currentParticipantId={null}
      />,
    );

    const badge = screen.getByText('offline');
    expect(badge.closest('[data-testid="bpk-badge"]')).toHaveAttribute('data-type', 'normal');
  });

  it('applies opacity to disconnected participants', () => {
    const participants = [makeParticipant({ id: 'p1', name: 'Alice', connected: false })];

    render(
      <ParticipantList
        participants={participants}
        currentRound={makeRound()}
        currentParticipantId={null}
      />,
    );

    const listItem = screen.getByText('Alice').closest('li');
    expect(listItem).toHaveClass('opacity-50');
  });

  it('shows vote checkmark badge during voting when participant has voted', () => {
    const participants = [makeParticipant({ id: 'p1', name: 'Alice' })];
    const round = makeRound({
      status: 'voting',
      votes: [{ participantId: 'p1', value: '5' }],
    });

    render(
      <ParticipantList
        participants={participants}
        currentRound={round}
        currentParticipantId={null}
      />,
    );

    const badges = screen.getAllByTestId('bpk-badge');
    const checkBadge = badges.find((b) => b.textContent === '\u2713');
    expect(checkBadge).toBeDefined();
    expect(checkBadge).toHaveAttribute('data-type', 'success');
  });

  it('shows empty placeholder during voting when participant has not voted', () => {
    const participants = [makeParticipant({ id: 'p1', name: 'Alice' })];
    const round = makeRound({ status: 'voting', votes: [] });

    const { container } = render(
      <ParticipantList
        participants={participants}
        currentRound={round}
        currentParticipantId={null}
      />,
    );

    // The dashed border placeholder should be rendered
    const placeholder = container.querySelector('.w-7.h-9');
    expect(placeholder).toBeInTheDocument();
  });

  it('shows vote values when round is revealed', () => {
    const participants = [
      makeParticipant({ id: 'p1', name: 'Alice' }),
      makeParticipant({ id: 'p2', name: 'Bob' }),
    ];
    const round = makeRound({
      status: 'revealed',
      votes: [
        { participantId: 'p1', value: '5' },
        { participantId: 'p2', value: '8' },
      ],
    });

    render(
      <ParticipantList
        participants={participants}
        currentRound={round}
        currentParticipantId={null}
      />,
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('wraps each participant row in a BpkCard', () => {
    const participants = [
      makeParticipant({ id: 'p1', name: 'Alice' }),
      makeParticipant({ id: 'p2', name: 'Bob' }),
    ];
    render(
      <ParticipantList participants={participants} currentRound={makeRound()} currentParticipantId={null} />,
    );
    const cards = screen.getAllByTestId('bpk-card');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveAttribute('data-atomic', 'false');
    expect(cards[0]).toHaveAttribute('data-padded', 'true');
  });

  it('renders 48x48 avatars', () => {
    render(<ParticipantList {...makeProps([makeParticipant('Alice Smith')])} />);
    const avatar = screen.getByText('AS').closest('div');
    expect(avatar).toHaveClass('w-12', 'h-12');
  });

  it('highlights current user with surfaceSubtleDay background and coreAccentDay left border', () => {
    const props = makeProps([makeParticipant('Alice', { id: 'p1' })]);
    render(<ParticipantList {...props} currentParticipantId="p1" />);
    const card = screen.getByText('Alice').closest('[data-testid="bpk-card"]');
    expect(card).toHaveStyle({
      backgroundColor: 'rgb(227, 240, 255)',
      borderLeft: '4px solid rgb(0, 98, 227)',
    });
  });

  it('uses an 8-color avatar palette with all distinct colours', () => {
    const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const participants = names.map((n, i) => makeParticipant(n, { id: `p${i}` }));
    render(<ParticipantList {...makeProps(participants)} />);
    const avatars = document.querySelectorAll('[data-testid="avatar"]');
    const colors = new Set(Array.from(avatars).map((el) => (el as HTMLElement).style.backgroundColor));
    expect(colors.size).toBeGreaterThanOrEqual(8);
  });

  it('renders heading with label1 text style', () => {
    render(<ParticipantList {...makeProps([makeParticipant('Alice')])} />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveAttribute('data-text-style', 'label-1');
  });

  it('does not show vote indicators during idle status', () => {
    const participants = [makeParticipant({ id: 'p1', name: 'Alice' })];
    const round = makeRound({ status: 'idle', votes: [] });

    const { container } = render(
      <ParticipantList
        participants={participants}
        currentRound={round}
        currentParticipantId={null}
      />,
    );

    // No checkmark badges or dashed placeholders
    const badges = screen.queryAllByTestId('bpk-badge');
    expect(badges).toHaveLength(0);
    const placeholder = container.querySelector('.w-7.h-9');
    expect(placeholder).not.toBeInTheDocument();
  });
});
