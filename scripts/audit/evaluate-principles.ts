/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Design Principles Evaluation
 * @description Evaluates components against 10 "Made to Be" design principles
 */

import { readFileSync, existsSync } from 'fs';
import { join, basename } from 'path';
import type {
  PrinciplesCompliance,
  PrincipleEvaluation,
  PrincipleViolation,
  DesignPrinciple,
  ComplianceStatus,
  ComponentMetadata,
} from './types';

/**
 * All 11 design principles from runi's design system
 */
const ALL_PRINCIPLES: DesignPrinciple[] = [
  'grayscale-foundation',
  'strategic-color',
  'semantic-tokens',
  'spacing-grid',
  'generous-whitespace',
  'subtle-depth',
  'typography-spacing',
  'dark-mode-compatible',
  'motion-animations',
  'zen-aesthetic',
  'radix-compliance',
];

/**
 * Patterns for detecting hardcoded colors (violations)
 */
const HARDCODED_COLOR_PATTERNS = [
  // Hex colors
  /#[0-9a-fA-F]{3,8}\b/g,
  // RGB/RGBA
  /rgba?\s*\([^)]+\)/gi,
  // HSL/HSLA
  /hsla?\s*\([^)]+\)/gi,
  // Hardcoded Tailwind colors (non-semantic)
  /\b(bg|text|border|ring|fill|stroke)-(white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g,
  // Bare white/black
  /\b(bg|text|border)-(white|black)\b/g,
];

/**
 * Patterns for semantic color tokens (good)
 */
const SEMANTIC_TOKEN_PATTERNS = [
  // Design system tokens
  /\b(bg|text|border)-(background|foreground|card|muted|primary|secondary|accent|destructive|popover|input)\b/g,
  /\b(bg|text|border)-(bg-app|bg-surface|bg-raised|bg-elevated)\b/g,
  /\b(text|bg)-(text-primary|text-secondary|text-muted)\b/g,
  // Signal colors (semantic)
  /\b(bg|text|border)-(signal-success|signal-warning|signal-error|accent-blue|accent-ai)\b/g,
  // With opacity
  /\b(bg|text|border)-(signal-success|signal-warning|signal-error|accent-blue|accent-ai)\/\d+\b/g,
];

/**
 * Patterns for 8px grid spacing (Tailwind's spacing scale)
 * 8px grid: 2 (0.5rem/8px), 4 (1rem/16px), 6 (1.5rem/24px), 8 (2rem/32px), etc.
 */
const VALID_SPACING_CLASSES = /\b(p|m|gap|space-[xy])-([2468]|10|12|14|16)\b/g;
const ODD_SPACING_CLASSES = /\b(p|m|gap|space-[xy])-(1|3|5|7|9|11|13|15)\b/g;

/**
 * Patterns for generous whitespace
 */
const GENEROUS_WHITESPACE_PATTERNS = [
  /\b(p|px|py|pt|pb|pl|pr)-(6|8|10|12|14|16)\b/g,
  /\b(m|mx|my|mt|mb|ml|mr)-(6|8|10|12|14|16)\b/g,
];

/**
 * Patterns for subtle depth (shadows)
 */
const SHADOW_PATTERNS = [/\bshadow-(xs|sm|md)\b/g, /\bshadow\b/g];

const HEAVY_SHADOW_PATTERNS = [/\bshadow-(lg|xl|2xl)\b/g];

/**
 * Patterns for Motion usage
 */
