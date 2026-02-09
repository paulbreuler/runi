/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Sidebar Storybook stories
 * @description Consolidated story using Storybook 10 controls
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Sidebar } from './Sidebar';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { useFeatureFlagStore } from '@/stores/features/useFeatureFlagStore';
import type { CollectionSummary } from '@/types/collection';

const meta = {
  title: 'Layout/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Sidebar component with Collections drawer. Use controls to explore different states.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Playground with controls for Sidebar features.
 */
export const Playground: Story = {
  render: () => (
    <div className="w-64 h-[600px] border-r border-border-default bg-bg-app">
      <Sidebar />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('sidebar-content')).toBeInTheDocument();
  },
};

/**
 * Story with a long list of items to test scrollbar behavior.
 */
export const LongList: Story = {
  render: () => {
    // Enable collections
    useFeatureFlagStore.getState().setFlag('http', 'collectionsEnabled', true);

    // Mock a long list of collections
    const mockCollections: CollectionSummary[] = Array.from({ length: 20 }, (_, i) => ({
      id: `col-${String(i)}`,
      name: `Collection ${String(i + 1)}`,
      request_count: 5,
      source_type: 'manual',
      modified_at: new Date().toISOString(),
    }));

    // Setup store before rendering
    useCollectionStore.setState({
      summaries: mockCollections,
      isLoading: false,
      error: null,
    });

    return (
      <div className="w-64 h-[400px] border-r border-border-default bg-bg-app overflow-hidden">
        <Sidebar />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify scrollbar appears on expand', async () => {
      // The drawer is open by default in Sidebar component
      // Using findByTestId because it might take a frame to appear due to requestAnimationFrame
      const scrollbar = await canvas.findByTestId('sidebar-scrollbar');
      await expect(scrollbar).toBeInTheDocument();
      // We can't easily test the exact opacity transition in interaction test
      // but we can verify it's there and has the right classes
      await expect(scrollbar).toHaveClass('opacity-100');
    });

    await step('Verify scrollbar is inset', async () => {
      const scrollbar = canvas.getByTestId('sidebar-scrollbar');
      await expect(scrollbar).toHaveClass('right-2');
      await expect(scrollbar).toHaveClass('top-1');
      await expect(scrollbar).toHaveClass('bottom-1');
    });
  },
};
