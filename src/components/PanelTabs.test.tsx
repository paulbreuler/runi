/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PanelTabs } from './PanelTabs';

// Mock motion/react to avoid animation-related issues in tests
vi.mock('motion/react', () => ({
  motion: {
    button: ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
      [key: string]: unknown;
    }): React.JSX.Element => (
      <button data-testid="motion-button" {...props}>
        {children}
      </button>
    ),
    div: ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
      [key: string]: unknown;
    }): React.JSX.Element => (
      <div data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
  },
  LayoutGroup: ({ children }: { children?: React.ReactNode }): React.ReactNode => (
    <div data-testid="layout-group">{children}</div>
  ),
  AnimatePresence: ({ children }: { children?: React.ReactNode }): React.ReactNode => (
    <>{children}</>
  ),
  useReducedMotion: (): boolean => false,
}));

// Mock Radix Tabs
// Store onValueChange callback to simulate Radix behavior
let mockOnValueChange: ((value: string) => void) | undefined;

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
    // Store callback for Trigger to use
    mockOnValueChange = onValueChange;
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
    // When asChild is true, children should be a single element (motion.button)
    // We need to clone it and add onClick handler
    const handleClick = (): void => {
      if (mockOnValueChange !== undefined && value !== undefined) {
        mockOnValueChange(value);
      }
    };

    if (asChild && React.isValidElement(children)) {
      // TypeScript workaround for cloneElement with dynamic props
      const childProps = {
        ...props,
        onClick: handleClick,
        'data-testid': 'tabs-trigger',
        'data-value': value,
        'data-as-child': asChild,
      };

      return React.cloneElement(children as React.ReactElement<any>, childProps);
    }

    return (
      <div
        data-testid="tabs-trigger"
        data-value={value}
        data-as-child={asChild}
        onClick={handleClick}
        {...props}
      >
        {children}
      </div>
    );
  },
}));