const MOTION_PATTERNS = [
  /import\s+.*\s+from\s+['"]motion\/react['"]/g,
  /import\s+{\s*motion\s*}\s+from\s+['"]motion\/react['"]/g,
  /<motion\./g,
  /motion\.\w+/g,
  /whileHover/g,
  /whileTap/g,
  /animate/g,
  /initial/g,
  /variants/g,
];

/**
 * Patterns for CSS transition fallbacks (not zen)
 */
const CSS_TRANSITION_PATTERNS = [
  /transition-all/g,
  /transition-colors/g,
  /transition-opacity/g,
  /transition-transform/g,
];

/**
 * Evaluate a single principle for a component
 */
function evaluatePrinciple(
  principle: DesignPrinciple,
  content: string,
  lines: string[],
  filePath: string = ''
): PrincipleEvaluation {
  const violations: PrincipleViolation[] = [];
  const evidence: string[] = [];
  const recommendations: string[] = [];

  switch (principle) {
    case 'grayscale-foundation':
      return evaluateGrayscaleFoundation(content, lines);

    case 'strategic-color':
      return evaluateStrategicColor(content, lines);

    case 'semantic-tokens':
      return evaluateSemanticTokens(content, lines);

    case 'spacing-grid':
      return evaluateSpacingGrid(content, lines);

    case 'generous-whitespace':
      return evaluateGenerousWhitespace(content, lines);

    case 'subtle-depth':
      return evaluateSubtleDepth(content, lines);

    case 'typography-spacing':
      return evaluateTypographySpacing(content, lines);

    case 'dark-mode-compatible':
      return evaluateDarkModeCompatible(content, lines);

    case 'motion-animations':
      return evaluateMotionAnimations(content, lines);

    case 'zen-aesthetic':
      return evaluateZenAesthetic(content, lines);

    case 'radix-compliance':
      return evaluateRadixCompliance(content, lines, filePath);

    default:
      return {
        principle,
        status: 'not-applicable',
        score: 100,
        violations: [],
        evidence: [],
        recommendations: [],
      };
  }
}

/**
 * Evaluate grayscale foundation principle
 */
function evaluateGrayscaleFoundation(content: string, lines: string[]): PrincipleEvaluation {
  const violations: PrincipleViolation[] = [];
  const evidence: string[] = [];
  const recommendations: string[] = [];

  // Check for grayscale usage
  const grayscaleMatches =
    content.match(/\b(bg|text|border)-(background|foreground|muted|card)\b/g) || [];
  const colorMatches =
    content.match(/\b(bg|text|border)-(red|green|blue|yellow|purple|pink|orange)-\d+\b/g) || [];

  if (grayscaleMatches.length > 0) {
    evidence.push(`Found ${grayscaleMatches.length} grayscale semantic tokens`);
  }

  // Calculate ratio
  const totalColorUsage = grayscaleMatches.length + colorMatches.length;
  const grayscaleRatio = totalColorUsage > 0 ? grayscaleMatches.length / totalColorUsage : 1;

  let status: ComplianceStatus = 'pass';
  let score = Math.round(grayscaleRatio * 100);

  if (grayscaleRatio < 0.5) {
    status = 'fail';
    recommendations.push(
      'Use more semantic grayscale tokens (bg-background, text-foreground, bg-muted)'
    );
  } else if (grayscaleRatio < 0.8) {
    status = 'partial';
    recommendations.push('Consider using more grayscale for non-semantic elements');
  }

  return {
    principle: 'grayscale-foundation',
    status,
    score,
    violations,
    evidence,
    recommendations,
  };
}

/**
 * Evaluate strategic color usage
 */
function evaluateStrategicColor(content: string, lines: string[]): PrincipleEvaluation {
  const violations: PrincipleViolation[] = [];
  const evidence: string[] = [];
  const recommendations: string[] = [];

  // Look for signal colors (strategic use)
  const signalColors =
    content.match(
      /\b(text|bg)-(signal-success|signal-warning|signal-error|accent-blue|accent-ai)\b/g
    ) || [];

  if (signalColors.length > 0) {
    evidence.push(`Found ${signalColors.length} strategic signal color usages`);
  }

  // Check for decorative color usage
  const decorativeColors =
    content.match(
      /\b(bg|text)-(red|blue|green|purple|pink|yellow)-\d+\b(?!.*method|status|signal)/g
    ) || [];

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    // Check for decorative color without context
    const decorativeMatch = line.match(/\b(bg|text)-(red|blue|green|purple)-\d+\b/);
    if (
      decorativeMatch &&
      !line.includes('method') &&
      !line.includes('status') &&
      !line.includes('signal') &&
      !line.includes('error') &&
      !line.includes('warning') &&
      !line.includes('success')
    ) {
      violations.push({
        line: lineNum,
        code: decorativeMatch[0],
        message: 'Potential decorative color usage without semantic purpose',
        severity: 'warning',
        suggestion:
          'Use signal colors (signal-success, signal-warning, signal-error) for semantic meaning',
      });
    }
  });

  const score = violations.length === 0 ? 100 : Math.max(0, 100 - violations.length * 10);
  const status: ComplianceStatus =
    violations.length === 0 ? 'pass' : violations.length < 3 ? 'partial' : 'fail';

  // Add default evidence for passing components
  if (violations.length === 0 && evidence.length === 0) {
    evidence.push('No prohibited color class patterns detected');
  }

  return {
    principle: 'strategic-color',
    status,
    score,
    violations,
    evidence,
    recommendations,
  };
}

