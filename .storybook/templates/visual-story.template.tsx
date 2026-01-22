/**
 * @file Visual Story Template
 * @description Template for creating stories that test visual appearance and layout
 *
 * This template provides a structure for testing:
 * - Visual regression (screenshots)
 * - Responsive layout
 * - Theme variations (light/dark)
 * - Animation states
 * - Loading states
 * - Error states
 *
 * Usage:
 * 1. Copy this template to your component's stories file
 * 2. Replace ComponentName with your actual component name
 * 3. Customize the render function with your component props
 * 4. Add visual test assertions in the play function
 * 5. Use Playwright visual regression for automated screenshots
 *
 * Note: Visual regression tests should be run with Playwright.
 * See tests/visual/ for examples.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';

// Import your component
// import { ComponentName } from './ComponentName';

const meta = {
  title: 'Components/ComponentName',
  component: ComponentName, // Replace with your component
  parameters: {
    docs: {
      description: {
        component: 'Description of visual states and appearance variations.',
      },
    },
    // Configure viewport for responsive testing
    viewport: {
      viewports: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '667px' } },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop', styles: { width: '1920px', height: '1080px' } },
      },
      defaultViewport: 'desktop',
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default visual state - baseline for visual regression.
 * This story should match the design specifications.
 */
export const Default: Story = {
  render: (args) => <ComponentName {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify component is visible
    await expect(canvas.getByTestId('component-root')).toBeVisible();

    // Verify key visual elements are present
    // await expect(canvas.getByText('Expected Text')).toBeVisible();
  },
};

/**
 * Tests component appearance in loading state.
 * Verifies loading indicators and skeleton states.
 */
export const LoadingState: Story = {
  render: (args) => <ComponentName {...args} isLoading={true} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify loading indicator is visible
    const loadingIndicator =
      canvas.getByTestId('loading-indicator') || canvas.getByRole('status', { name: /loading/i });
    await expect(loadingIndicator).toBeVisible();

    // Verify content is hidden or replaced with skeleton
    // await expect(canvas.queryByTestId('content')).not.toBeVisible();
  },
};

/**
 * Tests component appearance in error state.
 * Verifies error messages and error styling.
 */
export const ErrorState: Story = {
  render: (args) => <ComponentName {...args} error="Something went wrong" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify error message is visible
    const errorMessage =
      canvas.getByRole('alert') || canvas.getByText(/error|something went wrong/i);
    await expect(errorMessage).toBeVisible();

    // Verify error styling (red color, icon, etc.)
    // const errorStyles = window.getComputedStyle(errorMessage);
    // expect(errorStyles.color).toContain('red');
  },
};

/**
 * Tests responsive layout on mobile viewport.
 * Verifies that component adapts to smaller screens.
 */
export const MobileLayout: Story = {
  render: (args) => <ComponentName {...args} />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify component is visible
    await expect(canvas.getByTestId('component-root')).toBeVisible();

    // Verify responsive layout changes
    // const container = canvas.getByTestId('container');
    // const styles = window.getComputedStyle(container);
    // expect(styles.flexDirection).toBe('column'); // Stack on mobile
  },
};

/**
 * Tests component appearance with different themes.
 * Verifies that component works in both light and dark modes.
 */
export const DarkTheme: Story = {
  render: (args) => (
    <div className="dark">
      <ComponentName {...args} />
    </div>
  ),
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify component is visible in dark theme
    await expect(canvas.getByTestId('component-root')).toBeVisible();

    // Verify text contrast is maintained
    // const text = canvas.getByText('Sample Text');
    // const styles = window.getComputedStyle(text);
    // // Check that text color is light enough for dark background
  },
};

/**
 * Tests animation states and transitions.
 * Verifies that animations work correctly and respect prefers-reduced-motion.
 */
export const AnimationTest: Story = {
  render: (args) => <ComponentName {...args} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Component animates on mount', async () => {
      const component = canvas.getByTestId('component-root');
      await expect(component).toBeVisible();

      // Check for animation classes or styles
      // const styles = window.getComputedStyle(component);
      // expect(styles.transition).toBeTruthy();
    });

    await step('Animation respects prefers-reduced-motion', async () => {
      // This would typically be tested with media query mocking
      // or by checking that animations are disabled when the preference is set
    });
  },
};
