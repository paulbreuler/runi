/**
 * @file LanguageTabs Storybook stories
 * @description Visual documentation for LanguageTabs component
 */

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { LanguageTabs } from './LanguageTabs';
import type { CodeLanguage } from '@/utils/codeGenerators';

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
