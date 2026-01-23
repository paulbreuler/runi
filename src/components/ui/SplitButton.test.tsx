/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Download, Copy } from 'lucide-react';
import { SplitButton } from './SplitButton';

describe('SplitButton', () => {
  const defaultProps = {
    label: 'Save',
    onClick: vi.fn(),
    items: [
      { id: 'save', label: 'Save', onClick: vi.fn() },
      { id: 'save-as', label: 'Save As...', onClick: vi.fn() },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the primary button with label', () => {
      render(<SplitButton {...defaultProps} />);

      const primaryButton = screen.getByRole('button', { name: /save/i });
      expect(primaryButton).toBeInTheDocument();
    });

    it('renders an icon when provided', () => {
      render(<SplitButton {...defaultProps} icon={<Download data-testid="icon" />} />);

      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('renders the dropdown trigger button', () => {
      render(<SplitButton {...defaultProps} />);

      const triggerButton = screen.getByRole('button', { name: /more options/i });
      expect(triggerButton).toBeInTheDocument();
      expect(triggerButton).toHaveAttribute('aria-haspopup', 'menu');
    });

    it('has a visual separator between primary and dropdown', () => {
      const { container } = render(<SplitButton {...defaultProps} />);

      // Look for the separator element (it has aria-hidden)
      const separator = container.querySelector('[aria-hidden="true"]');
      expect(separator).toBeInTheDocument();
    });
  });

  describe('primary button interaction', () => {
    it('calls onClick when primary button is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<SplitButton {...defaultProps} onClick={handleClick} />);

      const primaryButton = screen.getByRole('button', { name: /save/i });
      await user.click(primaryButton);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<SplitButton {...defaultProps} onClick={handleClick} disabled />);

      const primaryButton = screen.getByRole('button', { name: /save/i });
      await user.click(primaryButton);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('has disabled attribute when disabled prop is true', () => {
      render(<SplitButton {...defaultProps} disabled />);

      const primaryButton = screen.getByRole('button', { name: /save/i });
      expect(primaryButton).toBeDisabled();
    });
  });

  describe('dropdown menu', () => {
    it('opens dropdown when trigger is clicked', async () => {
      const user = userEvent.setup();

      render(<SplitButton {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /more options/i });
      await user.click(trigger);

      // Dropdown items should be visible
      expect(screen.getByRole('menuitem', { name: /save$/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /save as/i })).toBeInTheDocument();
    });

    it('calls item onClick when a menu item is clicked', async () => {
      const user = userEvent.setup();
      const handleSaveAs = vi.fn();

      render(
        <SplitButton
          {...defaultProps}
          items={[
            { id: 'save', label: 'Save', onClick: vi.fn() },
            { id: 'save-as', label: 'Save As...', onClick: handleSaveAs },
          ]}
        />
      );

      const trigger = screen.getByRole('button', { name: /more options/i });
      await user.click(trigger);

      const saveAsItem = screen.getByRole('menuitem', { name: /save as/i });
      await user.click(saveAsItem);

      expect(handleSaveAs).toHaveBeenCalledTimes(1);
    });

    it('closes dropdown after clicking a menu item', async () => {
      const user = userEvent.setup();

      render(<SplitButton {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /more options/i });
      await user.click(trigger);

      const saveItem = screen.getByRole('menuitem', { name: /save$/i });
      await user.click(saveItem);

      // Dropdown should be closed
      expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
    });

    it('renders icons in menu items when provided', async () => {
      const user = userEvent.setup();

      render(
        <SplitButton
          {...defaultProps}
          items={[
            { id: 'copy', label: 'Copy', icon: <Copy data-testid="copy-icon" />, onClick: vi.fn() },
          ]}
        />
      );

      const trigger = screen.getByRole('button', { name: /more options/i });
      await user.click(trigger);

      expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
    });

    it('renders separators between items when specified', async () => {
      const user = userEvent.setup();

      render(
        <SplitButton
          {...defaultProps}
          items={[
            { id: 'save', label: 'Save', onClick: vi.fn() },
            { type: 'separator' },
            { id: 'delete', label: 'Delete', onClick: vi.fn() },
          ]}
        />
      );

      const trigger = screen.getByRole('button', { name: /more options/i });
      await user.click(trigger);

      // Should have a separator element
      expect(screen.getByRole('separator')).toBeInTheDocument();
    });

    it('disables individual menu items when item.disabled is true', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <SplitButton
          {...defaultProps}
          items={[{ id: 'save', label: 'Save', onClick: handleClick, disabled: true }]}
        />
      );

      const trigger = screen.getByRole('button', { name: /more options/i });
      await user.click(trigger);

      const saveItem = screen.getByRole('menuitem', { name: /save$/i });
      expect(saveItem).toHaveAttribute('data-disabled');
    });

    it('applies destructive styling when item.destructive is true', async () => {
      const user = userEvent.setup();

      render(
        <SplitButton
          {...defaultProps}
          items={[{ id: 'delete', label: 'Delete', onClick: vi.fn(), destructive: true }]}
        />
      );

      const trigger = screen.getByRole('button', { name: /more options/i });
      await user.click(trigger);

      const deleteItem = screen.getByRole('menuitem', { name: /delete/i });
      expect(deleteItem).toHaveClass('text-signal-error');
    });
  });

  describe('keyboard navigation', () => {
    it('opens dropdown on Enter key', async () => {
      const user = userEvent.setup();

      render(<SplitButton {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /more options/i });
      trigger.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByRole('menuitem', { name: /save$/i })).toBeInTheDocument();
    });

    it('closes dropdown on Escape key', async () => {
      const user = userEvent.setup();

      render(<SplitButton {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /more options/i });
      await user.click(trigger);

      await user.keyboard('{Escape}');

      expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('applies default variant styling', () => {
      render(<SplitButton {...defaultProps} variant="default" />);

      const primaryButton = screen.getByRole('button', { name: /save/i });
      expect(primaryButton).toHaveClass('bg-accent-blue');
    });

    it('applies outline variant styling', () => {
      render(<SplitButton {...defaultProps} variant="outline" />);

      const primaryButton = screen.getByRole('button', { name: /save/i });
      expect(primaryButton).toHaveClass('border');
    });

    it('applies ghost variant styling', () => {
      render(<SplitButton {...defaultProps} variant="ghost" />);

      const primaryButton = screen.getByRole('button', { name: /save/i });
      expect(primaryButton).toHaveClass('bg-transparent');
    });

    it('applies destructive variant styling', () => {
      render(<SplitButton {...defaultProps} variant="destructive" />);

      const primaryButton = screen.getByRole('button', { name: /save/i });
      expect(primaryButton).toHaveClass('bg-signal-error');
    });
  });

  describe('sizes', () => {
    it('applies xs size styling', () => {
      render(<SplitButton {...defaultProps} size="xs" />);

      const primaryButton = screen.getByRole('button', { name: /save/i });
      expect(primaryButton).toHaveClass('h-7');
    });

    it('applies sm size styling', () => {
      render(<SplitButton {...defaultProps} size="sm" />);

      const primaryButton = screen.getByRole('button', { name: /save/i });
      expect(primaryButton).toHaveClass('h-8');
    });

    it('applies default size styling', () => {
      render(<SplitButton {...defaultProps} size="default" />);

      const primaryButton = screen.getByRole('button', { name: /save/i });
      expect(primaryButton).toHaveClass('h-9');
    });
  });

  describe('accessibility', () => {
    it('dropdown trigger has aria-expanded attribute', async () => {
      const user = userEvent.setup();

      render(<SplitButton {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /more options/i });
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      await user.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('supports custom dropdown aria-label', () => {
      render(<SplitButton {...defaultProps} dropdownAriaLabel="Save options" />);

      const trigger = screen.getByRole('button', { name: /save options/i });
      expect(trigger).toBeInTheDocument();
    });

    it('allows tab navigation to both buttons', async () => {
      const user = userEvent.setup();

      render(<SplitButton {...defaultProps} />);

      // Tab to primary button
      await user.tab();
      expect(screen.getByRole('button', { name: /save/i })).toHaveFocus();

      // Tab to dropdown trigger
      await user.tab();
      expect(screen.getByRole('button', { name: /more options/i })).toHaveFocus();
    });
  });
});
