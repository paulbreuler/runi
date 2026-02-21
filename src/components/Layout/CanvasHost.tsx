import { type FC, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { CanvasPanel } from './CanvasPanel';
import { cn } from '@/utils/cn';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * Sash classes - minimal, grounded resize handle styling
 * Matches the sidebar sash pattern: transparent by default, accent-blue on hover/drag
 */
const getSashClasses = (orientation: 'vertical' | 'horizontal', isDragging: boolean): string =>
  cn(
    'relative z-30 touch-none transition-colors shrink-0 select-none',
    orientation === 'vertical' ? 'w-[2px] cursor-col-resize' : 'h-[2px] cursor-row-resize',
    'bg-transparent',
    'hover:bg-accent-blue',
    isDragging && 'bg-accent-blue'
  );

/** Minimum panel percentage to prevent collapsing to zero */
const MIN_PANEL_PERCENT = 10;

interface CanvasHostProps {
  className?: string;
}

export const CanvasHost: FC<CanvasHostProps> = ({ className }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { activeContextId, contexts, getActiveLayout } = useCanvasStore();

  // Interactive panel ratios - local state overrides static layout ratios during drag
  const [liveRatios, setLiveRatios] = useState<number[] | null>(null);
  const [draggingSashIndex, setDraggingSashIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track the layout arrangement key to reset ratios when layout changes
  const layoutKeyRef = useRef<string>('');

  if (activeContextId === null) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-secondary">
        No active context
      </div>
    );
  }

  const context = contexts.get(activeContextId);
  const layout = getActiveLayout(activeContextId);

  if (context === undefined) {
    const registeredContexts = Array.from(contexts.keys()).join(', ');
    const contextList = registeredContexts.length > 0 ? registeredContexts : 'none';
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-text-secondary gap-2 p-8 text-center">
        <div className="text-signal-error font-medium">Context not found: {activeContextId}</div>
        <div className="text-xs">Registered contexts: {contextList}</div>
      </div>
    );
  }

  if (layout === null) {
    const layoutList = context.layouts.map((l) => l.id).join(', ');
    const availableLayouts = layoutList.length > 0 ? layoutList : 'none';
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-text-secondary gap-2 p-8 text-center">
        <div className="text-signal-error font-medium">
          Layout not found for context: {context.label}
        </div>
        <div className="text-xs">Available layouts: {availableLayouts}</div>
      </div>
    );
  }

  const { arrangement } = layout;
  const panelEntries = Object.entries(context.panels);

  // Reset live ratios when layout changes
  const currentLayoutKey = `${activeContextId}-${layout.id}-${arrangement.type}`;
  if (layoutKeyRef.current !== currentLayoutKey) {
    layoutKeyRef.current = currentLayoutKey;
    if (liveRatios !== null) {
      setLiveRatios(null);
    }
  }

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
          <MultiPanelLayout
            arrangement={arrangement}
            orientation="horizontal"
            activeContextId={activeContextId}
            context={context}
            resolvePanelName={resolvePanelName}
            liveRatios={liveRatios}
            setLiveRatios={setLiveRatios}
            draggingSashIndex={draggingSashIndex}
            setDraggingSashIndex={setDraggingSashIndex}
            containerRef={containerRef}
          />
        );
      }

      case 'rows': {
        return (
          <MultiPanelLayout
            arrangement={arrangement}
            orientation="vertical"
            activeContextId={activeContextId}
            context={context}
            resolvePanelName={resolvePanelName}
            liveRatios={liveRatios}
            setLiveRatios={setLiveRatios}
            draggingSashIndex={draggingSashIndex}
            setDraggingSashIndex={setDraggingSashIndex}
            containerRef={containerRef}
          />
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

// ---------------------------------------------------------------------------
// MultiPanelLayout - renders columns or rows with interactive sashes between
// ---------------------------------------------------------------------------

interface MultiPanelLayoutProps {
  arrangement: { type: 'columns' | 'rows'; panels: string[]; ratios?: number[] };
  orientation: 'horizontal' | 'vertical';
  activeContextId: string;
  context: { panels: Record<string, React.ComponentType<{ contextId: string; panelId: string }>> };
  resolvePanelName: (placeholder: string) => string;
  liveRatios: number[] | null;
  setLiveRatios: (ratios: number[] | null) => void;
  draggingSashIndex: number | null;
  setDraggingSashIndex: (index: number | null) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const MultiPanelLayout: FC<MultiPanelLayoutProps> = ({
  arrangement,
  orientation,
  activeContextId,
  context,
  resolvePanelName,
  liveRatios,
  setLiveRatios,
  draggingSashIndex,
  setDraggingSashIndex,
  containerRef,
}) => {
  const isHorizontal = orientation === 'horizontal';
  const panelCount = arrangement.panels.length;

  // Calculate default ratios from arrangement or equal-share fallback
  const getDefaultRatios = useCallback((): number[] => {
    return arrangement.panels.map(
      (_, index) => arrangement.ratios?.[index] ?? (panelCount >= 3 ? 100 / panelCount : 50)
    );
  }, [arrangement.panels, arrangement.ratios, panelCount]);

  // Active ratios: live overrides or arrangement defaults
  const ratios = liveRatios ?? getDefaultRatios();

  // Prevent text selection during drag
  useEffect((): (() => void) => {
    if (draggingSashIndex !== null) {
      document.body.style.userSelect = 'none';
      document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
    return (): void => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [draggingSashIndex, isHorizontal]);

  const handleSashPointerDown = useCallback(
    (sashIndex: number, e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      setDraggingSashIndex(sashIndex);

      // Initialise live ratios from current state if not already set
      if (liveRatios === null) {
        setLiveRatios(getDefaultRatios());
      }
    },
    [getDefaultRatios, liveRatios, setDraggingSashIndex, setLiveRatios]
  );

  const handleSashPointerMove = useCallback(
    (sashIndex: number, e: React.PointerEvent<HTMLDivElement>) => {
      if (draggingSashIndex !== sashIndex) {
        return;
      }

      const container = containerRef.current;
      if (container === null) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const totalSize = isHorizontal ? rect.width : rect.height;
      const cursorPos = isHorizontal ? e.clientX - rect.left : e.clientY - rect.top;
      const cursorPercent = (cursorPos / totalSize) * 100;

      // Calculate the split point between panels[sashIndex] and panels[sashIndex + 1]
      const currentRatios = liveRatios ?? getDefaultRatios();
      const newRatios = [...currentRatios];

      // Sum of ratios before the sash
      let sumBefore = 0;
      for (let i = 0; i < sashIndex; i++) {
        sumBefore += newRatios[i] ?? 0;
      }

      // The two adjacent panels share the space
      const leftVal = newRatios[sashIndex] ?? 50;
      const rightVal = newRatios[sashIndex + 1] ?? 50;
      const combined = leftVal + rightVal;
      let leftRatio = cursorPercent - sumBefore;
      let rightRatio = combined - leftRatio;

      // Enforce minimums
      if (leftRatio < MIN_PANEL_PERCENT) {
        leftRatio = MIN_PANEL_PERCENT;
        rightRatio = combined - leftRatio;
      }
      if (rightRatio < MIN_PANEL_PERCENT) {
        rightRatio = MIN_PANEL_PERCENT;
        leftRatio = combined - rightRatio;
      }

      newRatios[sashIndex] = leftRatio;
      newRatios[sashIndex + 1] = rightRatio;

      setLiveRatios(newRatios);
    },
    [containerRef, draggingSashIndex, getDefaultRatios, isHorizontal, liveRatios, setLiveRatios]
  );

  const handleSashPointerUp = useCallback(
    (_sashIndex: number, e: React.PointerEvent<HTMLDivElement>) => {
      if (draggingSashIndex === null) {
        return;
      }
      e.currentTarget.releasePointerCapture(e.pointerId);
      setDraggingSashIndex(null);
    },
    [draggingSashIndex, setDraggingSashIndex]
  );

  // Double-click resets to default ratios
  const handleSashDoubleClick = useCallback(() => {
    setLiveRatios(null);
  }, [setLiveRatios]);

  // Build interleaved panels + sashes
  const elements: React.ReactNode[] = [];

  arrangement.panels.forEach((placeholder, index) => {
    const panelName = resolvePanelName(placeholder);
    const PanelComponent = context.panels[panelName];
    if (PanelComponent === undefined) {
      return;
    }

    const sizeValue = `${String(ratios[index])}%`;

    elements.push(
      <CanvasPanel
        key={panelName}
        panelId={panelName}
        {...(isHorizontal ? { width: sizeValue } : { height: sizeValue })}
        className={cn(isHorizontal ? 'h-full' : 'w-full')}
      >
        <PanelComponent contextId={activeContextId} panelId={panelName} />
      </CanvasPanel>
    );

    // Add sash between panels (not after the last one)
    if (index < panelCount - 1) {
      const sashIdx = index;
      elements.push(
        <div
          key={`sash-${String(sashIdx)}`}
          className={getSashClasses(
            isHorizontal ? 'vertical' : 'horizontal',
            draggingSashIndex === sashIdx
          )}
          data-test-id={`canvas-sash-${String(sashIdx)}`}
          onPointerDown={(e) => {
            handleSashPointerDown(sashIdx, e);
          }}
          onPointerMove={(e) => {
            handleSashPointerMove(sashIdx, e);
          }}
          onPointerUp={(e) => {
            handleSashPointerUp(sashIdx, e);
          }}
          onPointerCancel={(e) => {
            handleSashPointerUp(sashIdx, e);
          }}
          onDoubleClick={handleSashDoubleClick}
          role="separator"
          aria-label={
            isHorizontal
              ? `Resize panels (double-click to reset)`
              : `Resize panels (double-click to reset)`
          }
          aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
        />
      );
    }
  });

  return (
    <div
      ref={containerRef}
      className={cn('flex h-full', isHorizontal ? 'flex-row' : 'flex-col')}
      data-test-id="canvas-panel-container"
    >
      {elements}
    </div>
  );
};
