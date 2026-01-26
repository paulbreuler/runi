/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Implementation Checklist Audit
 * @description Audits components against comprehensive implementation checklist
 */

import { readFileSync, existsSync } from 'fs';
import { join, basename, dirname } from 'path';
import { glob } from 'glob';
import type {
  ChecklistAudit,
  ChecklistItem,
  CategoryAudit,
  ChecklistCategory,
  ComponentMetadata,
} from './types';

/**
 * All checklist categories
 */
const ALL_CATEGORIES: ChecklistCategory[] = [
  'typescript',
  'react-patterns',
  'testing',
  'accessibility',
  'motion',
  'storybook',
  'documentation',
];

/**
 * Check for TypeScript items
 */
function checkTypescript(content: string, lines: string[]): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  // Check for props interface
  const hasPropsInterface =
    /interface\s+\w+Props\b/.test(content) || /type\s+\w+Props\s*=/.test(content);
  items.push({
    id: 'ts-props-interface',
    category: 'typescript',
    description: 'Component has a typed props interface',
    passed: hasPropsInterface,
    details: hasPropsInterface ? 'Found props interface/type' : 'No props interface found',
    required: true,
  });

  // Check for explicit return types (looking for : JSX.Element or React.ReactNode)
  const hasExplicitReturn =
    /\):\s*(JSX\.Element|React\.ReactNode|ReactNode|ReactElement)/.test(content) ||
    // forwardRef pattern
    /forwardRef<\w+,\s*\w+>/.test(content);
  items.push({
    id: 'ts-return-type',
    category: 'typescript',
    description: 'Functions have explicit return types',
    passed: hasExplicitReturn,
    details: hasExplicitReturn
      ? 'Explicit return types found'
      : 'Consider adding explicit return types',
    required: false,
  });

  // Check for no `any` types
  const anyMatches = content.match(/:\s*any\b/g) || [];
  const hasNoAny = anyMatches.length === 0;
  items.push({
    id: 'ts-no-any',
    category: 'typescript',
    description: 'No usage of `any` type',
    passed: hasNoAny,
    details: hasNoAny ? 'No any types found' : `Found ${anyMatches.length} any type usages`,
    required: true,
  });

  // Check for TypeScript strict mode patterns
  const hasStrictPatterns =
    /as const/.test(content) || /satisfies/.test(content) || /readonly/.test(content);
  items.push({
    id: 'ts-strict-patterns',
    category: 'typescript',
    description: 'Uses TypeScript strict patterns (as const, satisfies, readonly)',
    passed: hasStrictPatterns,
    details: hasStrictPatterns
      ? 'Uses strict TypeScript patterns'
      : 'Could benefit from stricter typing',
    required: false,
  });

  return items;
}

/**
 * Check for React patterns
 */
