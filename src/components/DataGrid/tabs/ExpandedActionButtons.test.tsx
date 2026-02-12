/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file ExpandedActionButtons tests
 * @description Tests for ExpandedActionButtons component - Feature #24
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { ExpandedActionButtons } from './ExpandedActionButtons';
import type { NetworkHistoryEntry } from '@/types/history';

describe('ExpandedActionButtons', () => {
  const mockEntry: NetworkHistoryEntry = {
    id: 'test-1',
    timestamp: new Date().toISOString(),
    request: {
      url: 'https://api.example.com/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token123',
      },
      body: '{"name":"John"}',
      timeout_ms: 30000,
    },
    response: {
      status: 200,
      status_text: 'OK',
      headers: { 'Content-Type': 'application/json' },
      body: '{"id":1}',
      timing: {
        total_ms: 156,
        dns_ms: 12,
        connect_ms: 23,
        tls_ms: 34,
        first_byte_ms: 98,
      },
    },
  };

  describe('Feature #24: Expanded Panel - Action Buttons', () => {
    it('displays all action buttons', () => {
      const onReplay = vi.fn();
      const onCopy = vi.fn();
      const onChain = vi.fn();
      const onGenerateTests = vi.fn();
      const onAddToCollection = vi.fn();
      const onBlockToggle = vi.fn();

      render(
        <ExpandedActionButtons
          entry={mockEntry}
          onReplay={onReplay}
          onCopy={onCopy}
          onChain={onChain}
          onGenerateTests={onGenerateTests}
          onAddToCollection={onAddToCollection}
          onBlockToggle={onBlockToggle}
          isBlocked={false}
        />
      );

      // Check all buttons are present
      expect(screen.getByTestId('replay-button')).toBeInTheDocument();
      expect(screen.getByTestId('copy-curl-button')).toBeInTheDocument();
      expect(screen.getByTestId('chain-button')).toBeInTheDocument();
      expect(screen.getByTestId('generate-tests-button')).toBeInTheDocument();
      expect(screen.getByTestId('add-to-collection-button')).toBeInTheDocument();
      expect(screen.getByTestId('block-toggle-button')).toBeInTheDocument();
    });

    it('Edit & Replay triggers callback', async () => {
      const user = userEvent.setup();
      const onReplay = vi.fn();
      const onCopy = vi.fn();
      const onChain = vi.fn();
      const onGenerateTests = vi.fn();
      const onAddToCollection = vi.fn();
      const onBlockToggle = vi.fn();

      render(
        <ExpandedActionButtons
          entry={mockEntry}
          onReplay={onReplay}
          onCopy={onCopy}
          onChain={onChain}
          onGenerateTests={onGenerateTests}
          onAddToCollection={onAddToCollection}
          onBlockToggle={onBlockToggle}
          isBlocked={false}
        />
      );

      const replayButton = screen.getByTestId('replay-button');
      await user.click(replayButton);

      expect(onReplay).toHaveBeenCalledTimes(1);
      expect(onReplay).toHaveBeenCalledWith(mockEntry);
    });

    it('Copy cURL copies command', async () => {
      const user = userEvent.setup();
      const onReplay = vi.fn();
      const onCopy = vi.fn();
      const onChain = vi.fn();
      const onGenerateTests = vi.fn();
      const onAddToCollection = vi.fn();
      const onBlockToggle = vi.fn();

      render(
        <ExpandedActionButtons
          entry={mockEntry}
          onReplay={onReplay}
          onCopy={onCopy}
          onChain={onChain}
          onGenerateTests={onGenerateTests}
          onAddToCollection={onAddToCollection}
          onBlockToggle={onBlockToggle}
          isBlocked={false}
        />
      );

      const copyButton = screen.getByTestId('copy-curl-button');
      await user.click(copyButton);

      // Verify callback is triggered (actual clipboard functionality tested in CopyButton component)
      expect(onCopy).toHaveBeenCalledTimes(1);
      expect(onCopy).toHaveBeenCalledWith(mockEntry);
    });

    it('Block/Unblock toggles state', async () => {
      const user = userEvent.setup();
      const onReplay = vi.fn();
      const onCopy = vi.fn();
      const onChain = vi.fn();
      const onGenerateTests = vi.fn();
      const onAddToCollection = vi.fn();
      const onBlockToggle = vi.fn();

      const { rerender } = render(
        <ExpandedActionButtons
          entry={mockEntry}
          onReplay={onReplay}
          onCopy={onCopy}
          onChain={onChain}
          onGenerateTests={onGenerateTests}
          onAddToCollection={onAddToCollection}
          onBlockToggle={onBlockToggle}
          isBlocked={false}
        />
      );

      // Initially shows "Block" button
      const blockButton = screen.getByTestId('block-toggle-button');
      expect(blockButton).toHaveTextContent(/block/i);

      await user.click(blockButton);
      expect(onBlockToggle).toHaveBeenCalledTimes(1);
      expect(onBlockToggle).toHaveBeenCalledWith(mockEntry.id, true);

      // Rerender with blocked state
      rerender(
        <ExpandedActionButtons
          entry={mockEntry}
          onReplay={onReplay}
          onCopy={onCopy}
          onChain={onChain}
          onGenerateTests={onGenerateTests}
          onAddToCollection={onAddToCollection}
          onBlockToggle={onBlockToggle}
          isBlocked={true}
        />
      );

      // Now shows "Unblock" button
      const unblockButton = screen.getByTestId('block-toggle-button');
      expect(unblockButton).toHaveTextContent(/unblock/i);

      await user.click(unblockButton);
      expect(onBlockToggle).toHaveBeenCalledTimes(2);
      expect(onBlockToggle).toHaveBeenCalledWith(mockEntry.id, false);
    });

    it('Chain Request triggers callback', async () => {
      const user = userEvent.setup();
      const onReplay = vi.fn();
      const onCopy = vi.fn();
      const onChain = vi.fn();
      const onGenerateTests = vi.fn();
      const onAddToCollection = vi.fn();
      const onBlockToggle = vi.fn();

      render(
        <ExpandedActionButtons
          entry={mockEntry}
          onReplay={onReplay}
          onCopy={onCopy}
          onChain={onChain}
          onGenerateTests={onGenerateTests}
          onAddToCollection={onAddToCollection}
          onBlockToggle={onBlockToggle}
          isBlocked={false}
        />
      );

      const chainButton = screen.getByTestId('chain-button');
      await user.click(chainButton);

      expect(onChain).toHaveBeenCalledTimes(1);
      expect(onChain).toHaveBeenCalledWith(mockEntry);
    });

    it('Generate Tests triggers callback', async () => {
      const user = userEvent.setup();
      const onReplay = vi.fn();
      const onCopy = vi.fn();
      const onChain = vi.fn();
      const onGenerateTests = vi.fn();
      const onAddToCollection = vi.fn();
      const onBlockToggle = vi.fn();

      render(
        <ExpandedActionButtons
          entry={mockEntry}
          onReplay={onReplay}
          onCopy={onCopy}
          onChain={onChain}
          onGenerateTests={onGenerateTests}
          onAddToCollection={onAddToCollection}
          onBlockToggle={onBlockToggle}
          isBlocked={false}
        />
      );

      const generateTestsButton = screen.getByTestId('generate-tests-button');
      await user.click(generateTestsButton);

      expect(onGenerateTests).toHaveBeenCalledTimes(1);
      expect(onGenerateTests).toHaveBeenCalledWith(mockEntry);
    });

    it('Add to Collection triggers callback', async () => {
      const user = userEvent.setup();
      const onReplay = vi.fn();
      const onCopy = vi.fn();
      const onChain = vi.fn();
      const onGenerateTests = vi.fn();
      const onAddToCollection = vi.fn();
      const onBlockToggle = vi.fn();

      render(
        <ExpandedActionButtons
          entry={mockEntry}
          onReplay={onReplay}
          onCopy={onCopy}
          onChain={onChain}
          onGenerateTests={onGenerateTests}
          onAddToCollection={onAddToCollection}
          onBlockToggle={onBlockToggle}
          isBlocked={false}
        />
      );

      const addToCollectionButton = screen.getByTestId('add-to-collection-button');
      await user.click(addToCollectionButton);

      expect(onAddToCollection).toHaveBeenCalledTimes(1);
      expect(onAddToCollection).toHaveBeenCalledWith(mockEntry);
    });
  });
});
