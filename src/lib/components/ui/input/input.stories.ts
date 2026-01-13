import type { Meta, StoryObj } from '@storybook/svelte';
import Input from './input.svelte';

const meta = {
    title: 'Components/Input',
    component: Input,
    tags: ['autodocs'],
    argTypes: {
        type: {
            control: 'select',
            options: ['text', 'email', 'password', 'number', 'tel', 'url'],
        },
        disabled: {
            control: 'boolean',
        },
    },
} satisfies Meta<Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};

export const WithPlaceholder: Story = {
    args: {
        placeholder: 'Enter text...',
    },
};

export const Disabled: Story = {
    args: {
        disabled: true,
        value: 'Disabled input',
    },
};

export const Invalid: Story = {
    args: {
        'aria-invalid': true,
        value: 'Invalid input',
    },
};

export const Email: Story = {
    args: {
        type: 'email',
        placeholder: 'email@example.com',
    },
};

export const Password: Story = {
    args: {
        type: 'password',
        placeholder: 'Password',
    },
};

export const Number: Story = {
    args: {
        type: 'number',
        placeholder: '123',
    },
};
