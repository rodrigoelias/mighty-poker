import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import JoinPage from '../JoinPage';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ roomId: 'test-room-123' }),
}));

// Mock socket
vi.mock('../../lib/socket.js', () => ({
  joinRoom: vi.fn(),
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
    heading3: 'heading-3',
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
  const BpkInput = ({ valid, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { valid?: boolean | null }) => (
    <input data-valid={valid === null ? 'null' : valid === undefined ? 'undefined' : String(valid)} {...props} />
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
  const BUTTON_TYPES = {
    primary: 'primary',
    secondary: 'secondary',
    featured: 'featured',
    destructive: 'destructive',
    primaryOnDark: 'primaryOnDark',
    primaryOnLight: 'primaryOnLight',
    secondaryOnDark: 'secondaryOnDark',
    link: 'link',
    linkOnDark: 'linkOnDark',
  } as const;

  const BpkButton = ({
    children,
    submit,
    fullWidth: _fullWidth,
    type: _type,
    loading,
    ...rest
  }: {
    children: React.ReactNode;
    submit?: boolean;
    fullWidth?: boolean;
    disabled?: boolean;
    type?: string;
    onClick?: () => void;
    loading?: boolean;
    [key: string]: unknown;
  }) => (
    <button type={submit ? 'submit' : 'button'} data-loading={loading ? 'true' : undefined} {...rest}>
      {children}
    </button>
  );
  return { default: BpkButton, BUTTON_TYPES };
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
  surfaceHeroDay: 'rgb(0, 98, 227)',
  surfaceDefaultDay: 'rgb(255, 255, 255)',
  textOnDarkDay: 'rgb(255, 255, 255)',
}));

describe('JoinPage', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('shows spinner while loading room info', () => {
    // fetch never resolves, so checking stays true
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise(() => {}),
    );

    render(<JoinPage />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows not-found state with emoji and "Create a new room" button', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      status: 404,
      json: () => Promise.resolve({}),
    } as Response);

    render(<JoinPage />);

    // Wait for the not-found state to render
    const heading = await screen.findByText('Room not found');
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H2');

    expect(screen.getByText('😕')).toBeInTheDocument();

    const createButton = screen.getByRole('button', { name: 'Create a new room' });
    expect(createButton).toBeInTheDocument();
  });

  it('renders form with name input and label after room loads', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      status: 200,
      json: () => Promise.resolve({ name: 'Test Room' }),
    } as Response);

    render(<JoinPage />);

    // Wait for the form to render
    const nameInput = await screen.findByPlaceholderText('Bob');
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveAttribute('id', 'name');

    const nameLabel = screen.getByText('Your name');
    expect(nameLabel.tagName).toBe('LABEL');
    expect(nameLabel).toHaveAttribute('for', 'name');
  });

  it('submit button is disabled when name is empty', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      status: 200,
      json: () => Promise.resolve({ name: 'Test Room' }),
    } as Response);

    render(<JoinPage />);

    const button = await screen.findByRole('button', { name: 'Join Room' });
    expect(button).toBeDisabled();
  });

  it('submit button is enabled when name has a value', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      status: 200,
      json: () => Promise.resolve({ name: 'Test Room' }),
    } as Response);

    render(<JoinPage />);

    const nameInput = await screen.findByPlaceholderText('Bob');
    fireEvent.change(nameInput, { target: { value: 'Alice' } });

    const button = screen.getByRole('button', { name: 'Join Room' });
    expect(button).not.toBeDisabled();
  });

  it('button always shows "Join Room" text (no text swap)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      status: 200,
      json: () => Promise.resolve({ name: 'Test Room' }),
    } as Response);

    render(<JoinPage />);

    const button = await screen.findByRole('button', { name: 'Join Room' });
    expect(button).toBeInTheDocument();
    expect(screen.queryByText('Joining...')).not.toBeInTheDocument();
  });

  it('name input has valid=null before being touched', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      status: 200,
      json: () => Promise.resolve({ name: 'Test Room' }),
    } as Response);

    render(<JoinPage />);
    const nameInput = await screen.findByPlaceholderText('Bob');
    expect(nameInput).toHaveAttribute('data-valid', 'null');
  });

  it('name input shows valid=false after blur when empty', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      status: 200,
      json: () => Promise.resolve({ name: 'Test Room' }),
    } as Response);

    render(<JoinPage />);
    const nameInput = await screen.findByPlaceholderText('Bob');
    fireEvent.blur(nameInput);
    expect(nameInput).toHaveAttribute('data-valid', 'false');
  });

  it('name input shows valid=true after blur when filled', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      status: 200,
      json: () => Promise.resolve({ name: 'Test Room' }),
    } as Response);

    render(<JoinPage />);
    const nameInput = await screen.findByPlaceholderText('Bob');
    fireEvent.change(nameInput, { target: { value: 'Alice' } });
    fireEvent.blur(nameInput);
    expect(nameInput).toHaveAttribute('data-valid', 'true');
  });

  it('navigates to home when "Create a new room" is clicked', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      status: 404,
      json: () => Promise.resolve({}),
    } as Response);

    render(<JoinPage />);

    const createButton = await screen.findByRole('button', { name: 'Create a new room' });
    fireEvent.click(createButton);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
