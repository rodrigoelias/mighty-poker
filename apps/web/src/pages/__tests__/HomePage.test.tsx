import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import HomePage from '../HomePage';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock socket
vi.mock('../../lib/socket.js', () => ({
  createRoom: vi.fn(),
}));

// Mock room store
vi.mock('../../stores/room-store.js', () => ({
  useRoomStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      setIdentity: vi.fn(),
      setRoom: vi.fn(),
    }),
}));

// Mock Backpack components with minimal implementations
vi.mock('@skyscanner/backpack-web/bpk-component-text', () => {
  const TEXT_STYLES = {
    heading2: 'heading-2',
    bodyDefault: 'body-default',
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

vi.mock('@skyscanner/backpack-web/bpk-component-input', () => {
  const BpkInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  );
  return { default: BpkInput };
});

vi.mock('@skyscanner/backpack-web/bpk-component-label', () => {
  const BpkLabel = ({
    children,
    ...rest
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => <label {...rest}>{children}</label>;
  return { default: BpkLabel };
});

vi.mock('@skyscanner/backpack-web/bpk-component-button', () => {
  const BpkButton = ({
    children,
    submit,
    fullWidth,
    ...rest
  }: {
    children: React.ReactNode;
    submit?: boolean;
    fullWidth?: boolean;
    disabled?: boolean;
    [key: string]: unknown;
  }) => (
    <button type={submit ? 'submit' : 'button'} {...rest}>
      {children}
    </button>
  );
  return { default: BpkButton };
});

vi.mock('@skyscanner/backpack-web/bpk-component-info-banner', () => {
  const ALERT_TYPES = {
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    INFO: 'info',
  } as const;

  const BpkInfoBanner = (props: {
    type?: string;
    message: string;
    role?: string;
  }) => (
    <div data-testid="info-banner" data-type={props.type} role={props.role}>
      {props.message}
    </div>
  );

  return { default: BpkInfoBanner, ALERT_TYPES };
});

vi.mock('@skyscanner/bpk-foundations-web/tokens/base.es6', () => ({
  canvasDay: 'rgb(255, 255, 255)',
  corePrimaryDay: 'rgb(5, 32, 60)',
  surfaceDefaultDay: 'rgb(255, 255, 255)',
  textOnDarkDay: 'rgb(255, 255, 255)',
}));

describe('HomePage', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders form with name and room name inputs', () => {
    render(<HomePage />);

    expect(screen.getByPlaceholderText('Alice')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Sprint 42')).toBeInTheDocument();
  });

  it('renders the title and subtitle', () => {
    render(<HomePage />);

    expect(screen.getByText('Mighty Poker')).toBeInTheDocument();
    expect(
      screen.getByText('Plan together, estimate better'),
    ).toBeInTheDocument();
  });

  it('labels are associated with inputs via htmlFor/id', () => {
    render(<HomePage />);

    const nameLabel = screen.getByText('Your name');
    const roomLabel = screen.getByText('Room name');

    expect(nameLabel.tagName).toBe('LABEL');
    expect(roomLabel.tagName).toBe('LABEL');
    expect(nameLabel).toHaveAttribute('for', 'name');
    expect(roomLabel).toHaveAttribute('for', 'roomName');

    // Verify inputs have matching ids
    expect(screen.getByPlaceholderText('Alice')).toHaveAttribute('id', 'name');
    expect(screen.getByPlaceholderText('Sprint 42')).toHaveAttribute(
      'id',
      'roomName',
    );
  });

  it('submit button is disabled when fields are empty', () => {
    render(<HomePage />);

    const button = screen.getByRole('button', { name: 'Create Room' });
    expect(button).toBeDisabled();
  });

  it('submit button is enabled when both fields have values', () => {
    render(<HomePage />);

    fireEvent.change(screen.getByPlaceholderText('Alice'), {
      target: { value: 'Bob' },
    });
    fireEvent.change(screen.getByPlaceholderText('Sprint 42'), {
      target: { value: 'My Room' },
    });

    const button = screen.getByRole('button', { name: 'Create Room' });
    expect(button).not.toBeDisabled();
  });

  it('does not show error banner when no error', () => {
    render(<HomePage />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
