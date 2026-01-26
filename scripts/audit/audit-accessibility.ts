/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Accessibility Audit
 * @description Audits React components for accessibility requirements
 */

import { readFileSync } from 'fs';
import { basename } from 'path';
import * as ts from 'typescript';
import type { AccessibilityAudit, AccessibilityIssue, AccessibilitySeverity } from './types';
import { discoverComponents } from './discover-components';

// Semantic HTML elements
const SEMANTIC_ELEMENTS = new Set([
  'main',
  'nav',
  'article',
  'section',
  'aside',
  'header',
  'footer',
  'figure',
  'figcaption',
  'details',
  'summary',
  'dialog',
  'menu',
  'search',
]);

// Native interactive elements (have built-in keyboard support)
const NATIVE_INTERACTIVE_ELEMENTS = new Set([
  'button',
  'a',
  'input',
  'textarea',
  'select',
  'summary',
  'details',
]);

// Icon component patterns
const ICON_PATTERNS = [
  /Icon$/,
  /^Icon/,
  /^[A-Z][a-z]*Icon$/,
  /^(X|Plus|Minus|Check|Close|Menu|Arrow|Chevron|Home|Settings|User|Search|Edit|Delete|Trash|Copy|Save|Download|Upload|Play|Pause|Stop|Refresh|Info|Warning|Error|Help)$/,
];

/**
 * Check if an element name is an icon component
 */
function isIconComponent(name: string): boolean {
  return ICON_PATTERNS.some((pattern) => pattern.test(name));
}

/**
 * Audit a component for accessibility
 */
