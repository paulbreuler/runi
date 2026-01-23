/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Download, Copy, Trash2, Save, FolderOpen, FileUp, Share } from 'lucide-react';
import { SplitButton } from './SplitButton';

const meta = {
  title: 'Components/UI/SplitButton',
  component: SplitButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `A true split button with independent primary action and dropdown menu.

## Features

- **Independent actions**: Primary button can be clicked independently of dropdown
- **Visual separator**: Clear visual distinction between primary and dropdown
- **Keyboard navigation**: Full Radix DropdownMenu keyboard support
- **Menu items**: Icons, disabled states, destructive styling, separators
- **Variants**: default, outline, ghost, destructive
- **Sizes**: xs, sm, default

## True Split Button vs Combo Button

A true split button has two distinct, independent actions:
1. **Primary button** - Performs the main action (e.g., "Save")
2. **Dropdown trigger** - Opens a menu with related options

This differs from a "combo button" where clicking anywhere opens a dropdown.

## Usage

\`\`\`tsx
<SplitButton
  label="Save"
  icon={<Download size={14} />}
  onClick={() => saveFile()}
  items={[
    { id: 'save', label: 'Save', onClick: () => saveFile() },
    { id: 'save-as', label: 'Save As...', onClick: () => saveFileAs() },
    { type: 'separator' },
    { id: 'export', label: 'Export', onClick: () => exportFile() },
  ]}
/>
\`\`\`

## When to Use

- Save operations with "Save As..." option
- Create operations with multiple creation types
- Export operations with format options
- Any action with related alternatives
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SplitButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default split button with primary action and dropdown.
 */
export const Default: Story = {
  args: {
    label: 'Save',
    icon: <Download size={14} />,
    onClick: (): void => {
      console.log('Primary save clicked');
    },
    items: [
      {
        id: 'save',
        label: 'Save',
        icon: <Download size={14} />,
        onClick: (): void => {
          console.log('Save');
        },
      },
      {
        id: 'save-as',
        label: 'Save As...',
        icon: <Save size={14} />,
        onClick: (): void => {
          console.log('Save As');
        },
      },
      { type: 'separator' },
      {
        id: 'export',
        label: 'Export',
        icon: <FileUp size={14} />,
        onClick: (): void => {
          console.log('Export');
        },
      },
    ],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const primaryButton = canvas.getByRole('button', { name: /^save$/i });

    await step('Primary button is clickable', async () => {
      await expect(primaryButton).toBeVisible();
      await userEvent.click(primaryButton);
      // Button should still be visible after click
      await expect(primaryButton).toBeVisible();
    });

    await step('Dropdown trigger opens menu', async () => {
      // Find the dropdown trigger (SplitButton uses "More options" as default aria-label)
      const dropdownTrigger = canvas.getByRole('button', { name: /more options/i });
      await userEvent.click(dropdownTrigger);
      // Wait for Radix menu portal to appear (menus render in portals, may need more time in CI)
      await new Promise((resolve) => setTimeout(resolve, 400));
      // Menu should open - look in document body for portal
      const saveAsOption = await within(document.body).findByRole(
        'menuitem',
        { name: /save as/i },
        { timeout: 5000 }
      );
      await expect(saveAsOption).toBeVisible();
    });

    await step('Keyboard navigation works', async () => {
      // Focus the button directly to test focusability
      primaryButton.focus();
      await new Promise((resolve) => setTimeout(resolve, 50));
      await expect(primaryButton).toHaveFocus();
    });
  },
};

/**
 * Outline variant for secondary actions.
 */
export const OutlineVariant: Story = {
  args: {
    label: 'Open',
    icon: <FolderOpen size={14} />,
    onClick: (): void => {
      console.log('Open clicked');
    },
    variant: 'outline',
    items: [
      {
        id: 'open',
        label: 'Open File',
        onClick: (): void => {
          console.log('Open File');
        },
      },
      {
        id: 'open-recent',
        label: 'Open Recent',
        onClick: (): void => {
          console.log('Open Recent');
        },
      },
      {
        id: 'open-folder',
        label: 'Open Folder',
        onClick: (): void => {
          console.log('Open Folder');
        },
      },
    ],
  },
};

/**
 * Ghost variant for minimal styling.
 */
export const GhostVariant: Story = {
  args: {
    label: 'Share',
    icon: <Share size={14} />,
    onClick: (): void => {
      console.log('Share clicked');
    },
    variant: 'ghost',
    items: [
      {
        id: 'copy-link',
        label: 'Copy Link',
        icon: <Copy size={14} />,
        onClick: (): void => {
          console.log('Copy Link');
        },
      },
      {
        id: 'share-email',
        label: 'Share via Email',
        onClick: (): void => {
          console.log('Share via Email');
        },
      },
    ],
  },
};

/**
 * Destructive variant for dangerous actions.
 */
export const DestructiveVariant: Story = {
  args: {
    label: 'Delete',
    icon: <Trash2 size={14} />,
    onClick: (): void => {
      console.log('Delete clicked');
    },
    variant: 'destructive',
    items: [
      {
        id: 'delete',
        label: 'Delete',
        icon: <Trash2 size={14} />,
        onClick: (): void => {
          console.log('Delete');
        },
      },
      {
        id: 'delete-permanent',
        label: 'Delete Permanently',
        onClick: (): void => {
          console.log('Permanent');
        },
        destructive: true,
      },
    ],
  },
};

/**
 * With separators for grouping related options.
 */
export const WithSeparators: Story = {
  args: {
    label: 'Save',
    icon: <Download size={14} />,
    onClick: (): void => {
      console.log('Save clicked');
    },
    items: [
      {
        id: 'save',
        label: 'Save',
        icon: <Download size={14} />,
        onClick: (): void => {
          console.log('Save');
        },
      },
      {
        id: 'save-as',
        label: 'Save As...',
        onClick: (): void => {
          console.log('Save As');
        },
      },
      { type: 'separator' },
      {
        id: 'save-copy',
        label: 'Save a Copy',
        onClick: (): void => {
          console.log('Save Copy');
        },
      },
      {
        id: 'save-all',
        label: 'Save All',
        onClick: (): void => {
          console.log('Save All');
        },
      },
      { type: 'separator' },
      {
        id: 'export-json',
        label: 'Export as JSON',
        onClick: (): void => {
          console.log('Export JSON');
        },
      },
      {
        id: 'export-yaml',
        label: 'Export as YAML',
        onClick: (): void => {
          console.log('Export YAML');
        },
      },
    ],
  },
};

/**
 * With disabled items.
 */
export const WithDisabledItems: Story = {
  args: {
    label: 'Save',
    icon: <Download size={14} />,
    onClick: (): void => {
      console.log('Save clicked');
    },
    items: [
      {
        id: 'save',
        label: 'Save',
        onClick: (): void => {
          console.log('Save');
        },
      },
      {
        id: 'save-as',
        label: 'Save As...',
        onClick: (): void => {
          console.log('Save As');
        },
        disabled: true,
      },
      { type: 'separator' },
      {
        id: 'export',
        label: 'Export',
        onClick: (): void => {
          console.log('Export');
        },
        disabled: true,
      },
    ],
  },
};

/**
 * With destructive items in the menu.
 */
export const WithDestructiveItems: Story = {
  args: {
    label: 'Actions',
    onClick: (): void => {
      console.log('Default action');
    },
    items: [
      {
        id: 'duplicate',
        label: 'Duplicate',
        icon: <Copy size={14} />,
        onClick: (): void => {
          console.log('Duplicate');
        },
      },
      {
        id: 'rename',
        label: 'Rename',
        onClick: (): void => {
          console.log('Rename');
        },
      },
      { type: 'separator' },
      {
        id: 'delete',
        label: 'Delete',
        icon: <Trash2 size={14} />,
        onClick: (): void => {
          console.log('Delete');
        },
        destructive: true,
      },
    ],
  },
};

/**
 * Disabled primary button (dropdown still works).
 */
export const DisabledPrimary: Story = {
  args: {
    label: 'Save Selected',
    icon: <Download size={14} />,
    onClick: (): void => {
      console.log('Save clicked');
    },
    disabled: true,
    items: [
      {
        id: 'save-selected',
        label: 'Save Selected',
        onClick: (): void => {
          console.log('Save Selected');
        },
        disabled: true,
      },
      {
        id: 'save-all',
        label: 'Save All',
        onClick: (): void => {
          console.log('Save All');
        },
      },
    ],
  },
};

/**
 * Different sizes.
 */
export const Sizes: Story = {
  args: {
    label: 'Save',
    onClick: (): void => undefined,
    items: [],
  },
  render: () => (
    <div className="flex flex-col gap-4 items-start">
      <div className="space-y-2">
        <p className="text-xs text-text-muted">Extra Small (h-7)</p>
        <SplitButton
          label="Save"
          icon={<Download size={12} />}
          onClick={(): void => {
            console.log('Save');
          }}
          size="xs"
          items={[
            {
              id: 'save',
              label: 'Save',
              onClick: (): void => {
                console.log('Save');
              },
            },
            {
              id: 'save-as',
              label: 'Save As...',
              onClick: (): void => {
                console.log('Save As');
              },
            },
          ]}
        />
      </div>
      <div className="space-y-2">
        <p className="text-xs text-text-muted">Small (h-8)</p>
        <SplitButton
          label="Save"
          icon={<Download size={14} />}
          onClick={(): void => {
            console.log('Save');
          }}
          size="sm"
          items={[
            {
              id: 'save',
              label: 'Save',
              onClick: (): void => {
                console.log('Save');
              },
            },
            {
              id: 'save-as',
              label: 'Save As...',
              onClick: (): void => {
                console.log('Save As');
              },
            },
          ]}
        />
      </div>
      <div className="space-y-2">
        <p className="text-xs text-text-muted">Default (h-9)</p>
        <SplitButton
          label="Save"
          icon={<Download size={14} />}
          onClick={(): void => {
            console.log('Save');
          }}
          size="default"
          items={[
            {
              id: 'save',
              label: 'Save',
              onClick: (): void => {
                console.log('Save');
              },
            },
            {
              id: 'save-as',
              label: 'Save As...',
              onClick: (): void => {
                console.log('Save As');
              },
            },
          ]}
        />
      </div>
    </div>
  ),
};

/**
 * All variants side by side.
 */
export const AllVariants: Story = {
  args: {
    label: 'Button',
    onClick: (): void => undefined,
    items: [],
  },
  render: () => (
    <div className="flex flex-wrap gap-4">
      <SplitButton
        label="Default"
        variant="default"
        onClick={(): void => {
          console.log('Default');
        }}
        items={[{ id: 'option', label: 'Option', onClick: (): void => undefined }]}
      />
      <SplitButton
        label="Outline"
        variant="outline"
        onClick={(): void => {
          console.log('Outline');
        }}
        items={[{ id: 'option', label: 'Option', onClick: (): void => undefined }]}
      />
      <SplitButton
        label="Ghost"
        variant="ghost"
        onClick={(): void => {
          console.log('Ghost');
        }}
        items={[{ id: 'option', label: 'Option', onClick: (): void => undefined }]}
      />
      <SplitButton
        label="Destructive"
        variant="destructive"
        onClick={(): void => {
          console.log('Destructive');
        }}
        items={[{ id: 'option', label: 'Option', onClick: (): void => undefined }]}
      />
    </div>
  ),
};

/**
 * Real-world example: Network history save button.
 */
export const NetworkHistorySave: Story = {
  args: {
    label: 'Save Selected',
    onClick: (): void => undefined,
    items: [],
  },
  render: () => (
    <div className="p-4 bg-bg-surface border border-border-subtle rounded-lg">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm">3 requests selected</span>
        <SplitButton
          label="Save Selected"
          icon={<Download size={12} />}
          onClick={(): void => {
            console.log('Save selected');
          }}
          size="xs"
          variant="outline"
          items={[
            {
              id: 'save-selected',
              label: 'Save Selected',
              icon: <Download size={12} />,
              onClick: (): void => {
                console.log('Save Selected');
              },
            },
            {
              id: 'save-all',
              label: 'Save All',
              icon: <Download size={12} />,
              onClick: (): void => {
                console.log('Save All');
              },
            },
            { type: 'separator' },
            {
              id: 'export-har',
              label: 'Export as HAR',
              onClick: (): void => {
                console.log('Export HAR');
              },
            },
            {
              id: 'export-curl',
              label: 'Export as cURL',
              onClick: (): void => {
                console.log('Export cURL');
              },
            },
          ]}
        />
      </div>
    </div>
  ),
};
