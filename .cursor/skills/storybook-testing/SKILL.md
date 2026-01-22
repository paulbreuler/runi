---
name: storybook-testing
version: 1.0.0
description: Create and test Storybook stories with play functions, accessibility verification, and visual regression. Use this skill when creating, updating, or testing Storybook stories for runi components. Ensures consistent testing patterns, keyboard navigation, focus management, WCAG 2.1 AA compliance, and proper use of story templates and testing utilities.
---

# Storybook Testing

This skill guides creation of Storybook stories with consistent testing patterns, play functions, and accessibility verification.

## When to Use

- Creating new Storybook stories for components
- Adding play functions to test interactions
- Testing keyboard navigation and accessibility
- Creating visual regression test stories
- Ensuring WCAG 2.1 AA compliance in stories

## Story Templates

Templates are located in `.storybook/templates/` and provide reusable patterns for common story types.

### Interaction Story Template

**File**: `.storybook/templates/interaction-story.template.tsx`

**Use When**:

- Testing keyboard navigation (Tab, Enter, Space, Arrow keys)
- Testing click interactions and state changes
- Testing form input and submission
- Testing user flows and workflows

**Key Patterns**:

- Use `tabToElement()` from `@/utils/storybook-test-helpers` for keyboard navigation
- Use `step()` to organize test actions into logical groups
- Test one interaction concept per story

**Example**:

```tsx
import { expect, userEvent, within } from '@storybook/test';
import { tabToElement } from '@/utils/storybook-test-helpers';

export const KeyboardNavigationTest: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByTestId('submit-button');

    await step('Tab to button', async () => {
      const focused = await tabToElement(button, 5);
      expect(focused).toBe(true);
      await expect(button).toHaveFocus();
    });
  },
};
```

### Accessibility Story Template

**File**: `.storybook/templates/accessibility-story.template.tsx`

**Use When**:

- Testing ARIA attributes and roles
- Testing keyboard navigation and focus management
- Testing screen reader compatibility
- Ensuring WCAG 2.1 AA compliance

**Key Patterns**:

- Enable a11y addon in story parameters for automatic checks
- Use `waitForFocus()` for focus management tests
- Test keyboard navigation manually (a11y addon doesn't test this)
- Verify all interactive elements have accessible names

**Example**:

```tsx
import { waitForFocus } from '@/utils/storybook-test-helpers';

export const FocusManagementTest: Story = {
  parameters: {
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Focus moves to first element', async () => {
      const firstElement = canvas.getByTestId('first-focusable');
      await waitForFocus(firstElement, 1000);
      await expect(firstElement).toHaveFocus();
    });
  },
};
```

### Visual Story Template

**File**: `.storybook/templates/visual-story.template.tsx`

**Use When**:

- Testing visual regression (screenshots)
- Testing responsive layout on different viewports
- Testing theme variations (light/dark)
- Testing loading, error, and empty states
- Testing animations and transitions

**Key Patterns**:

- Configure viewport in story parameters
- Test both light and dark themes
- Use consistent viewport sizes for visual regression
- Use Playwright for automated visual regression (see `tests/visual/`)

**Example**:

```tsx
export const LoadingState: Story = {
  render: (args) => <ComponentName {...args} isLoading={true} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const loadingIndicator = canvas.getByTestId('loading-indicator');
    await expect(loadingIndicator).toBeVisible();
  },
};
```

## Testing Utilities

Use utilities from `@/utils/storybook-test-helpers` for common testing patterns.

### `tabToElement(target, maxTabs?)`

Tabs through focusable elements until the target receives focus.

```tsx
const button = canvas.getByTestId('submit-button');
const focused = await tabToElement(button, 5);
expect(focused).toBe(true);
```

### `waitForFocus(element, timeout?)`

Waits for an element to receive focus. Default timeout: 5000ms.

```tsx
await waitForFocus(button, 1000);
await expect(button).toHaveFocus();
```

### `waitForRemount(selector, timeout?)`

Waits for an element to be removed and re-added to the DOM. Default timeout: 5000ms.

```tsx
await waitForRemount('[data-test-id="form"]', 2000);
```

### `waitForState(getState, expected, timeout?)`

Waits for a state value to match an expected value. Default timeout: 5000ms.

```tsx
let count = 0;
const getCount = () => count;
setTimeout(() => {
  count = 5;
}, 100);
await waitForState(getCount, 5, 1000);
```

## Story Naming Conventions

Follow these naming patterns:

- `Default` - Basic component with default props
- `WithContent` - Component with realistic content
- `[StateName]` - Specific state (e.g., `LoadingState`, `ErrorState`)
- `FullIntegration` - Component with real child components
- `[Feature]Test` - Stories with play functions for automated testing

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
- Exception: Use semantic queries (`getByRole`, `getByLabel`) only when testing accessibility, not for component identification

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
- Use Playwright for automated visual regression (see `tests/visual/storybook-visual.spec.ts`)

### Story Structure

- Keep stories minimal and focused (1 concept per story)
- Add brief JSDoc comments explaining each story's purpose
- Use `@storybook/test` utilities (`expect`, `userEvent`, `within`) for assertions
- Don't duplicate unit test coverage in stories
- Limit to 6-8 stories per component

## Example Stories

See existing stories for reference:

- `src/components/Layout/DockablePanel.stories.tsx` - Interaction and focus testing
- `src/components/PanelTabs.stories.tsx` - Tab navigation testing
- `src/components/History/ResponseTab.stories.tsx` - Visual state testing

## Testing Approaches

1. **Play Functions** - For component interactions (recommended for most cases)
2. **Playwright E2E** - For complex multi-component flows (see `tests/e2e/`)
3. **Vitest Addon** - Convert stories to test cases automatically
4. **Accessibility Addon** - Automatic a11y checks on all stories

## Related Documentation

- `CLAUDE.md` - Storybook best practices section
- `docs/STORYBOOK_10_FEATURES.md` - Storybook 10 features
- `src/utils/storybook-test-helpers.ts` - Testing utility source code
- `.storybook/templates/` - Story template files
