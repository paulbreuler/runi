import type { Meta, StoryObj } from '@storybook/react';
import { MainLayout } from './MainLayout';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

const meta = {
  title: 'Components/Layout/MainLayout',
  component: MainLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MainLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithContent: Story = {
  render: () => (
    <MainLayout
      headerContent={
        <div className="h-14 p-2 flex items-center gap-2 border-b border-border-subtle bg-bg-surface">
          <Button variant="ghost" size="sm">
            File
          </Button>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
          <Button variant="ghost" size="sm">
            View
          </Button>
        </div>
      }
      requestContent={
        <div className="p-6">
          <Card>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">Request Pane</h3>
              <p className="text-text-secondary">Request builder content goes here</p>
            </div>
          </Card>
        </div>
      }
      responseContent={
        <div className="p-6">
          <Card>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">Response Pane</h3>
              <p className="text-text-secondary">Response viewer content goes here</p>
            </div>
          </Card>
        </div>
      }
    />
  ),
};

export const SidebarHidden: Story = {
  render: () => (
    <MainLayout initialSidebarVisible={false} />
  ),
};
