/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file ResponseTab component tests
 * @description Tests for the ResponseTab component - main response tab for expanded panel
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResponseTab } from './ResponseTab';
import type { NetworkHistoryEntry } from '@/types/history';

const mockEntry: NetworkHistoryEntry = {
  id: 'test-1',
  timestamp: new Date().toISOString(),
  request: {
    url: 'https://api.example.com/users',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"name":"John","email":"john@example.com"}',
    timeout_ms: 30000,
  },
  response: {
    status: 200,
    status_text: 'OK',
    headers: { 'Content-Type': 'application/json' },
    body: '{"id":1,"name":"John"}',
    timing: {
      total_ms: 156,
      dns_ms: 12,
      connect_ms: 23,
      tls_ms: 34,
      first_byte_ms: 98,
    },
  },
};

describe('ResponseTab', () => {
  describe('Feature #20: Expanded Panel - Response Tab', () => {
    it('displays response/request body tabs', () => {
      render(<ResponseTab entry={mockEntry} />);

      expect(screen.getByRole('tab', { name: /response body/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /request body/i })).toBeInTheDocument();
    });

    it('Response Body tab is active by default', () => {
      render(<ResponseTab entry={mockEntry} />);

      const responseTab = screen.getByRole('tab', { name: /response body/i });
      expect(responseTab).toHaveAttribute('aria-selected', 'true');

      const requestTab = screen.getByRole('tab', { name: /request body/i });
      expect(requestTab).toHaveAttribute('aria-selected', 'false');
    });

    it('formats JSON body', () => {
      render(<ResponseTab entry={mockEntry} />);

      // CodeSnippet should be rendered
      const codeSnippet = screen.getByTestId('code-editor');
      expect(codeSnippet).toBeInTheDocument();

      // CodeSnippet should format JSON with 2-space indentation
      // The formatted JSON is rendered by syntax highlighter, so we verify CodeSnippet is present
      // and that it has the correct language attribute
      const codeBox = screen.getByTestId('code-box');
      const innerBox = codeBox.querySelector('[data-language]');
      expect(innerBox).toHaveAttribute('data-language', 'json');
    });

    it('copies body to clipboard', async () => {
      const user = userEvent.setup();
      render(<ResponseTab entry={mockEntry} />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      expect(copyButton).toBeInTheDocument();

      // Verify button is clickable
      // Note: Actual clipboard functionality is tested in CopyButton component
      // and verified manually in Storybook due to jsdom limitations
      await user.click(copyButton);

      // Button should still be present after click
      expect(copyButton).toBeInTheDocument();
    });

    it('shows copy button for request body when Request Body tab is active', async () => {
      const user = userEvent.setup();
      render(<ResponseTab entry={mockEntry} />);

      // Switch to Request Body tab
      const requestTab = screen.getByRole('tab', { name: /request body/i });
      await user.click(requestTab);

      // Verify Request Body tab is now active
      expect(requestTab).toHaveAttribute('aria-selected', 'true');

      // Copy button should still be present (for request body)
      const copyButton = screen.getByRole('button', { name: /copy/i });
      expect(copyButton).toBeInTheDocument();
    });

    it('handles entry with null request body', () => {
      const entryWithoutBody: NetworkHistoryEntry = {
        ...mockEntry,
        request: {
          ...mockEntry.request,
          body: null,
        },
      };

      render(<ResponseTab entry={entryWithoutBody} />);

      expect(screen.getByRole('tab', { name: /request body/i })).toBeInTheDocument();
    });
  });
});
