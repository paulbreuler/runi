/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Motion Analysis
 * @description Analyzes components for Motion.dev usage and animation patterns
 */

import { readFileSync, existsSync } from 'fs';
import { join, basename } from 'path';
import * as ts from 'typescript';
import { discoverComponents } from './discover-components';
import type { MotionAnalysis, MotionPatterns, AnimationViolation, AnimationLibrary } from './types';

/**
 * Animation library import patterns
 */
const LIBRARY_PATTERNS: Record<string, AnimationLibrary> = {
  'motion/react': 'motion',
  'framer-motion': 'motion', // Legacy import
  gsap: 'gsap',
  '@gsap/react': 'gsap',
  '@react-spring/web': 'react-spring',
  'react-spring': 'react-spring',
  animejs: 'animejs',
  'anime.js': 'animejs',
};

/**
 * CSS transition patterns to detect
 */
const CSS_TRANSITION_PATTERNS = [
  /transition:\s*[^;]+/g, // transition: property
  /transition-\w+:/g, // transition-duration, transition-timing-function, etc.
  /className=.*transition[-\s]/g, // Tailwind transition classes
];

/**
 * CSS keyframes patterns to detect
 */
const KEYFRAMES_PATTERNS = [/@keyframes\s+\w+/g, /animation:\s*[^;]+/g, /animation-name:/g];

/**
 * Extract component name from file path
 */
function extractComponentName(filePath: string): string {
  const fileName = basename(filePath, /\.(tsx|jsx|ts|js)$/.exec(filePath)?.[0] || '');
  return fileName;
}

/**
 * Detect which animation library is imported
 */
