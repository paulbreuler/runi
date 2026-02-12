import { type FC, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/utils/cn';

interface CanvasPanelProps {
  children: ReactNode;
  panelId: string;
  minWidth?: number;
  minHeight?: number;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const CanvasPanel: FC<CanvasPanelProps> = ({
  children,
  panelId,
  minWidth = 200,
  minHeight = 200,
  width,
  height,
  className,
}) => {
  const prefersReducedMotion = useReducedMotion() === true;

  return (
    <motion.div
      data-test-id={`canvas-panel-${panelId}`}
      className={cn('overflow-hidden relative', className)}
      style={{ minWidth, minHeight, width, height }}
      layout={!prefersReducedMotion}
      transition={prefersReducedMotion ? { duration: 0 } : undefined}
    >
      {children}
    </motion.div>
  );
};
