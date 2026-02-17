/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { UrlBar } from './UrlBar';

describe('UrlBar', () => {
  const defaultProps = {
    method: 'GET' as const,
    url: 'https://api.example.com',
    loading: false,
    onMethodChange: vi.fn(),
    onUrlChange: vi.fn(),
    onSend: vi.fn(),
  };

  it('renders inline titlebar layout without outer panel chrome', () => {
    render(<UrlBar {...defaultProps} />);

    // Should not introduce its own panel framing when rendered in titlebar
    const wrapper = screen.getByTestId('url-bar');
    expect(wrapper).toHaveClass('min-w-0');
    expect(wrapper).not.toHaveClass('border-b');
    expect(wrapper).not.toHaveClass('bg-bg-surface');
  });

  it('renders method select with colored text only', () => {
    render(<UrlBar {...defaultProps} />);

    const methodSelect = screen.getByTestId('method-select');
    expect(methodSelect).toBeInTheDocument();
    expect(methodSelect).toHaveClass('font-semibold');
    // Text color based on method, transparent background, list-like hover
    // GET uses method-specific color token
    expect(methodSelect).toHaveClass('text-method-get');
    expect(methodSelect).toHaveClass('bg-transparent');
    expect(methodSelect).toHaveClass('border-0');
  });

  it('renders URL input with proper placeholder', () => {
    render(<UrlBar {...defaultProps} url="" />);

    const urlInput = screen.getByTestId('url-input');
    expect(urlInput).toBeInTheDocument();
    expect(urlInput).toHaveAttribute('placeholder', 'Enter request URL...');
  });

  it('renders URL input with proper styling', () => {
    render(<UrlBar {...defaultProps} url="" />);

    const urlInput = screen.getByTestId('url-input');
    // URL input remains borderless; the full control row carries the border
    expect(urlInput).toHaveClass('border-0');
    expect(urlInput).toHaveClass('bg-transparent');
  });

  it('applies muted composite focus state on command bar', () => {
    render(<UrlBar {...defaultProps} url="" />);
    const control = screen.getByTestId('url-bar');
    expect(control.className).toContain('focus-within:ring-1');
    expect(control.className).toContain('focus-within:ring-[color:var(--color-border-default)]');
    expect(control.className).toContain('focus-within:border-border-default');
  });

  it('applies primary focus states to inner controls', () => {
    render(<UrlBar {...defaultProps} url="" />);

    const methodSelect = screen.getByTestId('method-select');
    const urlInput = screen.getByTestId('url-input');
    const sendButton = screen.getByTestId('send-button');

    expect(methodSelect.className).toContain('focus-visible:ring-2');
    expect(methodSelect.className).toContain('focus-visible:ring-[color:var(--color-ring)]');
    expect(methodSelect.className).toContain('focus-visible:!ring-offset-0');
    expect(methodSelect.className).toContain('focus-visible:ring-inset');
    expect(methodSelect.className).toContain('focus-visible:z-10');

    expect(urlInput.className).toContain('focus-visible:ring-2');
    expect(urlInput.className).toContain('focus-visible:ring-[color:var(--color-ring)]');
    expect(urlInput.className).toContain('focus-visible:!ring-offset-0');
    expect(urlInput.className).toContain('focus-visible:ring-inset');
    expect(urlInput.className).toContain('focus-visible:z-10');

    expect(sendButton.className).toContain('focus-visible:ring-2');
    expect(sendButton.className).toContain('focus-visible:ring-[color:var(--color-ring)]');
    expect(sendButton.className).toContain('focus-visible:!ring-offset-0');
    expect(sendButton.className).toContain('focus-visible:ring-inset');
    expect(sendButton.className).toContain('focus-visible:z-10');
    // Send button uses composite focus item classes (no text-accent-blue on focus)
  });

  it('renders send button with proper styling', () => {
    render(<UrlBar {...defaultProps} />);

    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).toBeInTheDocument();
    expect(sendButton).toHaveTextContent('Send');
    // Send button is a ghost button within the composite bar
    expect(sendButton).toHaveClass('text-text-muted');
  });

  it('shows loading state on send button', () => {
    render(<UrlBar {...defaultProps} loading={true} />);

    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).toHaveTextContent('Sending');
    expect(sendButton).toBeDisabled();
  });

  it('disables send button when URL is empty', () => {
    render(<UrlBar {...defaultProps} url="" />);

    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).toBeDisabled();
  });

  it('enables send button when URL is valid', () => {
    render(<UrlBar {...defaultProps} url="https://api.example.com" />);

    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).not.toBeDisabled();
  });

  it('calls onSend when send button is clicked', async () => {
    const onSend = vi.fn();
    render(<UrlBar {...defaultProps} onSend={onSend} />);

    await userEvent.click(screen.getByTestId('send-button'));
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('calls onSend when Enter is pressed in URL input', async () => {
    const onSend = vi.fn();
    render(<UrlBar {...defaultProps} onSend={onSend} />);

    const urlInput = screen.getByTestId('url-input');
    await userEvent.type(urlInput, '{Enter}');
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('does not call onSend on Enter when URL is empty', async () => {
    const onSend = vi.fn();
    render(<UrlBar {...defaultProps} url="" onSend={onSend} />);

    const urlInput = screen.getByTestId('url-input');
    await userEvent.type(urlInput, '{Enter}');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('calls onUrlChange when typing in URL input', async () => {
    const onUrlChange = vi.fn();
    render(<UrlBar {...defaultProps} url="" onUrlChange={onUrlChange} />);

    const urlInput = screen.getByTestId('url-input');
    await userEvent.type(urlInput, 'test');
    expect(onUrlChange).toHaveBeenCalled();
  });

  it('renders inline command row without extra framed container', () => {
    render(<UrlBar {...defaultProps} />);

    // Composite control with focus-within border treatment
    const control = screen.getByTestId('url-bar');
    expect(control).toBeInTheDocument();
    expect(control.className).toContain('focus-within:border-border-default');
    expect(control.className).toContain('focus-within:ring-1');
  });

  describe('AI activity vigilance line', () => {
    it('renders vigilance line element', () => {
      render(<UrlBar {...defaultProps} />);
      expect(screen.getByTestId('url-bar-vigilance-line')).toBeInTheDocument();
    });

    it('shows idle state by default', () => {
      render(<UrlBar {...defaultProps} />);
      const line = screen.getByTestId('url-bar-vigilance-line');
      expect(line).toHaveClass('vigilance-progress-idle');
    });

    it('shows editing state with animated gradient', () => {
      render(<UrlBar {...defaultProps} aiState="editing" />);
      const line = screen.getByTestId('url-bar-vigilance-line');
      expect(line).toHaveClass('vigilance-progress');
    });

    it('shows executing state with fast gradient', () => {
      render(<UrlBar {...defaultProps} aiState="executing" />);
      const line = screen.getByTestId('url-bar-vigilance-line');
      expect(line).toHaveClass('vigilance-progress-fast');
    });

    it('shows complete state with success color', () => {
      render(<UrlBar {...defaultProps} aiState="complete" />);
      const line = screen.getByTestId('url-bar-vigilance-line');
      expect(line).toHaveClass('vigilance-progress-complete');
    });

    it('is hidden from screen readers', () => {
      render(<UrlBar {...defaultProps} />);
      const line = screen.getByTestId('url-bar-vigilance-line');
      expect(line).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
