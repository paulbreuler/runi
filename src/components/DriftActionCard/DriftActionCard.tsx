/**
 * @file DriftActionCard component
 * @description Standalone card showing a detected drift with actionable resolution buttons.
 * Designed for future placement in the Vigilance Monitor panel.
 */

import * as React from 'react';
import { FileEdit, Wrench, EyeOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
import type { DriftActionType } from '@/types/generated/DriftActionType';
import type { DriftSeverity } from '@/types/generated/DriftSeverity';
import type { DriftSuggestedAction } from '@/types/generated/DriftSuggestedAction';

export interface DriftActionCardProps {
  /** HTTP method of the drifted operation (e.g., "GET", "POST"). */
  method: string;
  /** URL path of the drifted operation (e.g., "/users/{id}"). */
  path: string;
  /** Severity of the drift. */
  severity: DriftSeverity;
  /** Human-readable description of the drift. */
  description: string;
  /** Available resolution actions. */
  actions: DriftSuggestedAction[];
  /** Callback when an action button is clicked. */
  onAction: (actionType: DriftActionType) => void;
  /** Whether this drift has been resolved. */
  resolved?: boolean;
  /** Additional CSS classes. */
  className?: string;
}

const severityStyles: Record<DriftSeverity, string> = {
  info: 'text-accent-blue bg-accent-blue/10 border-accent-blue/20',
  warning: 'text-signal-warning bg-signal-warning/10 border-signal-warning/20',
  breaking: 'text-signal-error bg-signal-error/10 border-signal-error/20',
};

const cardBorderStyles: Record<DriftSeverity, string> = {
  info: 'border-accent-blue/20',
  warning: 'border-signal-warning/20',
  breaking: 'border-signal-error/20',
};

const actionIcons: Record<DriftActionType, React.ReactNode> = {
  update_spec: <FileEdit size={14} />,
  fix_request: <Wrench size={14} />,
  ignore: <EyeOff size={14} />,
};

const actionVariants: Record<DriftActionType, 'outline' | 'ghost' | 'secondary'> = {
  update_spec: 'outline',
  fix_request: 'outline',
  ignore: 'ghost',
};

export const DriftActionCard = ({
  method,
  path,
  severity,
  description,
  actions,
  onAction,
  resolved = false,
  className,
}: DriftActionCardProps): React.JSX.Element => {
  return (
    <div
      data-test-id="drift-action-card"
      className={cn(
        'rounded-lg border bg-bg-surface p-4 transition-colors',
        resolved ? 'border-signal-success/20 opacity-75' : cardBorderStyles[severity],
        focusRingClasses,
        className
      )}
      tabIndex={0}
      role="article"
      aria-label={`Drift detected: ${method} ${path}`}
    >
      {/* Header: method, path, severity badge */}
      <div className="flex items-center gap-2 mb-2">
        <span
          data-test-id="drift-method"
          className="font-mono text-xs font-semibold text-text-muted uppercase"
        >
          {method}
        </span>
        <span data-test-id="drift-path" className="font-mono text-sm text-text-primary truncate">
          {path}
        </span>
        <span
          data-test-id="drift-severity"
          className={cn(
            'ml-auto shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium',
            severityStyles[severity]
          )}
        >
          {severity}
        </span>
        {resolved && (
          <span
            data-test-id="drift-resolved-indicator"
            className="flex items-center gap-1 text-xs text-signal-success"
            aria-label="Resolved"
          >
            <Check size={12} />
            <span>Resolved</span>
          </span>
        )}
      </div>

      {/* Description */}
      <p data-test-id="drift-description" className="text-sm text-text-secondary mb-3">
        {description}
      </p>

      {/* Action buttons */}
      <div className="flex items-center gap-2" role="group" aria-label="Drift resolution actions">
        {actions.map((action) => (
          <Button
            key={action.actionType}
            variant={actionVariants[action.actionType]}
            size="sm"
            onClick={(): void => {
              onAction(action.actionType);
            }}
            disabled={resolved}
            aria-label={action.description}
            title={action.description}
            data-test-id={`drift-action-${action.actionType}`}
          >
            {actionIcons[action.actionType]}
            <span>{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
