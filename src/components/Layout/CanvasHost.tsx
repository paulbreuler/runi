import { type FC } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { CanvasPanel } from './CanvasPanel';
import { cn } from '@/utils/cn';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export const CanvasHost: FC<{ className?: string }> = ({ className }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { activeContextId, contexts, getActiveLayout } = useCanvasStore();

  if (activeContextId === null) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-secondary">
        No active context
      </div>
    );
  }

  const context = contexts.get(activeContextId);
  const layout = getActiveLayout(activeContextId);

  if (context === undefined || layout === null) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-secondary">
        Context not found
      </div>
    );
  }

  const { arrangement } = layout;
  const panelEntries = Object.entries(context.panels);

  // Resolve placeholders ($first, $second, $third)
  const resolvePanelName = (placeholder: string): string => {
    if (placeholder.startsWith('$')) {
      const placeholderMap: Record<string, number> = { $first: 0, $second: 1, $third: 2 };
      const index = placeholderMap[placeholder];
      if (index !== undefined) {
        return panelEntries[index]?.[0] ?? '';
      }
    }
    return placeholder;
  };

  // Render based on arrangement type
  const renderArrangement = (): React.ReactNode => {
    switch (arrangement.type) {
      case 'single': {
        const panelName = resolvePanelName(arrangement.panel);
        const PanelComponent = context.panels[panelName];
        if (PanelComponent === undefined) {
          return null;
        }

        return (
          <CanvasPanel key={panelName} panelId={panelName} className="flex-1 w-full h-full">
            <PanelComponent contextId={activeContextId} panelId={panelName} />
          </CanvasPanel>
        );
      }

      case 'columns': {
        return (
          <div className="flex flex-row h-full">
            {arrangement.panels.map((placeholder, index) => {
              const panelName = resolvePanelName(placeholder);
              const PanelComponent = context.panels[panelName];
              if (PanelComponent === undefined) {
                return null;
              }

              const ratio = arrangement.ratios?.[index] ?? 50;
              const width = `${String(ratio)}%`;

              return (
                <CanvasPanel
                  key={panelName}
                  panelId={panelName}
                  width={width}
                  className="h-full border-r border-border-default last:border-r-0"
                >
                  <PanelComponent contextId={activeContextId} panelId={panelName} />
                </CanvasPanel>
              );
            })}
          </div>
        );
      }

      case 'rows': {
        return (
          <div className="flex flex-col h-full">
            {arrangement.panels.map((placeholder, index) => {
              const panelName = resolvePanelName(placeholder);
              const PanelComponent = context.panels[panelName];
              if (PanelComponent === undefined) {
                return null;
              }

              const ratio = arrangement.ratios?.[index] ?? 50;
              const height = `${String(ratio)}%`;

              return (
                <CanvasPanel
                  key={panelName}
                  panelId={panelName}
                  height={height}
                  className="w-full border-b border-border-default last:border-b-0"
                >
                  <PanelComponent contextId={activeContextId} panelId={panelName} />
                </CanvasPanel>
              );
            })}
          </div>
        );
      }

      case 'grid':
        return (
          <div className="flex-1 flex items-center justify-center text-text-secondary">
            Grid layout not yet implemented
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${activeContextId}-${layout.id}`}
        className={cn('flex-1 overflow-hidden', className)}
        data-test-id="canvas-host"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.15 }}
      >
        {renderArrangement()}
      </motion.div>
    </AnimatePresence>
  );
};
