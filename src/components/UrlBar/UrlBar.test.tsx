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
    const { container } = render(<UrlBar {...defaultProps} />);

    // Should not introduce its own panel framing when rendered in titlebar
    const wrapper = container.firstChild as HTMLElement;
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
    // GET is blue per industry standard (read, safe, neutral)
    expect(methodSelect).toHaveClass('text-accent-blue');
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

    expect(methodSelect.className).toContain('focus-visible:ring-[1.5px]');
    expect(methodSelect.className).toContain('focus-visible:ring-[color:var(--accent-a8)]');
    expect(methodSelect.className).toContain('focus-visible:!ring-offset-0');
    expect(methodSelect.className).toContain('focus-visible:ring-inset');
    expect(methodSelect.className).toContain('focus-visible:z-10');

    expect(urlInput.className).toContain('focus-visible:ring-[1.5px]');
    expect(urlInput.className).toContain('focus-visible:ring-[color:var(--accent-a8)]');
    expect(urlInput.className).toContain('focus-visible:!ring-offset-0');
    expect(urlInput.className).toContain('focus-visible:ring-inset');
    expect(urlInput.className).toContain('focus-visible:z-10');

    expect(sendButton.className).toContain('focus-visible:ring-[1.5px]');
    expect(sendButton.className).toContain('focus-visible:ring-[color:var(--accent-a8)]');
    expect(sendButton.className).toContain('focus-visible:!ring-offset-0');
    expect(sendButton.className).toContain('focus-visible:ring-inset');
    expect(sendButton.className).toContain('focus-visible:z-10');
    expect(sendButton.className).toContain('focus-visible:text-accent-blue');
  });

  it('renders send button with proper styling', () => {
    render(<UrlBar {...defaultProps} />);

    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).toBeInTheDocument();
    expect(sendButton).toHaveTextContent('Send');
    // In composite: flat left edge, rounded right edge
    expect(sendButton).toHaveClass('rounded-none');
    expect(sendButton).toHaveClass('rounded-r-lg');
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

    // One subtle border around the whole control, not around URL only
    const control = screen.getByTestId('url-bar');
    expect(control).toBeInTheDocument();
    expect(control).toHaveClass('border');
    expect(control).toHaveClass('border-border-subtle');
    expect(control).toHaveClass('bg-bg-raised');
  });
});
