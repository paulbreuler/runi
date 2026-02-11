/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

interface StatusBadgeProps {
  status: number;
  statusText: string;
}

// Get status color based on HTTP status code ranges
// Very subtle backgrounds with colored text for zen aesthetic
const getStatusStyles = (status: number): { bg: string; text: string; border: string } => {
  if (status >= 200 && status < 300) {
    return {
      bg: 'bg-signal-success-rgba-15',
      text: 'text-signal-success',
      border: 'border-signal-success/20',
    };
  }
  if (status >= 300 && status < 400) {
    return {
      bg: 'bg-accent-blue/10',
      text: 'text-accent-blue',
      border: 'border-accent-blue/20',
    };
  }
  if (status >= 400 && status < 500) {
    return {
      bg: 'bg-signal-warning-rgba-15',
      text: 'text-signal-warning',
      border: 'border-signal-warning/20',
    };
  }
  if (status >= 500) {
    return {
      bg: 'bg-signal-error/10',
      text: 'text-signal-error',
      border: 'border-signal-error/20',
    };
  }
  return {
    bg: 'bg-bg-raised/50',
    text: 'text-text-secondary',
    border: 'border-border-subtle',
  };
};

export const StatusBadge = ({ status, statusText }: StatusBadgeProps): React.JSX.Element => {
  const styles = getStatusStyles(status);

  return (
    <span
      className={`flex items-center gap-2 font-medium px-3 h-7 rounded-lg text-sm border transition-colors duration-200 ${styles.bg} ${styles.text} ${styles.border}`}
      data-test-id="status-badge"
    >
      <span className="font-semibold">{status}</span>
      <span className="opacity-80">{statusText}</span>
    </span>
  );
};
