/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file CodeGenPanel component tests
 * @description Tests for the CodeGenPanel component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { CodeGenPanel } from './CodeGenPanel';
import type { NetworkHistoryEntry } from '@/types/history';

describe('CodeGenPanel', () => {
  const createMockEntry = (): NetworkHistoryEntry => ({
    id: '1',
    timestamp: '2024-01-01T00:00:00Z',
    request: {
      url: 'https://api.example.com/users',
      method: 'GET',
      headers: { Authorization: 'Bearer token123' },
      body: null,
      timeout_ms: 30000,
    },
    response: {
      status: 200,
      status_text: 'OK',
      headers: {},
      body: '{}',
      timing: {
        total_ms: 100,
        dns_ms: 10,
        connect_ms: 20,
        tls_ms: 30,
        first_byte_ms: 50,
      },
    },
  });

  it('renders code generation panel', () => {
    const entry = createMockEntry();
    render(<CodeGenPanel entry={entry} />);

    expect(screen.getByTestId('codegen-panel')).toBeInTheDocument();
  });

  it('renders language tabs', () => {
    const entry = createMockEntry();
    render(<CodeGenPanel entry={entry} />);

    expect(screen.getByTestId('language-tabs')).toBeInTheDocument();
  });

  it('renders code snippet', () => {
    const entry = createMockEntry();
    render(<CodeGenPanel entry={entry} />);

    expect(screen.getByTestId('code-snippet')).toBeInTheDocument();
  });

  it('defaults to JavaScript language', () => {
    const entry = createMockEntry();
    render(<CodeGenPanel entry={entry} />);

    const javascriptTab = screen.getByText('JavaScript');
    expect(javascriptTab.closest('button')).toHaveAttribute('aria-selected', 'true');
  });

  it('switches language when tab is clicked', async () => {
    const user = userEvent.setup();
    const entry = createMockEntry();
    render(<CodeGenPanel entry={entry} />);

    const pythonTab = screen.getByText('Python');
    await user.click(pythonTab);

    expect(pythonTab.closest('button')).toHaveAttribute('aria-selected', 'true');
  });

  it('uses custom languages when provided', () => {
    const entry = createMockEntry();
    render(<CodeGenPanel entry={entry} languages={['javascript', 'python']} />);

    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.queryByText('Go')).not.toBeInTheDocument();
  });
});