/**
 * Evaluate semantic token usage
 */
function evaluateSemanticTokens(content: string, lines: string[]): PrincipleEvaluation {
  const violations: PrincipleViolation[] = [];
  const evidence: string[] = [];
  const recommendations: string[] = [];

  // Count semantic tokens
  let semanticCount = 0;
  SEMANTIC_TOKEN_PATTERNS.forEach((pattern) => {
    const matches = content.match(pattern) || [];
    semanticCount += matches.length;
  });

  if (semanticCount > 0) {
    evidence.push(`Found ${semanticCount} semantic color token usages`);
  }

  // Check for hardcoded colors
  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Skip import lines and comments
    if (
      line.trim().startsWith('import') ||
      line.trim().startsWith('//') ||
      line.trim().startsWith('*')
    ) {
      return;
    }

    HARDCODED_COLOR_PATTERNS.forEach((pattern) => {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          // Ignore matches in comments
          if (line.indexOf('//') !== -1 && line.indexOf('//') < line.indexOf(match)) {
            return;
          }
          // Ignore CSS variable definitions (they're defining the tokens)
          if (line.includes('--') || line.includes('oklch')) {
            return;
          }

          violations.push({
            line: lineNum,
            code: match,
            message: `Hardcoded color detected: ${match}`,
            severity: 'error',
            suggestion:
              'Use semantic tokens like bg-background, text-foreground, or design system tokens',
          });
        });
      }
    });
  });

  const score = violations.length === 0 ? 100 : Math.max(0, 100 - violations.length * 5);
  const status: ComplianceStatus =
    violations.length === 0 ? 'pass' : violations.length < 5 ? 'partial' : 'fail';

  if (violations.length > 0) {
    recommendations.push('Replace hardcoded colors with semantic tokens');
  }

  // Add default evidence for passing components
  if (violations.length === 0 && evidence.length === 0) {
    evidence.push('No hardcoded colors detected');
  }

  return {
    principle: 'semantic-tokens',
    status,
    score,
    violations,
    evidence,
    recommendations,
  };
}

/**
 * Evaluate spacing grid (8px grid)
 */
function evaluateSpacingGrid(content: string, lines: string[]): PrincipleEvaluation {
  const violations: PrincipleViolation[] = [];
  const evidence: string[] = [];
  const recommendations: string[] = [];

  const validSpacing = content.match(VALID_SPACING_CLASSES) || [];
  const oddSpacing = content.match(ODD_SPACING_CLASSES) || [];

  if (validSpacing.length > 0) {
    evidence.push(`Found ${validSpacing.length} 8px grid-aligned spacing classes`);
  }

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const oddMatches = line.match(ODD_SPACING_CLASSES);
    if (oddMatches) {
      oddMatches.forEach((match) => {
        violations.push({
          line: lineNum,
          code: match,
          message: `Non-8px grid spacing: ${match}`,
          severity: 'info',
          suggestion: 'Consider using 8px grid spacing (p-2, p-4, p-6, p-8)',
        });
      });
    }
  });

  const totalSpacing = validSpacing.length + oddSpacing.length;
  const score = totalSpacing > 0 ? Math.round((validSpacing.length / totalSpacing) * 100) : 100;
  const status: ComplianceStatus = score >= 90 ? 'pass' : score >= 70 ? 'partial' : 'fail';

  return {
    principle: 'spacing-grid',
    status,
    score,
    violations,
    evidence,
    recommendations,
  };
}

/**
 * Evaluate generous whitespace
 */
