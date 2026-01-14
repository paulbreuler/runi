import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Sidebar from './Sidebar.svelte';

describe('Sidebar', () => {
  it('renders with data-testid attribute', () => {
    render(Sidebar);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('displays Collections section', () => {
    render(Sidebar);
    expect(screen.getByText('Collections')).toBeInTheDocument();
    expect(screen.getByText('No collections yet')).toBeInTheDocument();
  });

  it('displays History section', () => {
    render(Sidebar);
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('No history yet')).toBeInTheDocument();
  });

  it('has correct width class', () => {
    render(Sidebar);
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveClass('w-64');
  });

  it('has transition classes for smooth animation', () => {
    render(Sidebar);
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveClass('transition-all');
    expect(sidebar).toHaveClass('duration-200');
  });

  it('has border and background styling', () => {
    render(Sidebar);
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveClass('border-r');
    expect(sidebar).toHaveClass('border-border');
  });

  it('renders as aside element for accessibility', () => {
    render(Sidebar);
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar.tagName.toLowerCase()).toBe('aside');
  });
});
