// Copyright (c) 2025 runi contributors
// SPDX-License-Identifier: MIT

/**
 * @file DriftReviewDrawer stories
 * @description Storybook stories for the drift review drawer component.
 *
 * The drawer renders via `createPortal` into `document.body` so it fills
 * the story viewport. Each story seeds `useDriftReviewStore` before mount
 * so the drawer is immediately visible in the correct state.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within, waitFor } from 'storybook/test';
import { DriftReviewDrawer } from './DriftReviewDrawer';
import { useDriftReviewStore } from '@/stores/useDriftReviewStore';
import type { SpecRefreshResult } from '@/types/generated/SpecRefreshResult';

// ---------------------------------------------------------------------------
// Shared fixture data
// ---------------------------------------------------------------------------

const COLLECTION_ID = 'col_stories';

const fullDriftResult: SpecRefreshResult = {
  changed: true,
  operationsRemoved: [
    { method: 'DELETE', path: '/books/{id}' },
    { method: 'DELETE', path: '/authors/{id}' },
  ],
  operationsChanged: [
    { method: 'PUT', path: '/books/{id}', changes: ['parameters', 'requestBody'] },
    { method: 'PATCH', path: '/books/{id}', changes: ['responseSchema'] },
  ],
  operationsAdded: [
    { method: 'POST', path: '/books/{id}/reserve' },
    { method: 'GET', path: '/books/search' },
  ],
};

const minimalDriftResult: SpecRefreshResult = {
  changed: true,
  operationsRemoved: [{ method: 'DELETE', path: '/books/{id}' }],
  operationsChanged: [],
  operationsAdded: [],
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta = {
  title: 'DriftReview/DriftReviewDrawer',
  component: DriftReviewDrawer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `DriftReviewDrawer — Right-side flyout drawer for reviewing API spec drift.

**Features:**
- Groups changes as REMOVED → CHANGED → ADDED with signal-colored section headers
- Per-change Accept / Ignore buttons + Accept all / Dismiss all bulk actions
- Empty "all-reviewed" state with Done button
- **Comparison header** mode: renders a custom title (e.g. \`Comparing v1.5.0 (active) → v2.0.0 (staged)\`) for spec-vs-spec comparisons instead of the default "Drift Review" heading
- Focus-trapped, Escape-closeable, backdrop-closeable
- Respects \`prefers-reduced-motion\`

**Architecture:**
- Renders via \`createPortal\` into \`document.body\`; must be mounted in the tree even when closed
- Controlled by \`useDriftReviewStore\` (Zustand); open/close state and per-change review state live here
- \`comparisonHeader\` is passed as the 3rd arg to \`openDrawer()\` by the version switcher popover
        `,
      },
    },
  },
  tags: ['autodocs'],
  args: {
    collectionId: COLLECTION_ID,
    driftResult: fullDriftResult,
  },
} satisfies Meta<typeof DriftReviewDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface StoreOverrides {
  comparisonHeader?: string | null;
  reviewState?: Record<string, { status: 'pending' | 'accepted' | 'ignored' }>;
}

const resetStore = (overrides: StoreOverrides = {}): void => {
  useDriftReviewStore.setState({
    isOpen: true,
    collectionId: COLLECTION_ID,
    focusOperationKey: null,
    comparisonHeader: overrides.comparisonHeader ?? null,
    reviewState: overrides.reviewState ?? {},
    dismissedBannerKeys: new Set(),
  });
};

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default drift review showing all three change groups (REMOVED / CHANGED / ADDED).
 * This is the standard mode triggered by a remote spec refresh.
 */
export const Playground: Story = {
  render: (args) => {
    resetStore();
    return <DriftReviewDrawer {...args} />;
  },
  beforeEach: () => {
    resetStore();
  },
  play: async ({ step }) => {
    // The drawer renders via portal into document.body so we query from there.
    const body = within(document.body);

    await step('Drawer is open and visible', async () => {
      await waitFor(async () => {
        await expect(body.getByTestId('drift-review-drawer')).toBeInTheDocument();
      });
      await expect(body.getByTestId('drift-review-drawer')).toHaveAttribute('role', 'dialog');
      await expect(body.getByTestId('drift-review-drawer')).toHaveAttribute('aria-modal', 'true');
    });

    await step('Shows default "Drift Review" title', async () => {
      await expect(body.getByTestId('drift-drawer-title')).toHaveTextContent('Drift Review');
      await expect(body.queryByTestId('drift-drawer-comparison-header')).toBeNull();
    });

    await step('Renders all three change groups in order', async () => {
      const groups = body.getAllByTestId(/^drift-group-/);
      await expect(groups.map((n) => n.getAttribute('data-test-id'))).toEqual([
        'drift-group-removed',
        'drift-group-changed',
        'drift-group-added',
      ]);
    });

    await step('Accept all / Dismiss all bulk actions are present', async () => {
      await expect(body.getByTestId('drift-drawer-accept-all')).toBeInTheDocument();
      await expect(body.getByTestId('drift-drawer-dismiss-all')).toBeInTheDocument();
    });

    await step('Close button is present and accessible', async () => {
      await expect(body.getByTestId('drift-drawer-close')).toHaveAttribute(
        'aria-label',
        'Close drift review'
      );
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Standard drift review drawer opened after a remote spec refresh. Shows all three change groups with bulk actions.',
      },
    },
  },
};

