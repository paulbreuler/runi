import { ExternalLink } from 'lucide-react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useCanvasPopout } from '@/hooks/useCanvasPopout';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { LayoutPicker } from './LayoutPicker';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';

interface ContextToolbarProps {
  className?: string;
}

export const ContextToolbar = ({ className }: ContextToolbarProps): React.JSX.Element | null => {
  const { activeContextId, contexts } = useCanvasStore();
  const { openPopout, isSupported } = useCanvasPopout();
  const { enabled: popoutEnabled } = useFeatureFlag('canvas', 'popout');

  if (activeContextId === null) {
    return null;
  }
  const context = contexts.get(activeContextId);
  if (context === undefined) {
    return null;
  }

  const ToolbarComponent = context.toolbar;

  return (
    <div
      className={cn(
        'px-3 py-1.5 flex items-center gap-2',
        'border-b border-border-default bg-bg-app',
        className
      )}
      data-test-id="context-toolbar"
    >
      {/* Context-specific toolbar */}
      <div className="flex-1 min-w-0">
        {ToolbarComponent !== undefined && (
          <ToolbarComponent contextId={activeContextId} isPopout={false} />
        )}
      </div>

      {/* Layout picker + popout */}
      <div className="flex items-center gap-1 shrink-0">
        <LayoutPicker />
        {popoutEnabled && isSupported && context.popoutEnabled === true && (
          <button
            type="button"
            onClick={() => {
              openPopout(activeContextId);
            }}
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded',
              'text-text-secondary hover:text-text-primary hover:bg-bg-raised',
              'motion-safe:transition-colors motion-reduce:transition-none',
              focusRingClasses
            )}
            data-test-id="popout-button"
            aria-label="Open in new window"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
