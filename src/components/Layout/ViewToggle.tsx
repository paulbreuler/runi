import type { ViewMode } from '@/stores/useSettingsStore';

interface ViewToggleProps {
  /** Current view mode */
  viewMode: ViewMode;
  /** Callback when view mode changes */
  onViewChange: (mode: ViewMode) => void;
}

/**
 * ViewToggle - Segmented control for switching between Request Builder and Network History views.
 */
export const ViewToggle = ({ viewMode, onViewChange }: ViewToggleProps): React.JSX.Element => {
  const handleClick = (mode: ViewMode): void => {
    if (mode !== viewMode) {
      onViewChange(mode);
    }
  };

  return (
    <div className="inline-flex rounded-md bg-bg-raised p-0.5 text-xs">
      <button
        type="button"
        role="button"
        aria-label="Builder"
        data-active={viewMode === 'builder'}
        onClick={() => {
          handleClick('builder');
        }}
        className={`px-3 py-1 rounded transition-colors ${
          viewMode === 'builder'
            ? 'bg-bg-surface text-text-primary shadow-sm'
            : 'text-text-muted hover:text-text-secondary'
        }`}
      >
        Builder
      </button>
      <button
        type="button"
        role="button"
        aria-label="History"
        data-active={viewMode === 'history'}
        onClick={() => {
          handleClick('history');
        }}
        className={`px-3 py-1 rounded transition-colors ${
          viewMode === 'history'
            ? 'bg-bg-surface text-text-primary shadow-sm'
            : 'text-text-muted hover:text-text-secondary'
        }`}
      >
        History
      </button>
    </div>
  );
};
