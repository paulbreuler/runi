import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ViewToggle } from './ViewToggle';
import type { ViewMode } from '@/stores/useSettingsStore';

const meta = {
  title: 'Layout/ViewToggle',
  component: ViewToggle,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ViewToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default state showing the Builder view selected. */
export const BuilderSelected: Story = {
  args: {
    viewMode: 'builder',
    onViewChange: (): void => undefined,
  },
};

/** History view selected. */
export const HistorySelected: Story = {
  args: {
    viewMode: 'history',
    onViewChange: (): void => undefined,
  },
};

/** Interactive toggle that switches between views. */
export const Interactive: Story = {
  args: {
    viewMode: 'builder',
    onViewChange: (): void => undefined,
  },
  render: function InteractiveViewToggle() {
    const [mode, setMode] = useState<ViewMode>('builder');
    return <ViewToggle viewMode={mode} onViewChange={setMode} />;
  },
};