function evaluateGenerousWhitespace(content: string, lines: string[]): PrincipleEvaluation {
  const violations: PrincipleViolation[] = [];
  const evidence: string[] = [];
  const recommendations: string[] = [];

  let generousCount = 0;
  GENEROUS_WHITESPACE_PATTERNS.forEach((pattern) => {
    const matches = content.match(pattern) || [];
    generousCount += matches.length;
  });

  if (generousCount > 0) {
    evidence.push(`Found ${generousCount} generous whitespace patterns (p-6+ or m-6+)`);
  }

  // Small components might not need generous whitespace
  const isSmallComponent = lines.length < 50;
  const hasAnyPadding = content.match(/\bp-[0-9]+\b/) !== null;

  let status: ComplianceStatus = 'not-applicable';
  let score = 100;

  if (isSmallComponent && hasAnyPadding) {
    status = 'pass';
    evidence.push('Small component with appropriate padding');
  } else if (generousCount > 0) {
    status = 'pass';
  } else if (hasAnyPadding) {
    status = 'partial';
    recommendations.push('Consider using more generous padding (p-6, p-8) for larger sections');
    score = 70;
  }

  return {
    principle: 'generous-whitespace',
    status,
    score,
    violations,
    evidence,
    recommendations,
  };
}

/**
 * Evaluate subtle depth (shadows)
 */
function evaluateSubtleDepth(content: string, lines: string[]): PrincipleEvaluation {
  const violations: PrincipleViolation[] = [];
  const evidence: string[] = [];
  const recommendations: string[] = [];

  let subtleShadows = 0;
  SHADOW_PATTERNS.forEach((pattern) => {
    const matches = content.match(pattern) || [];
    subtleShadows += matches.length;
  });

  let heavyShadows = 0;
  HEAVY_SHADOW_PATTERNS.forEach((pattern) => {
    const matches = content.match(pattern) || [];
    heavyShadows += matches.length;
  });

  if (subtleShadows > 0) {
    evidence.push(`Found ${subtleShadows} subtle shadow usages`);
  }

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    HEAVY_SHADOW_PATTERNS.forEach((pattern) => {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          violations.push({
            line: lineNum,
            code: match,
            message: `Heavy shadow detected: ${match}`,
            severity: 'warning',
            suggestion: 'Use subtle shadows (shadow-xs, shadow-sm, shadow-md) for zen aesthetic',
          });
        });
      }
    });
  });

  const totalShadows = subtleShadows + heavyShadows;
  const score = totalShadows > 0 ? Math.round((subtleShadows / totalShadows) * 100) : 100;
  const status: ComplianceStatus =
    heavyShadows === 0 ? 'pass' : heavyShadows < subtleShadows ? 'partial' : 'fail';

  // Add default evidence for passing components
  if (heavyShadows === 0 && evidence.length === 0) {
    evidence.push('No heavy shadows detected');
  }

  return {
    principle: 'subtle-depth',
    status,
    score,
    violations,
    evidence,
    recommendations,
  };
}

/**
 * Evaluate typography spacing
 */
function evaluateTypographySpacing(content: string, lines: string[]): PrincipleEvaluation {
  const evidence: string[] = [];
  const recommendations: string[] = [];

  // Check for font-mono usage for code
  const monoUsage = content.match(/\bfont-mono\b/g) || [];
  if (monoUsage.length > 0) {
    evidence.push(`Found ${monoUsage.length} monospace font usages`);
  }

  // Check for proper text sizing
  const textSizes = content.match(/\btext-(xs|sm|base|lg|xl|2xl)\b/g) || [];
  if (textSizes.length > 0) {
    evidence.push(`Found ${textSizes.length} text size classes`);
  }

  // Check for font weights
  const fontWeights = content.match(/\bfont-(normal|medium|semibold|bold)\b/g) || [];
  if (fontWeights.length > 0) {
    evidence.push(`Found ${fontWeights.length} font weight classes`);
  }

  const hasTypography = monoUsage.length > 0 || textSizes.length > 0 || fontWeights.length > 0;
  const status: ComplianceStatus = hasTypography ? 'pass' : 'not-applicable';
  const score = hasTypography ? 100 : 100;

  return {
    principle: 'typography-spacing',
    status,
    score,
    violations: [],
    evidence,
    recommendations,
  };
}

/**
 * Evaluate dark mode compatibility
 */
