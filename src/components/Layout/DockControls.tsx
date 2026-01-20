import React, { useRef, useEffect } from 'react';
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
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}

const DockButton = ({
  position,
  currentPosition,
  icon,
  label,
  onClick,
  buttonRef,
}: DockButtonProps): React.JSX.Element => {
  const isActive = position === currentPosition;

  return (
    <button
      ref={buttonRef}
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

  // Refs for each dock button to preserve focus after position change
  const bottomButtonRef = useRef<HTMLButtonElement>(null);
  const leftButtonRef = useRef<HTMLButtonElement>(null);
  const rightButtonRef = useRef<HTMLButtonElement>(null);

  // Track which button was clicked to restore focus after position change
  const clickedPositionRef = useRef<PanelPosition | null>(null);
  const previousPositionRef = useRef<PanelPosition>(position);

  const handlePositionChange = (newPosition: PanelPosition): void => {
    // Store which button was clicked for focus restoration after remount
    clickedPositionRef.current = newPosition;
    setPosition(newPosition);
  };

  // Restore focus after position changes and component remounts
  useEffect(() => {
    if (position !== previousPositionRef.current && clickedPositionRef.current !== null) {
      // Wait for component to fully remount and DOM to be ready
      // Use multiple RAFs + timeout to ensure we're after all React updates
      const attemptFocus = (attempts = 0): void => {
        const maxAttempts = 10;
        let buttonToFocus: HTMLButtonElement | null = null;

        if (clickedPositionRef.current === 'bottom') {
          buttonToFocus = bottomButtonRef.current;
        } else if (clickedPositionRef.current === 'left') {
          buttonToFocus = leftButtonRef.current;
        } else if (clickedPositionRef.current === 'right') {
          buttonToFocus = rightButtonRef.current;
        }

        if (buttonToFocus?.isConnected === true) {
          // Button is in DOM, restore focus
          buttonToFocus.focus();
          clickedPositionRef.current = null;
        } else if (attempts < maxAttempts) {
          // Button not ready yet, try again
          requestAnimationFrame(() => {
            setTimeout(() => {
              attemptFocus(attempts + 1);
            }, 10);
          });
        } else {
          // Give up after max attempts
          clickedPositionRef.current = null;
        }
      };

      // Start focus restoration after a short delay to allow remount
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          attemptFocus();
        });
      });
    }
    previousPositionRef.current = position;
  }, [position]);

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
        buttonRef={bottomButtonRef}
        onClick={() => {
          handlePositionChange('bottom');
        }}
      />
      <DockButton
        position="left"
        currentPosition={position}
        icon={<PanelLeft size={14} />}
        label="Dock left"
        buttonRef={leftButtonRef}
        onClick={() => {
          handlePositionChange('left');
        }}
      />
      <DockButton
        position="right"
        currentPosition={position}
        icon={<PanelRight size={14} />}
        label="Dock right"
        buttonRef={rightButtonRef}
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
