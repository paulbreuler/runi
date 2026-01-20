/**
 * @file CodeGenTab component tests
 * @description Tests for the CodeGenTab component
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CodeGenTab } from './CodeGenTab';
import type { NetworkHistoryEntry } from '@/types/history';

describe('CodeGenTab', () => {
  const createMockEntry = (): NetworkHistoryEntry => ({
    id: '1',
    timestamp: '2024-01-01T00:00:00Z',
    request: {
      url: 'https://api.example.com/users',
      method: 'GET',
      headers: {},
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

  it('renders code generation tab', () => {
    const entry = createMockEntry();
    render(<CodeGenTab entry={entry} />);

    expect(screen.getByTestId('codegen-tab')).toBeInTheDocument();
  });

  it('renders code generation panel', () => {
    const entry = createMockEntry();
    render(<CodeGenTab entry={entry} />);

    expect(screen.getByTestId('codegen-panel')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const entry = createMockEntry();
    render(<CodeGenTab entry={entry} className="custom-class" />);

    expect(screen.getByTestId('codegen-tab')).toHaveClass('custom-class');
  });
});
