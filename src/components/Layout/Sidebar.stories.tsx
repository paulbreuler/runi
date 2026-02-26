/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Sidebar Storybook stories
 * @description Consolidated story using Storybook 10 controls
 */

import React, { useEffect } from 'react';
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

const LongListWrapper = (): React.JSX.Element => {
  useEffect((): (() => void) => {
    const prevSummaries = useCollectionStore.getState().summaries;
    const prevIsLoading = useCollectionStore.getState().isLoading;
    const prevError = useCollectionStore.getState().error;

    useFeatureFlagStore.getState().setFlag('http', 'collectionsEnabled', true);

    const mockCollections: CollectionSummary[] = Array.from({ length: 20 }, (_, i) => ({
      id: `col-${String(i)}`,
      name: `Collection ${String(i + 1)}`,
      request_count: 5,
      source_type: 'manual',
      modified_at: new Date().toISOString(),
      pinned_version_count: 0,
    }));

    useCollectionStore.setState({
      summaries: mockCollections,
      isLoading: false,
      error: null,
    });

    return (): void => {
      useFeatureFlagStore.getState().resetToDefaults();
      useCollectionStore.setState({
        summaries: prevSummaries,
        isLoading: prevIsLoading,
        error: prevError,
      });
    };
  }, []);

  return (
    <div className="w-64 h-[400px] border-r border-border-default bg-bg-app overflow-hidden">
      <Sidebar />
    </div>
  );
};

/**
 * Story with a long list of items to test scrollbar behavior.
 */
export const LongList: Story = {
  render: (): React.JSX.Element => <LongListWrapper />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify drawer is expanded', async () => {
      const drawer = canvas.getByTestId('collections-drawer');
      await expect(drawer).toBeInTheDocument();
      const toggle = canvas.getByTestId('collections-drawer-toggle');
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Verify scroll area exists', async () => {
      // Check that the scroll root exists (this is rendered by the component)
      const scrollRoot = canvas.getByTestId('sidebar-scroll-root');
      await expect(scrollRoot).toBeInTheDocument();
    });
  },
};
