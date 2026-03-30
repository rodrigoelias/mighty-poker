import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { CardDeck } from '../CardDeck';

vi.mock('@skyscanner/backpack-web/bpk-component-text', () => {
  const TEXT_STYLES = {
    caption: 'caption',
    bodyDefault: 'body-default',
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
      <Tag data-testid="bpk-text" data-style={props.textStyle} style={props.style} className={props.className}>
        {props.children}
      </Tag>
    );
  };

  return { default: BpkText, TEXT_STYLES };
});

vi.mock('@skyscanner/bpk-foundations-web/tokens/base.es6', () => ({
  corePrimaryDay: 'rgb(5, 32, 60)',
  surfaceDefaultDay: 'rgb(255, 255, 255)',
  surfaceHighlightDay: 'rgb(224, 228, 233)',
  lineDay: 'rgb(193, 199, 207)',
  textPrimaryDay: 'rgb(22, 22, 22)',
  textDisabledDay: 'rgba(0, 0, 0, 0.2)',
  textOnDarkDay: 'rgb(255, 255, 255)',
}));

const defaultProps = {
  deck: ['1', '2', '3', '5', '8'],
  selectedValue: null,
  disabled: false,
  onSelect: vi.fn(),
};

describe('CardDeck', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders all deck values as buttons', () => {
    render(<CardDeck {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
    expect(buttons[0]).toHaveTextContent('1');
    expect(buttons[1]).toHaveTextContent('2');
    expect(buttons[2]).toHaveTextContent('3');
    expect(buttons[3]).toHaveTextContent('5');
    expect(buttons[4]).toHaveTextContent('8');
  });

  it('selected card has aria-pressed=true', () => {
    render(<CardDeck {...defaultProps} selectedValue="3" />);
    const buttons = screen.getAllByRole('button');
    const selectedButton = buttons.find((b) => b.textContent === '3');
    expect(selectedButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('non-selected cards have aria-pressed=false', () => {
    render(<CardDeck {...defaultProps} selectedValue="3" />);
    const buttons = screen.getAllByRole('button');
    const nonSelectedButtons = buttons.filter((b) => b.textContent !== '3');
    nonSelectedButtons.forEach((button) => {
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });
  });

  it('disabled cards are disabled', () => {
    render(<CardDeck {...defaultProps} disabled={true} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('clicking a card calls onSelect with the value', () => {
    const onSelect = vi.fn();
    render(<CardDeck {...defaultProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('5'));
    expect(onSelect).toHaveBeenCalledWith('5');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('selection feedback text shows when a value is selected', () => {
    render(<CardDeck {...defaultProps} selectedValue="8" />);
    expect(screen.getByText(/You selected/)).toBeInTheDocument();
    expect(screen.getByText(/click another card to change/)).toBeInTheDocument();
  });

  it('selection feedback text does not show when no value is selected', () => {
    render(<CardDeck {...defaultProps} selectedValue={null} />);
    expect(screen.queryByText(/click another card to change/)).not.toBeInTheDocument();
  });

  it('renders heading with BpkText caption style', () => {
    render(<CardDeck {...defaultProps} />);
    expect(screen.getByText('Choose your estimate')).toBeInTheDocument();
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Choose your estimate');
  });

  it('applies selected style to selected button', () => {
    render(<CardDeck {...defaultProps} selectedValue="2" />);
    const selectedButton = screen.getAllByRole('button').find((b) => b.textContent === '2');
    expect(selectedButton).toHaveStyle({ backgroundColor: 'rgb(5, 32, 60)', color: 'rgb(255, 255, 255)' });
  });

  it('applies disabled style to disabled buttons', () => {
    render(<CardDeck {...defaultProps} disabled={true} />);
    const button = screen.getAllByRole('button')[0];
    expect(button).toHaveStyle({ backgroundColor: 'rgb(224, 228, 233)' });
  });
});
