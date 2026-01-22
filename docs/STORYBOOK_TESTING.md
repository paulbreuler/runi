# Storybook Testing Guide

Complete guide to testing with Storybook in the runi project.

## Overview

Storybook serves as both a **documentation tool** and a **comprehensive testing platform** for runi components. All 62+ story files include play functions that test component interactions, accessibility, and visual states.

## Testing Infrastructure

### Vitest Addon

**Status**: ✅ Configured

The `@storybook/addon-vitest` automatically converts stories with play functions into test cases that run in CI/CD.

**Configuration**: `.storybook/main.ts`

```typescript
import { addonVitest } from '@storybook/addon-vitest';

export default {
  addons: [
    addonVitest({
      configFile: 'vitest.config.storybook.ts',
    }),
  ],
};
```

**Running Tests**:

```bash
# Run Storybook tests via Vitest
npm run test-storybook

# Or run Storybook in dev mode
npm run storybook
```

### Visual Testing

**Status**: ✅ Configured (Playwright)

Visual regression testing is handled by Playwright tests in `tests/visual/storybook-visual.spec.ts`. These tests capture screenshots of stories and compare them against baselines.

**Running Visual Tests**:

```bash
# Run visual regression tests
npm run test:visual

# Update baselines (after intentional changes)
npm run test:visual -- --update-snapshots
```

### Accessibility Testing

**Status**: ✅ Configured

The `@storybook/addon-a11y` automatically checks all stories for WCAG 2.1 AA compliance violations.

**Features**:

- Automatic color contrast checks
- ARIA attribute validation
- Semantic HTML verification
- Keyboard navigation testing (via play functions)

**Viewing Results**: Open the "Accessibility" panel in Storybook to see violations.

## Play Functions

All stories include `play` functions that test component interactions automatically.

### What Play Functions Test

- **Keyboard Navigation**: Tab order, Enter/Space activation, Arrow key navigation
- **Focus Management**: Focus restoration, focus indicators, focus traps
- **User Interactions**: Click handlers, form submission, state changes
- **Accessibility**: ARIA attributes, semantic HTML, screen reader compatibility
- **Visual States**: Loading, error, empty states, theme variations

### Example Play Function

```tsx
import { expect, userEvent, within } from 'storybook/test';

export const KeyboardNavigationTest: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByTestId('submit-button');

    await step('Tab to button and activate', async () => {
      await userEvent.tab();
      await expect(button).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await expect(button).toHaveAttribute('aria-pressed', 'true');
    });
  },
};
```

## Testing Utilities

Use utilities from `@/utils/storybook-test-helpers` for common testing patterns.

### `tabToElement(target, maxTabs?)`

Tabs through focusable elements until the target receives focus.

```tsx
import { tabToElement } from '@/utils/storybook-test-helpers';

const button = canvas.getByTestId('submit-button');
const focused = await tabToElement(button, 5);
expect(focused).toBe(true);
```

### `waitForFocus(element, timeout?)`

Waits for an element to receive focus. Default timeout: 5000ms.

```tsx
import { waitForFocus } from '@/utils/storybook-test-helpers';

await waitForFocus(button, 1000);
await expect(button).toHaveFocus();
```

### `waitForRemount(selector, timeout?)`

Waits for an element to be removed and re-added to the DOM. Default timeout: 5000ms.

```tsx
import { waitForRemount } from '@/utils/storybook-test-helpers';

await waitForRemount('[data-test-id="form"]', 2000);
```

### `waitForState(getState, expected, timeout?)`

Waits for a state value to match an expected value. Default timeout: 5000ms.

```tsx
import { waitForState } from '@/utils/storybook-test-helpers';

let count = 0;
const getCount = () => count;
setTimeout(() => {
  count = 5;
}, 100);
await waitForState(getCount, 5, 1000);
```

## Story Templates

Templates are located in `.storybook/templates/` and provide reusable patterns for common story types.

### Interaction Story Template

**File**: `.storybook/templates/interaction-story.template.tsx`

**Use When**:

- Testing keyboard navigation (Tab, Enter, Space, Arrow keys)
- Testing click interactions and state changes
- Testing form input and submission
- Testing user flows and workflows

### Accessibility Story Template

**File**: `.storybook/templates/accessibility-story.template.tsx`

**Use When**:

- Testing ARIA attributes and roles
- Testing keyboard navigation and focus management
- Testing screen reader compatibility
- Ensuring WCAG 2.1 AA compliance

### Visual Story Template

**File**: `.storybook/templates/visual-story.template.tsx`

**Use When**:

- Testing visual regression (screenshots)
- Testing responsive layout on different viewports
- Testing theme variations (light/dark)
- Testing loading, error, and empty states

See `docs/STORYBOOK_TEMPLATES.md` for detailed template usage.

