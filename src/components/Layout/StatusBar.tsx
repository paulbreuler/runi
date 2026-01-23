/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { getModifierKeyName } from '@/utils/platform';

export const StatusBar = (): React.JSX.Element => {
  const modifierKey = getModifierKeyName();

  return (
    <div
      className="h-8 border-t border-border-subtle bg-bg-surface/80 flex items-center justify-between px-5 text-xs"
      data-testid="status-bar"
    >
      <div className="flex items-center gap-4 opacity-70">
        <span className="flex items-center gap-1.5">
          <span className="text-text-muted">Environment:</span>
          <span className="font-mono text-text-secondary">default</span>
        </span>
      </div>
      <div className="flex items-center gap-4 opacity-60 hover:opacity-100 transition-opacity">
        <span className="flex items-center gap-1.5 text-text-muted">
          Press
          <kbd className="px-1.5 py-0.5 bg-bg-raised/50 border border-border-subtle rounded text-[10px] font-mono text-text-muted">
            {modifierKey}I
          </kbd>
          for AI assistance
        </span>
      </div>
    </div>
  );
};
