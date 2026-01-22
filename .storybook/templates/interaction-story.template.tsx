/**
 * @file Interaction Story Template
 * @description Template for creating stories with play functions that test user interactions
 *
 * This template provides a structure for testing component interactions like:
 * - Keyboard navigation (Tab, Enter, Space, Arrow keys)
 * - Click interactions
 * - Form input
 * - State changes triggered by user actions
 *
 * Usage:
 * 1. Copy this template to your component's stories file
 * 2. Replace ComponentName with your actual component name
 * 3. Customize the render function with your component props
 * 4. Add interaction steps in the play function
 * 5. Use testing utilities from @/utils/storybook-test-helpers for common patterns
 */

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { tabToElement } from '@/utils/storybook-test-helpers';

// ============================================================================
// TEMPLATE INSTRUCTIONS
// ============================================================================
// 1. Copy this template to your component's stories file
// 2. Uncomment and update the import below with your actual component
// 3. Replace all instances of `ComponentName` with your component name
// 4. Update the title to match your component's location in the sidebar
// 5. Customize the render functions and play functions for your component
// ============================================================================

// TODO: Uncomment and update with your component import
// import { ComponentName } from './ComponentName';

// Placeholder for template - replace with your actual component
const ComponentName = () => <div>Replace with your component</div>;

const meta = {
  title: 'Components/ComponentName', // TODO: Update path
  component: ComponentName, // TODO: Replace with your imported component
  parameters: {
    docs: {
      description: {
        component: 'Description of what this component does and what interactions are tested.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Tests keyboard navigation and focus management.
 * Verifies that users can navigate through interactive elements using Tab.
 */
export const KeyboardNavigationTest: Story = {
  render: (args) => <ComponentName {...args} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // Wait for component to render
    await expect(canvas.getByTestId('component-root')).toBeVisible();

    // Step 1: Tab to first interactive element
    await step('Tab to first element', async () => {
      const firstButton = canvas.getByTestId('first-button');
      const focused = await tabToElement(firstButton, 5);
      expect(focused).toBe(true);
      await expect(firstButton).toHaveFocus();
    });

    // Step 2: Tab to next element
    await step('Tab to next element', async () => {
      await userEvent.tab();
      const secondButton = canvas.getByTestId('second-button');
      await expect(secondButton).toHaveFocus();
    });

    // Step 3: Activate element with Enter
    await step('Activate with Enter key', async () => {
      const activeButton = canvas.getByTestId('second-button');
      await userEvent.keyboard('{Enter}');
      // Verify state change or action occurred
      // await expect(...).toBe(...);
    });
  },
};

/**
 * Tests click interactions and state changes.
 * Verifies that clicking elements triggers the expected behavior.
 */
export const ClickInteractionTest: Story = {
  render: (args) => <ComponentName {...args} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click button and verify state change', async () => {
      const button = canvas.getByTestId('action-button');
      await userEvent.click(button);

      // Verify expected state or UI change
      await expect(canvas.getByTestId('result')).toBeVisible();
    });
  },
};

/**
 * Tests form input interactions.
 * Verifies that users can type into inputs and submit forms.
 */
export const FormInputTest: Story = {
  render: (args) => <ComponentName {...args} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Type into input field', async () => {
      const input = canvas.getByTestId('text-input');
      await userEvent.type(input, 'Test input');
      await expect(input).toHaveValue('Test input');
    });

    await step('Submit form', async () => {
      const submitButton = canvas.getByTestId('submit-button');
      await userEvent.click(submitButton);
      // Verify form submission
    });
  },
};
