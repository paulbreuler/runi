/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

interface NetworkStatusBarProps {
  /** Number of entries with drift detected */
  driftCount: number;
  /** Number of AI-generated entries */
  aiCount: number;
  /** Number of entries bound to spec */
  boundCount: number;
}

/**
 * Status bar footer for the Network History Panel.
 * Shows intelligence counts: drift, AI-generated, and spec-bound entries.
 * Only renders when there are intelligence counts to display.
 */
export const NetworkStatusBar = ({
  driftCount,
  aiCount,
  boundCount,
}: NetworkStatusBarProps): React.JSX.Element | null => {
  // Only render if there's at least one intelligence count
  const hasIntelligence = driftCount > 0 || aiCount > 0 || boundCount > 0;

  if (!hasIntelligence) {
    return null;
  }

  return (
    <div className="h-7 flex items-center gap-4 px-3 border-t border-border-subtle text-xs">
      {driftCount > 0 && (
        <span className="text-signal-warning" data-test-id="status-drift-count">
          {driftCount} with drift
        </span>
      )}

      {aiCount > 0 && (
        <span className="text-signal-ai" data-test-id="status-ai-count">
          {aiCount} AI-generated
        </span>
      )}

      {boundCount > 0 && (
        <span className="text-accent-blue" data-test-id="status-bound-count">
          {boundCount} spec-bound
        </span>
      )}
    </div>
  );
};
