/**
 * @file LanguageTabs Storybook stories
 * @description Visual documentation for LanguageTabs component
 */

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { LanguageTabs } from './LanguageTabs';
import type { CodeLanguage } from '@/utils/codeGenerators';
import { tabToElement } from '@/utils/storybook-test-helpers';

const meta: Meta<typeof LanguageTabs> = {
  title: 'History/LanguageTabs',
  component: LanguageTabs,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Tab navigation for switching between code generation languages.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LanguageTabs>;

/**
 * Language tabs with all available languages.
 */
export const Default: Story = {
  render: () => {
    const [activeLanguage, setActiveLanguage] = useState<CodeLanguage>('javascript');

    return (
      <LanguageTabs
        languages={['javascript', 'python', 'go', 'ruby', 'curl']}
        activeLanguage={activeLanguage}
        onLanguageChange={setActiveLanguage}
      />
    );
  },
};

/**
 * Language tabs with subset of languages.
 */
export const Subset: Story = {
  render: () => {
    const [activeLanguage, setActiveLanguage] = useState<CodeLanguage>('python');

    return (
      <LanguageTabs
        languages={['javascript', 'python']}
        activeLanguage={activeLanguage}
        onLanguageChange={setActiveLanguage}
      />
    );
  },
};

/**
 * Test tab interactions: switching between languages.
 */
export const TabInteractionsTest: Story = {
  render: () => {
    const [activeLanguage, setActiveLanguage] = useState<CodeLanguage>('javascript');

    return (
      <LanguageTabs
        languages={['javascript', 'python', 'go', 'ruby', 'curl']}
        activeLanguage={activeLanguage}
        onLanguageChange={setActiveLanguage}
      />
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click Python tab', async () => {
      const pythonTab = canvas.getByRole('tab', { name: /python/i });
      await userEvent.click(pythonTab);
      await expect(pythonTab).toHaveAttribute('aria-selected', 'true');
    });

    await step('Click Go tab', async () => {
      const goTab = canvas.getByRole('tab', { name: /^go$/i });
      await userEvent.click(goTab);
      await expect(goTab).toHaveAttribute('aria-selected', 'true');
    });
  },
};

/**
 * Test keyboard navigation through tabs.
 */
export const KeyboardNavigationTest: Story = {
  render: () => {
    const [activeLanguage, setActiveLanguage] = useState<CodeLanguage>('javascript');

    return (
      <LanguageTabs
        languages={['javascript', 'python', 'go']}
        activeLanguage={activeLanguage}
        onLanguageChange={setActiveLanguage}
      />
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tab to Python tab', async () => {
      const pythonTab = canvas.getByRole('tab', { name: /python/i });
      const focused = await tabToElement(pythonTab, 10);
      await expect(focused).toBe(true);
      await expect(pythonTab).toHaveFocus();
    });
  },
};