## Test Selectors

**CRITICAL**: Always use `data-test-id` attributes for test selectors.

- Components must include `data-test-id` attributes on all interactive elements
- Test files must use `getByTestId()` or `screen.getByTestId()` for finding elements
- Exception: Use semantic queries (`getByRole`, `getByLabel`) only when testing accessibility

**Example**:

```tsx
// Component
<button data-test-id="save-button">Save</button>;

// Test
const button = canvas.getByTestId('save-button');
```

## Playwright vs Play Functions

### When to Use Play Functions

- **Component interactions** (recommended for most cases)
- **Accessibility testing** (keyboard navigation, focus management)
- **Visual state verification** (loading, error, empty states)
- **Form validation** and user flows
- **Fast feedback** during development

### When to Use Playwright

- **Cross-browser testing** (Chrome, Firefox, Safari)
- **Complex multi-component flows** that span multiple stories
- **Visual regression** (screenshot comparison)
- **End-to-end workflows** that require navigation between pages
- **Keyboard navigation testing** (more reliable than play functions for Tab + Space)

### Example: DockablePanel Focus Restoration

The `DockablePanel` component has both:

1. **Play function** (`FocusRestorationTest` story): Tests focus restoration using `userEvent.click()` - fast, reliable for development
2. **Playwright test** (`tests/e2e/dock-controls-focus.storybook.spec.ts`): Tests keyboard navigation (Tab + Space) - valuable for cross-browser validation

**Decision**: Keep both - play function for fast feedback, Playwright for comprehensive keyboard navigation testing across browsers.

## Running Tests

### Development

```bash
# Start Storybook (tests run automatically when viewing stories)
npm run storybook

# View interaction tests:
# 1. Select a story from sidebar
# 2. Switch to "Canvas" tab (not "Docs")
# 3. Open "Interactions" panel at bottom
# 4. Tests run automatically
```

### CI/CD

```bash
# Run all Storybook tests via Vitest
npm run test-storybook

# Run visual regression tests
npm run test:visual

# Run E2E tests (includes Storybook tests)
npm run test:e2e
```

## Best Practices

### Play Functions

- Use `step()` to organize test actions into logical groups
- Keep steps focused on a single interaction or verification
- Use descriptive step names that explain what is being tested
- Use testing utilities for common patterns (tab navigation, focus waiting)

### Test IDs

- **Always use `data-test-id` attributes** for test selectors
- Make test IDs descriptive and stable (not dependent on text content)
- Use `getByTestId()` instead of `getByText()` or `getByRole()` for component identification
- Exception: Use semantic queries (`getByRole`, `getByLabel`) only when testing accessibility

### Accessibility

- Enable the a11y addon in story parameters for automatic checks
- Test keyboard navigation manually (a11y addon doesn't test this)
- Verify focus indicators are visible (use `waitForFocus()` to verify)
- Test with screen readers when possible
- Ensure all interactive elements have accessible names (aria-label, aria-labelledby, or text content)

### Visual Testing

- Use consistent viewport sizes for visual regression
- Test both light and dark themes
- Test responsive breakpoints (mobile, tablet, desktop)
- Use Playwright for automated visual regression

### Story Structure

- Keep stories minimal and focused (1 concept per story)
- Add brief JSDoc comments explaining each story's purpose
- Use `storybook/test` utilities (`expect`, `userEvent`, `within`) for assertions
- Don't duplicate unit test coverage in stories
- Limit to 6-8 stories per component

## Coverage

All 62+ story files include play functions that test:

- ✅ **UI Components** (15 files) - Button, Input, Select, Checkbox, Card, Toast, etc.
- ✅ **Layout Components** (5 files) - MainLayout, Sidebar, DockablePanel, StatusBar, TitleBar
- ✅ **Request Components** (5 files) - AuthEditor, BodyEditor, HeaderEditor, ParamsEditor, RequestHeader
- ✅ **Response Components** (2 files) - ResponseViewer, StatusBadge
- ✅ **History Components** (6 files) - NetworkHistoryPanel, FilterBar, CopyButton, LanguageTabs, etc.
- ✅ **Console Components** (2 files) - ConsolePanel, ConsoleToolbar
- ✅ **DataGrid Components** (10+ files) - VirtualDataGrid, columns, tabs, accessibility stories

## Related Documentation

- `CLAUDE.md` - Storybook best practices section
- `docs/STORYBOOK_10_FEATURES.md` - Storybook 10 features adopted
- `docs/STORYBOOK_TEMPLATES.md` - Detailed template usage guide
- `src/utils/storybook-test-helpers.ts` - Testing utility source code
- `.storybook/templates/` - Story template files
- `.cursor/skills/storybook-testing/SKILL.md` - Complete testing guide
