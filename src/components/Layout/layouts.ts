/**
 * Generic Canvas Layouts
 *
 * Provides reusable layout definitions that can be used across different canvas contexts.
 */

import { Square, Columns2, Rows2, Columns3 } from 'lucide-react';
import type { CanvasLayout } from '@/types/canvas';

/**
 * Generic layouts available for all canvas contexts
 */
export const GENERIC_LAYOUTS: CanvasLayout[] = [
  {
    id: 'single',
    label: 'Single Panel',
    description: 'Focus on one panel at a time',
    icon: Square,
    arrangement: { type: 'single', panel: '$first' },
    category: 'generic',
  },
  {
    id: 'side-by-side',
    label: 'Side by Side',
    description: 'Two panels in columns',
    icon: Columns2,
    arrangement: { type: 'columns', panels: ['$first', '$second'] },
    category: 'generic',
  },
  {
    id: 'stacked',
    label: 'Stacked',
    description: 'Two panels in rows',
    icon: Rows2,
    arrangement: { type: 'rows', panels: ['$first', '$second'] },
    category: 'generic',
  },
  {
    id: 'three-columns',
    label: 'Three Columns',
    description: 'Three panels side by side',
    icon: Columns3,
    arrangement: { type: 'columns', panels: ['$first', '$second', '$third'] },
    category: 'generic',
  },
];
