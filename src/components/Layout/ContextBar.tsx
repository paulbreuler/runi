import { type FC } from 'react';
import { ExternalLink } from 'lucide-react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useCanvasPopout } from '@/hooks/useCanvasPopout';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { LayoutPicker } from './LayoutPicker';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';

export const ContextBar: FC<{ className?: string }> = ({ className }) => {
  const { activeContextId, contexts, contextOrder, setActiveContext } = useCanvasStore();
  const { openPopout, isSupported } = useCanvasPopout();
  const { enabled: popoutEnabled } = useFeatureFlag('canvas', 'popout');

  return (
    <div
      className={cn(
        'h-8 px-4 flex items-center justify-between',
        'bg-bg-surface border-b border-border-default',
        className
      )}
      data-test-id="context-bar"
    >
      {/* Context tabs */}
      <div role="tablist" className="flex items-center gap-1" data-test-id="context-tabs">
        {contextOrder.map((contextId) => {
          const context = contexts.get(contextId);
          if (context === undefined) {
            return null;
          }

          const isActive = contextId === activeContextId;
          const Icon = context.icon;

          return (
            <button
              key={contextId}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setActiveContext(contextId);
              }}
              className={cn(
                'flex items-center gap-2 px-3 h-7 text-sm rounded-t transition-colors relative',
                focusRingClasses,
                isActive
                  ? 'text-text-primary bg-bg-app'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-raised'
              )}
              data-test-id={`context-tab-${contextId}`}
            >
              {Icon !== undefined && <Icon className="w-4 h-4" />}
              <span>{context.label}</span>

              {/* Active indicator */}
              {isActive && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-blue"
                  data-test-id="active-indicator"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Layout picker + popout */}
      <div className="flex items-center gap-2">
        <LayoutPicker />

        {popoutEnabled &&
          isSupported &&
          activeContextId !== null &&
          contexts.get(activeContextId)?.popoutEnabled === true && (
            <button
              type="button"
              onClick={() => {
                openPopout(activeContextId);
              }}
              className={cn(
                'flex items-center justify-center w-7 h-7 rounded',
                'text-text-secondary hover:text-text-primary hover:bg-bg-raised',
                'transition-colors',
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
