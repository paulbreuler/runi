import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import StatusBadge from './StatusBadge.svelte';

describe('StatusBadge', () => {
  it('renders status code and text', () => {
    render(StatusBadge, {
      props: {
        status: 200,
        statusText: 'OK',
      },
    });

    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('applies green color for 2xx status', () => {
    const { container } = render(StatusBadge, {
      props: {
        status: 200,
        statusText: 'OK',
      },
    });

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveClass('bg-green-600');
  });

  it('applies blue color for 3xx status', () => {
    render(StatusBadge, {
      props: {
        status: 301,
        statusText: 'Moved Permanently',
      },
    });

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveClass('bg-blue-600');
  });

  it('applies yellow color for 4xx status', () => {
    render(StatusBadge, {
      props: {
        status: 404,
        statusText: 'Not Found',
      },
    });

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveClass('bg-yellow-600');
  });

  it('applies red color for 5xx status', () => {
    render(StatusBadge, {
      props: {
        status: 500,
        statusText: 'Internal Server Error',
      },
    });

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveClass('bg-red-600');
  });

  it('has correct styling classes', () => {
    render(StatusBadge, {
      props: {
        status: 200,
        statusText: 'OK',
      },
    });

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveClass('font-semibold');
    expect(badge).toHaveClass('px-3');
    expect(badge).toHaveClass('py-1.5');
    expect(badge).toHaveClass('rounded-md');
    expect(badge).toHaveClass('text-sm');
    expect(badge).toHaveClass('transition-colors');
    expect(badge).toHaveClass('duration-200');
  });
});