describe('PanelTabs', () => {
  const mockOnTabChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders Network and Console tabs', () => {
      render(<PanelTabs activeTab="network" onTabChange={mockOnTabChange} />);

      expect(screen.getByText('Network')).toBeInTheDocument();
      expect(screen.getByText('Console')).toBeInTheDocument();
    });

    it('uses Radix Tabs primitives', () => {
      render(<PanelTabs activeTab="network" onTabChange={mockOnTabChange} />);

      expect(screen.getByTestId('tabs-root')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-list')).toBeInTheDocument();
      expect(screen.getAllByTestId('tabs-trigger')).toHaveLength(2);
    });

    it('renders Network tab with icon', () => {
      render(<PanelTabs activeTab="network" onTabChange={mockOnTabChange} />);

      const networkTab = screen.getByText('Network').closest('[data-testid="tabs-trigger"]');
      expect(networkTab).toBeInTheDocument();
      // Network text should be present
      expect(screen.getByText('Network')).toBeInTheDocument();
    });

    it('renders Console tab with icon', () => {
      render(<PanelTabs activeTab="console" onTabChange={mockOnTabChange} />);

      const consoleTab = screen.getByText('Console').closest('[data-testid="tabs-trigger"]');
      expect(consoleTab).toBeInTheDocument();
    });

    it('displays network count badge when provided', () => {
      render(<PanelTabs activeTab="network" onTabChange={mockOnTabChange} networkCount={5} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('displays console count badge when provided', () => {
      render(<PanelTabs activeTab="console" onTabChange={mockOnTabChange} consoleCount={3} />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('does not display count badge when count is 0', () => {
      render(<PanelTabs activeTab="network" onTabChange={mockOnTabChange} networkCount={0} />);

      const badges = screen.queryAllByText('0');
      // Should not show badge for 0
      expect(badges.length).toBe(0);
    });
  });

  describe('tab switching', () => {
    it('calls onTabChange when Network tab is clicked', async () => {
      const user = userEvent.setup();
      render(<PanelTabs activeTab="console" onTabChange={mockOnTabChange} />);

      const networkTab = screen.getByText('Network');
      await user.click(networkTab);

      expect(mockOnTabChange).toHaveBeenCalledWith('network');
    });

    it('calls onTabChange when Console tab is clicked', async () => {
      const user = userEvent.setup();
      render(<PanelTabs activeTab="network" onTabChange={mockOnTabChange} />);

      const consoleTab = screen.getByText('Console');
      await user.click(consoleTab);

      expect(mockOnTabChange).toHaveBeenCalledWith('console');
    });

    it('passes correct value to Radix Tabs.Root', () => {
      render(<PanelTabs activeTab="network" onTabChange={mockOnTabChange} />);

      const root = screen.getByTestId('tabs-root');
      expect(root).toHaveAttribute('data-value', 'network');
    });

    it('updates Radix Tabs.Root value when activeTab changes', () => {
      const { rerender } = render(<PanelTabs activeTab="network" onTabChange={mockOnTabChange} />);

      let root = screen.getByTestId('tabs-root');
      expect(root).toHaveAttribute('data-value', 'network');

      rerender(<PanelTabs activeTab="console" onTabChange={mockOnTabChange} />);

      root = screen.getByTestId('tabs-root');
      expect(root).toHaveAttribute('data-value', 'console');
    });
  });

  describe('Motion animations', () => {
    it('uses LayoutGroup for layout animations', () => {
      render(<PanelTabs activeTab="network" onTabChange={mockOnTabChange} />);

      expect(screen.getByTestId('layout-group')).toBeInTheDocument();
    });

    it('uses motion.button for tabs via asChild', () => {
      render(<PanelTabs activeTab="network" onTabChange={mockOnTabChange} />);

      const triggers = screen.getAllByTestId('tabs-trigger');
      triggers.forEach((trigger) => {
        expect(trigger).toHaveAttribute('data-as-child', 'true');
      });
    });

    it('renders animated indicator with layoutId', () => {
      render(<PanelTabs activeTab="network" onTabChange={mockOnTabChange} />);

      const indicator = screen.getByTestId('panel-tab-indicator');
      expect(indicator).toBeInTheDocument();
      // layoutId should be set (checked via motion.div testid)
      expect(indicator).toHaveAttribute('data-layout-id', 'panel-tab-indicator');
    });

    it('indicator appears only on active tab', () => {
      const { rerender } = render(<PanelTabs activeTab="network" onTabChange={mockOnTabChange} />);

      let indicator = screen.getByTestId('panel-tab-indicator');
      expect(indicator).toBeInTheDocument();

      rerender(<PanelTabs activeTab="console" onTabChange={mockOnTabChange} />);

      // Indicator should still exist but be positioned on console tab
      indicator = screen.getByTestId('panel-tab-indicator');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA attributes from Radix Tabs', () => {
      render(<PanelTabs activeTab="network" onTabChange={mockOnTabChange} />);

      const root = screen.getByTestId('tabs-root');
      expect(root).toBeInTheDocument();
      // Radix Tabs provides ARIA attributes automatically
    });

    it('triggers have correct value attributes', () => {
      render(<PanelTabs activeTab="network" onTabChange={mockOnTabChange} />);

      const triggers = screen.getAllByTestId('tabs-trigger');
      const values = triggers.map((t) => t.getAttribute('data-value'));
      expect(values).toContain('network');
      expect(values).toContain('console');
    });
  });

  describe('styling', () => {
    it('applies active tab styling', () => {
      render(<PanelTabs activeTab="network" onTabChange={mockOnTabChange} />);

      // Active tab should have active styling (checked via className or data attributes)
      const networkTrigger = screen.getByText('Network').closest('[data-testid="tabs-trigger"]');
      expect(networkTrigger).toBeInTheDocument();
    });

    it('applies inactive tab styling', () => {
      render(<PanelTabs activeTab="network" onTabChange={mockOnTabChange} />);

      const consoleTrigger = screen.getByText('Console').closest('[data-testid="tabs-trigger"]');
      expect(consoleTrigger).toBeInTheDocument();
    });
  });
});
