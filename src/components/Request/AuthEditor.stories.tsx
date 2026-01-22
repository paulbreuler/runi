import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from '@storybook/test';
import { waitForFocus } from '@/utils/storybook-test-helpers';
import { AuthEditor } from './AuthEditor';
import { useRequestStore } from '@/stores/useRequestStore';

type Story = StoryObj<typeof meta>;

const seedStore = (headers: Record<string, string>): void => {
  useRequestStore.setState({ headers });
};

const meta = {
  title: 'Components/Request/AuthEditor',
  component: AuthEditor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Authentication editor used in the request builder. Uses glass inputs for tokens and credentials to keep focus styles consistent.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AuthEditor>;

export default meta;

export const Empty: Story = {
  render: () => {
    seedStore({});
    return (
      <div className="min-h-[420px] bg-bg-app p-6">
        <AuthEditor />
      </div>
    );
  },
};

export const BearerToken: Story = {
  render: () => {
    seedStore({ Authorization: 'Bearer sk-live-demo-token' });
    return (
      <div className="min-h-[420px] bg-bg-app p-6">
        <AuthEditor />
      </div>
    );
  },
};

/**
 * Tests form interactions: selecting auth type, entering credentials.
 */
export const FormInteractionsTest: Story = {
  render: () => {
    seedStore({});
    return (
      <div className="min-h-[420px] bg-bg-app p-6">
        <AuthEditor />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Select Bearer Token auth type', async () => {
      const authSelect = canvas.getByTestId('auth-type-select');
      await userEvent.click(authSelect);
      // Wait for select to open (Radix Select uses portals)
      await new Promise((resolve) => setTimeout(resolve, 200));
      // Options are in a Radix portal (document.body)
      const bearerOption = await within(document.body).findByRole(
        'option',
        { name: /bearer token/i },
        { timeout: 2000 }
      );
      await userEvent.click(bearerOption);
      // Wait for select to close and form to update
      await new Promise((resolve) => setTimeout(resolve, 200));
      const tokenInput = await canvas.findByTestId('bearer-token-input', {}, { timeout: 2000 });
      await expect(tokenInput).toBeVisible();
    });

    await step('Enter bearer token', async () => {
      const tokenInput = canvas.getByTestId('bearer-token-input');
      await userEvent.type(tokenInput, 'sk-live-test-token');
      // Wait for input value to update
      await new Promise((resolve) => setTimeout(resolve, 100));
      await expect(tokenInput).toHaveValue('sk-live-test-token');
    });

    await step('Switch to Basic Auth', async () => {
      const authSelect = canvas.getByTestId('auth-type-select');
      await userEvent.click(authSelect);
      // Wait for select to open (Radix Select uses portals)
      await new Promise((resolve) => setTimeout(resolve, 200));
      // Options are in a Radix portal (document.body)
      const basicOption = await within(document.body).findByRole(
        'option',
        { name: /basic auth/i },
        { timeout: 2000 }
      );
      await userEvent.click(basicOption);
      // Wait for select to close and form to update
      await new Promise((resolve) => setTimeout(resolve, 200));
      const usernameInput = await canvas.findByTestId(
        'basic-username-input',
        {},
        { timeout: 2000 }
      );
      const passwordInput = await canvas.findByTestId(
        'basic-password-input',
        {},
        { timeout: 2000 }
      );
      await expect(usernameInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
    });

    await step('Enter basic auth credentials', async () => {
      const usernameInput = canvas.getByTestId('basic-username-input');
      const passwordInput = canvas.getByTestId('basic-password-input');
      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'testpass');
      // Wait for input values to update
      await new Promise((resolve) => setTimeout(resolve, 100));
      await expect(usernameInput).toHaveValue('testuser');
      await expect(passwordInput).toHaveValue('testpass');
    });

    await step('Toggle password visibility', async () => {
      const toggleButton = canvas.getByTestId('toggle-password-visibility');
      const passwordInput = canvas.getByTestId('basic-password-input');
      await expect(passwordInput).toHaveAttribute('type', 'password');
      await userEvent.click(toggleButton);
      await expect(passwordInput).toHaveAttribute('type', 'text');
    });

    await step('Switch to Custom Header', async () => {
      const authSelect = canvas.getByTestId('auth-type-select');
      await userEvent.click(authSelect);
      // Wait for select to open
      await new Promise((resolve) => setTimeout(resolve, 100));
      const customOption = await canvas.findByRole(
        'option',
        { name: /custom header/i },
        { timeout: 2000 }
      );
      await userEvent.click(customOption);
      // Wait for select to close and form to update
      await new Promise((resolve) => setTimeout(resolve, 100));
      const customInput = await canvas.findByTestId('custom-header-input', {}, { timeout: 2000 });
      await expect(customInput).toBeVisible();
    });
  },
};

/**
 * Tests keyboard navigation through form elements.
 */
export const KeyboardNavigationTest: Story = {
  render: () => {
    seedStore({});
    return (
      <div className="min-h-[420px] bg-bg-app p-6">
        <AuthEditor />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tab to auth type select', async () => {
      const authSelect = canvas.getByTestId('auth-type-select');
      authSelect.focus();
      await waitForFocus(authSelect, 1000);
      await expect(authSelect).toHaveFocus();
    });

    await step('Select Bearer and tab to token input', async () => {
      await userEvent.keyboard('{Enter}');
      // Wait for select to open (Radix Select uses portals)
      await new Promise((resolve) => setTimeout(resolve, 200));
      // Options are in a Radix portal (document.body)
      const bearerOption = await within(document.body).findByRole(
        'option',
        { name: /bearer token/i },
        { timeout: 2000 }
      );
      await userEvent.click(bearerOption);
      // Wait for select to close and form to update
      await new Promise((resolve) => setTimeout(resolve, 200));
      const tokenInput = await canvas.findByTestId('bearer-token-input', {}, { timeout: 2000 });
      await userEvent.tab();
      await waitForFocus(tokenInput, 1000);
      await expect(tokenInput).toHaveFocus();
    });
  },
};
