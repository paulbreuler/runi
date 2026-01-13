import type { Meta, StoryObj } from '@storybook/svelte';
import ButtonStory from './ButtonStory.svelte';

const meta = {
    title: 'Components/Button',
    component: ButtonStory,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
        },
        size: {
            control: 'select',
            options: ['default', 'sm', 'lg', 'icon', 'icon-sm', 'icon-lg'],
        },
        disabled: {
            control: 'boolean',
        },
        label: {
            control: 'text',
        },
    },
} satisfies Meta<ButtonStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        label: 'Button',
    },
};

export const Destructive: Story = {
    args: {
        variant: 'destructive',
        label: 'Destructive',
    },
};

export const Outline: Story = {
    args: {
        variant: 'outline',
        label: 'Outline',
    },
};

export const Secondary: Story = {
    args: {
        variant: 'secondary',
        label: 'Secondary',
    },
};

export const Ghost: Story = {
    args: {
        variant: 'ghost',
        label: 'Ghost',
    },
};

export const Link: Story = {
    args: {
        variant: 'link',
        label: 'Link',
    },
};

export const Small: Story = {
    args: {
        size: 'sm',
        label: 'Small',
    },
};

export const Large: Story = {
    args: {
        size: 'lg',
        label: 'Large',
    },
};

export const Disabled: Story = {
    args: {
        disabled: true,
        label: 'Disabled',
    },
};