export async function auditAccessibility(
  componentPath: string,
  sourceCode?: string
): Promise<AccessibilityAudit> {
  const code = sourceCode ?? readFileSync(componentPath, 'utf-8');
  const name = basename(componentPath, /\.(tsx|jsx)$/.exec(componentPath)?.[0] || '');

  const sourceFile = ts.createSourceFile(
    componentPath,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  const issues: AccessibilityIssue[] = [];

  // Analysis flags
  let hasAriaAttributes = false;
  let usesSemanticHtml = false;
  let supportsKeyboardNav = false;
  let hasFocusManagement = false;
  let isScreenReaderCompatible = false;
  let respectsReducedMotion = false;

  // Track elements for analysis
  let hasMotionComponent = false;
  let hasAriaLive = false;
  let hasHtmlFor = false;
  let hasInputWithoutLabel = false;
  const clickHandlersWithoutKeyboard: Array<{ line?: number }> = [];
  const iconButtonsWithoutLabel: Array<{ line?: number }> = [];
  const interactiveWithoutFocus: Array<{ line?: number }> = [];

  function visit(node: ts.Node): void {
    // Check for useReducedMotion hook
    if (ts.isCallExpression(node)) {
      const callText = node.expression.getText(sourceFile);
      if (callText === 'useReducedMotion') {
        respectsReducedMotion = true;
      }
    }

    // Check for keyboard event handlers
    if (ts.isJsxAttribute(node)) {
      const attrName = node.name.getText(sourceFile);
      if (attrName === 'onKeyDown' || attrName === 'onKeyUp' || attrName === 'onKeyPress') {
        supportsKeyboardNav = true;
      }
    }

    // Check JSX elements
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = node.tagName.getText(sourceFile);
      const attributes = node.attributes;

      // Check for semantic HTML
      if (SEMANTIC_ELEMENTS.has(tagName.toLowerCase())) {
        usesSemanticHtml = true;
      }

      // Check for motion components
      if (tagName.startsWith('motion.')) {
        hasMotionComponent = true;
      }

      // Check for native interactive elements (keyboard support built-in)
      if (NATIVE_INTERACTIVE_ELEMENTS.has(tagName.toLowerCase())) {
        supportsKeyboardNav = true;
      }

      // Analyze attributes
      let hasOnClick = false;
      let hasOnKeyDown = false;
      let hasTabIndex = false;
      let hasAriaLabel = false;
      let hasRole = false;
      let hasFocusVisible = false;
      let hasIconChild = false;
      let isButton = tagName.toLowerCase() === 'button';
      let isInput = tagName.toLowerCase() === 'input';
      let hasId = false;

      // Check if this element contains only an icon
      if (ts.isJsxElement(node.parent)) {
        const children = node.parent.children;
        children.forEach((child) => {
          if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
            const childElement = ts.isJsxElement(child) ? child.openingElement : child;
            const childTag = childElement.tagName.getText(sourceFile);
            if (isIconComponent(childTag) || childTag === 'img') {
              hasIconChild = true;
            }
          }
        });
      }

      // Iterate through attributes
      ts.forEachChild(attributes, (attr) => {
        if (ts.isJsxAttribute(attr)) {
          const attrName = attr.name.getText(sourceFile);

          // ARIA attributes
          if (attrName.startsWith('aria-')) {
            hasAriaAttributes = true;
            if (attrName === 'aria-label' || attrName === 'aria-labelledby') {
              hasAriaLabel = true;
            }
            if (attrName === 'aria-live') {
              hasAriaLive = true;
              isScreenReaderCompatible = true;
            }
          }

          // Role attribute
          if (attrName === 'role') {
            hasRole = true;
            hasAriaAttributes = true;
          }

          // Event handlers
          if (attrName === 'onClick') {
            hasOnClick = true;
          }
          if (attrName === 'onKeyDown' || attrName === 'onKeyUp') {
            hasOnKeyDown = true;
          }

          // Focus attributes
          if (attrName === 'tabIndex') {
            hasTabIndex = true;
            hasFocusManagement = true;
          }

          // className with focus-visible
          if (attrName === 'className' && attr.initializer) {
            const classValue = attr.initializer.getText(sourceFile);
            if (classValue.includes('focus-visible') || classValue.includes('focus:')) {
              hasFocusVisible = true;
              hasFocusManagement = true;
            }
          }

          // htmlFor for labels
          if (attrName === 'htmlFor') {
            hasHtmlFor = true;
            isScreenReaderCompatible = true;
          }

          // id for inputs
          if (attrName === 'id') {
            hasId = true;
          }
        }
      });

      // Check for icon buttons without aria-label
      if (isButton && hasIconChild && !hasAriaLabel) {
        iconButtonsWithoutLabel.push({
          line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1,
        });
      }

      // Check for click handlers without keyboard equivalents
      if (hasOnClick && !hasOnKeyDown && !NATIVE_INTERACTIVE_ELEMENTS.has(tagName.toLowerCase())) {
        clickHandlersWithoutKeyboard.push({
          line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1,
        });
      }

      // Check for interactive elements without focus management
      if (hasOnClick && !hasTabIndex && !NATIVE_INTERACTIVE_ELEMENTS.has(tagName.toLowerCase())) {
        interactiveWithoutFocus.push({
          line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1,
        });
      }

      // Check for inputs without labels
      if (isInput && !hasAriaLabel && !hasId) {
        hasInputWithoutLabel = true;
      }
    }

    // Check for label elements with htmlFor
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = node.tagName.getText(sourceFile);
      if (tagName.toLowerCase() === 'label') {
        ts.forEachChild(node.attributes, (attr) => {
          if (ts.isJsxAttribute(attr)) {
            const attrName = attr.name.getText(sourceFile);
            if (attrName === 'htmlFor') {
              hasHtmlFor = true;
              isScreenReaderCompatible = true;
            }
          }
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  // Generate issues based on analysis

  // Icon buttons without label
  for (const loc of iconButtonsWithoutLabel) {
    issues.push({
      type: 'icon-button-no-label',
      category: 'aria',
      message: 'Button with icon-only content should have aria-label for screen readers.',
      severity: 'serious',
      line: loc.line,
      wcag: '1.1.1',
    });
  }

  // Missing semantic HTML
  if (!usesSemanticHtml) {
    // Only flag if the component seems to be a layout component
    if (
      code.includes('div') &&
      (code.includes('nav') || code.includes('content') || code.includes('sidebar'))
    ) {
      issues.push({
        type: 'missing-semantic-element',
        category: 'semantic-html',
        message:
          'Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.',
        severity: 'moderate',
        wcag: '1.3.1',
      });
    }
  }

  // Click handlers without keyboard equivalents
  for (const loc of clickHandlersWithoutKeyboard) {
    issues.push({
      type: 'missing-keyboard-handler',
      category: 'keyboard',
      message: 'onClick handler on non-interactive element should have onKeyDown equivalent.',
      severity: 'serious',
      line: loc.line,
      wcag: '2.1.1',
    });
  }

  // Interactive elements without tabIndex
  for (const loc of interactiveWithoutFocus) {
    issues.push({
      type: 'missing-tabindex',
      category: 'focus',
      message: 'Interactive element should have tabIndex for keyboard accessibility.',
      severity: 'serious',
      line: loc.line,
      wcag: '2.1.1',
    });
  }

  // Inputs without labels
  if (hasInputWithoutLabel) {
    issues.push({
      type: 'missing-htmlFor',
      category: 'screen-reader',
      message: 'Input should have an associated label with htmlFor or aria-label.',
      severity: 'serious',
      wcag: '1.3.1',
    });
  }

  // Motion components without reduced motion check
  if (hasMotionComponent && !respectsReducedMotion) {
    issues.push({
      type: 'missing-reduced-motion',
      category: 'reduced-motion',
      message: 'Motion component should respect prefers-reduced-motion using useReducedMotion().',
      severity: 'moderate',
      wcag: '2.3.3',
    });
  }

  // Calculate score
  const score = calculateAccessibilityScore({
    hasAriaAttributes,
    usesSemanticHtml,
    supportsKeyboardNav,
    hasFocusManagement,
    isScreenReaderCompatible,
    respectsReducedMotion,
    issues,
    hasMotionComponent,
  });

  return {
    path: componentPath,
    name,
    hasAriaAttributes,
    usesSemanticHtml,
    supportsKeyboardNav,
    hasFocusManagement,
    isScreenReaderCompatible,
    respectsReducedMotion,
    issues,
    score,
  };
}

/**
 * Calculate accessibility score based on audit results
 */
function calculateAccessibilityScore(audit: {
  hasAriaAttributes: boolean;
  usesSemanticHtml: boolean;
  supportsKeyboardNav: boolean;
  hasFocusManagement: boolean;
  isScreenReaderCompatible: boolean;
  respectsReducedMotion: boolean;
  issues: AccessibilityIssue[];
  hasMotionComponent: boolean;
}): number {
  let score = 100;

  // Deduct points for issues based on severity
  for (const issue of audit.issues) {
    switch (issue.severity) {
      case 'critical':
        score -= 25;
        break;
      case 'serious':
        score -= 15;
        break;
      case 'moderate':
        score -= 10;
        break;
      case 'minor':
        score -= 5;
        break;
    }
  }

  // Bonus points for good practices
  if (audit.hasAriaAttributes) {
    score += 5;
  }
  if (audit.usesSemanticHtml) {
    score += 5;
  }
  if (audit.supportsKeyboardNav) {
    score += 5;
  }
  if (audit.hasFocusManagement) {
    score += 3;
  }
  if (audit.isScreenReaderCompatible) {
    score += 3;
  }
  if (audit.hasMotionComponent && audit.respectsReducedMotion) {
    score += 5;
  }

  // Clamp score between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Audit all components in the inventory for accessibility
 */
export async function auditAllAccessibility(): Promise<AccessibilityAudit[]> {
  const components = await discoverComponents({
    rootDir: 'src/components',
    excludePatterns: ['**/*.test.tsx', '**/*.stories.tsx', '**/*.test.jsx', '**/*.stories.jsx'],
  });

  const results: AccessibilityAudit[] = [];

  for (const component of components) {
    try {
      const result = await auditAccessibility(component.path);
      results.push(result);
    } catch (error) {
      console.warn(`Failed to audit accessibility for ${component.path}:`, error);
    }
  }

  return results;
}