/**
 * **Comparison header** variant — the new mode opened by the "Compare" action
 * in the version switcher popover. The drawer title is replaced with a
 * `"Comparing {active} (active) → {staged} (staged)"` string to communicate
 * context clearly.
 *
 * This covers the spec-vs-spec flow introduced in Step 3f (plan: snuggly-wibbling-lobster).
 */
export const ComparisonHeader: Story = {
  args: {
    driftResult: fullDriftResult,
  },
  render: (args) => {
    resetStore({ comparisonHeader: 'Comparing v1.5.0 (active) → v2.0.0 (staged)' });
    return <DriftReviewDrawer {...args} />;
  },
  beforeEach: () => {
    resetStore({ comparisonHeader: 'Comparing v1.5.0 (active) → v2.0.0 (staged)' });
  },
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Drawer is open', async () => {
      await waitFor(async () => {
        await expect(body.getByTestId('drift-review-drawer')).toBeInTheDocument();
      });
    });

    await step('Shows comparison header instead of default title', async () => {
      await expect(body.getByTestId('drift-drawer-comparison-header')).toHaveTextContent(
        'Comparing v1.5.0 (active) → v2.0.0 (staged)'
      );
      await expect(body.queryByTestId('drift-drawer-title')).toBeNull();
    });

    await step('Still renders change groups and bulk actions', async () => {
      await expect(body.getByTestId('drift-group-removed')).toBeInTheDocument();
      await expect(body.getByTestId('drift-group-changed')).toBeInTheDocument();
      await expect(body.getByTestId('drift-group-added')).toBeInTheDocument();
      await expect(body.getByTestId('drift-drawer-accept-all')).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Spec-vs-spec comparison mode. The drawer title is replaced with a version range string ' +
          '("Comparing v1.5.0 (active) → v2.0.0 (staged)") when opened from the version switcher ' +
          '"Compare" action. All change groups and bulk actions behave identically to the standard mode.',
      },
    },
  },
};

/**
 * Comparison header with unknown active version — when a collection has no
 * stored `spec_version`, the fallback text `"current spec"` avoids the
 * redundant phrasing `"active (active)"`.
 */
export const ComparisonHeaderUnknownVersion: Story = {
  args: {
    driftResult: minimalDriftResult,
  },
  render: (args) => {
    resetStore({ comparisonHeader: 'Comparing current spec (active) → v1.0.0 (staged)' });
    return <DriftReviewDrawer {...args} />;
  },
  beforeEach: () => {
    resetStore({ comparisonHeader: 'Comparing current spec (active) → v1.0.0 (staged)' });
  },
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Shows "current spec" fallback in comparison header', async () => {
      await waitFor(async () => {
        await expect(body.getByTestId('drift-drawer-comparison-header')).toHaveTextContent(
          'Comparing current spec (active) → v1.0.0 (staged)'
        );
      });
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'When the existing collection has no stored `spec_version`, the fallback text ' +
          '"current spec" replaces the version label so the header reads ' +
          '"Comparing current spec (active) → v1.0.0 (staged)" — avoiding the redundant ' +
          '"active (active)" phrasing.',
      },
    },
  },
};

/**
 * All-reviewed state — shown when every change has been accepted or ignored.
 * Displays "All changes reviewed" with a Done button.
 */
export const AllReviewed: Story = {
  args: {
    driftResult: minimalDriftResult,
  },
  render: (args) => {
    resetStore({
      reviewState: {
        [`${COLLECTION_ID}:DELETE:/books/{id}`]: { status: 'accepted' },
      },
    });
    return <DriftReviewDrawer {...args} />;
  },
  beforeEach: () => {
    resetStore({
      reviewState: {
        [`${COLLECTION_ID}:DELETE:/books/{id}`]: { status: 'accepted' },
      },
    });
  },
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Shows all-reviewed empty state', async () => {
      await waitFor(async () => {
        await expect(body.getByTestId('drift-drawer-all-reviewed')).toBeInTheDocument();
      });
      await expect(body.getByTestId('drift-drawer-done')).toBeInTheDocument();
    });

    await step('No change group sections visible', async () => {
      await expect(body.queryByTestId('drift-group-removed')).toBeNull();
      await expect(body.queryByTestId('drift-group-changed')).toBeNull();
      await expect(body.queryByTestId('drift-group-added')).toBeNull();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'When every change has been accepted or ignored, the drawer shows an "All changes reviewed" ' +
          'message with a Done button that closes the drawer.',
      },
    },
  },
};