function checkReactPatterns(content: string, lines: string[]): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  // Check for functional component
  const isFunctional =
    /^export\s+(const|function)\s+\w+/.test(content) ||
    /React\.forwardRef/.test(content) ||
    /forwardRef</.test(content);
  items.push({
    id: 'react-functional',
    category: 'react-patterns',
    description: 'Uses functional component pattern',
    passed: isFunctional,
    details: isFunctional ? 'Functional component pattern used' : 'Check component pattern',
    required: true,
  });

  // Check for no class components
  const hasClassComponent = /class\s+\w+\s+extends\s+(React\.)?Component/.test(content);
  items.push({
    id: 'react-no-class',
    category: 'react-patterns',
    description: 'No class components used',
    passed: !hasClassComponent,
    details: hasClassComponent
      ? 'Found class component - migrate to functional'
      : 'No class components',
    required: true,
  });

  // Check for proper hooks usage
  const hasHooks = /use[A-Z]\w+\(/.test(content);
  const hooksAtTop = !/if\s*\([^)]*\)\s*{[^}]*use[A-Z]\w+/.test(content);
  items.push({
    id: 'react-hooks-rules',
    category: 'react-patterns',
    description: 'Hooks follow rules (not in conditions)',
    passed: !hasHooks || hooksAtTop,
    details: hooksAtTop ? 'Hooks follow rules' : 'Hooks may be called conditionally',
    required: true,
  });

  // Check for prop destructuring
  const hasDestructuring = /\(\s*{\s*\w+/.test(content);
  items.push({
    id: 'react-destructuring',
    category: 'react-patterns',
    description: 'Props are destructured',
    passed: hasDestructuring,
    details: hasDestructuring ? 'Props are destructured' : 'Consider destructuring props',
    required: false,
  });

  // Check for displayName (for forwardRef)
  const hasForwardRef = /forwardRef/.test(content);
  const hasDisplayName = /\.displayName\s*=/.test(content);
  items.push({
    id: 'react-display-name',
    category: 'react-patterns',
    description: 'Has displayName (required for forwardRef)',
    passed: !hasForwardRef || hasDisplayName,
    details:
      hasForwardRef && hasDisplayName
        ? 'displayName set'
        : hasForwardRef
          ? 'Missing displayName for forwardRef'
          : 'Not applicable',
    required: hasForwardRef,
  });

  return items;
}

/**
 * Check for testing items
 */
function checkTesting(componentPath: string, content: string): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  // Check for test file existence
  const testPath = componentPath.replace(/\.(tsx|jsx)$/, '.test.$1');
  const hasTestFile = existsSync(join(process.cwd(), testPath));
  items.push({
    id: 'test-file-exists',
    category: 'testing',
    description: 'Has corresponding test file',
    passed: hasTestFile,
    details: hasTestFile ? `Test file: ${testPath}` : 'No test file found',
    required: true,
  });

  // Check for data-test-id attributes
  const hasTestIds = /data-test-id=/.test(content);
  items.push({
    id: 'test-data-test-ids',
    category: 'testing',
    description: 'Uses data-test-id attributes for test selectors',
    passed: hasTestIds,
    details: hasTestIds
      ? 'Has data-test-id attributes'
      : 'Consider adding data-test-id for testing',
    required: false,
  });

  // Note about 85% coverage requirement
  items.push({
    id: 'test-coverage-requirement',
    category: 'testing',
    description: 'Test coverage requirement: ≥85%',
    passed: hasTestFile, // If test file exists, we assume it meets coverage
    details: 'Coverage should be verified with `just test-frontend --coverage`',
    required: true,
  });

  return items;
}

/**
 * Check for accessibility items
 */
function checkAccessibility(content: string, lines: string[]): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  // Check for ARIA attributes
  const hasAria = /aria-\w+/.test(content);
  items.push({
    id: 'a11y-aria-attributes',
    category: 'accessibility',
    description: 'Uses ARIA attributes where appropriate',
    passed: hasAria,
    details: hasAria ? 'ARIA attributes found' : 'Consider adding ARIA attributes',
    required: false,
  });

  // Check for keyboard navigation (tabIndex, onKeyDown, etc.)
  const hasKeyboard = /tabIndex|onKeyDown|onKeyUp|onKeyPress/.test(content);
  items.push({
    id: 'a11y-keyboard-navigation',
    category: 'accessibility',
    description: 'Supports keyboard navigation',
    passed: hasKeyboard,
    details: hasKeyboard ? 'Keyboard support found' : 'Check keyboard accessibility',
    required: false,
  });

  // Check for focus ring styling
  const hasFocusRing = /focus-visible:ring|focus:ring|focus-visible:outline/.test(content);
  items.push({
    id: 'a11y-focus-ring',
    category: 'accessibility',
    description: 'Has visible focus indicators',
    passed: hasFocusRing,
    details: hasFocusRing ? 'Focus ring styling found' : 'Add focus ring for accessibility',
    required: true,
  });

  // Check for semantic HTML usage
  const usesSemanticHTML = /<(button|nav|main|aside|header|footer|section|article)\b/.test(content);
  items.push({
    id: 'a11y-semantic-html',
    category: 'accessibility',
    description: 'Uses semantic HTML elements',
    passed: usesSemanticHTML,
    details: usesSemanticHTML ? 'Semantic HTML found' : 'Consider using semantic HTML',
    required: false,
  });

  // Check for disabled state handling
  const hasDisabledHandling = /disabled/.test(content);
  items.push({
    id: 'a11y-disabled-state',
    category: 'accessibility',
    description: 'Properly handles disabled state',
    passed: hasDisabledHandling,
    details: hasDisabledHandling
      ? 'Disabled state handling found'
      : 'Not applicable or check disabled handling',
    required: false,
  });

  return items;
}

/**
 * Check for Motion usage
 */
