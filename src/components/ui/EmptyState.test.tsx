import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="Title" description="Description text" />);
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<EmptyState title="Title" />);
    expect(screen.queryByText('Description text')).not.toBeInTheDocument();
  });

  it('renders icon when provided and not muted', () => {
    const icon = <span data-testid="test-icon">Icon</span>;
    render(<EmptyState title="Title" icon={icon} />);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('does not render icon when muted', () => {
    const icon = <span data-testid="test-icon">Icon</span>;
    render(<EmptyState title="Title" icon={icon} muted />);
    expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
  });

  it('renders action when provided', () => {
    const action = <button data-testid="action-button">Action</button>;
    render(<EmptyState title="Title" action={action} />);
    expect(screen.getByTestId('action-button')).toBeInTheDocument();
  });

  it('applies muted styling when muted prop is true', () => {
    const { container } = render(<EmptyState title="Title" muted />);
    const mutedContent = container.querySelector('.text-text-muted\\/50')!;
    expect(mutedContent).not.toBeNull();
    expect(mutedContent.textContent).toContain('Title');
  });

  it('applies custom className', () => {
    const { container } = render(<EmptyState title="Title" className="custom-class" />);
    const emptyState = container.firstChild as HTMLElement;
    expect(emptyState.className).toContain('custom-class');
  });

  it('renders title in muted mode', () => {
    render(<EmptyState title="Muted title" muted />);
    expect(screen.getByText('Muted title')).toBeInTheDocument();
  });

  it('renders description in muted mode when provided', () => {
    render(<EmptyState title="Title" description="Muted description" muted />);
    expect(screen.getByText('Muted description')).toBeInTheDocument();
  });
});
