import type { Meta, StoryObj } from '@storybook/svelte';
import Separator from './separator.svelte';

const meta = {
    title: 'Components/Separator',
    component: Separator,
    tags: ['autodocs'],
    argTypes: {
        orientation: {
            control: 'select',
            options: ['horizontal', 'vertical'],
        },
    },
} satisfies Meta<Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        orientation: 'horizontal',
    },
};

export const Horizontal: Story = {
    args: {
        orientation: 'horizontal',
    },
};

export const Vertical: Story = {
    args: {
        orientation: 'vertical',
    },
};