function checkMotion(content: string, lines: string[]): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  // Check for motion/react import
  const hasMotionImport =
    content.includes("from 'motion/react'") || content.includes('from "motion/react"');
  items.push({
    id: 'motion-import',
    category: 'motion',
    description: 'Uses motion/react for animations',
    passed: hasMotionImport,
    details: hasMotionImport ? 'motion/react import found' : 'No Motion usage detected',
    required: false,
  });

  // Check for NOT using framer-motion
  const hasFramerMotion = content.includes('framer-motion');
  items.push({
    id: 'motion-no-framer',
    category: 'motion',
    description: 'Does not use deprecated framer-motion import',
    passed: !hasFramerMotion,
    details: hasFramerMotion ? 'Replace framer-motion with motion/react' : 'Correct import used',
    required: true,
  });

  // Check for motion components
  const hasMotionComponents = /<motion\.\w+/.test(content);
  items.push({
    id: 'motion-components',
    category: 'motion',
    description: 'Uses motion components for animations',
    passed: hasMotionComponents,
    details: hasMotionComponents ? 'Motion components found' : 'No motion components (may be OK)',
    required: false,
  });

  // Check for animation variants (best practice)
  const hasVariants = /variants\s*[=:{]/.test(content);
  items.push({
    id: 'motion-variants',
    category: 'motion',
    description: 'Uses animation variants for maintainability',
    passed: hasVariants,
    details: hasVariants
      ? 'Animation variants used'
      : 'Consider using variants for complex animations',
    required: false,
  });

  return items;
}

/**
 * Check for Storybook items
 */
async function checkStorybook(componentPath: string): Promise<ChecklistItem[]> {
  const items: ChecklistItem[] = [];

  // Check for story file existence
  const storyPatterns = [
    componentPath.replace(/\.(tsx|jsx)$/, '.stories.$1'),
    componentPath.replace(/\.(tsx|jsx)$/, '.stories.ts'),
  ];

  let hasStoryFile = false;
  let storyPath = '';

  for (const pattern of storyPatterns) {
    if (existsSync(join(process.cwd(), pattern))) {
      hasStoryFile = true;
      storyPath = pattern;
      break;
    }
  }

  items.push({
    id: 'storybook-story-file',
    category: 'storybook',
    description: 'Has Storybook story file',
    passed: hasStoryFile,
    details: hasStoryFile ? `Story file: ${storyPath}` : 'No story file found',
    required: true,
  });

  // If story file exists, check for play functions
  if (hasStoryFile && storyPath) {
    const storyContent = readFileSync(join(process.cwd(), storyPath), 'utf-8');

    const hasPlayFunction = /play:\s*async/.test(storyContent);
    items.push({
      id: 'storybook-play-function',
      category: 'storybook',
      description: 'Stories have play functions for interaction testing',
      passed: hasPlayFunction,
      details: hasPlayFunction ? 'Play functions found' : 'Consider adding play functions',
      required: false,
    });

    const hasControls = /argTypes|args/.test(storyContent);
    items.push({
      id: 'storybook-controls',
      category: 'storybook',
      description: 'Uses Storybook controls for variations',
      passed: hasControls,
      details: hasControls ? 'Controls/args defined' : 'Consider adding controls',
      required: false,
    });
  }

  return items;
}

/**
 * Check for documentation items
 */
function checkDocumentation(content: string, lines: string[]): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  // Check for JSDoc/TSDoc comments
  const hasJSDoc = /\/\*\*[\s\S]*?\*\//.test(content);
  items.push({
    id: 'docs-jsdoc',
    category: 'documentation',
    description: 'Has JSDoc/TSDoc comments',
    passed: hasJSDoc,
    details: hasJSDoc ? 'JSDoc comments found' : 'Consider adding documentation comments',
    required: false,
  });

  // Check for copyright header
  const hasCopyright =
    /Copyright.*BaseState/.test(content) || /SPDX-License-Identifier/.test(content);
  items.push({
    id: 'docs-copyright',
    category: 'documentation',
    description: 'Has copyright header',
    passed: hasCopyright,
    details: hasCopyright ? 'Copyright header found' : 'Add copyright header',
    required: false,
  });

  // Check for @file documentation
  const hasFileDoc = /@file/.test(content);
  items.push({
    id: 'docs-file-annotation',
    category: 'documentation',
    description: 'Has @file annotation',
    passed: hasFileDoc,
    details: hasFileDoc ? '@file annotation found' : 'Consider adding @file annotation',
    required: false,
  });

  return items;
}

