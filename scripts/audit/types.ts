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

/**
 * Design principles for component audit
 */
export type DesignPrinciple =
  | 'grayscale-foundation'
  | 'strategic-color'
  | 'semantic-tokens'
  | 'spacing-grid'
  | 'generous-whitespace'
  | 'subtle-depth'
  | 'typography-spacing'
  | 'dark-mode-compatible'
  | 'motion-animations'
  | 'zen-aesthetic'
  | 'radix-compliance';

/**
 * Compliance status for a principle evaluation
 */
export type ComplianceStatus = 'pass' | 'partial' | 'fail' | 'not-applicable';

/**
 * Severity level for violations
 */
export type ViolationSeverity = 'error' | 'warning' | 'info';

/**
 * A single violation of a design principle
 */
export interface PrincipleViolation {
  /** Line number where violation occurs */
  line: number;

  /** The offending code snippet */
  code: string;

  /** Human-readable violation message */
  message: string;

  /** Severity of the violation */
  severity: ViolationSeverity;

  /** Suggested fix */
  suggestion: string;
}

/**
 * Evaluation result for a single design principle
 */
export interface PrincipleEvaluation {
  /** The principle being evaluated */
  principle: DesignPrinciple;

  /** Overall compliance status */
  status: ComplianceStatus;

  /** Numeric score (0-100) */
  score: number;

  /** List of violations found */
  violations: PrincipleViolation[];

  /** Evidence of compliance (good patterns found) */
  evidence: string[];

  /** Recommendations for improvement */
  recommendations: string[];
}

/**
 * Full compliance report for a component
 */
export interface PrinciplesCompliance {
  /** Path to the component file */
  componentPath: string;

  /** Component name */
  componentName: string;

  /** Overall compliance score (0-100) */
  overallScore: number;

  /** Individual principle evaluations */
  principles: PrincipleEvaluation[];

  /** Summary statistics */
  summary: {
    totalPrinciples: number;
    passed: number;
    partial: number;
    failed: number;
    notApplicable: number;
  };

  /** Timestamp of evaluation */
  evaluatedAt: string;
}
