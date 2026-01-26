/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Performance Pattern Analysis
 * @description Analyzes React components for performance best practices
 */

import { readFileSync } from 'fs';
import { basename } from 'path';
import * as ts from 'typescript';
import type { PerformancePattern, PerformanceIssue, PerformanceSeverity } from './types';
import { discoverComponents } from './discover-components';

// Hardware-accelerated CSS properties (transform-based or opacity)
const HARDWARE_ACCELERATED_PROPS = new Set([
  'x',
  'y',
  'z',
  'rotate',
  'rotateX',
  'rotateY',
  'rotateZ',
  'scale',
  'scaleX',
  'scaleY',
  'scaleZ',
  'skew',
  'skewX',
  'skewY',
  'opacity',
  'transform',
  'translateX',
  'translateY',
  'translateZ',
]);

// Layout-thrashing CSS properties (trigger layout recalculation)
const LAYOUT_THRASHING_PROPS = new Set([
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'flex',
  'flexBasis',
  'flexGrow',
  'flexShrink',
  'gridTemplateColumns',
  'gridTemplateRows',
  'gap',
]);

// Non-hardware-accelerated positioning properties
const NON_ACCELERATED_POSITION_PROPS = new Set(['left', 'right', 'top', 'bottom', 'inset']);

/**
 * Analyze a component for performance patterns
 */
