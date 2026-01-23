/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

interface NetworkStatusBarProps {
  /** Total number of history entries */
  totalCount: number;
  /** Number of entries with drift detected */
  driftCount: number;
  /** Number of AI-generated entries */
  aiCount: number;
  /** Number of entries bound to spec */
  boundCount: number;
}

/**
 * Status bar footer for the Network History Panel.
 * Shows counts for drift, AI-generated, and spec-bound entries.
 */
export const NetworkStatusBar = ({
  totalCount,
  driftCount,
  aiCount,
  boundCount,
}: NetworkStatusBarProps): React.JSX.Element => {
  const requestWord = totalCount === 1 ? 'request' : 'requests';

  return (
    <div className="flex items-center justify-between px-3 py-2 border-t border-border-subtle text-xs">
      {/* Left side - counts */}
      <div className="flex items-center gap-4">
        <span className="text-text-secondary">
          {totalCount} {requestWord}
        </span>

        {driftCount > 0 && <span className="text-signal-warning">{driftCount} with drift</span>}

        {aiCount > 0 && <span className="text-signal-ai">{aiCount} AI-generated</span>}

        {boundCount > 0 && <span className="text-accent-blue">{boundCount} spec-bound</span>}
      </div>

      {/* Right side - keyboard hint */}
      <span className="text-text-muted">
        <kbd className="px-1 py-0.5 bg-bg-raised rounded text-xs">⌘K</kbd> to search
      </span>
    </div>
  );
};
