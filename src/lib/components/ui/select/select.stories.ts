import type { Meta, StoryObj } from '@storybook/svelte';
import * as Select from './index';

const meta = {
    title: 'Components/Select',
    component: Select.Root,
    tags: ['autodocs'],
} satisfies Meta<Select.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
