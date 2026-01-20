/**
 * @file CodeGenTab component
 * @description Main code generation tab component for expanded panel
 */

import { CodeGenPanel } from './CodeGenPanel';
import type { NetworkHistoryEntry } from '@/types/history';

export interface CodeGenTabProps {
  /** Network history entry with request/response data */
  entry: NetworkHistoryEntry;
  /** Additional CSS classes */
  className?: string;
}

/**
 * CodeGenTab component for the expanded panel.
 *
 * Displays code generation panel with multiple language options.
 * This is the main component that will be integrated into the
 * expanded panel's tab navigation.
 *
 * @example
 * ```tsx
 * <CodeGenTab entry={networkHistoryEntry} />
 * ```
 */
export const CodeGenTab = ({ entry, className }: CodeGenTabProps): React.ReactElement => {
  return (
    <div data-testid="codegen-tab" className={className}>
      <CodeGenPanel entry={entry} />
    </div>
  );
};
