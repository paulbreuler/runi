/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

export const StatusBar = (): React.JSX.Element => {
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
          <span className="text-text-muted">Version:</span>
          <span className="font-mono text-text-secondary">
            {/* @ts-expect-error - Injected by Vite define */}
            {__APP_VERSION__}
          </span>
        </span>
      </div>
    </div>
  );
};
