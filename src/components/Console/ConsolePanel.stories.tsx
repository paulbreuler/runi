import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ConsolePanel } from './ConsolePanel';
import { getConsoleService } from '@/services/console-service';
import type { ConsoleLog, LogLevel } from '@/types/console';

const meta = {
  title: 'Components/Console/ConsolePanel',
  component: ConsolePanel,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        component: `DevTools-style console panel for viewing application and debug logs.

## Features

- **Log Level Filtering**: Filter by error, warn, info, debug, or show all
- **Full-Text Search**: Search across log messages, args, and correlation IDs
- **Log Grouping**: Identical logs (same level, message, correlationId, AND args) are automatically grouped with count badges
- **Smart Expansion**: Expanded grouped logs show args once, with a collapsible occurrences sublist
- **Bulk Actions**: Save, copy, and clear logs
- **Auto-scroll**: Automatically scroll to latest logs (toggleable)
- **Context Menu**: Right-click logs to copy message, correlation ID, or full log data

## Log Grouping

Logs are automatically grouped when they have:
- Same log level
- Same message text
- Same correlation ID (or both undefined)
- Same args (compared by serialized JSON)

When grouped, logs show a count badge (e.g., "3") and can be expanded to see:
- The args content once (formatted like a normal expanded log)
- A collapsible list of all occurrence timestamps

## Full-Text Search

The search field searches across:
- Log message text
- Log args (serialized to JSON string)
- Correlation ID (if present)

Search is case-insensitive and matches partial strings.

## Usage

\`\`\`tsx
<ConsolePanel />
\`\`\`

The console service must be initialized before React mounts (typically in \`main.tsx\`):

\`\`\`tsx
import { initializeConsoleService } from '@/services/console-service';

// Before React mounts
initializeConsoleService();
\`\`\`

## Keyboard Shortcuts

- \`Cmd+Shift+I\` (Mac) / \`Ctrl+Shift+I\` (Windows/Linux) - Toggle DevTools panel
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ConsolePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Helper to create mock logs for stories
 */
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
 * Default example for docs page.
 * Shows logs with complex, expandable args matching real application usage.
 * Click the chevron icons to expand and see formatted JSON.
 */
export const Default: Story = {
  parameters: {
    docs: {
      // Only show this story in docs
      story: { inline: true },
    },
  },
  decorators: [
    (Story) => {
      useEffect(() => {
        const service = getConsoleService();
        service.clear();
        service.setMinLogLevel('debug');

        // Startup timing log (matches real app)
        service.addLog(
          createMockLog('info', '🚀 Startup Timing:', [
            {
              DOMContentLoaded: '0.00ms',
              'Window Load': '3.00ms',
              'React Mounted': '14.00ms',
              Total: '14.00ms',
            },
          ])
        );

        // Error with complex nested object
        service.addLog(
          createMockLog('error', 'Request failed', [
            {
              event: 'tauri://error',
              id: -1,
              payload: 'webview.create_webview_window not allowed',
              stack: ['at createWindow', 'at handleClick', 'at onClick'],
              metadata: {
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
              },
            },
          ])
        );

        // Info with nested data
        service.addLog(
          createMockLog('info', 'Request completed', [
            {
              method: 'GET',
              url: '/api/users',
              status: 200,
              duration: 45,
              timing: {
                dns: 2,
                connect: 5,
                tls: 12,
                firstByte: 30,
                download: 15,
              },
              headers: {
                'content-type': 'application/json',
                'content-length': '1234',
              },
            },
          ])
        );

        // Warning with complex validation data
        service.addLog(
          createMockLog('warn', 'Deprecated API endpoint used', [
            {
              endpoint: '/v1/users',
              replacement: '/v2/users',
              deprecationDate: '2024-01-01',
              migrationGuide: 'https://docs.example.com/migration',
              affectedEndpoints: ['/v1/users', '/v1/posts', '/v1/comments'],
            },
          ])
        );

        return () => {
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
};

/**
 * Interactive console with log generator.
 * Use the buttons below to generate logs of different types, or type your own custom log.
 * All logs have complex, expandable args to demonstrate the expansion feature.
 */
export const Interactive: Story = {
  parameters: {
    docs: {
      // Hide from docs, only show in story view
      disable: true,
    },
  },
  render: () => {
    const [customMessage, setCustomMessage] = useState('🚀 Startup Timing:');
    const [customLevel, setCustomLevel] = useState<LogLevel>('info');
    const [logCounter, setLogCounter] = useState(0);

    const generateLog = (level: LogLevel, message: string, args: unknown[]) => {
      const service = getConsoleService();
      service.addLog({
        level,
        message,
        args,
        timestamp: Date.now(),
      });
    };

    // GROUPING DEMO: Error and Warning use STATIC args - click multiple times to see grouping
    // AUTO-SCROLL DEMO: Info and Debug include counter in message - each click creates unique log

    const generateStartupTiming = () => {
      // Static - will group
      generateLog('info', '🚀 Startup Timing:', [
        {
          DOMContentLoaded: '2.50ms',
          'Window Load': '8.00ms',
          'React Mounted': '15.00ms',
          Total: '18.50ms',
        },
      ]);
    };

    const generateError = () => {
      // Static - will group (demonstrates grouping feature)
      generateLog('error', 'Request failed', [
        {
          event: 'tauri://error',
          id: -1,
          payload: 'webview.create_webview_window not allowed',
          stack: ['at createWindow', 'at handleClick', 'at onClick'],
          metadata: {
            requestId: 'req-12345',
            endpoint: '/api/users',
          },
        },
      ]);
    };

    const generateWarning = () => {
      // Static - will group (demonstrates grouping feature)
      generateLog('warn', 'Deprecated API endpoint used', [
        {
          endpoint: '/v1/users',
          replacement: '/v2/users',
          deprecationDate: '2024-01-01',
          migrationGuide: 'https://docs.example.com/migration',
          affectedEndpoints: ['/v1/users', '/v1/posts', '/v1/comments'],
        },
      ]);
    };

    const generateInfo = () => {
      // Counter in message - won't group (demonstrates auto-scroll)
      const count = logCounter + 1;
      setLogCounter(count);
      generateLog('info', `Request #${String(count)} completed`, [
        {
          method: 'GET',
          url: '/api/users',
          status: 200,
          duration: 45,
          timing: {
            dns: 2,
            connect: 5,
            tls: 12,
            firstByte: 30,
            download: 15,
          },
          headers: {
            'content-type': 'application/json',
            'content-length': '1234',
          },
        },
      ]);
    };

    const generateDebug = () => {
      // Counter in message - won't group (demonstrates auto-scroll)
      const count = logCounter + 1;
      setLogCounter(count);
      generateLog('debug', `Cache lookup #${String(count)}`, [
        {
          operation: 'lookup',
          key: 'users:all',
          hit: true,
          ttl: 3600,
          size: 4096,
          metadata: {
            region: 'us-east-1',
            node: 'cache-node-42',
          },
        },
      ]);
    };

    const generateCustom = () => {
      if (customMessage.trim() === '') {
        return;
      }
      generateLog(customLevel, customMessage, [
        {
          customData: {
            userInput: customMessage,
            level: customLevel,
            nested: {
              data: 'This is nested data',
              array: [1, 2, 3, { nested: 'object' }],
            },
          },
        },
      ]);
    };

    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border-default bg-bg-raised">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={generateStartupTiming}
                className="px-3 py-1.5 text-xs bg-accent-blue/20 text-accent-blue rounded hover:bg-accent-blue/30"
              >
                Generate Startup Timing
              </button>
              <button
                type="button"
                onClick={generateError}
                className="px-3 py-1.5 text-xs bg-signal-error/20 text-signal-error rounded hover:bg-signal-error/30"
              >
                Generate Error
              </button>
              <button
                type="button"
                onClick={generateWarning}
                className="px-3 py-1.5 text-xs bg-signal-warning/20 text-signal-warning rounded hover:bg-signal-warning/30"
              >
                Generate Warning
              </button>
              <button
                type="button"
                onClick={generateInfo}
                className="px-3 py-1.5 text-xs bg-accent-blue/20 text-accent-blue rounded hover:bg-accent-blue/30"
              >
                Generate Info
              </button>
              <button
                type="button"
                onClick={generateDebug}
                className="px-3 py-1.5 text-xs bg-text-muted/20 text-text-muted rounded hover:bg-text-muted/30"
              >
                Generate Debug
              </button>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={customMessage}
                onChange={(e) => {
                  setCustomMessage(e.target.value);
                }}
                placeholder="Custom log message..."
                className="flex-1 px-3 py-1.5 text-xs bg-bg-surface border border-border-default rounded text-text-primary"
              />
              <select
                value={customLevel}
                onChange={(e) => {
                  setCustomLevel(e.target.value as LogLevel);
                }}
                className="px-3 py-1.5 text-xs bg-bg-surface border border-border-default rounded text-text-primary"
              >
                <option value="error">Error</option>
                <option value="warn">Warn</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
              <button
                type="button"
                onClick={generateCustom}
                className="px-3 py-1.5 text-xs bg-accent-purple/20 text-accent-purple rounded hover:bg-accent-purple/30"
              >
                Generate Custom
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <ConsolePanel />
        </div>
      </div>
    );
  },
  decorators: [
    (Story) => {
      useEffect(() => {
        const service = getConsoleService();
        service.clear();
        service.setMinLogLevel('debug');
        return () => {
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
};
