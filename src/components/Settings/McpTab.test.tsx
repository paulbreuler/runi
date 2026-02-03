/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { McpTab } from './McpTab';
import { DEFAULT_SETTINGS } from '@/types/settings-defaults';

describe('McpTab', () => {
  it('renders enabled status when MCP is enabled', () => {
    render(<McpTab settings={DEFAULT_SETTINGS} onUpdate={vi.fn()} />);
    expect(screen.getByTestId('mcp-status')).toHaveTextContent('Enabled');
  });

  it('renders disabled status when MCP is disabled', () => {
    render(
      <McpTab
        settings={{ ...DEFAULT_SETTINGS, mcp: { ...DEFAULT_SETTINGS.mcp, enabled: false } }}
        onUpdate={vi.fn()}
      />
    );
    expect(screen.getByTestId('mcp-status')).toHaveTextContent('Disabled');
  });

  it('calls onUpdate for permission toggles', async () => {
    const onUpdate = vi.fn();
    const user = userEvent.setup();

    render(<McpTab settings={DEFAULT_SETTINGS} onUpdate={onUpdate} />);

    await user.click(screen.getByTestId('setting-mcp-allowRequestExecution'));
    expect(onUpdate).toHaveBeenCalledWith('mcp', 'allowRequestExecution', true);
  });
});
