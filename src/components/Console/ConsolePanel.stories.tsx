/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file ConsolePanel Storybook stories
 * @description Consolidated story using Storybook 10 controls
 *
 * ConsolePanel includes ConsoleToolbar - use controls to explore all features.
 */

import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ConsolePanel } from './ConsolePanel';
import { getConsoleService } from '@/services/console-service';
import type { ConsoleLog, LogLevel } from '@/types/console';

const meta = {
  title: 'Console/ConsolePanel',
  component: ConsolePanel,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        component: `DevTools-style console panel for viewing application and debug logs.

**Features:**
- Log Level Filtering: Filter by error, warn, info, debug, or show all
- Full-Text Search: Search across log messages, args, and correlation IDs
- Log Grouping: Identical logs are automatically grouped with count badges
- Bulk Actions: Save, copy, and clear logs
- Auto-scroll: Automatically scroll to latest logs (toggleable)
- ConsoleToolbar: Integrated toolbar with all filtering and action controls

Use the Controls panel to explore different log configurations.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    logLevel: {
      control: 'select',
      options: ['error', 'warn', 'info', 'debug', 'all'],
      description: 'Minimum log level to display',
    },
    logCount: {
      control: 'select',
      options: ['few', 'many', 'grouped'],
      description: 'Number of logs to generate',
    },
    autoScroll: {
      control: 'boolean',
      description: 'Auto-scroll to latest logs (toggleable via toolbar)',
    },
  },
  args: {
    logLevel: 'all',
    logCount: 'few',
    autoScroll: true,
  },
} satisfies Meta<typeof ConsolePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

function createMockLog(
  level: LogLevel,
  message: string,
  args: unknown[] = [],
  correlationId?: string
): Partial<ConsoleLog> {
  return {
    level,
    message,
    args,
    correlationId,
    timestamp: Date.now(),
  };
}

/**
 * Playground with controls for all ConsolePanel features.
 * ConsoleToolbar is integrated - use toolbar controls in the UI.
 */
export const Playground: Story = {
  decorators: [
    (Story, context) => {
      useEffect(() => {
        const service = getConsoleService();
        service.clear();
        const minLevel = context.args.logLevel === 'all' ? 'debug' : context.args.logLevel;
        service.setMinLogLevel(minLevel as LogLevel);

        let count: number;
        if (context.args.logCount === 'few') {
          count = 5;
        } else if (context.args.logCount === 'many') {
          count = 20;
        } else {
          count = 10;
        }
        const shouldGroup = context.args.logCount === 'grouped';

        // Generate logs
        for (let i = 0; i < count; i++) {
          if (shouldGroup && i < 3) {
            // Create grouped logs (same message, same args)
            service.addLog(
              createMockLog('error', 'Request failed', [{ id: i, error: 'Network error' }])
            );
          } else {
            service.addLog(
              createMockLog(
                (['error', 'warn', 'info', 'debug'] as LogLevel[])[i % 4] ?? 'info',
                `Log entry ${String(i + 1)}`,
                [{ index: i + 1, data: `Sample data ${String(i + 1)}` }]
              )
            );
          }
        }

        return () => {
          service.clear();
        };
      }, [context.args.logLevel, context.args.logCount]);

      return (
        <div className="h-screen">
          <Story />
        </div>
      );
    },
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify console panel renders', async () => {
      const panel = canvasElement.querySelector('[data-testid="console-panel"]');
      await expect(panel).toBeInTheDocument();
    });
    await step('Test filter interaction', async () => {
      const errorFilter = canvas.queryByRole('button', { name: /error/i });
      if (errorFilter !== null) {
        await userEvent.click(errorFilter);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive playground for ConsolePanel. Use the Controls panel to configure log levels and counts. The integrated ConsoleToolbar provides filtering, search, and action controls in the UI.',
      },
    },
  },
};
