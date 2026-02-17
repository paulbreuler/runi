import { type FC, useState } from 'react';
import { Check } from 'lucide-react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover';
import { GENERIC_LAYOUTS } from './layouts';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';

export const LayoutPicker: FC<{ className?: string }> = ({ className }) => {
  const [open, setOpen] = useState(false);
  const { activeContextId, contexts, getActiveLayout, setLayout } = useCanvasStore();

  if (activeContextId === null) {
    return null;
  }

  const context = contexts.get(activeContextId);
  const activeLayout = getActiveLayout(activeContextId);

  if (context === undefined) {
    return null;
  }

  const handleSelectLayout = (layoutId: string): void => {
    setLayout(activeContextId, layoutId);
    setOpen(false);
  };

  const presetLayouts = context.layouts;
  const genericLayouts = GENERIC_LAYOUTS;
  const activeLayoutLabel = activeLayout?.label ?? 'Layout';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'flex items-center justify-center',
          'w-[34px] h-[34px] rounded',
          'text-text-muted hover:text-text-primary',
          'hover:bg-bg-raised/50',
          'motion-safe:transition-colors motion-reduce:transition-none',
          focusRingClasses,
          className
        )}
        data-test-id="layout-picker-trigger"
        title={activeLayoutLabel}
        aria-label={`Layout: ${activeLayoutLabel}`}
      >
        {activeLayout !== null && <activeLayout.icon className="w-4 h-4" />}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-64 p-2" data-test-id="layout-picker-content">
        <div className="space-y-2">
          {/* Preset layouts */}
          {presetLayouts.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs font-medium text-text-tertiary uppercase">
                Panel Layouts
              </div>
              <div className="space-y-1">
                {presetLayouts.map((layout) => {
                  const Icon = layout.icon;
                  const isActive = activeLayout?.id === layout.id;

                  return (
                    <button
                      key={layout.id}
                      type="button"
                      onClick={() => {
                        handleSelectLayout(layout.id);
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-2 py-2 rounded',
                        'text-left text-sm hover:bg-bg-raised motion-safe:transition-colors motion-reduce:transition-none',
                        focusRingClasses,
                        isActive && 'bg-bg-raised text-text-primary'
                      )}
                      data-test-id={`layout-option-${layout.id}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{layout.label}</div>
                        <div className="text-xs text-text-tertiary">{layout.description}</div>
                      </div>
                      {isActive && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Separator */}
          {presetLayouts.length > 0 && genericLayouts.length > 0 && (
            <div className="border-t border-border-default" />
          )}

          {/* Generic layouts */}
          {genericLayouts.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs font-medium text-text-tertiary uppercase">
                Generic
              </div>
              <div className="space-y-1">
                {genericLayouts.map((layout) => {
                  const Icon = layout.icon;
                  const isActive = activeLayout?.id === layout.id;

                  return (
                    <button
                      key={layout.id}
                      type="button"
                      onClick={() => {
                        handleSelectLayout(layout.id);
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-2 py-2 rounded',
                        'text-left text-sm hover:bg-bg-raised motion-safe:transition-colors motion-reduce:transition-none',
                        focusRingClasses,
                        isActive && 'bg-bg-raised text-text-primary'
                      )}
                      data-test-id={`layout-option-${layout.id}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{layout.label}</div>
                        <div className="text-xs text-text-tertiary">{layout.description}</div>
                      </div>
                      {isActive && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
