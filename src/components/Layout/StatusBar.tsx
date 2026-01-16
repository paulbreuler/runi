import { getModifierKeyName } from '@/utils/platform';

export const StatusBar = (): React.JSX.Element => {
  const modifierKey = getModifierKeyName();

  return (
    <div
      className="h-8 border-t border-border-default bg-bg-surface flex items-center justify-between px-4 text-xs text-text-secondary"
      data-testid="status-bar"
    >
      <div className="flex items-center gap-4">
        <span>
          Environment: <strong className="font-mono text-text-primary">default</strong>
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span>
          Press{' '}
          <kbd className="px-1.5 py-0.5 bg-bg-app border border-border-default rounded text-xs">
            {modifierKey}I
          </kbd>{' '}
          for AI assistance
        </span>
      </div>
    </div>
  );
};
