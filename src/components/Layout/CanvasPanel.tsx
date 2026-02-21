import { type FC, type ReactNode } from 'react';
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
  return (
    <div
      data-test-id={`canvas-panel-${panelId}`}
      className={cn('overflow-hidden relative', className)}
      style={{ minWidth, minHeight, width, height }}
    >
      {children}
    </div>
  );
};
