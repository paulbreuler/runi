import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import { BodyEditor } from './BodyEditor';
import { useRequestStore } from '@/stores/useRequestStore';

const meta = {
  title: 'Components/Request/BodyEditor',
  component: BodyEditor,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BodyEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const BodyStateDecorator = ({ body }: { body: string }): React.JSX.Element => {
  useEffect((): void | (() => void) => {
    useRequestStore.setState({ body });
    return (): void => {
      useRequestStore.getState().reset();
    };
  }, [body]);

  return (
    <div className="h-64 border border-border-default bg-bg-app">
      <BodyEditor />
    </div>
  );
};

export const Empty: Story = {
  render: () => <BodyStateDecorator body="" />,
};

export const ValidJson: Story = {
  render: () => <BodyStateDecorator body='{"name":"Runi","count":3}' />,
};

export const InvalidJson: Story = {
  render: () => <BodyStateDecorator body='{"name":"Runi",}' />,
};
