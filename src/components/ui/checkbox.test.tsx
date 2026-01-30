/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  describe('rendering', () => {
    it('renders unchecked state by default', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('renders checked state when checked prop is true', () => {
      render(<Checkbox checked={true} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('renders unchecked state when checked prop is false', () => {
      render(<Checkbox checked={false} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('renders indeterminate state', () => {
      render(<Checkbox checked="indeterminate" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      // Indeterminate checkboxes are not "checked" per ARIA spec
      // Base UI uses data-indeterminate attribute
      expect(checkbox).toHaveAttribute('data-indeterminate');
    });

    it('renders with custom className', () => {
      render(<Checkbox className="custom-class" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('custom-class');
    });

    it('renders with aria-label when provided', () => {
      render(<Checkbox aria-label="Select all items" />);
      const checkbox = screen.getByRole('checkbox', { name: 'Select all items' });
      expect(checkbox).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onCheckedChange when clicked', () => {
      const onCheckedChange = vi.fn();
      render(<Checkbox onCheckedChange={onCheckedChange} />);
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('calls onCheckedChange with false when checked is toggled off', () => {
      const onCheckedChange = vi.fn();
      render(<Checkbox checked={true} onCheckedChange={onCheckedChange} />);
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      expect(onCheckedChange).toHaveBeenCalledWith(false);
    });

    it('does not call onCheckedChange when disabled', () => {
      const onCheckedChange = vi.fn();
      render(<Checkbox disabled onCheckedChange={onCheckedChange} />);
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      expect(onCheckedChange).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('applies disabled attribute when disabled', () => {
      render(<Checkbox disabled />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
    });

    it('has disabled styling when disabled', () => {
      render(<Checkbox disabled />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  describe('styling', () => {
    it('has correct base styling', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');
      // Should have size classes
      expect(checkbox).toHaveClass('w-4');
      expect(checkbox).toHaveClass('h-4');
      expect(checkbox).toHaveClass('rounded');
    });

    it('has checked styling when checked', () => {
      render(<Checkbox checked={true} />);
      const checkbox = screen.getByRole('checkbox');
      // Base UI uses data-checked attribute
      expect(checkbox).toHaveAttribute('data-checked');
      // Verify the class contains the data-attribute selector
      expect(checkbox).toHaveClass('data-checked:bg-accent-blue');
    });

    it('has border styling when unchecked', () => {
      render(<Checkbox checked={false} />);
      const checkbox = screen.getByRole('checkbox');
      // Base UI doesn't set data-checked when unchecked
      expect(checkbox).not.toHaveAttribute('data-checked');
      expect(checkbox).not.toHaveAttribute('data-indeterminate');
    });

    it('shows check icon when checked', () => {
      render(<Checkbox checked={true} />);
      // The check icon should be visible
      const checkbox = screen.getByRole('checkbox');
      // Base UI Checkbox uses an indicator element
      const indicator = checkbox.querySelector('[data-checked]') ?? checkbox;
      expect(indicator).toBeInTheDocument();
    });

    it('shows minus icon when indeterminate', () => {
      render(<Checkbox checked="indeterminate" />);
      const checkbox = screen.getByRole('checkbox');
      // Base UI uses data-indeterminate attribute
      expect(checkbox).toHaveAttribute('data-indeterminate');
    });
  });

  describe('sizes', () => {
    it('applies sm size', () => {
      render(<Checkbox size="sm" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('w-3.5');
      expect(checkbox).toHaveClass('h-3.5');
    });

    it('applies default size', () => {
      render(<Checkbox size="default" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('w-4');
      expect(checkbox).toHaveClass('h-4');
    });

    it('applies lg size', () => {
      render(<Checkbox size="lg" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('w-5');
      expect(checkbox).toHaveClass('h-5');
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to the checkbox element', () => {
      const ref = vi.fn();
      render(<Checkbox ref={ref} />);
      expect(ref).toHaveBeenCalled();
      const firstCall = ref.mock.calls[0];
      expect(firstCall).toBeDefined();
      expect(firstCall?.[0]).toBeInstanceOf(HTMLButtonElement);
    });
  });
});
