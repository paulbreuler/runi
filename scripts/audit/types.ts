/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Component Design Principles Audit - Type Definitions
 * @description TypeScript interfaces for component discovery and analysis
 */

/**
 * Component category classification
 */
export type ComponentCategory =
  | 'Core'
  | 'Layout'
  | 'Request'
  | 'Response'
  | 'Intelligence'
  | 'Overlays'
  | 'Unknown';

/**
 * Component metadata extracted from codebase
 */
export interface ComponentMetadata {
  /** Full file path relative to project root */
  path: string;

  /** Component name (extracted from file/export) */
  name: string;

  /** Component category (Core, Layout, Request, Response, Intelligence, Overlays) */
  category: ComponentCategory;

  /** Export type (default, named, both) */
  exportType: 'default' | 'named' | 'both';

  /** Props interface name */
  propsInterface?: string;

  /** File size in bytes */
  fileSize: number;

  /** Line count */
  lineCount: number;

  /** Dependencies (imports from other components) */
  dependencies: string[];

  /** Whether component has children components */
  hasChildren: boolean;

  /** Parent component (if part of hierarchy) */
  parent?: string;
}

/**
 * Options for component discovery
 */
export interface DiscoveryOptions {
  /** Root directory to scan (default: 'src/components') */
  rootDir?: string;

  /** File patterns to include (default: glob patterns for .tsx and .jsx files) */
  includePatterns?: string[];

  /** File patterns to exclude (default: test and story files) */
  excludePatterns?: string[];

  /** Whether to follow re-exports from index files */
  followReExports?: boolean;
}
