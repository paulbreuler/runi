import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  it('renders sidebar with proper structure', () => {
    render(<Sidebar />);
    
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toBeInTheDocument();
  });

  it('has Collections drawer section', () => {
    render(<Sidebar />);
    
    expect(screen.getByText('Collections')).toBeInTheDocument();
    expect(screen.getByTestId('collections-drawer')).toBeInTheDocument();
  });

  it('has History drawer section', () => {
    render(<Sidebar />);
    
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByTestId('history-drawer')).toBeInTheDocument();
  });

  it('drawer sections are collapsible', () => {
    render(<Sidebar />);
    
    // Collections drawer should be open by default
    expect(screen.getByText('No collections yet')).toBeInTheDocument();
    
    // Click to collapse
    const collectionsButton = screen.getByText('Collections').closest('button');
    fireEvent.click(collectionsButton!);
    
    // Content should be hidden - check aria-expanded
    expect(collectionsButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('displays empty states for collections', () => {
    render(<Sidebar />);
    
    expect(screen.getByText('No collections yet')).toBeInTheDocument();
  });

  it('displays empty states for history', () => {
    render(<Sidebar />);
    
    expect(screen.getByText('No history yet')).toBeInTheDocument();
  });

  it('has proper sidebar width', () => {
    render(<Sidebar />);
    
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveClass('w-64');
  });

  it('has proper background styling', () => {
    render(<Sidebar />);
    
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveClass('bg-bg-surface');
  });

  it('drawer headers have uppercase styling', () => {
    render(<Sidebar />);
    
    const collectionsTitle = screen.getByText('Collections');
    expect(collectionsTitle).toHaveClass('uppercase');
    expect(collectionsTitle).toHaveClass('tracking-wider');
  });
});
