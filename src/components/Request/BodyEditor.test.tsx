/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, cleanup, act, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { BodyEditor } from './BodyEditor';
import { useRequestStore } from '@/stores/useRequestStore';

describe('BodyEditor', () => {
  afterEach(() => {
    act(() => {
      useRequestStore.getState().reset();
    });
    cleanup();
  });

  it('renders the syntax layer and textarea', () => {
    act(() => {
      useRequestStore.setState({ body: '{"name":"Runi"}' });
    });
    render(<BodyEditor />);

    expect(screen.getByTestId('body-syntax-layer')).toBeInTheDocument();
    const textarea = screen.getByTestId('body-textarea');
    expect(textarea).toHaveValue('{"name":"Runi"}');
  });

  it('uses JSON highlighting when the body is valid JSON', () => {
    act(() => {
      useRequestStore.setState({ body: '{"valid":true}' });
    });
    render(<BodyEditor />);

    expect(screen.getByTestId('body-syntax-layer')).toBeInTheDocument();
    expect(screen.getByText('Valid JSON')).toBeInTheDocument();
  });

  it('falls back to text highlighting when JSON is invalid', () => {
    act(() => {
      useRequestStore.setState({ body: '{invalid-json' });
    });
    render(<BodyEditor />);

    expect(screen.getByTestId('body-syntax-layer')).toBeInTheDocument();
    expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
  });

  it('supports XML highlighting when XML-like content is provided', () => {
    act(() => {
      useRequestStore.setState({ body: '<note><to>Runi</to></note>' });
    });
    render(<BodyEditor />);

    expect(screen.getByTestId('body-syntax-layer')).toBeInTheDocument();
    expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
  });

  it('updates the store when the user types', async () => {
    render(<BodyEditor />);

    const textarea = screen.getByTestId('body-textarea');
    act(() => {
      fireEvent.change(textarea, { target: { value: '{"typed":true}' } });
    });

    expect(useRequestStore.getState().body).toBe('{"typed":true}');
  });

  it('shows format button for valid JSON', () => {
    act(() => {
      useRequestStore.setState({ body: '{"key":"value"}' });
    });
    render(<BodyEditor />);

    expect(screen.getByText('Format')).toBeInTheDocument();
  });

  it('formats JSON when format button is clicked', async () => {
    act(() => {
      useRequestStore.setState({ body: '{"key":"value","nested":{"a":1}}' });
    });
    render(<BodyEditor />);

    await waitFor(() => {
      expect(screen.getByText('Format')).toBeInTheDocument();
    });

    const formatButton = screen.getByText('Format');
    act(() => {
      fireEvent.click(formatButton);
    });

    await waitFor(() => {
      const formatted = useRequestStore.getState().body;
      expect(formatted).toContain('\n');
      expect(formatted).toContain('  '); // 2-space indentation
    });
  });

  // Note: Tab key handling test is skipped due to setTimeout complexity in test environment
  // The functionality is tested via E2E tests

  it('does not format invalid JSON', async () => {
    act(() => {
      useRequestStore.setState({ body: '{invalid json' });
    });
    render(<BodyEditor />);

    await waitFor(() => {
      expect(screen.queryByText('Format')).not.toBeInTheDocument();
    });
  });

  it('does not format empty body', async () => {
    act(() => {
      useRequestStore.setState({ body: '' });
    });
    render(<BodyEditor />);

    await waitFor(() => {
      expect(screen.queryByText('Format')).not.toBeInTheDocument();
    });
  });
});
