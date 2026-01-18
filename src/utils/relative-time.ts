/**
 * Format a timestamp as a relative time string.
 *
 * @param timestamp - ISO timestamp string
 * @returns Relative time string (e.g., "2m ago", "yesterday", "3d ago")
 */
export function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);

  // Validate timestamp - return fallback if invalid
  if (Number.isNaN(date.getTime())) {
    return 'invalid date';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  }

  if (diffMinutes < 60) {
    return `${String(diffMinutes)}m ago`;
  }

  if (diffHours < 24) {
    return `${String(diffHours)}h ago`;
  }

  if (diffDays === 1) {
    return 'yesterday';
  }

  if (diffDays < 7) {
    return `${String(diffDays)}d ago`;
  }

  // For older dates, show formatted date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
