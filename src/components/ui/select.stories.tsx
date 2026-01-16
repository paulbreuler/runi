import type { Meta, StoryObj } from '@storybook/react';
import * as Select from './select';

const meta = {
  title: 'Components/UI/Select',
  component: Select.Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Select.Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select.Select defaultValue="apple">
      <Select.SelectTrigger className="w-[180px]">
        <Select.SelectValue placeholder="Select a fruit" />
      </Select.SelectTrigger>
      <Select.SelectContent>
        <Select.SelectItem value="apple">Apple</Select.SelectItem>
        <Select.SelectItem value="banana">Banana</Select.SelectItem>
        <Select.SelectItem value="orange">Orange</Select.SelectItem>
        <Select.SelectItem value="grape">Grape</Select.SelectItem>
      </Select.SelectContent>
    </Select.Select>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Select.Select defaultValue="apple">
      <Select.SelectTrigger className="w-[200px]">
        <Select.SelectValue placeholder="Select a fruit" />
      </Select.SelectTrigger>
      <Select.SelectContent>
        <Select.SelectGroup>
          <Select.SelectLabel>Fruits</Select.SelectLabel>
          <Select.SelectItem value="apple">Apple</Select.SelectItem>
          <Select.SelectItem value="banana">Banana</Select.SelectItem>
          <Select.SelectItem value="orange">Orange</Select.SelectItem>
        </Select.SelectGroup>
        <Select.SelectSeparator />
        <Select.SelectGroup>
          <Select.SelectLabel>Vegetables</Select.SelectLabel>
          <Select.SelectItem value="carrot">Carrot</Select.SelectItem>
          <Select.SelectItem value="potato">Potato</Select.SelectItem>
          <Select.SelectItem value="tomato">Tomato</Select.SelectItem>
        </Select.SelectGroup>
      </Select.SelectContent>
    </Select.Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Select.Select defaultValue="apple" disabled>
        <Select.SelectTrigger className="w-[180px]">
          <Select.SelectValue placeholder="Select a fruit" />
        </Select.SelectTrigger>
        <Select.SelectContent>
          <Select.SelectItem value="apple">Apple</Select.SelectItem>
          <Select.SelectItem value="banana">Banana</Select.SelectItem>
        </Select.SelectContent>
      </Select.Select>
      <Select.Select defaultValue="banana">
        <Select.SelectTrigger className="w-[180px]">
          <Select.SelectValue placeholder="Select a fruit" />
        </Select.SelectTrigger>
        <Select.SelectContent>
          <Select.SelectItem value="apple">Apple</Select.SelectItem>
          <Select.SelectItem value="banana" disabled>
            Banana (disabled)
          </Select.SelectItem>
          <Select.SelectItem value="orange">Orange</Select.SelectItem>
        </Select.SelectContent>
      </Select.Select>
    </div>
  ),
};

export const HTTPMethods: Story = {
  render: () => (
    <Select.Select defaultValue="GET">
      <Select.SelectTrigger className="w-[120px] font-semibold">
        <Select.SelectValue />
      </Select.SelectTrigger>
      <Select.SelectContent>
        <Select.SelectItem value="GET" className="text-method-get">
          GET
        </Select.SelectItem>
        <Select.SelectItem value="POST" className="text-method-post">
          POST
        </Select.SelectItem>
        <Select.SelectItem value="PUT" className="text-method-put">
          PUT
        </Select.SelectItem>
        <Select.SelectItem value="PATCH" className="text-method-patch">
          PATCH
        </Select.SelectItem>
        <Select.SelectItem value="DELETE" className="text-method-delete">
          DELETE
        </Select.SelectItem>
        <Select.SelectItem value="HEAD" className="text-method-head">
          HEAD
        </Select.SelectItem>
        <Select.SelectItem value="OPTIONS" className="text-method-options">
          OPTIONS
        </Select.SelectItem>
      </Select.SelectContent>
    </Select.Select>
  ),
};
