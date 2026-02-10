/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Real-time activity feed showing actor-attributed actions.
 *
 * Shows a timeline of actions with actor icons:
 * - User actions (default)
 * - AI actions (purple highlight)
 * - System actions (gray)
 *
 * Scrollable feed, newest first. Click entry to focus target in UI.
 */

import { Activity } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  useActivityStore,
  type ActivityEntry as ActivityEntryType,
} from '@/stores/useActivityStore';
import { ActivityEntry } from './ActivityEntry';
import { cn } from '@/utils/cn';

interface ActivityFeedProps {
  /** Filter by actor type. */
  filter?: 'all' | 'ai' | 'user' | 'system';
  /** Maximum entries to display. */
  maxEntries?: number;
  /** Callback when an entry is clicked. */
  onEntryClick?: (entry: ActivityEntryType) => void;
  /** Additional CSS classes. */
  className?: string;
}

export const ActivityFeed = ({
  filter = 'all',
  maxEntries = 50,
  onEntryClick,
  className,
}: ActivityFeedProps): React.JSX.Element => {
  const entries = useActivityStore((s) => s.entries);
  const shouldReduceMotion = useReducedMotion();

  const filtered = entries
    .filter((e) => filter === 'all' || e.actor.type === filter)
    .slice(0, maxEntries);

  if (filtered.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 py-8 text-text-muted',
          className
        )}
        data-test-id="activity-feed-empty"
      >
        <Activity size={24} className="opacity-30" />
        <span className="text-xs">No activity yet</span>
        <span className="text-xs opacity-60">Actions from you and AI will appear here</span>
      </div>
    );
  }

  return (
    <div
      className={cn('flex flex-col overflow-y-auto', className)}
      data-test-id="activity-feed"
      data-scroll-container="true"
      role="log"
      aria-label="Activity feed"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {filtered.map((entry) => (
          <motion.div
            key={entry.id}
            initial={shouldReduceMotion === true ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={shouldReduceMotion === true ? undefined : { opacity: 0, height: 0 }}
            transition={
              shouldReduceMotion === true
                ? { duration: 0 }
                : { type: 'spring', stiffness: 500, damping: 30 }
            }
          >
            <ActivityEntry entry={entry} onClick={onEntryClick} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
