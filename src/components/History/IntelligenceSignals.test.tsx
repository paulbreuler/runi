/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IntelligenceSignals } from './IntelligenceSignals';
import type { IntelligenceInfo } from '@/types/history';

describe('IntelligenceSignals', () => {
  const emptyIntelligence: IntelligenceInfo = {
    boundToSpec: false,
    specOperation: null,
    drift: null,
    aiGenerated: false,
    verified: false,
  };

  it('renders nothing when no signals are present', () => {
    const { container } = render(<IntelligenceSignals intelligence={emptyIntelligence} />);
    expect(container.querySelector('[data-test-id^="signal-icon"]')).toBeNull();
  });

  it('renders verified signal when verified is true', () => {
    render(<IntelligenceSignals intelligence={{ ...emptyIntelligence, verified: true }} />);
    expect(screen.getByTestId('signal-icon-verified')).toBeInTheDocument();
  });

  it('renders bound signal when boundToSpec is true', () => {
    render(
      <IntelligenceSignals
        intelligence={{ ...emptyIntelligence, boundToSpec: true, specOperation: 'getUsers' }}
      />
    );
    expect(screen.getByTestId('signal-icon-bound')).toBeInTheDocument();
  });

  it('renders drift signal when drift is present', () => {
    render(
      <IntelligenceSignals
        intelligence={{
          ...emptyIntelligence,
          drift: { type: 'response', fields: ['status'], message: 'Status code differs' },
        }}
      />
    );
    expect(screen.getByTestId('signal-icon-drift')).toBeInTheDocument();
  });

  it('renders ai signal when aiGenerated is true', () => {
    render(<IntelligenceSignals intelligence={{ ...emptyIntelligence, aiGenerated: true }} />);
    expect(screen.getByTestId('signal-icon-ai')).toBeInTheDocument();
  });

  it('renders multiple signals when multiple flags are set', () => {
    render(
      <IntelligenceSignals
        intelligence={{
          boundToSpec: true,
          specOperation: 'createUser',
          drift: { type: 'request', fields: ['body.name'], message: 'Missing required field' },
          aiGenerated: true,
          verified: false,
        }}
      />
    );

    expect(screen.getByTestId('signal-icon-bound')).toBeInTheDocument();
    expect(screen.getByTestId('signal-icon-drift')).toBeInTheDocument();
    expect(screen.getByTestId('signal-icon-ai')).toBeInTheDocument();
    expect(screen.queryByTestId('signal-icon-verified')).toBeNull();
  });

  it('renders signals in correct order: verified, drift, ai, bound', () => {
    render(
      <IntelligenceSignals
        intelligence={{
          boundToSpec: true,
          specOperation: 'test',
          drift: { type: 'response', fields: ['x'], message: 'test' },
          aiGenerated: true,
          verified: true,
        }}
      />
    );

    const dots = screen.getAllByTestId(/^signal-icon-/);
    expect(dots).toHaveLength(4);
    expect(dots[0]).toHaveAttribute('data-test-id', 'signal-icon-verified');
    expect(dots[1]).toHaveAttribute('data-test-id', 'signal-icon-drift');
    expect(dots[2]).toHaveAttribute('data-test-id', 'signal-icon-ai');
    expect(dots[3]).toHaveAttribute('data-test-id', 'signal-icon-bound');
  });

  it('includes spec operation in bound tooltip when available', () => {
    render(
      <IntelligenceSignals
        intelligence={{ ...emptyIntelligence, boundToSpec: true, specOperation: 'getUserById' }}
      />
    );
    const dot = screen.getByTestId('signal-icon-bound');
    expect(dot).toHaveAttribute('title', 'Bound to spec: getUserById');
  });

  it('includes drift message in tooltip when available', () => {
    render(
      <IntelligenceSignals
        intelligence={{
          ...emptyIntelligence,
          drift: { type: 'response', fields: ['status'], message: 'Expected 200, got 404' },
        }}
      />
    );
    const dot = screen.getByTestId('signal-icon-drift');
    expect(dot).toHaveAttribute('title', 'Drift: Expected 200, got 404');
  });

  it('renders undefined intelligence as no signals', () => {
    const { container } = render(<IntelligenceSignals />);
    expect(container.querySelector('[data-test-id^="signal-icon"]')).toBeNull();
  });
});
