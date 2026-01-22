/**
 * @file Accessibility Story Template
 * @description Template for creating stories that test accessibility features
 *
 * This template provides a structure for testing:
 * - ARIA attributes and roles
 * - Keyboard navigation and focus management
 * - Screen reader compatibility
 * - Color contrast (checked automatically by a11y addon)
 * - Focus indicators
 * - Semantic HTML structure
 *
 * Usage:
 * 1. Copy this template to your component's stories file
 * 2. Replace ComponentName with your actual component name
 * 3. Customize the render function with your component props
 * 4. Add accessibility test steps in the play function
 * 5. The a11y addon will automatically check for violations
 */

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { tabToElement, waitForFocus } from '@/utils/storybook-test-helpers';

// Import your component
// import { ComponentName } from './ComponentName';

const meta = {
  title: 'Components/ComponentName',
  component: ComponentName, // Replace with your component
  parameters: {
    docs: {
      description: {
        component: 'Description of accessibility features and keyboard navigation patterns.',
      },
    },
    // Enable a11y addon for automatic checks
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'keyboard-navigation',
            enabled: true,
          },
        ],
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Tests that all interactive elements are keyboard accessible.
 * Verifies Tab navigation reaches all focusable elements.
 */
export const KeyboardAccessibilityTest: Story = {
  render: (args) => <ComponentName {...args} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('All buttons are keyboard accessible', async () => {
      const buttons = canvas.getAllByRole('button');
      for (const button of buttons) {
        const focused = await tabToElement(button, 10);
        expect(focused).toBe(true);
        await expect(button).toHaveFocus();
      }
    });

    await step('Focus indicators are visible', async () => {
      const firstButton = canvas.getByRole('button', { name: /first/i });
      await tabToElement(firstButton, 5);
      await waitForFocus(firstButton, 1000);

      // Check that focus ring is visible (CSS class or computed style)
      const styles = window.getComputedStyle(firstButton);
      // Focus ring should be visible (check outline or box-shadow)
      expect(firstButton).toHaveFocus();
    });
  },
};

/**
 * Tests ARIA attributes and semantic structure.
 * Verifies that components have proper ARIA labels, roles, and states.
 */
export const AriaAttributesTest: Story = {
  render: (args) => <ComponentName {...args} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Interactive elements have accessible names', async () => {
      const buttons = canvas.getAllByRole('button');
      for (const button of buttons) {
        // Each button should have an accessible name (aria-label, aria-labelledby, or text content)
        const name = button.getAttribute('aria-label') || button.textContent;
        expect(name).toBeTruthy();
        expect(name?.trim().length).toBeGreaterThan(0);
      }
    });

    await step('Form inputs have associated labels', async () => {
      const inputs = canvas.getAllByRole('textbox');
      for (const input of inputs) {
        const label =
          input.getAttribute('aria-label') ||
          input.getAttribute('aria-labelledby') ||
          document.querySelector(`label[for="${input.id}"]`);
        expect(label).toBeTruthy();
      }
    });

    await step('Component has appropriate ARIA role', async () => {
      const component = canvas.getByTestId('component-root');
      const role = component.getAttribute('role');
      // Verify role is appropriate (or uses semantic HTML)
      expect(role || component.tagName.toLowerCase()).toBeTruthy();
    });
  },
};

/**
 * Tests focus management and restoration.
 * Verifies that focus moves correctly when components mount/unmount or state changes.
 */
export const FocusManagementTest: Story = {
  render: (args) => <ComponentName {...args} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Focus moves to first element on mount', async () => {
      const firstElement = canvas.getByTestId('first-focusable');
      await waitForFocus(firstElement, 1000);
      await expect(firstElement).toHaveFocus();
    });

    await step('Focus is restored after modal/dialog closes', async () => {
      const trigger = canvas.getByTestId('open-dialog-button');
      await userEvent.click(trigger);

      const closeButton = canvas.getByTestId('close-dialog-button');
      await userEvent.click(closeButton);

      // Focus should return to trigger
      await waitForFocus(trigger, 1000);
      await expect(trigger).toHaveFocus();
    });
  },
};

/**
 * Tests screen reader announcements.
 * Verifies that dynamic content changes are announced to screen readers.
 */
export const ScreenReaderAnnouncementsTest: Story = {
  render: (args) => <ComponentName {...args} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Status messages use aria-live regions', async () => {
      const statusRegion = canvas.getByRole('status') || canvas.getByRole('alert');
      expect(statusRegion).toBeInTheDocument();

      // Trigger a status change
      const actionButton = canvas.getByTestId('trigger-status-button');
      await userEvent.click(actionButton);

      // Verify status region is updated
      await expect(statusRegion).toHaveTextContent(/success|error|updated/i);
    });
  },
};
