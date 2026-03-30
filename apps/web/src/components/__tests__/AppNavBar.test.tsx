import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@skyscanner/backpack-web/bpk-component-navigation-bar', () => {
  const BpkNavigationBar = (props: {
    id: string;
    title: React.ReactNode;
    barStyle?: string;
    leadingButton?: React.ReactNode;
    className?: string;
  }) => (
    <nav data-testid="nav-bar" data-bar-style={props.barStyle} id={props.id}>
      {props.leadingButton && <span data-testid="leading-button">{props.leadingButton}</span>}
      <span data-testid="nav-title">{props.title}</span>
    </nav>
  );
  return {
    default: BpkNavigationBar,
    BAR_STYLES: { default: 'default', onDark: 'on-dark' },
  };
});

import { AppNavBar } from '../AppNavBar';

describe('AppNavBar', () => {
  it('renders with onDark bar style', () => {
    render(<AppNavBar />);
    const nav = screen.getByTestId('nav-bar');
    expect(nav).toHaveAttribute('data-bar-style', 'on-dark');
  });

  it('renders "Mighty Poker" as the title', () => {
    render(<AppNavBar />);
    expect(screen.getByTestId('nav-title')).toHaveTextContent('Mighty Poker');
  });

  it('renders the spade icon as leading button', () => {
    render(<AppNavBar />);
    expect(screen.getByTestId('leading-button')).toBeInTheDocument();
  });

  it('has id="main-nav"', () => {
    render(<AppNavBar />);
    expect(screen.getByTestId('nav-bar')).toHaveAttribute('id', 'main-nav');
  });
});
