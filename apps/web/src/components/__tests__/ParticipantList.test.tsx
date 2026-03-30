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
  } as const;

  const BpkText = (props: {
    textStyle?: string;
    tagName?: string;
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
  }) => {
    const Tag = (props.tagName || 'span') as keyof JSX.IntrinsicElements;
    return (
      <Tag data-testid="bpk-text" data-style={props.textStyle} style={props.style}>
        {props.children}
      </Tag>
    );
  };

  return { default: BpkText, TEXT_STYLES };
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
  const BpkCard = (props: { atomic?: boolean; padded?: boolean; children: React.ReactNode; className?: string }) => (
    <div data-testid="bpk-card" data-atomic={String(props.atomic)} data-padded={String(props.padded)} className={props.className}>
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
}));

function makeParticipant(overrides: Partial<Participant> = {}): Participant {
  return {
    id: 'p1',
    name: 'Alice Smith',
    role: 'voter',
    connected: true,
    ...overrides,
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
    const placeholder = container.querySelector('.w-7.h-9.rounded-md');
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

  it('uses an 8-color avatar palette', () => {
    const participants = Array.from({ length: 8 }, (_, i) =>
      makeParticipant({ id: `p${i}`, name: `User ${i}` }),
    );
    const { container } = render(
      <ParticipantList participants={participants} currentRound={makeRound()} currentParticipantId={null} />,
    );
    const avatars = container.querySelectorAll('.w-9.h-9.rounded-full');
    expect(avatars).toHaveLength(8);
  });

  it('includes corePrimaryDay in avatar color palette', () => {
    const participants = Array.from({ length: 20 }, (_, i) =>
      makeParticipant({ id: `p${i}`, name: String(i) }),
    );
    const { container } = render(
      <ParticipantList participants={participants} currentRound={makeRound()} currentParticipantId={null} />,
    );
    const avatars = container.querySelectorAll('.w-9.h-9.rounded-full');
    const colors = Array.from(avatars).map((el) => (el as HTMLElement).style.backgroundColor);
    expect(colors).toContain('rgb(5, 32, 60)');
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
    const placeholder = container.querySelector('.w-7.h-9.rounded-md');
    expect(placeholder).not.toBeInTheDocument();
  });
});
