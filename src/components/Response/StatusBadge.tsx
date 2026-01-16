interface StatusBadgeProps {
  status: number;
  statusText: string;
}

// Get status color based on HTTP status code ranges
const getStatusStyles = (status: number): { bg: string; text: string; border: string } => {
  if (status >= 200 && status < 300) {
    return {
      bg: 'bg-signal-success/15',
      text: 'text-signal-success',
      border: 'border-signal-success/30',
    };
  }
  if (status >= 300 && status < 400) {
    return {
      bg: 'bg-accent-blue/15',
      text: 'text-accent-blue',
      border: 'border-accent-blue/30',
    };
  }
  if (status >= 400 && status < 500) {
    return {
      bg: 'bg-signal-warning/15',
      text: 'text-signal-warning',
      border: 'border-signal-warning/30',
    };
  }
  if (status >= 500) {
    return {
      bg: 'bg-signal-error/15',
      text: 'text-signal-error',
      border: 'border-signal-error/30',
    };
  }
  return {
    bg: 'bg-bg-raised',
    text: 'text-text-secondary',
    border: 'border-border-subtle',
  };
};

export const StatusBadge = ({ status, statusText }: StatusBadgeProps): React.JSX.Element => {
  const styles = getStatusStyles(status);

  return (
    <span
      className={`inline-flex items-center gap-2 font-medium px-3 py-1.5 rounded-lg text-sm border transition-colors duration-200 ${styles.bg} ${styles.text} ${styles.border}`}
      data-testid="status-badge"
    >
      <span className="font-semibold">{status}</span>
      <span className="opacity-80">{statusText}</span>
    </span>
  );
};
