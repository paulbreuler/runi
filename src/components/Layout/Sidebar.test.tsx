import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  it('renders sidebar with proper structure', () => {
    render(<Sidebar />);
    
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toBeInTheDocument();
  });

  it('has Collections section with proper heading', () => {
    render(<Sidebar />);
    
    expect(screen.getByText('Collections')).toBeInTheDocument();
  });

  it('has History section with proper heading', () => {
    render(<Sidebar />);
    
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('has proper typography for section titles', () => {
    render(<Sidebar />);
    
    const collectionsTitle = screen.getByText('Collections');
    expect(collectionsTitle).toHaveClass('font-semibold');
    expect(collectionsTitle).toHaveClass('text-base');
    expect(collectionsTitle).toHaveClass('tracking-tight');
  });

  it('shows empty state for collections', () => {
    render(<Sidebar />);
    
    expect(screen.getByText('No collections yet')).toBeInTheDocument();
  });

  it('shows empty state for history', () => {
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

  it('has subtle border styling for zen aesthetic', () => {
    render(<Sidebar />);
    
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveClass('border-r');
    expect(sidebar).toHaveClass('border-border-subtle');
  });
});
