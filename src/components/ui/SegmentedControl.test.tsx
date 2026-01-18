import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { SegmentedControl } from './SegmentedControl';

const defaultOptions = [
  { value: 'all', label: 'All' },
  { value: 'error', label: 'Errors' },
  { value: 'warn', label: 'Warnings' },
];

describe('SegmentedControl', () => {
  describe('rendering', () => {
    it('renders all options as buttons', () => {
      render(
        <SegmentedControl
          value="all"
          onValueChange={() => {}}
          options={defaultOptions}
          aria-label="Filter by level"
        />
      );

      expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /errors/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /warnings/i })).toBeInTheDocument();
    });

    it('renders as a group with proper aria-label', () => {
      render(
        <SegmentedControl
          value="all"
          onValueChange={() => {}}
          options={defaultOptions}
          aria-label="Filter by level"
        />
      );

      const group = screen.getByRole('group', { name: /filter by level/i });
      expect(group).toBeInTheDocument();
    });

    it('marks selected option with aria-pressed', () => {
      render(
        <SegmentedControl
          value="error"
          onValueChange={() => {}}
          options={defaultOptions}
          aria-label="Filter by level"
        />
      );

      expect(screen.getByRole('button', { name: /errors/i })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      expect(screen.getByRole('button', { name: /all/i })).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('interaction', () => {
    it('calls onValueChange when clicking an unselected option', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <SegmentedControl
          value="all"
          onValueChange={handleChange}
          options={defaultOptions}
          aria-label="Filter by level"
        />
      );

      await user.click(screen.getByRole('button', { name: /errors/i }));
      expect(handleChange).toHaveBeenCalledWith('error');
    });

    it('calls onValueChange with empty string when clicking selected option with allowEmpty', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <SegmentedControl
          value="error"
          onValueChange={handleChange}
          options={defaultOptions}
          allowEmpty
          aria-label="Filter by level"
        />
      );

      await user.click(screen.getByRole('button', { name: /errors/i }));
      expect(handleChange).toHaveBeenCalledWith('');
    });

    it('does not deselect when clicking selected option without allowEmpty', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <SegmentedControl
          value="error"
          onValueChange={handleChange}
          options={defaultOptions}
          aria-label="Filter by level"
        />
      );

      await user.click(screen.getByRole('button', { name: /errors/i }));
      expect(handleChange).toHaveBeenCalledWith('error');
    });

    it('does not call onValueChange when clicking a disabled option', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <SegmentedControl
          value="all"
          onValueChange={handleChange}
          options={[
            { value: 'all', label: 'All' },
            { value: 'error', label: 'Errors', disabled: true },
          ]}
          aria-label="Filter by level"
        />
      );

      const errorButton = screen.getByRole('button', { name: /errors/i });
      await user.click(errorButton);
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('does not call onValueChange when entire control is disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <SegmentedControl
          value="all"
          onValueChange={handleChange}
          options={defaultOptions}
          disabled
          aria-label="Filter by level"
        />
      );

      await user.click(screen.getByRole('button', { name: /errors/i }));
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('icons', () => {
    it('renders icons when provided', () => {
      render(
        <SegmentedControl
          value="all"
          onValueChange={() => {}}
          options={[
            { value: 'error', label: 'Errors', icon: <AlertCircle data-testid="error-icon" /> },
            { value: 'warn', label: 'Warnings', icon: <AlertTriangle data-testid="warn-icon" /> },
          ]}
          aria-label="Filter by level"
        />
      );

      expect(screen.getByTestId('error-icon')).toBeInTheDocument();
      expect(screen.getByTestId('warn-icon')).toBeInTheDocument();
    });
  });

  describe('badges', () => {
    it('renders badge count when provided', () => {
      render(
        <SegmentedControl
          value="all"
          onValueChange={() => {}}
          options={[
            { value: 'all', label: 'All' },
            { value: 'error', label: 'Errors', badge: 5 },
          ]}
          aria-label="Filter by level"
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('does not render badge when count is 0', () => {
      render(
        <SegmentedControl
          value="all"
          onValueChange={() => {}}
          options={[
            { value: 'all', label: 'All' },
            { value: 'error', label: 'Errors', badge: 0 },
          ]}
          aria-label="Filter by level"
        />
      );

      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('caps badge display at maxBadgeCount', () => {
      render(
        <SegmentedControl
          value="all"
          onValueChange={() => {}}
          options={[{ value: 'error', label: 'Errors', badge: 150 }]}
          maxBadgeCount={99}
          aria-label="Filter by level"
        />
      );

      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('defaults maxBadgeCount to 99', () => {
      render(
        <SegmentedControl
          value="all"
          onValueChange={() => {}}
          options={[{ value: 'error', label: 'Errors', badge: 150 }]}
          aria-label="Filter by level"
        />
      );

      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });

  describe('displayVariant', () => {
    it('shows labels in full variant', () => {
      render(
        <SegmentedControl
          value="all"
          onValueChange={() => {}}
          options={[{ value: 'error', label: 'Errors', icon: <AlertCircle data-testid="icon" /> }]}
          displayVariant="full"
          aria-label="Filter by level"
        />
      );

      expect(screen.getByText('Errors')).toBeInTheDocument();
    });

    it('shows labels in compact variant', () => {
      render(
        <SegmentedControl
          value="all"
          onValueChange={() => {}}
          options={[{ value: 'error', label: 'Errors', icon: <AlertCircle data-testid="icon" /> }]}
          displayVariant="compact"
          aria-label="Filter by level"
        />
      );

      expect(screen.getByText('Errors')).toBeInTheDocument();
    });

    it('hides labels in icon variant but shows tooltip', () => {
      render(
        <SegmentedControl
          value="all"
          onValueChange={() => {}}
          options={[{ value: 'error', label: 'Errors', icon: <AlertCircle data-testid="icon" /> }]}
          displayVariant="icon"
          aria-label="Filter by level"
        />
      );

      // Label should not be visible (but icon should be)
      expect(screen.queryByText('Errors')).not.toBeInTheDocument();
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      // Button should have title for tooltip
      expect(screen.getByRole('button')).toHaveAttribute('title', 'Errors');
    });

    it('includes badge count in tooltip in icon variant', () => {
      render(
        <SegmentedControl
          value="all"
          onValueChange={() => {}}
          options={[
            { value: 'error', label: 'Errors', icon: <AlertCircle data-testid="icon" />, badge: 5 },
          ]}
          displayVariant="icon"
          aria-label="Filter by level"
        />
      );

      expect(screen.getByRole('button')).toHaveAttribute('title', 'Errors (5)');
    });
  });

  describe('sizes', () => {
    it('applies sm size classes', () => {
      const { container } = render(
        <SegmentedControl
          value="all"
          onValueChange={() => {}}
          options={defaultOptions}
          size="sm"
          aria-label="Filter by level"
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('h-6');
      });
    });

    it('applies md size classes by default', () => {
      const { container } = render(
        <SegmentedControl
          value="all"
          onValueChange={() => {}}
          options={defaultOptions}
          aria-label="Filter by level"
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('h-7');
      });
    });

    it('applies lg size classes', () => {
      const { container } = render(
        <SegmentedControl
          value="all"
          onValueChange={() => {}}
          options={defaultOptions}
          size="lg"
          aria-label="Filter by level"
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('h-8');
      });
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      render(
        <SegmentedControl
          value="all"
          onValueChange={() => {}}
          options={defaultOptions}
          className="custom-class"
          aria-label="Filter by level"
        />
      );

      const group = screen.getByRole('group');
      expect(group).toHaveClass('custom-class');
    });

    it('visually distinguishes selected button', () => {
      render(
        <SegmentedControl
          value="error"
          onValueChange={() => {}}
          options={defaultOptions}
          aria-label="Filter by level"
        />
      );

      const selectedButton = screen.getByRole('button', { name: /errors/i });
      const unselectedButton = screen.getByRole('button', { name: /all/i });

      // Selected should have distinct styling
      expect(selectedButton).toHaveClass('bg-bg-raised');
      expect(unselectedButton).not.toHaveClass('bg-bg-raised');
    });
  });

  describe('keyboard navigation', () => {
    it('allows tab navigation between buttons', async () => {
      const user = userEvent.setup();

      render(
        <SegmentedControl
          value="all"
          onValueChange={() => {}}
          options={defaultOptions}
          aria-label="Filter by level"
        />
      );

      // Tab to first button
      await user.tab();
      expect(screen.getByRole('button', { name: /all/i })).toHaveFocus();

      // Tab to second button
      await user.tab();
      expect(screen.getByRole('button', { name: /errors/i })).toHaveFocus();
    });

    it('activates button on Enter key', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <SegmentedControl
          value="all"
          onValueChange={handleChange}
          options={defaultOptions}
          aria-label="Filter by level"
        />
      );

      // Focus the errors button and press Enter
      const errorsButton = screen.getByRole('button', { name: /errors/i });
      errorsButton.focus();
      await user.keyboard('{Enter}');

      expect(handleChange).toHaveBeenCalledWith('error');
    });

    it('activates button on Space key', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <SegmentedControl
          value="all"
          onValueChange={handleChange}
          options={defaultOptions}
          aria-label="Filter by level"
        />
      );

      // Focus the errors button and press Space
      const errorsButton = screen.getByRole('button', { name: /errors/i });
      errorsButton.focus();
      await user.keyboard(' ');

      expect(handleChange).toHaveBeenCalledWith('error');
    });
  });
});
