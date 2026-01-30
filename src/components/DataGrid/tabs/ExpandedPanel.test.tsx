/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file ExpandedPanel tests
 * @description Tests for ExpandedPanel component with tab navigation
 */

import { render } from '@testing-library/react';
import { vi } from 'vitest';
import React from 'react';
import { ExpandedPanel } from './ExpandedPanel';
import type { NetworkHistoryEntry } from '@/types/history';

// Mock Base UI Tabs (similar to PanelTabs.test.tsx)
let mockOnValueChange: ((value: string) => void) | undefined;
let mockCurrentValue: string | undefined;

vi.mock('@base-ui/react/tabs', () => ({
  Tabs: {
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
    Tab: ({
      value,
      render,
      ...props
    }: {
      value?: string;
      render?: (props: Record<string, unknown>) => React.ReactElement;
      [key: string]: unknown;
    }): React.JSX.Element => {
      const handleClick = (): void => {
        if (mockOnValueChange !== undefined && value !== undefined) {
          mockOnValueChange(value);
        }
      };

      if (render !== undefined) {
        const tabProps = {
          ...props,
          onClick: handleClick,
          'data-testid': `tab-${value ?? 'unknown'}`,
          'data-value': value,
          role: 'tab',
          'aria-selected': value === mockCurrentValue ? 'true' : 'false',
        };
        return render(tabProps);
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
          {value}
        </div>
      );
    },
    Panel: ({
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
  },
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
      const { container } = render(<ExpandedPanel entry={mockEntry} />);

      // Get tabs from the expanded tabs list (top-level navigation)
      const tabsList = container.querySelector('[data-testid="expanded-tabs-list"]');
      expect(tabsList).toBeInTheDocument();
      const tabs = tabsList?.querySelectorAll('[role="tab"]') ?? [];

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
      const { container } = render(<ExpandedPanel entry={mockEntry} />);

      const tabsRoot = container.querySelector('[data-testid="tabs-root"]');
      expect(tabsRoot).toBeInTheDocument();
      expect(tabsRoot).toHaveAttribute('data-value', 'timing');
    });

    it('switches tabs on click', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      const { container } = render(<ExpandedPanel entry={mockEntry} />);

      // Find the Response tab button by data-testid
      const responseTab = container.querySelector('[data-testid="tab-response"]');
      expect(responseTab).toBeInTheDocument();
      if (responseTab) {
        await user.click(responseTab);
      }

      const tabsRoot = container.querySelector('[data-testid="tabs-root"]');
      expect(tabsRoot).toBeInTheDocument();
      expect(tabsRoot).toHaveAttribute('data-value', 'response');
    });

    it('highlights active tab', () => {
      const { container } = render(<ExpandedPanel entry={mockEntry} />);

      // Find the Timing tab button by data-testid
      const timingTab = container.querySelector('[data-testid="tab-timing"]');
      expect(timingTab).toBeInTheDocument();
      // Active tab should have text-text-primary class
      expect(timingTab).toHaveClass('text-text-primary');
    });
  });
});
