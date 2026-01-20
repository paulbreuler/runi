/**
 * @file CopyButton component tests
 * @description Tests for the CopyButton component with clipboard functionality and feedback
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopyButton } from './CopyButton';

// Mock clipboard API
const mockWriteText = vi.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

describe('CopyButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders copy button', () => {
    render(<CopyButton text="test text" />);
    const button = screen.getByRole('button', { name: /copy/i });
    expect(button).toBeInTheDocument();
  });

  it('copies text to clipboard on click', async () => {
    const user = userEvent.setup();
    render(<CopyButton text="test text" />);
    const button = screen.getByRole('button', { name: /copy/i });

    await user.click(button);

    expect(mockWriteText).toHaveBeenCalledWith('test text');
    expect(mockWriteText).toHaveBeenCalledTimes(1);
  });

  it('shows "✓ Copied" feedback after copying', async () => {
    const user = userEvent.setup();
    render(<CopyButton text="test text" />);
    const button = screen.getByRole('button', { name: /copy/i });

    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/copied/i)).toBeInTheDocument();
    });
  });

  it('resets feedback after timeout', async () => {
    const user = userEvent.setup();
    vi.useFakeTimers();
    render(<CopyButton text="test text" feedbackDuration={100} />);
    const button = screen.getByRole('button', { name: /copy/i });

    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/copied/i)).toBeInTheDocument();
    });

    // Fast-forward past the timeout (100ms)
    await vi.advanceTimersByTimeAsync(150);

    await waitFor(() => {
      expect(screen.queryByText(/copied/i)).not.toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('handles clipboard errors gracefully', async () => {
    const user = userEvent.setup();
    mockWriteText.mockRejectedValue(new Error('Clipboard error'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<CopyButton text="test text" />);
    const button = screen.getByRole('button', { name: /copy/i });

    await user.click(button);

    // Should not crash, error should be logged
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
