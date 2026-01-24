# Storybook 10 Features

This document describes the Storybook 10 features adopted in the runi project.

## Overview

Storybook 10 introduced several key improvements:

- **ESM-only** format (29% smaller install size)
- **Module automocking** with `sb.mock`
- **CSF Factories** (Preview) for better type safety
- **Tag filtering exclusion** for sidebar management
- **UI editing optimizations** (QR codes, open in editor)
- **Controls for state variations** - Use controls instead of separate stories for every prop combination

## Tag Filtering Exclusion

**Status**: ✅ Configured

Tag filtering allows you to exclude stories from the sidebar based on tags. This is useful for:

- Hiding experimental features from non-technical collaborators
- Separating test stories from documentation stories
- Managing large Storybooks with thousands of stories

### Configuration

Configured in `.storybook/main.ts`:

```typescript
tags: {
  experimental: {
    defaultFilterSelection: 'exclude',
  },
  test: {
    defaultFilterSelection: 'exclude',
  },
}
```

### Usage in Stories

Add tags to stories to control their visibility:

```typescript
export const ExperimentalFeature: Story = {
  tags: ['experimental'],
  // ... story config
};

export const TestStory: Story = {
  tags: ['test'],
  // ... story config
};
```

### Filtering in UI

Users can toggle tag filters in the Storybook sidebar:

- Click the filter icon
- Select tags to include or exclude
- Excluded tags hide matching stories from sidebar

## Module Automocking (sb.mock)

**Status**: ✅ Available (import from `storybook/test`)

Storybook 10 introduces `sb.mock` for simplified module mocking that works in both dev and production builds, compatible with both Vite and Webpack.

**Important**: `sb.mock` is available from `'storybook/test'`, NOT `'@storybook/test'`. The `@storybook/test` package is a separate package for test utilities, while `storybook/test` is the Storybook 10 testing API.

### Before (vi.mock)

```typescript
import { vi } from 'vitest';

vi.mock('@/utils/api', () => ({
  fetchData: vi.fn(() => Promise.resolve([])),
}));
```

### After (sb.mock)

**In `.storybook/preview.ts`** (register mocks globally):

```typescript
import { sb } from 'storybook/test';

// Register mocks at preview level (applies to all stories)
sb.mock(import('../src/utils/api.ts'), { spy: true }); // Spy-only (keeps original behavior)
// OR
sb.mock(import('../src/utils/api.ts')); // Fully automocked (replaces with mocks)
```

**In stories** (use mocked modules):

```typescript
import { expect, mocked } from 'storybook/test';
import { fetchData } from '@/utils/api';

export const MyStory: Story = {
  beforeEach: async () => {
    // Override mock behavior per story
    mocked(fetchData).mockReturnValue([{ id: 1, name: 'Test' }]);
  },
  play: async ({ canvas }) => {
    // Use the mocked module
    expect(fetchData).toHaveBeenCalled();
  },
};
```

### Key Points

- **Register mocks in `.storybook/preview.ts`** - not in individual stories
- **Use relative paths with file extensions** - e.g., `import('../src/utils/api.ts')`
- **Cannot use aliases** - must use relative paths from `.storybook/preview.ts`
- **TypeScript**: Wrap in `import(...)` for proper type resolution
- **Spy vs Mock**: `{ spy: true }` keeps original behavior, default replaces with mocks

### Current Usage in Project

We use `sb.mock` in `.storybook/preview.ts` to provide consistent behavior for DataGrid stories. Example mocks can be added as needed for utilities or services used across multiple stories.

## CSF Factories (Preview)

**Status**: ⚠️ Optional (Preview in SB10, default in SB11)

CSF Factories provide better type safety and autocompletion for story definitions. They're in Preview status in Storybook 10 and will become the default in Storybook 11.

### Current CSF 3 Format

```typescript
import type { Meta, StoryObj } from '@storybook/react-vite';
import Button from './Button';

const meta = {
  component: Button,
} satisfies Meta<typeof Button>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { label: 'Button', primary: true },
};
```

### CSF Factories Format

```typescript
import preview from '../.storybook/preview';
import Button from './Button';

const meta = preview.meta({ component: Button });

export const Primary = meta.story({
  args: { label: 'Button', primary: true },
});
```

### Benefits

- Less boilerplate (no type assignments needed)
- Better autocompletion
- Improved type safety
- Cleaner syntax

### Migration Strategy

- **Optional**: Evaluate for new stories
- **Full migration**: Can wait for Storybook 11 when it becomes default
- **Codemod available**: `npx storybook@latest migrate csf-3-to-factories`

## UI Editing Optimizations

**Status**: ✅ Available (built into Storybook 10)

Storybook 10 includes UI improvements for editing and sharing:

### QR Code Sharing

- Click the share menu in Storybook
- Select "Scan me with QR code"
- Scan with mobile device to view story on phone

### Open in Editor

- Right-click a story in the sidebar
- Select "Open in editor"
- Opens story file in your default editor at the correct line

## Experimental Test Syntax

**Status**: 🔬 Early Access (future consideration)

Storybook 10 introduces experimental `.test()` method for attaching tests to stories:

```typescript
export const Disabled = meta.story({ args: { disabled: true } });

Disabled.test('should be disabled', async ({ canvas, userEvent, args }) => {
  const button = await canvas.findByRole('button');
  await userEvent.click(button);
  await expect(button).toBeDisabled();
  await expect(args.onClick).not.toHaveBeenCalled();
});
```

**Status**: Monitor early access program, adopt when stable.

## ESM-Only Format

**Status**: ✅ Already Migrated

Storybook 10 is ESM-only (no CommonJS support). The project has already been migrated:

- `.storybook/main.ts` uses ESM format (`import`/`export`)
- Requires Node 20.16+, 22.19+, or 24+ (already verified)

## References

- [Storybook 10 Release Notes](https://storybook.js.org/blog/storybook-10/)
- [Tag Filtering Documentation](https://storybook.js.org/docs/configure/storybook-tags)
- [CSF Factories RFC](https://github.com/storybookjs/storybook/discussions)
- [Module Automocking](https://storybook.js.org/docs/writing-tests/module-mocking)
