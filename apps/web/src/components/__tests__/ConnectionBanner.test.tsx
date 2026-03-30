import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { ConnectionBanner } from '../ConnectionBanner';

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

  return {
    default: BpkInfoBanner,
    ALERT_TYPES,
  };
});

describe('ConnectionBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('does not render when connected', () => {
    render(<ConnectionBanner connected={true} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('does not render immediately on disconnect (debounce)', () => {
    render(<ConnectionBanner connected={false} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders after 500ms of continuous disconnect', () => {
    render(<ConnectionBanner connected={false} />);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
  });

  it('does not render if reconnected during debounce period', () => {
    const { rerender } = render(<ConnectionBanner connected={false} />);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    rerender(<ConnectionBanner connected={true} />);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('has role="status" on the wrapper div', () => {
    render(<ConnectionBanner connected={false} />);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    const wrapper = screen.getByRole('status');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper.tagName).toBe('DIV');
  });

  it('uses warning alert type', () => {
    render(<ConnectionBanner connected={false} />);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    const banner = screen.getByTestId('info-banner');
    expect(banner).toHaveAttribute('data-type', 'warning');
  });

  it('hides banner when reconnected after being shown', () => {
    const { rerender } = render(<ConnectionBanner connected={false} />);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<ConnectionBanner connected={true} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