function detectAnimationLibrary(content: string, sourceFile: ts.SourceFile): AnimationLibrary {
  let detectedLibrary: AnimationLibrary = 'none';

  function visit(node: ts.Node): void {
    if (
      ts.isImportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const importPath = node.moduleSpecifier.text;

      for (const [pattern, library] of Object.entries(LIBRARY_PATTERNS)) {
        if (importPath === pattern || importPath.startsWith(pattern)) {
          detectedLibrary = library;
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return detectedLibrary;
}

/**
 * Check if component imports motion/react
 */
function hasMotionImport(sourceFile: ts.SourceFile): boolean {
  let found = false;

  function visit(node: ts.Node): void {
    if (
      ts.isImportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const importPath = node.moduleSpecifier.text;
      if (importPath === 'motion/react' || importPath === 'framer-motion') {
        found = true;
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return found;
}

/**
 * Detect Motion.dev patterns in component
 */
function detectMotionPatterns(content: string, sourceFile: ts.SourceFile): MotionPatterns {
  const patterns: MotionPatterns = {
    usesMotionElements: false,
    usesAnimate: false,
    usesInitial: false,
    usesExit: false,
    usesVariants: false,
    usesLayout: false,
    usesWhileHover: false,
    usesWhileTap: false,
    usesWhileFocus: false,
    usesWhileInView: false,
    usesTransition: false,
    usesDrag: false,
  };

  // Check for motion.* elements in JSX
  if (/motion\.\w+/.test(content)) {
    patterns.usesMotionElements = true;
  }

  function visit(node: ts.Node): void {
    // Check JSX attributes
    if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name)) {
      const attrName = node.name.text;

      switch (attrName) {
        case 'animate':
          patterns.usesAnimate = true;
          break;
        case 'initial':
          patterns.usesInitial = true;
          break;
        case 'exit':
          patterns.usesExit = true;
          break;
        case 'variants':
          patterns.usesVariants = true;
          break;
        case 'layout':
          patterns.usesLayout = true;
          break;
        case 'whileHover':
          patterns.usesWhileHover = true;
          break;
        case 'whileTap':
          patterns.usesWhileTap = true;
          break;
        case 'whileFocus':
          patterns.usesWhileFocus = true;
          break;
        case 'whileInView':
          patterns.usesWhileInView = true;
          break;
        case 'transition':
          patterns.usesTransition = true;
          break;
        case 'drag':
          patterns.usesDrag = true;
          break;
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return patterns;
}

/**
 * Check for useReducedMotion hook usage
 */
function checkReducedMotion(content: string): boolean {
  return /useReducedMotion\s*\(/.test(content);
}

/**
 * Check for hardware acceleration patterns
 */
function checkHardwareAcceleration(content: string): boolean {
  const patterns = [
    /transform3d/i,
    /translateZ/i,
    /translate3d/i,
    /willChange/i,
    /will-change/i,
    /gpu/i,
  ];

  return patterns.some((pattern) => pattern.test(content));
}

/**
 * Detect CSS transition violations
 */
function detectCssTransitionViolations(content: string): AnimationViolation[] {
  const violations: AnimationViolation[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Check for CSS transition property
    if (/transition:\s*[^;]+/.test(line) || /transition-\w+:/.test(line)) {
      // Skip if it's inside a comment
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
        return;
      }

      violations.push({
        type: 'css-transition',
        line: index + 1,
        description: `CSS transition detected: "${line.trim().slice(0, 50)}..."`,
        suggestion: 'Consider using Motion.dev animate prop or transition prop instead',
      });
    }

    // Check for Tailwind transition classes
    if (/className=.*transition[-\s]/.test(line) || /transition-/.test(line)) {
      // Only flag if it looks like a transition class, not just a word
      if (
        /transition-(all|none|colors|opacity|shadow|transform|duration|ease|delay)/.test(line) ||
        /className=["'`].*\btransition\b/.test(line)
      ) {
        violations.push({
          type: 'css-transition',
          line: index + 1,
          description: `Tailwind transition class detected`,
          suggestion:
            'Consider using Motion.dev for complex animations; simple transitions may be acceptable',
        });
      }
    }
  });

  return violations;
}

/**
 * Detect CSS @keyframes violations
 */
function detectKeyframesViolations(content: string): AnimationViolation[] {
  const violations: AnimationViolation[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    if (/@keyframes\s+\w+/.test(line)) {
      violations.push({
        type: 'keyframes',
        line: index + 1,
        description: `CSS @keyframes detected`,
        suggestion: 'Consider using Motion.dev variants or animate prop instead',
      });
    }

    if (/animation:\s*[^;]+/.test(line) || /animation-name:/.test(line)) {
      // Skip if it's inside a comment
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
        return;
      }

      violations.push({
        type: 'keyframes',
        line: index + 1,
        description: `CSS animation property detected`,
        suggestion: 'Consider using Motion.dev for declarative animations',
      });
    }
  });

  return violations;
}

/**
 * Detect other animation library violations
 */
function detectOtherLibraryViolations(
  content: string,
  library: AnimationLibrary
): AnimationViolation[] {
  const violations: AnimationViolation[] = [];

  if (library !== 'motion' && library !== 'none') {
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      for (const [pattern] of Object.entries(LIBRARY_PATTERNS)) {
        if (pattern !== 'motion/react' && pattern !== 'framer-motion') {
          if (line.includes(`from '${pattern}'`) || line.includes(`from "${pattern}"`)) {
            violations.push({
              type: 'other-library',
              line: index + 1,
              description: `${library.toUpperCase()} animation library detected`,
              suggestion: 'Consider migrating to Motion.dev for consistency',
            });
          }
        }
      }
    });
  }

  return violations;
}

/**
 * Analyze a single component for Motion.dev usage
 */
export async function analyzeMotion(componentPath: string): Promise<MotionAnalysis> {
  const projectRoot = process.cwd();
  const fullPath = join(projectRoot, componentPath);

  if (!existsSync(fullPath)) {
    throw new Error(`Component file does not exist: ${fullPath}`);
  }

  const content = readFileSync(fullPath, 'utf-8');

  // Create TypeScript source file
  const sourceFile = ts.createSourceFile(
    fullPath,
    content,
    ts.ScriptTarget.Latest,
    true,
    fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  const componentName = extractComponentName(componentPath);
  const hasMotion = hasMotionImport(sourceFile);
  const animationLibrary = detectAnimationLibrary(content, sourceFile);
  const patterns = detectMotionPatterns(content, sourceFile);
  const usesReducedMotion = checkReducedMotion(content);
  const usesHardwareAcceleration = checkHardwareAcceleration(content);

  // Collect violations
  const violations: AnimationViolation[] = [
    ...detectCssTransitionViolations(content),
    ...detectKeyframesViolations(content),
    ...detectOtherLibraryViolations(content, animationLibrary),
  ];

  // Determine compliance
  // Compliant if: uses motion OR (no animation library and no violations)
  const isCompliant =
    hasMotion ||
    (animationLibrary === 'none' &&
      violations.filter((v) => v.type !== 'css-transition').length === 0);

  return {
    path: componentPath,
    name: componentName,
    hasMotionImport: hasMotion,
    animationLibrary: hasMotion ? 'motion' : animationLibrary,
    patterns,
    usesReducedMotion,
    usesHardwareAcceleration,
    violations,
    isCompliant,
  };
}

/**
 * Analyze all components for Motion.dev usage
 */
export async function analyzeAllMotion(): Promise<MotionAnalysis[]> {
  const components = await discoverComponents({
    rootDir: 'src/components',
    includePatterns: ['**/*.tsx', '**/*.jsx'],
    excludePatterns: ['**/*.test.tsx', '**/*.stories.tsx', '**/*.test.jsx', '**/*.stories.jsx'],
  });

  const results: MotionAnalysis[] = [];

  for (const component of components) {
    try {
      const analysis = await analyzeMotion(component.path);
      results.push(analysis);
    } catch (error) {
      console.warn(`Failed to analyze motion for ${component.path}:`, error);
    }
  }

  return results;
}
