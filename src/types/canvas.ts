/**
 * Canvas Architecture Types
 *
 * Defines the foundational types for the canvas architecture including
 * context descriptors, layouts, arrangements, and panel/toolbar props.
 */

import type { LucideIcon } from 'lucide-react';

/**
 * Canvas context identifier
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
