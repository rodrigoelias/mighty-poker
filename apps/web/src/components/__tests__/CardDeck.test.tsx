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
    const feedbackText = screen.getByText(/You selected/).closest('p');
    expect(feedbackText).toHaveTextContent('8');
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
