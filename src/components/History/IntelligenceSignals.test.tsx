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
    expect(container.querySelector('[data-testid^="signal-dot"]')).toBeNull();
  });

  it('renders verified signal when verified is true', () => {
    render(<IntelligenceSignals intelligence={{ ...emptyIntelligence, verified: true }} />);
    expect(screen.getByTestId('signal-dot-verified')).toBeInTheDocument();
  });

  it('renders bound signal when boundToSpec is true', () => {
    render(
      <IntelligenceSignals
        intelligence={{ ...emptyIntelligence, boundToSpec: true, specOperation: 'getUsers' }}
      />
    );
    expect(screen.getByTestId('signal-dot-bound')).toBeInTheDocument();
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
    expect(screen.getByTestId('signal-dot-drift')).toBeInTheDocument();
  });

  it('renders ai signal when aiGenerated is true', () => {
    render(<IntelligenceSignals intelligence={{ ...emptyIntelligence, aiGenerated: true }} />);
    expect(screen.getByTestId('signal-dot-ai')).toBeInTheDocument();
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

    expect(screen.getByTestId('signal-dot-bound')).toBeInTheDocument();
    expect(screen.getByTestId('signal-dot-drift')).toBeInTheDocument();
    expect(screen.getByTestId('signal-dot-ai')).toBeInTheDocument();
    expect(screen.queryByTestId('signal-dot-verified')).toBeNull();
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

    const dots = screen.getAllByTestId(/^signal-dot-/);
    expect(dots).toHaveLength(4);
    expect(dots[0]).toHaveAttribute('data-testid', 'signal-dot-verified');
    expect(dots[1]).toHaveAttribute('data-testid', 'signal-dot-drift');
    expect(dots[2]).toHaveAttribute('data-testid', 'signal-dot-ai');
    expect(dots[3]).toHaveAttribute('data-testid', 'signal-dot-bound');
  });

  it('includes spec operation in bound tooltip when available', () => {
    render(
      <IntelligenceSignals
        intelligence={{ ...emptyIntelligence, boundToSpec: true, specOperation: 'getUserById' }}
      />
    );
    const dot = screen.getByTestId('signal-dot-bound');
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
    const dot = screen.getByTestId('signal-dot-drift');
    expect(dot).toHaveAttribute('title', 'Drift: Expected 200, got 404');
  });

  it('renders undefined intelligence as no signals', () => {
    const { container } = render(<IntelligenceSignals />);
    expect(container.querySelector('[data-testid^="signal-dot"]')).toBeNull();
  });
});
