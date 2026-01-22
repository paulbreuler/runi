import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from '@storybook/test';
import { tabToElement } from '@/utils/storybook-test-helpers';
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
      const bearerOption = canvas.getByText('Bearer Token');
      await userEvent.click(bearerOption);
      const tokenInput = canvas.getByTestId('bearer-token-input');
      await expect(tokenInput).toBeVisible();
    });

    await step('Enter bearer token', async () => {
      const tokenInput = canvas.getByTestId('bearer-token-input');
      await userEvent.type(tokenInput, 'sk-live-test-token');
      await expect(tokenInput).toHaveValue('sk-live-test-token');
    });

    await step('Switch to Basic Auth', async () => {
      const authSelect = canvas.getByTestId('auth-type-select');
      await userEvent.click(authSelect);
      const basicOption = canvas.getByText('Basic Auth');
      await userEvent.click(basicOption);
      const usernameInput = canvas.getByTestId('basic-username-input');
      const passwordInput = canvas.getByTestId('basic-password-input');
      await expect(usernameInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
    });

    await step('Enter basic auth credentials', async () => {
      const usernameInput = canvas.getByTestId('basic-username-input');
      const passwordInput = canvas.getByTestId('basic-password-input');
      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'testpass');
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
      const customOption = canvas.getByText('Custom Header');
      await userEvent.click(customOption);
      const customInput = canvas.getByTestId('custom-header-input');
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
      const focused = await tabToElement(authSelect, 5);
      void expect(focused).toBe(true);
      await expect(authSelect).toHaveFocus();
    });

    await step('Select Bearer and tab to token input', async () => {
      await userEvent.keyboard('{Enter}');
      const bearerOption = canvas.getByText('Bearer Token');
      await userEvent.click(bearerOption);
      const tokenInput = canvas.getByTestId('bearer-token-input');
      await userEvent.tab();
      await expect(tokenInput).toHaveFocus();
    });
  },
};
