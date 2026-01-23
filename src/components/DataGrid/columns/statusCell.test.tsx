/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file StatusCell component tests
 * @description Tests for HTTP status code cell component
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusCell } from './statusCell';

describe('StatusCell', () => {
  it('renders 2xx status with success styling', () => {
    render(<StatusCell status={200} />);
    const badge = screen.getByText('200');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-signal-success');
  });

  it('renders 201 status with success styling', () => {
    render(<StatusCell status={201} />);
    const badge = screen.getByText('201');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-signal-success');
  });

  it('renders 3xx status with info styling', () => {
    render(<StatusCell status={301} />);
    const badge = screen.getByText('301');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-accent-blue');
  });

  it('renders 302 status with info styling', () => {
    render(<StatusCell status={302} />);
    const badge = screen.getByText('302');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-accent-blue');
  });

  it('renders 4xx status with warning styling', () => {
    render(<StatusCell status={400} />);
    const badge = screen.getByText('400');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-signal-warning');
  });

  it('renders 404 status with warning styling', () => {
    render(<StatusCell status={404} />);
    const badge = screen.getByText('404');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-signal-warning');
  });

  it('renders 5xx status with error styling', () => {
    render(<StatusCell status={500} />);
    const badge = screen.getByText('500');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-signal-error');
  });

  it('renders 503 status with error styling', () => {
    render(<StatusCell status={503} />);
    const badge = screen.getByText('503');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-signal-error');
  });

  it('renders unknown status codes with muted styling', () => {
    render(<StatusCell status={199} />);
    const badge = screen.getByText('199');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-text-muted');
  });

  it('renders status code as monospace font', () => {
    render(<StatusCell status={200} />);
    const badge = screen.getByText('200');
    expect(badge).toHaveClass('font-mono');
  });

  it('renders status code with semibold font weight', () => {
    render(<StatusCell status={200} />);
    const badge = screen.getByText('200');
    expect(badge).toHaveClass('font-semibold');
  });
});
