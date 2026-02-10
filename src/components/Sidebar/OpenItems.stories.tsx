/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useEffect } from 'react';
import { OpenItems } from './OpenItems';
import { useTabStore } from '@/stores/useTabStore';

/**
 * Sidebar section showing open tabs with method badges, dirty indicators,
 * and close buttons. Hidden when 0–1 tabs (progressive disclosure).
 */
const meta: Meta<typeof OpenItems> = {
  title: 'Sidebar/OpenItems',
  component: OpenItems,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-[300px] bg-bg-surface border border-border-subtle">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof OpenItems>;

/** Seed the tab store with sample tabs for stories. */
const TabSeeder = ({
  tabs,
  activeIndex = 0,
}: {
  tabs: Array<{ method?: string; url?: string; label?: string; isDirty?: boolean }>;
  activeIndex?: number;
}): React.JSX.Element => {
  useEffect(() => {
    // Reset store
    useTabStore.setState({ tabs: {}, tabOrder: [], activeTabId: null });
    const ids: string[] = [];
    for (const tab of tabs) {
      ids.push(useTabStore.getState().openTab(tab));
    }
    if (ids[activeIndex] !== undefined) {
      useTabStore.getState().setActiveTab(ids[activeIndex]);
    }
  }, [tabs, activeIndex]);

  return <OpenItems />;
};

/** Playground with typical open tabs. */
export const Playground: Story = {
  render: () => (
    <TabSeeder
      tabs={[
        { method: 'GET', url: 'https://api.example.com/users', label: '/users' },
        { method: 'POST', url: 'https://api.example.com/users', label: '/users', isDirty: true },
        { method: 'DELETE', url: 'https://api.example.com/users/1', label: '/users/1' },
      ]}
      activeIndex={0}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Section header shows count', async () => {
      const count = canvas.getByTestId('open-items-count');
      await expect(count).toHaveTextContent('3');
    });

    await step('Tab navigation with arrow keys', async () => {
      const items = canvas.getAllByRole('option');
      items[0]?.focus();
      await expect(items[0]).toHaveFocus();

      await userEvent.keyboard('{ArrowDown}');
      await expect(items[1]).toHaveFocus();

      await userEvent.keyboard('{ArrowDown}');
      await expect(items[2]).toHaveFocus();

      // Wrap around
      await userEvent.keyboard('{ArrowDown}');
      await expect(items[0]).toHaveFocus();
    });

    await step('Close button appears on hover', async () => {
      // Close buttons exist but are visually hidden (opacity-0)
      const closeButtons = canvasElement.querySelectorAll('[data-test-id^="open-items-close-"]');
      await expect(closeButtons.length).toBe(3);
    });

    await step('Section collapses on header click', async () => {
      const toggle = canvas.getByTestId('open-items-section-toggle');
      await userEvent.click(toggle);
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(canvas.queryByTestId('open-items-list')).not.toBeInTheDocument();

      // Re-open
      await userEvent.click(toggle);
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });
  },
};

/** Many tabs to verify scrolling behavior. */
export const WithManyTabs: Story = {
  render: () => (
    <TabSeeder
      tabs={Array.from({ length: 12 }, (_, i) => ({
        method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'][i % 5],
        url: `https://api.example.com/resource-${String(i + 1)}`,
        label: `/resource-${String(i + 1)}`,
        isDirty: i % 3 === 0,
      }))}
      activeIndex={4}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('All 12 tabs rendered', async () => {
      const items = canvas.getAllByRole('option');
      await expect(items.length).toBe(12);
    });

    await step('Count badge shows 12', async () => {
      await expect(canvas.getByTestId('open-items-count')).toHaveTextContent('12');
    });
  },
};
