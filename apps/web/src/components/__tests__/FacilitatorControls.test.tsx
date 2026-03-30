import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FacilitatorControls } from '../FacilitatorControls';

vi.mock('@skyscanner/backpack-web/bpk-component-button', () => {
  const BUTTON_TYPES = {
    primary: 'primary',
    primaryOnDark: 'primary-on-dark',
    primaryOnLight: 'primary-on-light',
    secondary: 'secondary',
    secondaryOnDark: 'secondary-on-dark',
    destructive: 'destructive',
    featured: 'featured',
    link: 'link',
    linkOnDark: 'link-on-dark',
  } as const;

  const BpkButton = (props: {
    type?: string;
    onClick?: () => void;
    children?: React.ReactNode;
  }) => (
    <button data-type={props.type} onClick={props.onClick}>
      {props.children}
    </button>
  );

  return {
    default: BpkButton,
    BUTTON_TYPES,
  };
});

describe('FacilitatorControls', () => {
  const defaultProps = {
    onStart: vi.fn(),
    onReveal: vi.fn(),
    onReset: vi.fn(),
  };

  it('shows "Start Voting" button when idle and calls onStart on click', () => {
    render(<FacilitatorControls roundStatus="idle" {...defaultProps} />);

    const button = screen.getByRole('button', { name: 'Start Voting' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('data-type', 'primary');

    fireEvent.click(button);
    expect(defaultProps.onStart).toHaveBeenCalledOnce();
  });

  it('shows "Reveal Votes" button when voting and calls onReveal on click', () => {
    render(<FacilitatorControls roundStatus="voting" {...defaultProps} />);

    const button = screen.getByRole('button', { name: 'Reveal Votes' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('data-type', 'secondary');

    fireEvent.click(button);
    expect(defaultProps.onReveal).toHaveBeenCalledOnce();
  });

  it('shows "New Round" button when revealed and calls onReset on click', () => {
    render(<FacilitatorControls roundStatus="revealed" {...defaultProps} />);

    const button = screen.getByRole('button', { name: 'New Round' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('data-type', 'secondary');

    fireEvent.click(button);
    expect(defaultProps.onReset).toHaveBeenCalledOnce();
  });

  it('does not show buttons for other states', () => {
    render(<FacilitatorControls roundStatus="idle" {...defaultProps} />);

    expect(screen.queryByRole('button', { name: 'Reveal Votes' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New Round' })).not.toBeInTheDocument();
  });
});
