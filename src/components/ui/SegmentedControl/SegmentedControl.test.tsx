/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { SegmentedControl } from '.';

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

      // className is applied to the outer wrapper (parent of the group element)
      const group = screen.getByRole('group');
      expect(group.parentElement).toHaveClass('custom-class');
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

  describe('tier animation state resets', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('resets badge display after animation settles when going from high tier to low tier', async () => {
      const handleChange = vi.fn();

      // Start with high tier badges
      const highTierOptions = [
        { value: 'all', label: 'All' },
        { value: 'error', label: 'Errors', badge: 9001 },
        { value: 'warn', label: 'Warnings', badge: 100 },
      ];

      const { rerender } = render(
        <SegmentedControl
          value="all"
          onValueChange={handleChange}
          options={highTierOptions}
          aria-label="Filter by level"
        />
      );

      // Badge should show "9K+" for high counts
      expect(screen.getByText('9K+')).toBeInTheDocument();

      // Change to low tier
      const lowTierOptions = [
        { value: 'all', label: 'All' },
        { value: 'error', label: 'Errors', badge: 5 },
        { value: 'warn', label: 'Warnings', badge: 3 },
      ];

      rerender(
        <SegmentedControl
          value="all"
          onValueChange={handleChange}
          options={lowTierOptions}
          aria-label="Filter by level"
        />
      );

      // Badge should now show normal count
      expect(screen.queryByText('9K+')).not.toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('animates when tier decreases (not just increases)', async () => {
      const handleChange = vi.fn();

      // Start with tier 2 (multiple high badges)
      const tier2Options = [
        { value: 'all', label: 'All' },
        { value: 'error', label: 'Errors', badge: 9001 },
        { value: 'warn', label: 'Warnings', badge: 9002 },
        { value: 'info', label: 'Info', badge: 100 },
      ];

      const { rerender } = render(
        <SegmentedControl
          value="all"
          onValueChange={handleChange}
          options={tier2Options}
          aria-label="Filter by level"
        />
      );

      // Wait for initial animation to settle
      vi.advanceTimersByTime(2500);

      // Reduce to tier 1
      const tier1Options = [
        { value: 'all', label: 'All' },
        { value: 'error', label: 'Errors', badge: 9001 },
        { value: 'warn', label: 'Warnings', badge: 100 },
        { value: 'info', label: 'Info', badge: 50 },
      ];

      rerender(
        <SegmentedControl
          value="all"
          onValueChange={handleChange}
          options={tier1Options}
          aria-label="Filter by level"
        />
      );

      // Animation should still trigger (not instant reset)
      // After full animation cycle, should be back to idle
      vi.advanceTimersByTime(2500);

      // Component should render without errors and show correct badges
      expect(screen.getByText('9K+')).toBeInTheDocument();
      expect(screen.getByText('99+')).toBeInTheDocument(); // 100 capped at 99
    });

    it('properly resets colors after tier 5+ animation completes', async () => {
      const handleChange = vi.fn();

      // Start at tier 5+
      const advancedTierOptions = [
        { value: 'error', label: 'Errors', badge: 10000 },
        { value: 'warn', label: 'Warnings', badge: 10000 },
        { value: 'info', label: 'Info', badge: 10000 },
        { value: 'debug', label: 'Debug', badge: 10000 },
      ];

      const { rerender } = render(
        <SegmentedControl
          value="error"
          onValueChange={handleChange}
          options={advancedTierOptions}
          aria-label="Filter by level"
        />
      );

      // Wait for tier 5+ animation to complete (includes finale)
      vi.advanceTimersByTime(3500);

      // Reduce to tier 0
      const tier0Options = [
        { value: 'error', label: 'Errors', badge: 5 },
        { value: 'warn', label: 'Warnings', badge: 3 },
        { value: 'info', label: 'Info', badge: 2 },
        { value: 'debug', label: 'Debug', badge: 1 },
      ];

      rerender(
        <SegmentedControl
          value="error"
          onValueChange={handleChange}
          options={tier0Options}
          aria-label="Filter by level"
        />
      );

      // Should immediately reset to idle (tier 0 = instant reset)
      // All badges should show their actual counts
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });
});
