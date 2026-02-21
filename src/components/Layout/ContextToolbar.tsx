import { ExternalLink } from 'lucide-react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useCanvasPopout } from '@/hooks/useCanvasPopout';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useRequestStoreRaw } from '@/stores/useRequestStore';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { DriftContextBanner } from '@/components/DriftReview/DriftContextBanner';
import { LayoutPicker } from './LayoutPicker';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
import type { RequestTabSource } from '@/types/canvas';

interface ContextToolbarProps {
  className?: string;
}

/** Extract the URL path from a full URL string. Returns undefined when URL is empty or unparseable. */
function extractPath(url: string): string | undefined {
  if (url.length === 0) {
    return undefined;
  }
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://example.com${url}`);
    return parsed.pathname;
  } catch {
    return undefined;
  }
}

export const ContextToolbar = ({ className }: ContextToolbarProps): React.JSX.Element | null => {
  const { activeContextId, contexts, contextState } = useCanvasStore();
  const { openPopout, isSupported } = useCanvasPopout();
  const { enabled: popoutEnabled } = useFeatureFlag('canvas', 'popout');
  const requestContexts = useRequestStoreRaw((state) => state.contexts);
  const driftResults = useCollectionStore((state) => state.driftResults);

  if (activeContextId === null) {
    return null;
  }
  const context = contexts.get(activeContextId);
  if (context === undefined) {
    return null;
  }

  const ToolbarComponent = context.toolbar;

  // Derive drift context banner data from active request context
  const isRequestContext = context.contextType === 'request';
  const tabState = isRequestContext ? contextState.get(activeContextId) : undefined;
  const tabSource = tabState?.source as RequestTabSource | undefined;
  const bannerCollectionId = tabSource?.collectionId;
  const activeRequestState = isRequestContext ? requestContexts[activeContextId] : undefined;
  const bannerMethod = activeRequestState?.method;
  const bannerPath =
    activeRequestState?.url !== undefined ? extractPath(activeRequestState.url) : undefined;
  const bannerDriftResult =
    bannerCollectionId !== undefined ? driftResults[bannerCollectionId] : undefined;
  return (
    <div
      className={cn('flex flex-col', 'border-b border-border-default bg-bg-app', className)}
      data-test-id="context-toolbar"
    >
      {/* Toolbar row */}
      <div className="px-3 py-1.5 flex items-center gap-2">
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
                'flex items-center justify-center w-[34px] h-[34px] rounded',
                'text-text-muted hover:text-text-primary hover:bg-bg-raised/50',
                'motion-safe:transition-colors motion-reduce:transition-none',
                focusRingClasses
              )}
              data-test-id="popout-button"
              aria-label="Open in new window"
            >
              <ExternalLink size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Drift context banner — shown below URL bar for request context only */}
      {isRequestContext &&
        bannerCollectionId !== undefined &&
        bannerMethod !== undefined &&
        bannerPath !== undefined && (
          <DriftContextBanner
            collectionId={bannerCollectionId}
            method={bannerMethod}
            path={bannerPath}
            driftResult={bannerDriftResult}
          />
        )}
    </div>
  );
};
