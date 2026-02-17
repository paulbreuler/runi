/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ActionButtons } from './ActionButtons';

describe('ActionButtons', () => {
  const defaultProps = {
    onCode: vi.fn(),
    onDocs: vi.fn(),
    onSave: vi.fn(),
    onHistory: vi.fn(),
  };

  it('renders all action buttons with correct icons', () => {
    render(<ActionButtons {...defaultProps} />);

    expect(screen.getByTestId('action-code')).toBeInTheDocument();
    expect(screen.getByTestId('action-docs')).toBeInTheDocument();
    expect(screen.getByTestId('action-save')).toBeInTheDocument();
    expect(screen.getByTestId('action-history')).toBeInTheDocument();
  });

  it('disables Code button when no URL is provided', () => {
    render(<ActionButtons {...defaultProps} hasUrl={false} />);

    const codeButton = screen.getByTestId('action-code');
    expect(codeButton).toBeDisabled();
  });

  it('enables Code button when URL is provided', () => {
    render(<ActionButtons {...defaultProps} hasUrl={true} />);

    const codeButton = screen.getByTestId('action-code');
    expect(codeButton).toBeEnabled();
  });

  it('shows dirty indicator on Save button when isDirty is true', () => {
    render(<ActionButtons {...defaultProps} isDirty={true} />);

    const dirtyIndicator = screen.getByTestId('save-dirty-indicator');
    expect(dirtyIndicator).toBeInTheDocument();
  });

  it('does not show dirty indicator on Save button when isDirty is false', () => {
    render(<ActionButtons {...defaultProps} isDirty={false} />);

    const dirtyIndicator = screen.queryByTestId('save-dirty-indicator');
    expect(dirtyIndicator).not.toBeInTheDocument();
  });

  it('shows count badge on History button when count is provided', () => {
    render(<ActionButtons {...defaultProps} historyCount={5} />);

    const badge = screen.getByTestId('history-count-badge');
    expect(badge).toHaveTextContent('5');
  });

  it('does not show count badge on History button when count is 0', () => {
    render(<ActionButtons {...defaultProps} historyCount={0} />);

    const badge = screen.queryByTestId('history-count-badge');
    expect(badge).not.toBeInTheDocument();
  });

  it('calls onCode when Code button is clicked', async () => {
    const user = userEvent.setup();
    render(<ActionButtons {...defaultProps} hasUrl={true} />);

    const codeButton = screen.getByTestId('action-code');
    await user.click(codeButton);

    expect(defaultProps.onCode).toHaveBeenCalledOnce();
  });

  it('calls onDocs when Docs button is clicked', async () => {
    const user = userEvent.setup();
    render(<ActionButtons {...defaultProps} />);

    const docsButton = screen.getByTestId('action-docs');
    await user.click(docsButton);

    expect(defaultProps.onDocs).toHaveBeenCalledOnce();
  });

  it('calls onSave when Save button is clicked', async () => {
    const user = userEvent.setup();
    render(<ActionButtons {...defaultProps} />);

    const saveButton = screen.getByTestId('action-save');
    await user.click(saveButton);

    expect(defaultProps.onSave).toHaveBeenCalledOnce();
  });

  it('calls onHistory when History button is clicked', async () => {
    const user = userEvent.setup();
    render(<ActionButtons {...defaultProps} />);

    const historyButton = screen.getByTestId('action-history');
    await user.click(historyButton);

    expect(defaultProps.onHistory).toHaveBeenCalledOnce();
  });

  it('all buttons have aria-label attributes', () => {
    render(<ActionButtons {...defaultProps} />);

    expect(screen.getByTestId('action-code')).toHaveAttribute('aria-label');
    expect(screen.getByTestId('action-docs')).toHaveAttribute('aria-label');
    expect(screen.getByTestId('action-save')).toHaveAttribute('aria-label');
    expect(screen.getByTestId('action-history')).toHaveAttribute('aria-label');
  });

  it('applies muted color by default', () => {
    render(<ActionButtons {...defaultProps} />);

    const codeButton = screen.getByTestId('action-code');
    expect(codeButton).toHaveClass('text-text-muted');
  });

  it('applies focus ring classes for keyboard accessibility', () => {
    render(<ActionButtons {...defaultProps} />);

    const codeButton = screen.getByTestId('action-code');
    // Check for focus-visible class (part of focusRingClasses)
    expect(codeButton.className).toContain('focus-visible');
  });
});
