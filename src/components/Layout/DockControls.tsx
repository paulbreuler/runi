/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useRef, useEffect } from 'react';
import { PanelBottom, PanelLeft, PanelRight, ExternalLink, Ellipsis } from 'lucide-react';
import { Menu } from '@base-ui/react/menu';
import { usePanelStore, type PanelPosition } from '@/stores/usePanelStore';
import { focusRingClasses } from '@/utils/accessibility';
import { usePopoutWindow } from '@/hooks/usePopoutWindow';
import { cn } from '@/utils/cn';
import { OVERLAY_Z_INDEX } from '@/utils/z-index';

interface DockControlsProps {
  /** Additional class name */
  className?: string;
  /** Called when pop-out is requested (overrides default behavior) */
  onPopout?: () => void;
  /** When true, collapse dock buttons into a single overflow menu */
  collapsed?: boolean;
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
        focusRingClasses,
        'p-1 rounded transition-colors',
        isActive
          ? 'text-text-primary bg-bg-raised/80'
          : 'text-text-secondary hover:text-text-primary hover:bg-bg-raised/50'
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
 * Shared menu item styling — matches ContextTabs and CollectionItem patterns.
 */
const menuItemClasses =
  'flex items-center gap-2 px-2 py-1.5 text-xs rounded-sm cursor-pointer outline-none data-[highlighted]:bg-bg-raised/60 text-text-secondary data-[highlighted]:text-text-primary';

const menuPopupClasses =
  'min-w-[140px] rounded-md border border-border-default bg-bg-elevated p-1 shadow-lg outline-none motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-reduce:animate-none';

/**
 * DockControls - Control buttons for changing panel dock position.
 *
 * When `collapsed` is true (e.g. header tabs overflow), the 3 dock-position
 * buttons + pop-out are folded into a single overflow menu behind an ellipsis
 * trigger, reclaiming ~140 px of header space for tabs.
 *
 * When `collapsed` is false (default), the buttons render inline as before.
 */
export const DockControls = ({
  className,
  onPopout,
  collapsed = false,
}: DockControlsProps): React.JSX.Element => {
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
    // Track cleanup state and timeout for this effect
    let isCleanedUp = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let observer: MutationObserver | null = null;

    if (position !== previousPositionRef.current && clickedPositionRef.current !== null) {
      // Determine which button to focus based on clicked position
      let buttonToFocus: HTMLButtonElement | null = null;
      if (clickedPositionRef.current === 'bottom') {
        buttonToFocus = bottomButtonRef.current;
      } else if (clickedPositionRef.current === 'left') {
        buttonToFocus = leftButtonRef.current;
      } else if (clickedPositionRef.current === 'right') {
        buttonToFocus = rightButtonRef.current;
      }

      if (buttonToFocus !== null) {
        // Capture button reference for use in callbacks
        const button = buttonToFocus;

        // Use MutationObserver to detect when button is connected to DOM
        // This is more reliable than polling and avoids arbitrary retry counts
        observer = new MutationObserver(() => {
          if (isCleanedUp) {
            return;
          }
          if (button.isConnected) {
            // Button is in DOM, restore focus
            requestAnimationFrame(() => {
              if (isCleanedUp) {
                return;
              }
              button.focus();
              clickedPositionRef.current = null;
              observer?.disconnect();
            });
          }
        });

        // Capture observer reference for use in callbacks
        const currentObserver = observer;

        // Start observing after a short delay to allow React to start remounting
        requestAnimationFrame(() => {
          if (isCleanedUp) {
            return;
          }

          // Observe the parent container (document.body) for subtree changes
          currentObserver.observe(document.body, {
            childList: true,
            subtree: true,
          });

          // If button is already connected, focus immediately
          if (button.isConnected) {
            requestAnimationFrame(() => {
              if (isCleanedUp) {
                return;
              }
              button.focus();
              clickedPositionRef.current = null;
              currentObserver.disconnect();
            });
          } else {
            // Set a timeout to give up if button doesn't appear (safety net)
            timeoutId = setTimeout(() => {
              if (isCleanedUp) {
                return;
              }
              currentObserver.disconnect();
              clickedPositionRef.current = null;
            }, 1000);
          }
        });
      } else {
        clickedPositionRef.current = null;
      }
    }
    previousPositionRef.current = position;

    // Cleanup function to disconnect observer on unmount
    return (): void => {
      isCleanedUp = true;
      if (observer !== null) {
        observer.disconnect();
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [position]);

  const handlePopout = (): void => {
    if (onPopout !== undefined) {
      onPopout();
    } else {
      void openPopout();
    }
  };

  // ---- Collapsed mode: single ellipsis menu ----
  if (collapsed) {
    const dockOptions: Array<{ position: PanelPosition; icon: React.ReactNode; label: string }> = [
      { position: 'bottom', icon: <PanelBottom size={14} />, label: 'Dock bottom' },
      { position: 'left', icon: <PanelLeft size={14} />, label: 'Dock left' },
      { position: 'right', icon: <PanelRight size={14} />, label: 'Dock right' },
    ];

    return (
      <Menu.Root>
        <Menu.Trigger
          render={(props) => (
            <button
              {...props}
              type="button"
              className={cn(
                focusRingClasses,
                'p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-raised/50 transition-colors',
                className
              )}
              aria-label="Panel options"
              title="Panel options"
              data-test-id="dock-controls-menu-trigger"
            >
              <Ellipsis size={14} />
            </button>
          )}
        />
        <Menu.Portal>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: OVERLAY_Z_INDEX,
              pointerEvents: 'none',
            }}
          >
            <div style={{ pointerEvents: 'auto' }}>
              <Menu.Positioner sideOffset={4} align="end">
                <Menu.Popup style={{ zIndex: OVERLAY_Z_INDEX }} className={menuPopupClasses}>
                  {dockOptions.map(({ position: pos, icon, label }) => (
                    <Menu.Item
                      key={pos}
                      label={label}
                      className={cn(
                        menuItemClasses,
                        pos === position && 'bg-bg-raised/60 text-text-primary'
                      )}
                      closeOnClick={true}
                      onClick={() => {
                        handlePositionChange(pos);
                      }}
                    >
                      {icon}
                      <span>{label}</span>
                      {pos === position && (
                        <span className="ml-auto text-text-muted text-[10px]">Active</span>
                      )}
                    </Menu.Item>
                  ))}
                  <Menu.Separator className="h-px bg-border-subtle my-1" />
                  <Menu.Item
                    label="Pop out to window"
                    className={menuItemClasses}
                    closeOnClick={true}
                    onClick={handlePopout}
                  >
                    <ExternalLink size={14} />
                    <span>Pop out to window</span>
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </div>
          </div>
        </Menu.Portal>
      </Menu.Root>
    );
  }

  // ---- Expanded mode: inline buttons (default) ----
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
        className={cn(
          focusRingClasses,
          'p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-raised/50 transition-colors'
        )}
        onClick={handlePopout}
        aria-label="Pop out to window"
        title="Pop out to window"
      >
        <ExternalLink size={14} />
      </button>
    </div>
  );
};
