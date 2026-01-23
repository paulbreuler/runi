/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file ExpandedActionButtons component
 * @description Action buttons for expanded panel - Feature #24
 */

import * as React from 'react';
import { Play, Copy, Link2, TestTube, FolderPlus, Ban, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import type { NetworkHistoryEntry } from '@/types/history';

export interface ExpandedActionButtonsProps {
  /** Network history entry */
  entry: NetworkHistoryEntry;
  /** Callback when Edit & Replay button is clicked */
  onReplay: (entry: NetworkHistoryEntry) => void;
  /** Callback when Copy cURL button is clicked */
  onCopy: (entry: NetworkHistoryEntry) => void;
  /** Callback when Chain Request button is clicked */
  onChain: (entry: NetworkHistoryEntry) => void;
  /** Callback when Generate Tests button is clicked */
  onGenerateTests: (entry: NetworkHistoryEntry) => void;
  /** Callback when Add to Collection button is clicked */
  onAddToCollection: (entry: NetworkHistoryEntry) => void;
  /** Callback when Block/Unblock button is clicked */
  onBlockToggle: (id: string, isBlocked: boolean) => void;
  /** Whether the entry is currently blocked */
  isBlocked: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ExpandedActionButtons - Action buttons displayed in the expanded panel.
 *
 * Provides quick access to common actions for a network history entry:
 * - Edit & Replay: Replay the request
 * - Copy cURL: Copy request as cURL command
 * - Chain Request: Create a chained request
 * - Generate Tests: Generate test code
 * - Add to Collection: Add request to collection
 * - Block/Unblock: Toggle blocking state
 *
 * @example
 * ```tsx
 * <ExpandedActionButtons
 *   entry={entry}
 *   onReplay={(e) => replayRequest(e)}
 *   onCopy={(e) => copyCurl(e)}
 *   onChain={(e) => chainRequest(e)}
 *   onGenerateTests={(e) => generateTests(e)}
 *   onAddToCollection={(e) => addToCollection(e)}
 *   onBlockToggle={(id, blocked) => toggleBlock(id, blocked)}
 *   isBlocked={false}
 * />
 * ```
 */
export const ExpandedActionButtons = ({
  entry,
  onReplay,
  onCopy,
  onChain,
  onGenerateTests,
  onAddToCollection,
  onBlockToggle,
  isBlocked,
  className,
}: ExpandedActionButtonsProps): React.JSX.Element => {
  const handleReplay = (): void => {
    onReplay(entry);
  };

  const handleCopy = (): void => {
    onCopy(entry);
  };

  const handleChain = (): void => {
    onChain(entry);
  };

  const handleGenerateTests = (): void => {
    onGenerateTests(entry);
  };

  const handleAddToCollection = (): void => {
    onAddToCollection(entry);
  };

  const handleBlockToggle = (): void => {
    onBlockToggle(entry.id, !isBlocked);
  };

  return (
    <div
      data-testid="expanded-action-buttons"
      className={cn('flex items-center gap-2 border-t border-border-subtle px-4 py-3', className)}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={handleReplay}
        aria-label="Edit & Replay"
        title="Edit & Replay"
        data-testid="replay-button"
      >
        <Play size={14} />
        <span>Edit & Replay</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        aria-label="Copy as cURL"
        title="Copy as cURL"
        data-testid="copy-curl-button"
      >
        <Copy size={14} />
        <span>Copy cURL</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleChain}
        aria-label="Chain Request"
        title="Chain Request"
        data-testid="chain-button"
      >
        <Link2 size={14} />
        <span>Chain Request</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleGenerateTests}
        aria-label="Generate Tests"
        title="Generate Tests"
        data-testid="generate-tests-button"
      >
        <TestTube size={14} />
        <span>Generate Tests</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleAddToCollection}
        aria-label="Add to Collection"
        title="Add to Collection"
        data-testid="add-to-collection-button"
      >
        <FolderPlus size={14} />
        <span>Add to Collection</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleBlockToggle}
        aria-label={isBlocked ? 'Unblock' : 'Block'}
        title={isBlocked ? 'Unblock' : 'Block'}
        data-testid="block-toggle-button"
      >
        {isBlocked ? <Unlock size={14} /> : <Ban size={14} />}
        <span>{isBlocked ? 'Unblock' : 'Block'}</span>
      </Button>
    </div>
  );
};
