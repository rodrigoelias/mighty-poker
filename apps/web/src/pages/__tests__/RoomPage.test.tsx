import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import RoomPage from '../RoomPage';

// --- Mocks ---

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ roomId: 'test-room-123' }),
}));

vi.mock('../../lib/socket.js', () => ({
  getSocket: vi.fn(),
  startRound: vi.fn(),
  castVote: vi.fn(),
  revealVotes: vi.fn(),
  resetRound: vi.fn(),
}));

// Room store mock — overridable per test
let mockStoreState: Record<string, unknown> = {};

vi.mock('../../stores/room-store.js', () => ({
  useRoomStore: (selectorOrNothing?: (s: Record<string, unknown>) => unknown) => {
    if (typeof selectorOrNothing === 'function') {
      return selectorOrNothing(mockStoreState);
    }
    return mockStoreState;
  },
}));

// Child component mocks — render identifiable markers
vi.mock('../../components/ConnectionBanner.js', () => ({
  ConnectionBanner: ({ connected }: { connected: boolean }) => (
    <div data-testid="connection-banner" data-connected={connected} />
  ),
}));

vi.mock('../../components/RoomHeader.js', () => ({
  RoomHeader: () => <div data-testid="room-header" />,
}));

vi.mock('../../components/ParticipantList.js', () => ({
  ParticipantList: () => <div data-testid="participant-list" />,
}));

vi.mock('../../components/CardDeck.js', () => ({
  CardDeck: () => <div data-testid="card-deck" />,
}));

vi.mock('../../components/RevealedResults.js', () => ({
  RevealedResults: () => <div data-testid="revealed-results" />,
}));

vi.mock('../../components/FacilitatorControls.js', () => ({
  FacilitatorControls: () => <div data-testid="facilitator-controls" />,
}));

// Backpack component mocks
vi.mock('@skyscanner/backpack-web/bpk-component-text', () => {
  const TEXT_STYLES = {
    heading2: 'heading-2',
    heading3: 'heading-3',
    heading4: 'heading-4',
    bodyDefault: 'body-default',
    caption: 'caption',
  } as const;

  const BpkText = ({
    children,
    tagName: TagName = 'span',
    textStyle: _textStyle,
    color: _color,
    ...rest
  }: {
    children: React.ReactNode;
    tagName?: string;
    textStyle?: string;
    color?: string;
    className?: string;
    [key: string]: unknown;
  }) => {
    const Tag = TagName as keyof JSX.IntrinsicElements;
    return <Tag {...rest}>{children}</Tag>;
  };

  return { default: BpkText, TEXT_STYLES };
});

vi.mock('@skyscanner/backpack-web/bpk-component-card', () => {
  const BpkCard = ({
    children,
    padded: _padded,
    ...rest
  }: {
    children: React.ReactNode;
    padded?: boolean;
    className?: string;
    [key: string]: unknown;
  }) => (
    <div data-testid="bpk-card" {...rest}>
      {children}
    </div>
  );
  return { default: BpkCard };
});

vi.mock('@skyscanner/backpack-web/bpk-component-spinner', () => {
  const SPINNER_TYPES = {
    primary: 'primary',
    dark: 'dark',
    light: 'light',
  } as const;

  const BpkSpinner = (props: { type?: string }) => (
    <div data-testid="spinner" data-type={props.type} role="status">
      Loading...
    </div>
  );

  return { BpkSpinner, SPINNER_TYPES };
});

vi.mock('@skyscanner/bpk-foundations-web/tokens/base.es6', () => ({
  canvasContrastDay: 'rgb(239, 243, 248)',
}));

// --- Helpers ---

function makeRoom(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-room-123',
    name: 'Sprint 42',
    deck: ['1', '2', '3', '5', '8'],
    participants: [
      { id: 'p1', name: 'Alice', role: 'facilitator', connected: true },
      { id: 'p2', name: 'Bob', role: 'voter', connected: true },
    ],
    currentRound: {
      status: 'idle',
      votes: [],
    },
    ...overrides,
  };
}

