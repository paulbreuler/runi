/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { RequestHeader } from './RequestHeader';

describe('RequestHeader', () => {
  const defaultProps = {
    method: 'GET' as const,
    url: 'https://api.example.com',
    loading: false,
    onMethodChange: vi.fn(),
    onUrlChange: vi.fn(),
    onSend: vi.fn(),
  };

  it('renders with proper layout structure', () => {
    const { container } = render(<RequestHeader {...defaultProps} />);

    // Should have compact spacing (px-4 py-2) for unified command input
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('px-4');
    expect(wrapper).toHaveClass('py-2');
  });

  it('renders method select with colored text only', () => {
    render(<RequestHeader {...defaultProps} />);

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
    render(<RequestHeader {...defaultProps} url="" />);

    const urlInput = screen.getByTestId('url-input');
    expect(urlInput).toBeInTheDocument();
    expect(urlInput).toHaveAttribute('placeholder', 'Enter request URL...');
  });

  it('renders URL input with proper styling', () => {
    render(<RequestHeader {...defaultProps} url="" />);

    const urlInput = screen.getByTestId('url-input');
    // Should be seamless with unified container (no border, transparent background)
    expect(urlInput).toHaveClass('border-0');
    expect(urlInput).toHaveClass('bg-transparent');
  });

  it('URL input has visible focus ring for keyboard navigation', () => {
    render(<RequestHeader {...defaultProps} url="" />);
    const urlInput = screen.getByTestId('url-input');
    expect(urlInput.className).toContain('focus-visible:ring-2');
    expect(urlInput.className).toContain('ring-accent-blue');
  });

  it('renders send button with proper styling', () => {
    render(<RequestHeader {...defaultProps} />);

    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).toBeInTheDocument();
    expect(sendButton).toHaveTextContent('Send');
  });

  it('shows loading state on send button', () => {
    render(<RequestHeader {...defaultProps} loading={true} />);

    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).toHaveTextContent('Sending');
    expect(sendButton).toBeDisabled();
  });

  it('disables send button when URL is empty', () => {
    render(<RequestHeader {...defaultProps} url="" />);

    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).toBeDisabled();
  });

  it('enables send button when URL is valid', () => {
    render(<RequestHeader {...defaultProps} url="https://api.example.com" />);

    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).not.toBeDisabled();
  });

  it('calls onSend when send button is clicked', async () => {
    const onSend = vi.fn();
    render(<RequestHeader {...defaultProps} onSend={onSend} />);

    await userEvent.click(screen.getByTestId('send-button'));
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('calls onSend when Enter is pressed in URL input', async () => {
    const onSend = vi.fn();
    render(<RequestHeader {...defaultProps} onSend={onSend} />);

    const urlInput = screen.getByTestId('url-input');
    await userEvent.type(urlInput, '{Enter}');
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('does not call onSend on Enter when URL is empty', async () => {
    const onSend = vi.fn();
    render(<RequestHeader {...defaultProps} url="" onSend={onSend} />);

    const urlInput = screen.getByTestId('url-input');
    await userEvent.type(urlInput, '{Enter}');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('calls onUrlChange when typing in URL input', async () => {
    const onUrlChange = vi.fn();
    render(<RequestHeader {...defaultProps} url="" onUrlChange={onUrlChange} />);

    const urlInput = screen.getByTestId('url-input');
    await userEvent.type(urlInput, 'test');
    expect(onUrlChange).toHaveBeenCalled();
  });

  it('renders unified command input container', () => {
    const { container } = render(<RequestHeader {...defaultProps} />);

    // Should have unified container with no gap (gap-0) for seamless appearance
    const unifiedContainer = container.querySelector('.bg-bg-raised.border');
    expect(unifiedContainer).toBeInTheDocument();
    expect(unifiedContainer).toHaveClass('gap-0');
  });
});
