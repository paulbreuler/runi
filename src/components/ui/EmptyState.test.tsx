import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmptyState } from './EmptyState';
import { Key } from 'lucide-react';

// Mock useReducedMotion to control animation behavior in tests
vi.mock('motion/react', async () => {
  const actual = await vi.importActual('motion/react');
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  };
});

describe('EmptyState', () => {
  // Existing tests (backward compatibility)
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
    render(<EmptyState title="Title" icon={icon} variant="muted" />);
    expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
  });

  it('renders action when provided', () => {
    const action = <button data-testid="action-button">Action</button>;
    render(<EmptyState title="Title" action={action} />);
    expect(screen.getByTestId('action-button')).toBeInTheDocument();
  });

  it('applies muted styling when variant is muted', () => {
    const { container } = render(<EmptyState title="Title" variant="muted" />);
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
    render(<EmptyState title="Muted title" variant="muted" />);
    expect(screen.getByText('Muted title')).toBeInTheDocument();
  });

  it('renders description in muted mode when provided', () => {
    render(<EmptyState title="Title" description="Muted description" variant="muted" />);
    expect(screen.getByText('Muted description')).toBeInTheDocument();
  });

  // New tests for variant prop
  describe('variant prop', () => {
    it('defaults to prominent variant', () => {
      const { container } = render(<EmptyState title="Title" />);
      const heading = container.querySelector('h3');
      expect(heading).toBeInTheDocument();
      expect(heading?.textContent).toBe('Title');
    });

    it('renders muted variant correctly', () => {
      const { container } = render(<EmptyState title="Title" variant="muted" />);
      const mutedContent = container.querySelector('.text-text-muted\\/50');
      expect(mutedContent).toBeInTheDocument();
    });

    it('renders prominent variant with icon', () => {
      const icon = <Key data-testid="test-icon" />;
      const { container } = render(<EmptyState title="Title" icon={icon} variant="prominent" />);
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      const heading = container.querySelector('h3');
      expect(heading).toBeInTheDocument();
    });

    it('renders minimal variant without icon or description', () => {
      const { container } = render(
        <EmptyState title="Title" description="Description" icon={<Key />} variant="minimal" />
      );
      // Minimal variant should not show icon or description
      expect(container.querySelector('h3')).not.toBeInTheDocument();
      expect(screen.queryByText('Description')).not.toBeInTheDocument();
    });
  });

  // New tests for size prop
  describe('size prop', () => {
    it('defaults to md size', () => {
      const { container } = render(<EmptyState title="Title" />);
      const heading = container.querySelector('h3');
      expect(heading?.className).toContain('text-2xl');
    });

    it('applies sm size styling', () => {
      const { container } = render(<EmptyState title="Title" size="sm" />);
      const heading = container.querySelector('h3');
      expect(heading?.className).toContain('text-lg');
    });

    it('applies lg size styling', () => {
      const { container } = render(<EmptyState title="Title" size="lg" />);
      const heading = container.querySelector('h3');
      expect(heading?.className).toContain('text-3xl');
    });
  });

  // New tests for children prop
  describe('children prop', () => {
    it('renders children when provided', () => {
      render(
        <EmptyState title="Title">
          <div data-testid="custom-content">Custom content</div>
        </EmptyState>
      );
      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    });

    it('renders children alongside title and description', () => {
      render(
        <EmptyState title="Title" description="Description">
          <button data-testid="custom-action">Custom Action</button>
        </EmptyState>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByTestId('custom-action')).toBeInTheDocument();
    });
  });

  // New tests for accessibility
  describe('accessibility', () => {
    it('has role="status" when ariaLive is set', () => {
      const { container } = render(<EmptyState title="Title" ariaLive="polite" />);
      const statusElement = container.querySelector('[role="status"]');
      expect(statusElement).toBeInTheDocument();
    });

    it('has aria-live="polite" when ariaLive is polite', () => {
      const { container } = render(<EmptyState title="Title" ariaLive="polite" />);
      const statusElement = container.querySelector('[aria-live="polite"]');
      expect(statusElement).toBeInTheDocument();
    });

    it('has aria-live="assertive" when ariaLive is assertive', () => {
      const { container } = render(<EmptyState title="Title" ariaLive="assertive" />);
      const statusElement = container.querySelector('[aria-live="assertive"]');
      expect(statusElement).toBeInTheDocument();
    });

    it('does not have aria-live when ariaLive is off', () => {
      const { container } = render(<EmptyState title="Title" ariaLive="off" />);
      const statusElement = container.querySelector('[aria-live]');
      expect(statusElement).toBeNull();
    });

    it('uses semantic h3 heading by default', () => {
      const { container } = render(<EmptyState title="Title" />);
      const heading = container.querySelector('h3');
      expect(heading).toBeInTheDocument();
      expect(heading?.textContent).toBe('Title');
    });

    it('uses custom heading level when headingLevel is provided', () => {
      const { container } = render(<EmptyState title="Title" headingLevel={2} />);
      const heading = container.querySelector('h2');
      expect(heading).toBeInTheDocument();
      expect(heading?.textContent).toBe('Title');
      expect(container.querySelector('h3')).toBeNull();
    });

    it('uses semantic p tag for description', () => {
      const { container } = render(<EmptyState title="Title" description="Description" />);
      const description = container.querySelector('p');
      expect(description).toBeInTheDocument();
      expect(description?.textContent).toBe('Description');
    });

    it('has aria-label when provided', () => {
      const { container } = render(<EmptyState title="Title" ariaLabel="Custom label" />);
      const element = container.querySelector('[aria-label="Custom label"]');
      expect(element).toBeInTheDocument();
    });

    it('has aria-labelledby linking title when provided', () => {
      const { container } = render(<EmptyState title="Title" ariaLabelledBy="title-id" />);
      const element = container.querySelector('[aria-labelledby="title-id"]');
      expect(element).toBeInTheDocument();
    });

    it('has aria-describedby linking description when provided', () => {
      const { container } = render(
        <EmptyState title="Title" description="Description" ariaDescribedBy="desc-id" />
      );
      const element = container.querySelector('[aria-describedby="desc-id"]');
      expect(element).toBeInTheDocument();
    });

    it('action buttons are keyboard accessible', () => {
      const action = <button data-testid="action-button">Action</button>;
      render(<EmptyState title="Title" action={action} />);
      const button = screen.getByTestId('action-button');
      expect(button.tagName).toBe('BUTTON');
      expect(button).not.toHaveAttribute('tabindex', '-1');
    });
  });

  // New tests for reduced motion
  describe('reduced motion support', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('respects prefers-reduced-motion when useReducedMotion returns true', async () => {
      const { useReducedMotion } = await import('motion/react');
      vi.mocked(useReducedMotion).mockReturnValue(true);

      render(<EmptyState title="Title" />);
      // When reduced motion is enabled, animations should be disabled
      // This is tested by checking that the component still renders correctly
      expect(screen.getByText('Title')).toBeInTheDocument();
    });
  });

  // New tests for icon variants
  describe('icon variants', () => {
    it('renders icon with correct size in prominent variant', () => {
      const icon = <Key data-testid="test-icon" />;
      const { container } = render(<EmptyState title="Title" icon={icon} variant="prominent" />);
      const iconContainer = container.querySelector('[data-testid="test-icon"]')?.parentElement;
      expect(iconContainer).toBeInTheDocument();
    });

    it('does not render icon in muted variant', () => {
      const icon = <Key data-testid="test-icon" />;
      render(<EmptyState title="Title" icon={icon} variant="muted" />);
      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
    });

    it('does not render icon in minimal variant', () => {
      const icon = <Key data-testid="test-icon" />;
      render(<EmptyState title="Title" icon={icon} variant="minimal" />);
      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
    });

    it('icon container has flex items-center justify-center for proper centering', () => {
      const icon = <Key data-testid="test-icon" />;
      const { container } = render(<EmptyState title="Title" icon={icon} variant="prominent" />);
      const iconContainer = container.querySelector('[data-testid="test-icon"]')?.parentElement;
      expect(iconContainer).toHaveClass('flex');
      expect(iconContainer).toHaveClass('items-center');
      expect(iconContainer).toHaveClass('justify-center');
    });

    it('icon container has correct size class for sm size', () => {
      const icon = <Key data-testid="test-icon" />;
      const { container } = render(
        <EmptyState title="Title" icon={icon} variant="prominent" size="sm" />
      );
      const iconContainer = container.querySelector('[data-testid="test-icon"]')?.parentElement;
      expect(iconContainer).toHaveClass('size-8');
    });

    it('icon container has correct size class for md size', () => {
      const icon = <Key data-testid="test-icon" />;
      const { container } = render(
        <EmptyState title="Title" icon={icon} variant="prominent" size="md" />
      );
      const iconContainer = container.querySelector('[data-testid="test-icon"]')?.parentElement;
      expect(iconContainer).toHaveClass('size-12');
    });

    it('icon container has correct size class for lg size', () => {
      const icon = <Key data-testid="test-icon" />;
      const { container } = render(
        <EmptyState title="Title" icon={icon} variant="prominent" size="lg" />
      );
      const iconContainer = container.querySelector('[data-testid="test-icon"]')?.parentElement;
      expect(iconContainer).toHaveClass('size-16');
    });
  });

  // Edge cases
  describe('edge cases', () => {
    it('handles empty string title gracefully', () => {
      render(<EmptyState title="" />);
      const { container } = render(<EmptyState title="" />);
      // Should still render without crashing
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles all props together', () => {
      const icon = <Key data-testid="test-icon" />;
      const action = <button data-testid="action-button">Action</button>;
      render(
        <EmptyState
          title="Title"
          description="Description"
          icon={icon}
          action={action}
          variant="prominent"
          size="lg"
          headingLevel={2}
          ariaLive="polite"
          className="custom-class"
        />
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByTestId('action-button')).toBeInTheDocument();
    });
  });
});
