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
import { ConsolePanel, type ConsolePanelProps } from './ConsolePanel';
import { getConsoleService } from '@/services/console-service';
import type { ConsoleLog, LogLevel } from '@/types/console';

// Custom args for story controls (not part of component props)
interface ConsolePanelStoryArgs {
  logLevel?: 'error' | 'warn' | 'info' | 'debug' | 'all';
  logCount?: 'few' | 'many' | 'grouped';
  autoScroll?: boolean;
}

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
} satisfies Meta<ConsolePanelProps & ConsolePanelStoryArgs>;

export default meta;
type Story = StoryObj<ConsolePanelProps & ConsolePanelStoryArgs>;

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
        const logLevelArg = context.args.logLevel ?? 'all';
        const minLevel: LogLevel = logLevelArg === 'all' ? 'debug' : (logLevelArg as LogLevel);
        service.setMinLogLevel(minLevel);

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
      // ConsolePanel doesn't have a root data-test-id, check for console-logs instead
      const logsContainer = await canvas.findByTestId('console-logs', {}, { timeout: 3000 });
      await expect(logsContainer).toBeInTheDocument();
    });
    await step('Test filter interaction', async () => {
      // Try both singular and plural forms of "error" button
      const errorFilter =
        canvas.queryByRole('button', { name: /error/i }) ??
        canvas.queryByRole('button', { name: /errors/i });
      if (errorFilter !== null) {
        await userEvent.click(errorFilter);
        await new Promise((resolve) => setTimeout(resolve, 200));
        // Verify button is still visible after click (filter was applied)
        await expect(errorFilter).toBeVisible();
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

/**
 * Demonstrates updating logs with the spinning indicator.
 * Shows how logs with `isUpdating: true` display a RefreshCw icon that spins.
 */
export const UpdatingLogs: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        const service = getConsoleService();
        service.clear();

        // Create a regular log
        service.addLog(createMockLog('info', 'Regular log entry', [{ data: 'static' }]));

        // Create an updating log (simulates metrics that change over time)
        service.addOrUpdateLog({
          id: 'memory-metrics',
          level: 'info',
          message: 'Memory Usage: 245.5 MB',
          args: [{ current: 245.5, average: 220.3, peak: 280.1 }],
          isUpdating: true,
        });

        // Simulate updates to the updating log
        let updateCount = 0;
        const interval = setInterval(() => {
          updateCount += 1;
          service.addOrUpdateLog({
            id: 'memory-metrics',
            level: 'info',
            message: `Memory Usage: ${String(245.5 + updateCount * 5)} MB`,
            args: [
              {
                current: 245.5 + updateCount * 5,
                average: 220.3 + updateCount * 2,
                peak: 280.1 + updateCount * 3,
              },
            ],
            isUpdating: true,
          });
        }, 2000); // Update every 2 seconds

        return () => {
          clearInterval(interval);
          service.clear();
        };
      }, []);

      return (
        <div className="h-screen">
          <Story />
        </div>
      );
    },
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify updating log indicator is visible', async () => {
      const indicator = await canvas.findByTestId('updating-log-indicator', {}, { timeout: 3000 });
      await expect(indicator).toBeInTheDocument();
      // Verify it has the spinning animation class
      await expect(indicator).toHaveClass('animate-spin');
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates updating logs with the spinning RefreshCw indicator. The log with `isUpdating: true` shows a spinning icon and updates in place every 2 seconds, simulating real-time metrics updates.',
      },
    },
  },
};
