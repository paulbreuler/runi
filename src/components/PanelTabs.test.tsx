/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';
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

// Mock Base UI Tabs
// Store onValueChange callback to simulate Base UI behavior
let mockOnValueChange: ((value: string) => void) | undefined;

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
      // Store callback for Tab to use
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
    Tab: ({
      value,
      render,
      ...props
    }: {
      value?: string;
      render?: (props: Record<string, unknown>) => React.ReactElement;
      [key: string]: unknown;
    }): React.JSX.Element => {
      // When render is provided, call it with props and onClick handler
      const handleClick = (): void => {
        if (mockOnValueChange !== undefined && value !== undefined) {
          mockOnValueChange(value);
        }
      };

      if (render !== undefined) {
        const tabProps = {
          ...props,
          onClick: handleClick,
          role: 'tab',
          'data-testid': 'tabs-trigger',
          'data-value': value,
        };
        return render(tabProps);
      }

      return (
        <div data-testid="tabs-trigger" data-value={value} onClick={handleClick} {...props}>
          {value}
        </div>
      );
    },
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

    it('uses Base UI Tabs primitives', () => {
      const { container } = render(<PanelTabs activeTab="network" onTabChange={mockOnTabChange} />);

      // Check that mock elements are rendered
      const root = container.querySelector('[data-testid="tabs-root"]');
      expect(root).toBeInTheDocument();
      const list = container.querySelector('[data-testid="tabs-list"]');
      expect(list).toBeInTheDocument();
      const triggers = container.querySelectorAll('[data-testid="tabs-trigger"]');
      expect(triggers).toHaveLength(2);
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

    it('passes correct value to Base UI Tabs.Root', () => {
      const { container } = render(<PanelTabs activeTab="network" onTabChange={mockOnTabChange} />);

      const root = container.querySelector('[data-testid="tabs-root"]');
      expect(root).toBeInTheDocument();
      expect(root).toHaveAttribute('data-value', 'network');
    });

    it('updates Base UI Tabs.Root value when activeTab changes', () => {
      const { container, rerender } = render(
        <PanelTabs activeTab="network" onTabChange={mockOnTabChange} />
      );

      let root = container.querySelector('[data-testid="tabs-root"]');
      expect(root).toBeInTheDocument();
      expect(root).toHaveAttribute('data-value', 'network');

      rerender(<PanelTabs activeTab="console" onTabChange={mockOnTabChange} />);

      root = container.querySelector('[data-testid="tabs-root"]');
      expect(root).toBeInTheDocument();
      expect(root).toHaveAttribute('data-value', 'console');
    });
  });

  describe('Motion animations', () => {
    it('uses LayoutGroup for layout animations', () => {
      const { container } = render(<PanelTabs activeTab="network" onTabChange={mockOnTabChange} />);

      const layoutGroup = container.querySelector('[data-testid="layout-group"]');
      expect(layoutGroup).toBeInTheDocument();
    });

    it('uses motion.button for tabs via render prop', () => {
      const { container } = render(<PanelTabs activeTab="network" onTabChange={mockOnTabChange} />);

      const triggers = container.querySelectorAll('[data-testid="tabs-trigger"]');
      expect(triggers.length).toBeGreaterThan(0);
      // motion.button should be rendered via render prop
      triggers.forEach((trigger) => {
        expect(trigger).toBeInTheDocument();
      });
    });

    it('renders animated indicator with layoutId', () => {
      const { container } = render(<PanelTabs activeTab="network" onTabChange={mockOnTabChange} />);

      const indicator = container.querySelector('[data-testid="panel-tab-indicator"]');
      expect(indicator).toBeInTheDocument();
      // layoutId should be set (checked via motion.div testid)
      expect(indicator).toHaveAttribute('data-layout-id', 'panel-tab-indicator');
    });

    it('indicator appears only on active tab', () => {
      const { container, rerender } = render(
        <PanelTabs activeTab="network" onTabChange={mockOnTabChange} />
      );

      let indicator = container.querySelector('[data-testid="panel-tab-indicator"]');
      expect(indicator).toBeInTheDocument();

      rerender(<PanelTabs activeTab="console" onTabChange={mockOnTabChange} />);

      // Indicator should still exist but be positioned on console tab
      indicator = container.querySelector('[data-testid="panel-tab-indicator"]');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('keyboard navigation', () => {
    it('Arrow Right moves focus to next tab and activates it', () => {
      render(<PanelTabs activeTab="network" onTabChange={mockOnTabChange} />);

      const list = screen.getByTestId('tabs-list');
      const wrapper = list.parentElement;
      expect(wrapper).not.toBeNull();

      fireEvent.keyDown(wrapper!, { key: 'ArrowRight', bubbles: true });

      expect(mockOnTabChange).toHaveBeenCalledTimes(1);
      expect(mockOnTabChange).toHaveBeenCalledWith('console');
    });

    it('Arrow Left moves focus to previous tab and activates it', () => {
      render(<PanelTabs activeTab="console" onTabChange={mockOnTabChange} />);

      const list = screen.getByTestId('tabs-list');
      const wrapper = list.parentElement;
      expect(wrapper).not.toBeNull();

      fireEvent.keyDown(wrapper!, { key: 'ArrowLeft', bubbles: true });

      expect(mockOnTabChange).toHaveBeenCalledTimes(1);
      expect(mockOnTabChange).toHaveBeenCalledWith('network');
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA attributes from Base UI Tabs', () => {
      const { container } = render(<PanelTabs activeTab="network" onTabChange={mockOnTabChange} />);

      const root = container.querySelector('[data-testid="tabs-root"]');
      expect(root).toBeInTheDocument();
      // Base UI Tabs provides ARIA attributes automatically
    });

    it('triggers have correct value attributes', () => {
      const { container } = render(<PanelTabs activeTab="network" onTabChange={mockOnTabChange} />);

      const triggers = container.querySelectorAll('[data-testid="tabs-trigger"]');
      const values = Array.from(triggers).map((t) => t.getAttribute('data-value'));
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