function evaluateDarkModeCompatible(content: string, lines: string[]): PrincipleEvaluation {
  const violations: PrincipleViolation[] = [];
  const evidence: string[] = [];
  const recommendations: string[] = [];

  // Check for hardcoded light-mode colors
  const lightModeColors = [
    /\bbg-white\b/g,
    /\btext-black\b/g,
    /\bbg-gray-50\b/g,
    /\bbg-gray-100\b/g,
  ];

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    lightModeColors.forEach((pattern) => {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          violations.push({
            line: lineNum,
            code: match,
            message: `Light-mode only color: ${match}`,
            severity: 'error',
            suggestion: 'Use semantic tokens that work in both light and dark modes',
          });
        });
      }
    });
  });

  // Check for semantic token usage (good for dark mode)
  const semanticUsage = content.match(/\b(bg|text)-(background|foreground|muted|card)\b/g) || [];
  if (semanticUsage.length > 0) {
    evidence.push(`Found ${semanticUsage.length} dark-mode compatible semantic tokens`);
  }

  const score = violations.length === 0 ? 100 : Math.max(0, 100 - violations.length * 20);
  const status: ComplianceStatus =
    violations.length === 0 ? 'pass' : violations.length < 3 ? 'partial' : 'fail';

  // Add default evidence for passing components
  if (violations.length === 0 && evidence.length === 0) {
    evidence.push('No light-mode only color patterns detected');
  }

  return {
    principle: 'dark-mode-compatible',
    status,
    score,
    violations,
    evidence,
    recommendations,
  };
}

/**
 * Evaluate Motion animations usage
 */
function evaluateMotionAnimations(content: string, lines: string[]): PrincipleEvaluation {
  const evidence: string[] = [];
  const recommendations: string[] = [];

  // Check for Motion import
  const hasMotionImport =
    content.includes("from 'motion/react'") || content.includes('from "motion/react"');

  if (hasMotionImport) {
    evidence.push('Uses motion/react for animations');
  }

  // Check for motion components
  const motionComponents = content.match(/<motion\.\w+/g) || [];
  if (motionComponents.length > 0) {
    evidence.push(`Found ${motionComponents.length} motion component usages`);
  }

  // Check for animation props
  const animationProps = ['whileHover', 'whileTap', 'animate', 'initial', 'variants', 'transition'];
  animationProps.forEach((prop) => {
    if (content.includes(prop)) {
      evidence.push(`Uses ${prop} animation prop`);
    }
  });

  // Check for CSS transitions (less ideal but acceptable for simple cases)
  const cssTransitions = content.match(/transition-(colors|all|opacity|transform)/g) || [];

  const hasMotion = hasMotionImport || motionComponents.length > 0;
  const hasCssTransitions = cssTransitions.length > 0;

  let status: ComplianceStatus = 'not-applicable';
  let score = 100;

  if (hasMotion) {
    status = 'pass';
  } else if (hasCssTransitions) {
    status = 'partial';
    score = 70;
    recommendations.push('Consider using Motion for complex animations instead of CSS transitions');
  }

  return {
    principle: 'motion-animations',
    status,
    score,
    violations: [],
    evidence,
    recommendations,
  };
}

/**
 * Evaluate zen aesthetic (calm, muted, minimal)
 */
function evaluateZenAesthetic(content: string, lines: string[]): PrincipleEvaluation {
  const violations: PrincipleViolation[] = [];
  const evidence: string[] = [];
  const recommendations: string[] = [];

  // Check for muted colors
  const mutedColors = content.match(/\b(text-muted|bg-muted|opacity-\d+|\/\d+)\b/g) || [];
  if (mutedColors.length > 0) {
    evidence.push(`Found ${mutedColors.length} muted/opacity color usages`);
  }

  // Check for subtle interactions
  const subtleInteractions = content.match(/hover:bg-\w+\/\d+/g) || [];
  if (subtleInteractions.length > 0) {
    evidence.push(`Found ${subtleInteractions.length} subtle hover interactions`);
  }

  // Check for scale animations (should be subtle: 1.01-1.02)
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const scaleMatch = line.match(/scale:\s*([\d.]+)/);
    if (scaleMatch) {
      const scaleValue = parseFloat(scaleMatch[1]);
      if (scaleValue > 1.05 || scaleValue < 0.95) {
        violations.push({
          line: lineNum,
          code: scaleMatch[0],
          message: `Large scale animation: ${scaleMatch[0]}`,
          severity: 'warning',
          suggestion: 'Use subtle scale values (1.01-1.02 or 0.98-0.99) for zen aesthetic',
        });
      } else {
        evidence.push(`Subtle scale animation at line ${lineNum}: ${scaleMatch[0]}`);
      }
    }
  });

  // Check for flashy patterns (violations)
  const flashyPatterns = [/animate-bounce/g, /animate-spin/g, /animate-pulse/g];

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    flashyPatterns.forEach((pattern) => {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          violations.push({
            line: lineNum,
            code: match,
            message: `Flashy animation: ${match}`,
            severity: 'warning',
            suggestion: 'Use subtle, intentional animations instead of flashy ones',
          });
        });
      }
    });
  });

  const hasZenElements = mutedColors.length > 0 || subtleInteractions.length > 0;
  const score =
    violations.length === 0
      ? hasZenElements
        ? 100
        : 80
      : Math.max(0, 100 - violations.length * 15);
  const status: ComplianceStatus =
    violations.length === 0 ? 'pass' : violations.length < 2 ? 'partial' : 'fail';

  // Add default evidence for passing components
  if (violations.length === 0 && evidence.length === 0) {
    evidence.push('No flashy or distracting patterns detected');
  }

  return {
    principle: 'zen-aesthetic',
    status,
    score,
    violations,
    evidence,
    recommendations,
  };
}

