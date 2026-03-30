import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { RevealedResults } from '../RevealedResults';
import type { Vote, Participant } from '@mighty-poker/core';

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
  const BpkCard = (props: {
    children: React.ReactNode;
    padded?: boolean;
    className?: string;
  }) => (
    <div data-testid="bpk-card" data-padded={props.padded}>
      {props.children}
    </div>
  );

  return { default: BpkCard };
});

vi.mock('@skyscanner/backpack-web/bpk-component-info-banner', () => {
  const ALERT_TYPES = {
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    INFO: 'info',
  } as const;

  const BpkInfoBanner = (props: { type?: string; message: string }) => (
    <div data-testid="info-banner" data-type={props.type}>
      {props.message}
    </div>
  );

  return { default: BpkInfoBanner, ALERT_TYPES };
});

vi.mock('@skyscanner/bpk-foundations-web/tokens/base.es6', () => ({
  coreAccentDay: 'rgb(0, 98, 227)',
}));

afterEach(() => {
  cleanup();
});

function makeVotes(values: string[]): Vote[] {
  return values.map((value, i) => ({
    participantId: `p${i}`,
    value,
  }));
}

function makeParticipants(
  count: number,
  overrides?: Partial<Participant>[],
): Participant[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    name: `Player ${i}`,
    role: 'voter' as const,
    connected: true,
    ...overrides?.[i],
  }));
}

describe('RevealedResults', () => {
  describe('getConsensus logic', () => {
    it('returns null for empty votes (shows warning banner)', () => {
      render(<RevealedResults votes={[]} participants={[]} />);
      const banner = screen.getByTestId('info-banner');
      expect(banner).toHaveAttribute('data-type', 'warning');
    });

    it('shows consensus banner when all votes match', () => {
      const votes = makeVotes(['5', '5', '5']);
      const participants = makeParticipants(3);

      render(<RevealedResults votes={votes} participants={participants} />);

      const banner = screen.getByTestId('info-banner');
      expect(banner).toHaveAttribute('data-type', 'success');
      expect(banner.textContent).toContain('Consensus');
      expect(banner.textContent).toContain('5');
    });

    it('shows no-consensus warning when votes differ', () => {
      const votes = makeVotes(['3', '5', '8']);
      const participants = makeParticipants(3);

      render(<RevealedResults votes={votes} participants={participants} />);

      const banner = screen.getByTestId('info-banner');
      expect(banner).toHaveAttribute('data-type', 'warning');
      expect(banner.textContent).toContain('No consensus');
    });
  });

  describe('vote display', () => {
    it('displays all vote values', () => {
      const votes = makeVotes(['3', '5', '8']);
      const participants = makeParticipants(3);

      render(<RevealedResults votes={votes} participants={participants} />);

      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('renders a BpkCard for each vote', () => {
      const votes = makeVotes(['3', '5']);
      const participants = makeParticipants(2);

      render(<RevealedResults votes={votes} participants={participants} />);

      const cards = screen.getAllByTestId('bpk-card');
      expect(cards).toHaveLength(2);
      cards.forEach((card) => {
        expect(card).toHaveAttribute('data-padded', 'true');
      });
    });

    it('displays participant names', () => {
      const votes = makeVotes(['5', '8']);
      const participants = makeParticipants(2, [
        { name: 'Alice' },
        { name: 'Bob' },
      ]);

      render(<RevealedResults votes={votes} participants={participants} />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('shows "Unknown" for unmatched participant', () => {
      const votes: Vote[] = [{ participantId: 'unknown-id', value: '5' }];

      render(<RevealedResults votes={votes} participants={[]} />);

      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });

  describe('facilitator badge', () => {
    it('shows brand badge for facilitators', () => {
      const votes = makeVotes(['5']);
      const participants = makeParticipants(1, [
        { name: 'Facilitator', role: 'facilitator' },
      ]);

      render(<RevealedResults votes={votes} participants={participants} />);

      const badge = screen.getByTestId('bpk-badge');
      expect(badge).toHaveAttribute('data-type', 'brand');
      expect(badge.textContent).toBe('facilitator');
    });

    it('does not show badge for regular voters', () => {
      const votes = makeVotes(['5']);
      const participants = makeParticipants(1, [{ role: 'voter' }]);

      render(<RevealedResults votes={votes} participants={participants} />);

      expect(screen.queryByTestId('bpk-badge')).not.toBeInTheDocument();
    });
  });

  describe('heading', () => {
    it('renders "Results" heading with caption style', () => {
      render(<RevealedResults votes={[]} participants={[]} />);

      const headings = screen.getAllByTestId('bpk-text');
      const resultsHeading = headings.find((h) => h.textContent === 'Results');
      expect(resultsHeading).toBeDefined();
      expect(resultsHeading).toHaveAttribute('data-style', 'caption');
      expect(resultsHeading?.tagName).toBe('H2');
    });
  });

  describe('emoji preservation', () => {
    it('consensus message includes party popper emoji', () => {
      const votes = makeVotes(['5', '5']);
      const participants = makeParticipants(2);

      render(<RevealedResults votes={votes} participants={participants} />);

      const banner = screen.getByTestId('info-banner');
      expect(banner.textContent).toContain('\u{1F389}');
    });

    it('no-consensus message includes warning emoji', () => {
      const votes = makeVotes(['3', '5']);
      const participants = makeParticipants(2);

      render(<RevealedResults votes={votes} participants={participants} />);

      const banner = screen.getByTestId('info-banner');
      expect(banner.textContent).toContain('\u26A0');
    });
  });
});
