/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AboutTab } from './AboutTab';

describe('AboutTab', () => {
  it('renders app tagline and version', () => {
    render(<AboutTab />);

    expect(screen.getByText('runi')).toBeInTheDocument();
    expect(screen.getByText('See the truth about your APIs')).toBeInTheDocument();
    expect(screen.getByTestId('about-version')).toBeInTheDocument();
  });
});
