# Storybook Story Templates

Complete guide to using story templates for consistent, testable Storybook stories.

## Overview

Templates are located in `.storybook/templates/` and provide reusable patterns for common story types. All templates include:

- Proper TypeScript types
- Play function structure
- Testing utilities integration
- Accessibility considerations
- Documentation comments

## Available Templates

### 1. Interaction Story Template

**File**: `.storybook/templates/interaction-story.template.tsx`

**Use When**:

- Testing keyboard navigation (Tab, Enter, Space, Arrow keys)
- Testing click interactions and state changes
- Testing form input and submission
- Testing user flows and workflows

**Key Features**:

- Uses `tabToElement()` from `@/utils/storybook-test-helpers` for keyboard navigation
- Uses `step()` to organize test actions into logical groups
- Tests one interaction concept per story

**Example Usage**:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { tabToElement } from '@/utils/storybook-test-helpers';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Test keyboard navigation to button and activation.
 */
export const KeyboardNavigationTest: Story = {
  args: {
    label: 'Submit',
    onClick: () => {},
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByTestId('submit-button');

    await step('Tab to button', async () => {
      const focused = await tabToElement(button, 5);
      expect(focused).toBe(true);
      await expect(button).toHaveFocus();
    });

    await step('Activate button with Enter', async () => {
      await userEvent.keyboard('{Enter}');
      // Verify button was activated
    });
  },
};
```

### 2. Accessibility Story Template

**File**: `.storybook/templates/accessibility-story.template.tsx`

**Use When**:

- Testing ARIA attributes and roles
- Testing keyboard navigation and focus management
- Testing screen reader compatibility
- Ensuring WCAG 2.1 AA compliance

**Key Features**:

- Enables a11y addon in story parameters for automatic checks
- Uses `waitForFocus()` for focus management tests
- Tests keyboard navigation manually (a11y addon doesn't test this)
- Verifies all interactive elements have accessible names

**Example Usage**:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { waitForFocus } from '@/utils/storybook-test-helpers';
import { Modal } from './Modal';

const meta = {
  title: 'Components/Modal',
  component: Modal,
  tags: ['autodocs'],
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Test focus management when modal opens and closes.
 */
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

    await step('Tab order is correct', async () => {
      const first = canvas.getByTestId('first-focusable');
      const second = canvas.getByTestId('second-focusable');

      await userEvent.tab();
      await expect(second).toHaveFocus();
    });
  },
};
```

### 3. Visual Story Template

**File**: `.storybook/templates/visual-story.template.tsx`

**Use When**:

- Testing visual regression (screenshots)
- Testing responsive layout on different viewports
- Testing theme variations (light/dark)
- Testing loading, error, and empty states
- Testing animations and transitions

**Key Features**:

- Configures viewport in story parameters
- Tests both light and dark themes
- Uses consistent viewport sizes for visual regression
- Uses Playwright for automated visual regression

**Example Usage**:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { DataPanel } from './DataPanel';

const meta = {
  title: 'Components/DataPanel',
  component: DataPanel,
  tags: ['autodocs'],
} satisfies Meta<typeof DataPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Test loading state visual appearance.
 */
export const LoadingState: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  render: (args) => <DataPanel {...args} isLoading={true} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const loadingIndicator = canvas.getByTestId('loading-indicator');
    await expect(loadingIndicator).toBeVisible();
  },
};

/**
 * Test error state visual appearance.
 */
export const ErrorState: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  render: (args) => <DataPanel {...args} error="Failed to load data" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const errorMessage = canvas.getByTestId('error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveTextContent('Failed to load data');
  },
};
```

## Template Usage Workflow

### Step 1: Choose the Right Template

- **Interaction Story**: For user interactions (clicks, keyboard, forms)
- **Accessibility Story**: For a11y testing (ARIA, focus, keyboard nav)
- **Visual Story**: For visual states (loading, error, themes, responsive)

### Step 2: Copy Template to Your Stories File

1. Open the template file from `.storybook/templates/`
2. Copy the relevant story structure
3. Paste into your component's `.stories.tsx` file

### Step 3: Customize for Your Component

1. **Update imports**: Replace placeholder imports with your component
2. **Update meta**: Set correct `title` and `component`
3. **Update render**: Customize render function with your component props
4. **Update play function**: Add test steps specific to your component
5. **Add test IDs**: Ensure component has `data-test-id` attributes

### Step 4: Add Test IDs to Component

Components must include `data-test-id` attributes for test selectors:

```tsx
// Component
export const Button = ({ label, onClick }: ButtonProps) => {
  return (
    <button data-test-id="submit-button" onClick={onClick} aria-label={label}>
      {label}
    </button>
  );
};
```

### Step 5: Test Your Story

1. Run Storybook: `npm run storybook`
2. Navigate to your story
3. Switch to "Canvas" tab (not "Docs")
4. Open "Interactions" panel at bottom
5. Verify play function runs successfully

## Template Patterns

### Common Patterns in All Templates

1. **TypeScript Types**: All templates use proper TypeScript types
2. **Play Functions**: All templates include play function structure
3. **Testing Utilities**: All templates use utilities from `@/utils/storybook-test-helpers`
4. **Step Organization**: All templates use `step()` to organize test actions
5. **Test IDs**: All templates use `getByTestId()` for element selection

### Interaction Template Patterns

- `tabToElement()` for keyboard navigation
- `userEvent.tab()`, `userEvent.keyboard()` for keyboard interactions
- `userEvent.click()` for mouse interactions
- `expect().toHaveFocus()` for focus verification

### Accessibility Template Patterns

- `waitForFocus()` for focus management
- `parameters.a11y` for automatic a11y checks
- `getByRole()`, `getByLabelText()` for semantic queries
- ARIA attribute verification

### Visual Template Patterns

- `parameters.viewport` for responsive testing
- `parameters.theme` for theme variations
- `expect().toBeVisible()` for visibility checks
- `expect().toHaveTextContent()` for text verification

## Best Practices

### Template Selection

- **Start with Interaction Template** for most components
- **Use Accessibility Template** when a11y is a primary concern
- **Use Visual Template** for state-heavy components (loading, error, empty)

### Customization

- **Don't copy blindly**: Customize templates for your component's needs
- **Add context**: Include JSDoc comments explaining what each story tests
- **Keep focused**: One interaction concept per story
- **Use utilities**: Leverage testing utilities instead of writing custom logic

### Test IDs

- **Always use `data-test-id`**: Makes tests resilient to UI changes
- **Descriptive names**: `submit-button` not `button-1`
- **Stable selectors**: Don't depend on text content or CSS classes

### Play Functions

- **Organize with steps**: Use `step()` to group related actions
- **Descriptive names**: Step names should explain what is being tested
- **One concept per step**: Each step should test one thing
- **Use utilities**: Don't reinvent common patterns

## Examples

See existing stories for reference:

- `src/components/Layout/DockablePanel.stories.tsx` - Interaction and focus testing
- `src/components/ui/button.stories.tsx` - Keyboard navigation testing
- `src/components/History/NetworkHistoryPanel.stories.tsx` - Visual state testing
- `src/components/DataGrid/VirtualDataGrid.stories.tsx` - Complex interaction testing

## Related Documentation

- `docs/STORYBOOK_TESTING.md` - Complete testing guide
- `src/utils/storybook-test-helpers.ts` - Testing utility source code
- `.cursor/skills/storybook-testing/SKILL.md` - Testing skill guide
- `CLAUDE.md` - Storybook best practices section
