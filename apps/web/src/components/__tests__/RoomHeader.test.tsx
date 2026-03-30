import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { RoomHeader } from '../RoomHeader';

vi.mock('@skyscanner/backpack-web/bpk-component-text', () => {
  const TEXT_STYLES = {
    heading4: 'heading-4',
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

vi.mock('@skyscanner/backpack-web/bpk-component-button', () => {
  const BUTTON_TYPES = {
    primary: 'primary',
    link: 'link',
  } as const;

  const BpkButton = (props: {
    type?: string;
    onClick?: () => void;
    children: React.ReactNode;
  }) => (
    <button data-testid="bpk-button" data-type={props.type} onClick={props.onClick}>
      {props.children}
    </button>
  );

  return { default: BpkButton, BUTTON_TYPES };
});

vi.mock('@skyscanner/bpk-foundations-web/tokens/base.es6', () => ({
  textErrorDay: 'rgb(231, 8, 102)',
}));

const defaultProps = {
  roomName: 'Sprint 42',
  roomId: 'abc-123',
  participantCount: 3,
  roundStatus: 'idle' as const,
  connected: true,
};

describe('RoomHeader', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the room name as an h1', () => {
    render(<RoomHeader {...defaultProps} />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Sprint 42');
  });

  it('renders badge with normal type for idle status', () => {
    render(<RoomHeader {...defaultProps} roundStatus="idle" />);
    const badge = screen.getByTestId('bpk-badge');
    expect(badge).toHaveAttribute('data-type', 'normal');
    expect(badge).toHaveTextContent('Idle');
  });

  it('renders badge with brand type for voting status', () => {
    render(<RoomHeader {...defaultProps} roundStatus="voting" />);
    const badge = screen.getByTestId('bpk-badge');
    expect(badge).toHaveAttribute('data-type', 'brand');
    expect(badge).toHaveTextContent('Voting');
  });

  it('renders badge with success type for revealed status', () => {
    render(<RoomHeader {...defaultProps} roundStatus="revealed" />);
    const badge = screen.getByTestId('bpk-badge');
    expect(badge).toHaveAttribute('data-type', 'success');
    expect(badge).toHaveTextContent('Revealed');
  });

  it('renders participant count with plural', () => {
    render(<RoomHeader {...defaultProps} participantCount={3} />);
    expect(screen.getByText('3 participants')).toBeInTheDocument();
  });

  it('renders participant count singular for 1', () => {
    render(<RoomHeader {...defaultProps} participantCount={1} />);
    expect(screen.getByText('1 participant')).toBeInTheDocument();
  });

  it('renders Invite button with link type', () => {
    render(<RoomHeader {...defaultProps} />);
    const button = screen.getByTestId('bpk-button');
    expect(button).toHaveAttribute('data-type', 'link');
    expect(button).toHaveTextContent('Invite');
  });

  it('calls clipboard API when Invite button is clicked', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<RoomHeader {...defaultProps} />);
    fireEvent.click(screen.getByTestId('bpk-button'));

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('/room/abc-123/join'),
    );
  });

  it('does not show reconnecting text when connected', () => {
    render(<RoomHeader {...defaultProps} connected={true} />);
    expect(screen.queryByText(/Reconnecting/)).not.toBeInTheDocument();
  });

  it('shows reconnecting text when not connected', () => {
    render(<RoomHeader {...defaultProps} connected={false} />);
    expect(screen.getByText(/Reconnecting/)).toBeInTheDocument();
  });
});
