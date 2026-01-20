/**
 * @file ResponsePanel component tests
 * @description Tests for the ResponsePanel component with request/response body tabs
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResponsePanel } from './ResponsePanel';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

const mockRequestBody = '{"name":"John","email":"john@example.com"}';
const mockResponseBody = '{"id":1,"name":"John"}';

describe('ResponsePanel', () => {
  it('renders response and request body tabs', () => {
    render(<ResponsePanel requestBody={mockRequestBody} responseBody={mockResponseBody} />);

    expect(screen.getByRole('tab', { name: /response body/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /request body/i })).toBeInTheDocument();
  });

  it('shows Response Body tab as active by default', () => {
    render(<ResponsePanel requestBody={mockRequestBody} responseBody={mockResponseBody} />);

    const responseTab = screen.getByRole('tab', { name: /response body/i });
    expect(responseTab).toHaveAttribute('aria-selected', 'true');
    expect(responseTab).toHaveAttribute('tabIndex', '0');
  });

  it('switches to Request Body tab on click', async () => {
    const user = userEvent.setup();
    render(<ResponsePanel requestBody={mockRequestBody} responseBody={mockResponseBody} />);

    const requestTab = screen.getByRole('tab', { name: /request body/i });
    await user.click(requestTab);

    expect(requestTab).toHaveAttribute('aria-selected', 'true');
  });

  it('displays response body content when Response Body tab is active', () => {
    render(<ResponsePanel requestBody={mockRequestBody} responseBody={mockResponseBody} />);

    // Response body should be visible
    expect(screen.getByText(/John/)).toBeInTheDocument();
  });

  it('displays request body content when Request Body tab is active', async () => {
    const user = userEvent.setup();
    render(<ResponsePanel requestBody={mockRequestBody} responseBody={mockResponseBody} />);

    const requestTab = screen.getByRole('tab', { name: /request body/i });
    await user.click(requestTab);

    // Request body should be visible
    expect(screen.getByText(/john@example.com/)).toBeInTheDocument();
  });

  it('handles null request body', () => {
    render(<ResponsePanel requestBody={null} responseBody={mockResponseBody} />);

    const requestTab = screen.getByRole('tab', { name: /request body/i });
    expect(requestTab).toBeInTheDocument();
  });

  it('handles null response body', () => {
    render(<ResponsePanel requestBody={mockRequestBody} responseBody="" />);

    const responseTab = screen.getByRole('tab', { name: /response body/i });
    expect(responseTab).toBeInTheDocument();
  });
});