function setStore(overrides: Record<string, unknown> = {}) {
  mockStoreState = {
    room: null,
    participantId: 'p1',
    token: 'test-token',
    pendingVote: null,
    myVote: () => null,
    connected: true,
    ...overrides,
  };
}

// --- Tests ---

describe('RoomPage', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows spinner when room is not loaded', () => {
    setStore({ room: null });
    render(<RoomPage />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders ConnectionBanner when room is loaded', () => {
    setStore({ room: makeRoom() });
    render(<RoomPage />);

    expect(screen.getByTestId('connection-banner')).toBeInTheDocument();
  });

  it('renders ParticipantList inside a BpkCard', () => {
    setStore({ room: makeRoom() });
    render(<RoomPage />);

    const participantList = screen.getByTestId('participant-list');
    expect(participantList).toBeInTheDocument();
    // ParticipantList should be wrapped in a BpkCard
    expect(participantList.closest('[data-testid="bpk-card"]')).toBeTruthy();
  });

  it('shows FacilitatorControls for facilitator participant', () => {
    setStore({ room: makeRoom(), participantId: 'p1' });
    render(<RoomPage />);

    expect(screen.getByTestId('facilitator-controls')).toBeInTheDocument();
  });

  it('does not show FacilitatorControls for non-facilitator participant', () => {
    setStore({ room: makeRoom(), participantId: 'p2' });
    render(<RoomPage />);

    expect(screen.queryByTestId('facilitator-controls')).not.toBeInTheDocument();
  });

  it('shows CardDeck during voting round', () => {
    setStore({
      room: makeRoom({
        currentRound: { status: 'voting', votes: [] },
      }),
    });
    render(<RoomPage />);

    expect(screen.getByTestId('card-deck')).toBeInTheDocument();
  });

  it('does not show CardDeck during idle round', () => {
    setStore({ room: makeRoom() });
    render(<RoomPage />);

    expect(screen.queryByTestId('card-deck')).not.toBeInTheDocument();
  });

  it('shows waiting state with emoji and BpkText during idle round', () => {
    setStore({ room: makeRoom() });
    render(<RoomPage />);

    expect(screen.getByText('🃏')).toBeInTheDocument();
    expect(
      screen.getByText('Waiting for facilitator to start voting'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Participants will be able to cast their votes once the round begins',
      ),
    ).toBeInTheDocument();
  });

  it('does not show waiting state during voting', () => {
    setStore({
      room: makeRoom({
        currentRound: { status: 'voting', votes: [] },
      }),
    });
    render(<RoomPage />);

    expect(
      screen.queryByText('Waiting for facilitator to start voting'),
    ).not.toBeInTheDocument();
  });

  it('shows RevealedResults when round is revealed', () => {
    setStore({
      room: makeRoom({
        currentRound: {
          status: 'revealed',
          votes: [{ participantId: 'p1', value: '5' }],
        },
      }),
    });
    render(<RoomPage />);

    expect(screen.getByTestId('revealed-results')).toBeInTheDocument();
  });

  it('does not show RevealedResults during idle or voting', () => {
    setStore({ room: makeRoom() });
    render(<RoomPage />);

    expect(screen.queryByTestId('revealed-results')).not.toBeInTheDocument();
  });

  it('renders RoomHeader when room is loaded', () => {
    setStore({ room: makeRoom() });
    render(<RoomPage />);

    expect(screen.getByTestId('room-header')).toBeInTheDocument();
  });

  it('wraps FacilitatorControls in a BpkCard', () => {
    setStore({ room: makeRoom(), participantId: 'p1' });
    render(<RoomPage />);

    const controls = screen.getByTestId('facilitator-controls');
    expect(controls.closest('[data-testid="bpk-card"]')).toBeTruthy();
  });
});
