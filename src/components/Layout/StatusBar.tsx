import { getModifierKeyName } from '@/utils/platform';

export const StatusBar = (): React.JSX.Element => {
  const modifierKey = getModifierKeyName();

  return (
    <div
      className="h-9 border-t border-border-default bg-bg-surface flex items-center justify-between px-6 text-xs text-text-secondary"
      data-testid="status-bar"
    >
      <div className="flex items-center gap-6">
        <span className="flex items-center gap-2">
          <span className="text-text-muted">Environment:</span>
          <strong className="font-mono text-text-primary">default</strong>
        </span>
      </div>
      <div className="flex items-center gap-6">
        <span className="flex items-center gap-1.5">
          <span className="text-text-muted">Press</span>
          <kbd className="px-2 py-0.5 bg-bg-raised border border-border-subtle rounded-md text-xs font-mono text-text-secondary">
            {modifierKey}I
          </kbd>
          <span className="text-text-muted">for AI assistance</span>
        </span>
      </div>
    </div>
  );
};