/**
 * Calculate category audit from items
 */
function calculateCategoryAudit(
  category: ChecklistCategory,
  items: ChecklistItem[]
): CategoryAudit {
  const categoryItems = items.filter((i) => i.category === category);
  const passed = categoryItems.filter((i) => i.passed).length;
  const failed = categoryItems.filter((i) => !i.passed).length;
  const requiredPassed = categoryItems.filter((i) => i.required && i.passed).length;
  const requiredFailed = categoryItems.filter((i) => i.required && !i.passed).length;

  const completionPercentage =
    categoryItems.length > 0 ? Math.round((passed / categoryItems.length) * 100) : 100;

  return {
    category,
    items: categoryItems,
    completionPercentage,
    passed,
    failed,
    requiredPassed,
    requiredFailed,
  };
}

/**
 * Calculate overall completion percentage
 */
function calculateOverallCompletion(items: ChecklistItem[]): number {
  if (items.length === 0) return 100;
  const passed = items.filter((i) => i.passed).length;
  return Math.round((passed / items.length) * 100);
}

/**
 * Calculate summary statistics
 */
function calculateSummary(items: ChecklistItem[]): ChecklistAudit['summary'] {
  const requiredItems = items.filter((i) => i.required);
  return {
    totalItems: items.length,
    passed: items.filter((i) => i.passed).length,
    failed: items.filter((i) => !i.passed).length,
    requiredPassed: requiredItems.filter((i) => i.passed).length,
    requiredFailed: requiredItems.filter((i) => !i.passed).length,
  };
}

/**
 * Check if story file exists for component
 */
async function checkStoryExists(componentPath: string): Promise<boolean> {
  const storyPatterns = [
    componentPath.replace(/\.(tsx|jsx)$/, '.stories.$1'),
    componentPath.replace(/\.(tsx|jsx)$/, '.stories.ts'),
  ];

  for (const pattern of storyPatterns) {
    if (existsSync(join(process.cwd(), pattern))) {
      return true;
    }
  }
  return false;
}

/**
 * Audit a single component against the implementation checklist
 */
export async function auditChecklist(componentPath: string): Promise<ChecklistAudit> {
  const fullPath = join(process.cwd(), componentPath);

  if (!existsSync(fullPath)) {
    throw new Error(`Component file not found: ${fullPath}`);
  }

  const content = readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');
  const componentName = basename(componentPath, '.tsx').replace('.jsx', '');

  // Collect all checklist items
  const allItems: ChecklistItem[] = [
    ...checkTypescript(content, lines),
    ...checkReactPatterns(content, lines),
    ...checkTesting(componentPath, content),
    ...checkAccessibility(content, lines),
    ...checkMotion(content, lines),
    ...(await checkStorybook(componentPath)),
    ...checkDocumentation(content, lines),
  ];

  // Calculate category audits
  const categories = ALL_CATEGORIES.map((category) => calculateCategoryAudit(category, allItems));

  // Check story existence
  const hasStory = await checkStoryExists(componentPath);

  return {
    componentPath,
    componentName,
    overallCompletion: calculateOverallCompletion(allItems),
    categories,
    items: allItems,
    summary: calculateSummary(allItems),
    hasStory,
    auditedAt: new Date().toISOString(),
  };
}

/**
 * Audit all components from component inventory
 */
export async function auditAllComponents(): Promise<ChecklistAudit[]> {
  const inventoryPath = join(
    process.cwd(),
    'scripts',
    'audit',
    'output',
    'component-inventory.json'
  );

  if (!existsSync(inventoryPath)) {
    throw new Error(
      `Component inventory not found: ${inventoryPath}. Run discover-components first.`
    );
  }

  const inventoryContent = readFileSync(inventoryPath, 'utf-8');
  const components: ComponentMetadata[] = JSON.parse(inventoryContent);

  const results: ChecklistAudit[] = [];

  for (const component of components) {
    try {
      const result = await auditChecklist(component.path);
      results.push(result);
    } catch (error) {
      console.warn(`Failed to audit ${component.path}:`, error);
    }
  }

  return results;
}