export async function analyzePerformance(
  componentPath: string,
  sourceCode?: string
): Promise<PerformancePattern> {
  const code = sourceCode ?? readFileSync(componentPath, 'utf-8');
  const name = basename(componentPath, /\.(tsx|jsx)$/.exec(componentPath)?.[0] || '');

  const sourceFile = ts.createSourceFile(
    componentPath,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  const issues: PerformanceIssue[] = [];

  // Analysis flags
  let usesHardwareAcceleration = false;
  let usesMotionValues = false;
  let usesResizeObserver = false;
  let usesLayoutPosition = false;
  let usesWhileInView = false;
  let hasInlineAnimationValues = false;
  let hasVariants = false;
  let hasStateAnimations = false;
  let hasIntervalAnimations = false;
  let hasIntersectionObserver = false;
  let hasFullLayout = false;

  // Track animated properties
  const animatedProps = new Set<string>();
  const layoutThrasingPropsUsed = new Set<string>();
  const nonAcceleratedPropsUsed = new Set<string>();

  function visit(node: ts.Node): void {
    // Check for MotionValue hooks
    if (ts.isCallExpression(node)) {
      const callText = node.expression.getText(sourceFile);
      if (
        callText === 'useMotionValue' ||
        callText === 'useSpring' ||
        callText === 'useTransform' ||
        callText === 'useMotionTemplate'
      ) {
        usesMotionValues = true;
      }

      // Check for ResizeObserver
      if (ts.isNewExpression(node.expression)) {
        const newExpr = node.expression as ts.NewExpression;
        if (newExpr.getText(sourceFile).includes('ResizeObserver')) {
          usesResizeObserver = true;
        }
      }

      // Check for IntersectionObserver
      if (ts.isNewExpression(node.expression)) {
        const newExpr = node.expression as ts.NewExpression;
        if (newExpr.getText(sourceFile).includes('IntersectionObserver')) {
          hasIntersectionObserver = true;
        }
      }

      // Check for setInterval (potential animation loop)
      if (callText === 'setInterval') {
        hasIntervalAnimations = true;
      }
    }

    // Check for new expressions (ResizeObserver, IntersectionObserver)
    if (ts.isNewExpression(node)) {
      const newText = node.expression.getText(sourceFile);
      if (newText === 'ResizeObserver') {
        usesResizeObserver = true;
      }
      if (newText === 'IntersectionObserver') {
        hasIntersectionObserver = true;
      }
    }

    // Check for ref usage for caching
    if (ts.isCallExpression(node)) {
      const callText = node.expression.getText(sourceFile);
      if (callText === 'useRef') {
        // Check if ref is used for dimension caching
        const parent = node.parent;
        if (parent && ts.isVariableDeclaration(parent)) {
          const varName = parent.name.getText(sourceFile);
          if (
            varName.toLowerCase().includes('dimension') ||
            varName.toLowerCase().includes('size') ||
            varName.toLowerCase().includes('bounds') ||
            varName.toLowerCase().includes('rect')
          ) {
            usesResizeObserver = true; // Counting refs for caching as equivalent
          }
        }
      }
    }

    // Check for variants declaration
    if (ts.isVariableDeclaration(node)) {
      const name = node.name.getText(sourceFile);
      if (name === 'variants' || name.endsWith('Variants') || name.endsWith('variants')) {
        hasVariants = true;
      }
    }

    // Check JSX attributes for motion components
    if (ts.isJsxAttribute(node)) {
      const attrName = node.name.getText(sourceFile);

      // Check for layout prop
      if (attrName === 'layout') {
        if (node.initializer) {
          if (ts.isStringLiteral(node.initializer)) {
            if (node.initializer.text === 'position') {
              usesLayoutPosition = true;
            } else {
              hasFullLayout = true;
            }
          } else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
            const exprText = node.initializer.expression.getText(sourceFile);
            if (exprText === '"position"' || exprText === "'position'") {
              usesLayoutPosition = true;
            } else {
              hasFullLayout = true;
            }
          }
        } else {
          // layout without value means full layout
          hasFullLayout = true;
        }
      }

      // Check for whileInView
      if (attrName === 'whileInView') {
        usesWhileInView = true;
      }

      // Check for variants usage
      if (attrName === 'variants') {
        hasVariants = true;
      }

      // Check for inline animation values (whileHover, whileTap, animate with object literals)
      if (
        (attrName === 'whileHover' ||
          attrName === 'whileTap' ||
          attrName === 'whileFocus' ||
          attrName === 'whileDrag') &&
        node.initializer
      ) {
        if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
          const expr = node.initializer.expression;
          // String values mean using variants
          if (ts.isStringLiteral(expr)) {
            // Using variant name - good
          } else if (ts.isObjectLiteralExpression(expr)) {
            hasInlineAnimationValues = true;
          }
        }
      }

      // Analyze animate prop
      if (attrName === 'animate' && node.initializer) {
        if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
          const expr = node.initializer.expression;
          if (ts.isObjectLiteralExpression(expr)) {
            // Check animated properties
            expr.properties.forEach((prop) => {
              if (ts.isPropertyAssignment(prop)) {
                const propName = prop.name.getText(sourceFile);
                animatedProps.add(propName);

                if (HARDWARE_ACCELERATED_PROPS.has(propName)) {
                  usesHardwareAcceleration = true;
                }
                if (LAYOUT_THRASHING_PROPS.has(propName)) {
                  layoutThrasingPropsUsed.add(propName);
                }
                if (NON_ACCELERATED_POSITION_PROPS.has(propName)) {
                  nonAcceleratedPropsUsed.add(propName);
                }

                // Check if animating with state variable
                if (ts.isIdentifier(prop.initializer)) {
                  hasStateAnimations = true;
                }
              }
            });
          } else if (ts.isIdentifier(expr)) {
            // Animating with a variable - might be state-based
            hasStateAnimations = true;
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  // Generate issues based on analysis

  // Layout thrashing
  if (layoutThrasingPropsUsed.size > 0) {
    issues.push({
      type: 'layout-thrashing',
      message: `Animating layout properties (${[...layoutThrasingPropsUsed].join(', ')}) causes layout recalculation. Consider using transform-based animations (x, y, scale).`,
      severity: 'critical',
    });
  }

  // Non-hardware-accelerated properties
  if (nonAcceleratedPropsUsed.size > 0 && !usesHardwareAcceleration) {
    issues.push({
      type: 'non-hardware-accelerated',
      message: `Using non-hardware-accelerated properties (${[...nonAcceleratedPropsUsed].join(', ')}). Consider using x, y instead of left, top.`,
      severity: 'warning',
    });
  }

  // Missing MotionValues for continuous updates
  if (hasIntervalAnimations && hasStateAnimations && !usesMotionValues) {
    issues.push({
      type: 'missing-motion-values',
      message:
        'Using state + interval for animations. Consider using MotionValues (useMotionValue, useSpring) for smoother performance.',
      severity: 'warning',
    });
  }

  // Full layout animation suggestion
  if (hasFullLayout && !usesLayoutPosition) {
    issues.push({
      type: 'full-layout-animation',
      message:
        'Using full layout animation. If only position changes, consider layout="position" for better performance.',
      severity: 'info',
    });
  }

  // Missing whileInView
  if (hasIntersectionObserver && !usesWhileInView) {
    issues.push({
      type: 'missing-while-in-view',
      message:
        "Using IntersectionObserver manually. Consider using Motion's built-in whileInView for simpler code and better integration.",
      severity: 'info',
    });
  }

  // Inline animation values
  if (hasInlineAnimationValues && !hasVariants) {
    issues.push({
      type: 'inline-animation-values',
      message:
        'Using inline animation values in whileHover/whileTap. Consider extracting to variants for reusability and cleaner code.',
      severity: 'info',
    });
  }

  // Calculate score
  const score = calculatePerformanceScore({
    usesHardwareAcceleration,
    usesMotionValues,
    usesResizeObserver,
    usesLayoutPosition,
    usesWhileInView,
    issues,
    hasInlineAnimationValues,
    hasVariants,
    layoutThrasingPropsUsed,
  });

  return {
    path: componentPath,
    name,
    usesHardwareAcceleration,
    usesMotionValues,
    usesResizeObserver,
    usesLayoutPosition,
    usesWhileInView,
    issues,
    score,
  };
}

/**
 * Calculate performance score based on analysis results
 */
function calculatePerformanceScore(analysis: {
  usesHardwareAcceleration: boolean;
  usesMotionValues: boolean;
  usesResizeObserver: boolean;
  usesLayoutPosition: boolean;
  usesWhileInView: boolean;
  issues: PerformanceIssue[];
  hasInlineAnimationValues: boolean;
  hasVariants: boolean;
  layoutThrasingPropsUsed: Set<string>;
}): number {
  let score = 100;

  // Deduct points for issues based on severity
  for (const issue of analysis.issues) {
    switch (issue.severity) {
      case 'critical':
        score -= 25;
        break;
      case 'warning':
        score -= 15;
        break;
      case 'info':
        score -= 5;
        break;
    }
  }

  // Bonus points for good practices
  if (analysis.usesHardwareAcceleration) {
    score += 5;
  }
  if (analysis.usesMotionValues) {
    score += 5;
  }
  if (analysis.hasVariants && !analysis.hasInlineAnimationValues) {
    score += 5;
  }
  if (analysis.usesWhileInView) {
    score += 3;
  }

  // Clamp score between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Analyze all components in the inventory for performance patterns
 */
export async function analyzeAllPerformance(): Promise<PerformancePattern[]> {
  const components = await discoverComponents({
    rootDir: 'src/components',
    excludePatterns: ['**/*.test.tsx', '**/*.stories.tsx', '**/*.test.jsx', '**/*.stories.jsx'],
  });

  const results: PerformancePattern[] = [];

  for (const component of components) {
    try {
      const result = await analyzePerformance(component.path);
      results.push(result);
    } catch (error) {
      console.warn(`Failed to analyze performance for ${component.path}:`, error);
    }
  }

  return results;
}
