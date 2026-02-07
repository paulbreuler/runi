/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AboutTab } from './AboutTab';

describe('AboutTab', () => {
  it('renders app name, tagline, and version', () => {
    render(<AboutTab />);

    expect(screen.getByText('runi')).toBeInTheDocument();
    expect(screen.getByText('See the truth about your APIs')).toBeInTheDocument();
    expect(screen.getByTestId('about-version')).toBeInTheDocument();
  });

  it('renders privacy info items', () => {
    render(<AboutTab />);

    expect(screen.getByTestId('about-info-telemetry')).toHaveTextContent(/Telemetry:\s*None/);
    expect(screen.getByTestId('about-info-cloud-sync')).toHaveTextContent(/Cloud Sync:\s*Never/);
    expect(screen.getByTestId('about-info-offline-mode')).toHaveTextContent(/Offline Mode:\s*Full/);
  });

  it('renders footer', () => {
    render(<AboutTab />);

    expect(screen.getByTestId('about-footer')).toHaveTextContent('Made with care by BaseState LLC');
  });
});
