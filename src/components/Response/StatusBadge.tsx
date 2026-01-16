import { getStatusColor } from '@/utils/http-colors';

interface StatusBadgeProps {
  status: number;
  statusText: string;
}

export const StatusBadge = ({ status, statusText }: StatusBadgeProps): React.JSX.Element => {
  const colorClass = getStatusColor(status);

  return (
    <span
      className={`font-semibold px-3 py-1.5 rounded-md text-sm transition-colors duration-200 ${colorClass}`}
      data-testid="status-badge"
    >
      {status} {statusText}
    </span>
  );
};
