/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file ExpandedPanel tests
 * @description Tests for ExpandedPanel component with tab navigation
 */

import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import React from 'react';
import { ExpandedPanel } from './ExpandedPanel';
import type { NetworkHistoryEntry } from '@/types/history';

// Mock Radix Tabs (similar to PanelTabs.test.tsx)
let mockOnValueChange: ((value: string) => void) | undefined;
let mockCurrentValue: string | undefined;

vi.mock('@radix-ui/react-tabs', () => ({
  Root: ({
    children,
    value,
    onValueChange,
    ...props
  }: {
    children?: React.ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
    [key: string]: unknown;
  }): React.JSX.Element => {
    mockOnValueChange = onValueChange;
    mockCurrentValue = value;
    return (
      <div data-testid="tabs-root" data-value={value} {...props}>
        {children}
      </div>
    );
  },
  List: ({
    children,
    ...props
  }: {
    children?: React.ReactNode;
    [key: string]: unknown;
  }): React.JSX.Element => (
    <div data-testid="tabs-list" {...props}>
      {children}
    </div>
  ),
  Trigger: ({
    children,
    value,
    asChild,
    ...props
  }: {
    children?: React.ReactNode;
    value?: string;
    asChild?: boolean;
    [key: string]: unknown;
  }): React.JSX.Element => {
    const handleClick = (): void => {
      if (mockOnValueChange !== undefined && value !== undefined) {
        mockOnValueChange(value);
      }
    };

    if (asChild && React.isValidElement(children)) {
      const childProps = {
        ...props,
        onClick: handleClick,
        'data-testid': `tab-${value ?? 'unknown'}`,
        'data-value': value,
        'data-as-child': asChild,
        role: 'tab',
        'aria-selected': value === mockCurrentValue ? 'true' : 'false',
      };

      return React.cloneElement(
        children as React.ReactElement<Record<string, unknown>>,
        childProps
      );
    }

    return (
      <div
        data-testid={`tab-${value ?? 'unknown'}`}
        data-value={value}
        role="tab"
        aria-selected={value === mockCurrentValue ? 'true' : 'false'}
        onClick={handleClick}
        {...props}
      >
        {children}
      </div>
    );
  },
  Content: ({
    children,
    value,
    ...props
  }: {
    children?: React.ReactNode;
    value?: string;
    [key: string]: unknown;
  }): React.JSX.Element => (
    <div
      data-testid={`tab-content-${value ?? 'unknown'}`}
      data-value={value ?? 'unknown'}
      {...props}
    >
      {children}
    </div>
  ),
}));

describe('ExpandedPanel', () => {
  const mockEntry: NetworkHistoryEntry = {
    id: '1',
    request: {
      method: 'GET',
      url: 'https://example.com/api',
      headers: {},
      body: '',
      timeout_ms: 30000,
    },
    response: {
      status: 200,
      status_text: 'OK',
      headers: {},
      body: '',
      timing: {
        dns_ms: 10,
        connect_ms: 20,
        tls_ms: 30,
        first_byte_ms: 50,
        total_ms: 150,
      },
    },
    timestamp: new Date().toISOString(),
  };

  describe('Feature #18: Tab Navigation', () => {
    it('renders all tabs', () => {
      render(<ExpandedPanel entry={mockEntry} />);

      // Get tabs from the expanded tabs list (top-level navigation)
      const tabsList = screen.getByTestId('expanded-tabs-list');
      const tabs = tabsList.querySelectorAll('[role="tab"]');

      // Check that we have exactly 5 top-level tabs
      expect(tabs).toHaveLength(5);

      // Verify each tab is present within the tabs list
      expect(tabsList).toHaveTextContent('Timing');
      expect(tabsList).toHaveTextContent('Response');
      expect(tabsList).toHaveTextContent('Headers');
      expect(tabsList).toHaveTextContent('TLS');
      expect(tabsList).toHaveTextContent('Code Gen');
    });

    it('Timing tab is active by default', () => {
      render(<ExpandedPanel entry={mockEntry} />);

      const tabsRoot = screen.getByTestId('tabs-root');
      expect(tabsRoot).toHaveAttribute('data-value', 'timing');
    });

    it('switches tabs on click', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      render(<ExpandedPanel entry={mockEntry} />);

      // Find the Response tab button by data-testid
      const responseTab = screen.getByTestId('tab-response');
      expect(responseTab).toBeInTheDocument();
      await user.click(responseTab);

      const tabsRoot = screen.getByTestId('tabs-root');
      expect(tabsRoot).toHaveAttribute('data-value', 'response');
    });

    it('highlights active tab', () => {
      render(<ExpandedPanel entry={mockEntry} />);

      // Find the Timing tab button by data-testid
      const timingTab = screen.getByTestId('tab-timing');
      // Active tab should have text-text-primary class
      expect(timingTab).toHaveClass('text-text-primary');
    });
  });
});
