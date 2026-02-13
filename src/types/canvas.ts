/**
 * Canvas Architecture Types
 *
 * Defines the foundational types for the canvas architecture including
 * context descriptors, layouts, arrangements, and panel/toolbar props.
 */

import type React from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * Canvas context identifier
 * - Static contexts: 'request', 'blueprint', 'docs'
 * - Dynamic request tabs: 'request-{uuid}'
 */
export type CanvasContextId = 'request' | 'blueprint' | 'docs' | (string & {});

/**
 * Canvas arrangement types
 */
export type CanvasArrangement =
  | { type: 'single'; panel: string }
  | { type: 'columns'; panels: string[]; ratios?: number[] }
  | { type: 'rows'; panels: string[]; ratios?: number[] }
  | { type: 'grid'; panels: string[][]; columns: number };

/**
 * Canvas layout definition
 */
export interface CanvasLayout {
  /** Unique layout identifier */
  id: string;
  /** Display label */
  label: string;
  /** Description of the layout */
  description: string;
  /** Icon component */
  icon: LucideIcon;
  /** Panel arrangement configuration */
  arrangement: CanvasArrangement;
  /** Layout category for grouping */
  category: 'preset' | 'generic';
}

/**
 * Canvas context descriptor
 */
export interface CanvasContextDescriptor {
  /** Unique context identifier */
  id: CanvasContextId;
  /** Display label */
  label: string;
  /** Icon component */
  icon?: LucideIcon;
  /** Available panels in this context */
  panels: Record<string, React.ComponentType<CanvasPanelProps>>;
  /** Optional toolbar component */
  toolbar?: React.ComponentType<CanvasToolbarProps>;
  /** Available layouts for this context */
  layouts: CanvasLayout[];
  /** Whether this context supports popout */
  popoutEnabled?: boolean;
  /** Default popout window options */
  popoutDefaults?: {
    width?: number;
    height?: number;
    title?: string;
  };
  /** Order in context switcher */
  order?: number;
  /** Keyboard shortcut hint */
  shortcutHint?: string;
  /** Context type (e.g., 'request') to mark this as a template */
  contextType?: string;
}

/**
 * Props passed to canvas panels
 */
export interface CanvasPanelProps {
  /** Context identifier */
  contextId: CanvasContextId;
  /** Panel identifier */
  panelId: string;
  /** Whether panel is in popout window */
  isPopout?: boolean;
}

/**
 * Props passed to canvas toolbars
 */
export interface CanvasToolbarProps {
  /** Context identifier */
  contextId: CanvasContextId;
  /** Whether toolbar is in popout window */
  isPopout?: boolean;
}

/**
 * Request tab source - identifies where the request originated from
 */
export interface RequestTabSource {
  type: 'collection' | 'history';
  collectionId?: string;
  requestId?: string;
  historyEntryId?: string;
}

/**
 * State for a request tab context
 *
 * Request-specific data (method, url, headers, body, response) is managed
 * by useRequestStore (keyed by contextId). This interface defines the
 * metadata managed by useCanvasStore.
 */
export interface RequestTabState {
  /** Whether the tab has unsaved changes */
  isDirty?: boolean;
  /** Origin of this tab's content */
  source?: RequestTabSource;
  /** Timestamp when the tab was created */
  createdAt?: number;
  /** User-provided or AI-suggested friendly name for the tab (must be unique) */
  name?: string;
  /** Whether the tab has been "saved" (has meaningful data) */
  isSaved?: boolean;
}