/**
 * Patterns for old token names that should be migrated to Radix-idiomatic names
 */
const OLD_TOKEN_PATTERNS = [
  { pattern: /--color-bg-app/g, suggestion: 'Use --color-background instead' },
  { pattern: /--color-bg-surface/g, suggestion: 'Use --color-surface instead' },
  { pattern: /--color-bg-raised/g, suggestion: 'Use --color-panel-solid instead' },
  {
    pattern: /--color-bg-elevated/g,
    suggestion: 'Use --gray-4 or --color-panel-translucent instead',
  },
  { pattern: /--color-text-primary/g, suggestion: 'Use --gray-12 instead' },
  { pattern: /--color-text-secondary/g, suggestion: 'Use --gray-11 instead' },
  { pattern: /--color-text-muted/g, suggestion: 'Use --gray-9 instead' },
  { pattern: /--color-border-subtle/g, suggestion: 'Use --gray-4 instead' },
  { pattern: /--color-border-default/g, suggestion: 'Use --gray-6 instead' },
  { pattern: /--color-border-emphasis/g, suggestion: 'Use --gray-8 instead' },
  { pattern: /--color-accent-blue(?!-hover)/g, suggestion: 'Use --accent-9 instead' },
];

/**
 * Patterns for Radix-idiomatic tokens (good)
 */
const RADIX_TOKEN_PATTERNS = [
  /--gray-[1-9][0-2]?/g,
  /--blue-[1-9][0-2]?/g,
  /--accent-[1-9][0-2]?/g,
  /--focus-[1-9][0-2]?/g,
  /--color-background/g,
  /--color-surface/g,
  /--color-panel-solid/g,
  /--color-panel-translucent/g,
];

/**
 * Evaluate Radix UI token compliance
 */
