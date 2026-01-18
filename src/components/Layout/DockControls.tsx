import React from 'react';
import { PanelBottom, PanelLeft, PanelRight, ExternalLink } from 'lucide-react';
import { usePanelStore, type PanelPosition } from '@/stores/usePanelStore';
import { usePopoutWindow } from '@/hooks/usePopoutWindow';
import { cn } from '@/utils/cn';

interface DockControlsProps {
  /** Additional class name */
  className?: string;
  /** Called when pop-out is requested (overrides default behavior) */
  onPopout?: () => void;
}

interface DockButtonProps {
  position: PanelPosition;
  currentPosition: PanelPosition;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const DockButton = ({
  position,
  currentPosition,
  icon,
  label,
  onClick,
}: DockButtonProps): React.JSX.Element => {
  const isActive = position === currentPosition;

  return (
    <button
      type="button"
      className={cn(
        'p-1 rounded transition-colors',
        isActive
          ? 'text-text-primary bg-bg-elevated/70'
          : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50'
      )}
      onClick={onClick}
      aria-label={label}
      aria-pressed={isActive}
      title={label}
    >
      {icon}
    </button>
  );
};

/**
 * DockControls - Control buttons for changing panel dock position.
 *
 * Shows icons for bottom, left, right docking and pop-out to window.
 */
export const DockControls = ({ className, onPopout }: DockControlsProps): React.JSX.Element => {
  const { position, setPosition } = usePanelStore();
  const { openPopout } = usePopoutWindow();

  const handlePositionChange = (newPosition: PanelPosition): void => {
    setPosition(newPosition);
  };

  const handlePopout = (): void => {
    if (onPopout !== undefined) {
      onPopout();
    } else {
      void openPopout();
    }
  };

  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      role="group"
      aria-label="Dock position"
    >
      <DockButton
        position="bottom"
        currentPosition={position}
        icon={<PanelBottom size={14} />}
        label="Dock bottom"
        onClick={() => {
          handlePositionChange('bottom');
        }}
      />
      <DockButton
        position="left"
        currentPosition={position}
        icon={<PanelLeft size={14} />}
        label="Dock left"
        onClick={() => {
          handlePositionChange('left');
        }}
      />
      <DockButton
        position="right"
        currentPosition={position}
        icon={<PanelRight size={14} />}
        label="Dock right"
        onClick={() => {
          handlePositionChange('right');
        }}
      />

      <div className="w-px h-3 bg-border-default mx-1" />

      <button
        type="button"
        className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50 transition-colors"
        onClick={handlePopout}
        aria-label="Pop out to window"
        title="Pop out to window"
      >
        <ExternalLink size={14} />
      </button>
    </div>
  );
};