function evaluateRadixCompliance(
  content: string,
  lines: string[],
  filePath: string
): PrincipleEvaluation {
  const violations: PrincipleViolation[] = [];
  const evidence: string[] = [];
  const recommendations: string[] = [];

  // Skip theme/style files - they define the tokens, not use them
  const isThemeFile =
    filePath.includes('app.css') ||
    filePath.includes('radix-colors') ||
    filePath.includes('theme-tokens') ||
    filePath.includes('styles/');

  if (isThemeFile) {
    return {
      principle: 'radix-compliance',
      status: 'not-applicable',
      score: 100,
      violations: [],
      evidence: ['Theme file - token definitions, not usage'],
      recommendations: [],
    };
  }

  // Count Radix-idiomatic tokens
  let radixTokenCount = 0;
  RADIX_TOKEN_PATTERNS.forEach((pattern) => {
    const matches = content.match(pattern) || [];
    radixTokenCount += matches.length;
  });

  if (radixTokenCount > 0) {
    evidence.push(`Found ${radixTokenCount} Radix-idiomatic token usages`);
  }

  // Check for old token names that should be migrated
  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Skip import lines and comments
    if (
      line.trim().startsWith('import') ||
      line.trim().startsWith('//') ||
      line.trim().startsWith('*') ||
      line.trim().startsWith('/*')
    ) {
      return;
    }

    OLD_TOKEN_PATTERNS.forEach(({ pattern, suggestion }) => {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          // Ignore matches in comments
          if (line.indexOf('//') !== -1 && line.indexOf('//') < line.indexOf(match)) {
            return;
          }

          violations.push({
            line: lineNum,
            code: match,
            message: `Legacy token detected: ${match}`,
            severity: 'warning',
            suggestion,
          });
        });
      }
    });

    // Check for hardcoded colors in style props/attributes
    const hardcodedColorPatterns = [
      { pattern: /#[0-9a-fA-F]{3,8}\b/g, name: 'hex color' },
      { pattern: /rgba?\s*\([^)]+\)/gi, name: 'rgb/rgba color' },
      { pattern: /hsla?\s*\([^)]+\)/gi, name: 'hsl/hsla color' },
    ];

    hardcodedColorPatterns.forEach(({ pattern, name }) => {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          // Skip CSS variable definitions and oklch values (they're defining tokens)
          if (line.includes('--') && line.includes(':')) {
            return;
          }
          // Skip oklch values (design system definitions)
          if (line.includes('oklch')) {
            return;
          }
          // Skip color-gamut media queries
          if (line.includes('color-gamut') || line.includes('display-p3')) {
            return;
          }
          // Ignore matches in comments
          if (line.indexOf('//') !== -1 && line.indexOf('//') < line.indexOf(match)) {
            return;
          }

          violations.push({
            line: lineNum,
            code: match,
            message: `Hardcoded ${name} detected: ${match}`,
            severity: 'error',
            suggestion: 'Use Radix color tokens (--gray-*, --accent-*) or semantic tokens',
          });
        });
      }
    });
  });

  const score = violations.length === 0 ? 100 : Math.max(0, 100 - violations.length * 5);
  const status: ComplianceStatus =
    violations.length === 0 ? 'pass' : violations.length < 5 ? 'partial' : 'fail';

  if (violations.length > 0) {
    recommendations.push('Migrate legacy tokens to Radix-idiomatic names');
    recommendations.push('Replace hardcoded colors with semantic tokens');
  }

  // Add default evidence for passing components
  if (violations.length === 0 && evidence.length === 0) {
    evidence.push('No legacy tokens or hardcoded colors detected');
  }

  return {
    principle: 'radix-compliance',
    status,
    score,
    violations,
    evidence,
    recommendations,
  };
}

/**
 * Calculate overall score from principle evaluations
 */
function calculateOverallScore(principles: PrincipleEvaluation[]): number {
  const applicablePrinciples = principles.filter((p) => p.status !== 'not-applicable');
  if (applicablePrinciples.length === 0) return 100;

  const totalScore = applicablePrinciples.reduce((sum, p) => sum + p.score, 0);
  return Math.round(totalScore / applicablePrinciples.length);
}

/**
 * Calculate summary statistics
 */
function calculateSummary(principles: PrincipleEvaluation[]): PrinciplesCompliance['summary'] {
  return {
    totalPrinciples: principles.length,
    passed: principles.filter((p) => p.status === 'pass').length,
    partial: principles.filter((p) => p.status === 'partial').length,
    failed: principles.filter((p) => p.status === 'fail').length,
    notApplicable: principles.filter((p) => p.status === 'not-applicable').length,
  };
}

/**
 * Evaluate a single component against all design principles
 */
export async function evaluatePrinciples(componentPath: string): Promise<PrinciplesCompliance> {
  const fullPath = join(process.cwd(), componentPath);

  if (!existsSync(fullPath)) {
    throw new Error(`Component file not found: ${fullPath}`);
  }

  const content = readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');
  const componentName = basename(componentPath, '.tsx').replace('.jsx', '');

  const principles = ALL_PRINCIPLES.map((principle) =>
    evaluatePrinciple(principle, content, lines, componentPath)
  );

  return {
    componentPath,
    componentName,
    overallScore: calculateOverallScore(principles),
    principles,
    summary: calculateSummary(principles),
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Evaluate all components from component inventory
 */
export async function evaluateAllComponents(): Promise<PrinciplesCompliance[]> {
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

  const results: PrinciplesCompliance[] = [];

  for (const component of components) {
    try {
      const result = await evaluatePrinciples(component.path);
      results.push(result);
    } catch (error) {
      console.warn(`Failed to evaluate ${component.path}:`, error);
    }
  }

  return results;
}
