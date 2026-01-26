/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Unified Material Feel Analysis
 * @description Analyzes components for unified material feel patterns
 */

import { readFileSync, existsSync } from 'fs';
import { join, basename } from 'path';
import type {
  UnifiedMaterialAnalysis,
  UnifiedMaterialCheck,
  UnifiedMaterialViolation,
  ComponentMetadata,
} from './types';

/**
 * Pattern matchers for unified material analysis
 */
const PATTERNS = {
  // Motion.div patterns
  motionDiv: /motion\.div|<motion\.div/g,
  motionAny: /motion\.[a-z]+|<motion\.[a-z]+/g,
  motionImport: /from\s+['"]motion\/react['"]/,
  framerImport: /from\s+['"]framer-motion['"]/,

  // Variant patterns
  variants: /variants\s*[=:]/g,
  variantsProp: /variants\s*=\s*\{/g,
  animateVariant: /animate\s*=\s*["']?\w+["']?/g,
  whileHover: /whileHover\s*=/g,
  whileTap: /whileTap\s*=/g,

  // Hover state patterns
  hoverClass: /hover:/g,
  groupHover: /group-hover:/g,
  onHover: /on(?:Mouse)?(?:Enter|Over)/g,
  hoverState: /isHover(?:ed)?|hovering/gi,

  // Depth patterns (shadow/glow on hover)
  shadowHover: /hover:shadow|whileHover.*shadow|hover:ring|hover:glow/gi,
  shadowClass: /shadow-(?:sm|md|lg|xl|2xl)|ring-/g,
  glowEffect: /glow|blur.*opacity|opacity.*blur/gi,

  // Clip-path patterns (potential violation)
  clipPath: /clip-path|clipPath/gi,
  clipPathInset: /clip-path:\s*inset|clipPath:\s*['"]?inset/gi,

  // Orchestration patterns
  staggerChildren: /staggerChildren/g,
  delayChildren: /delayChildren/g,
  transition: /transition\s*[=:]/g,
};

/**
 * Analyze a single component for unified material feel patterns
 */
export async function analyzeUnifiedMaterial(
  componentPath: string
): Promise<UnifiedMaterialAnalysis> {
  const projectRoot = process.cwd();
  const fullPath = componentPath.startsWith('/') ? componentPath : join(projectRoot, componentPath);

  if (!existsSync(fullPath)) {
    throw new Error(`Component file not found: ${fullPath}`);
  }

  const content = readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');
  const componentName = extractComponentName(fullPath, content);

  // Analyze motion usage
  const usesMotion = PATTERNS.motionImport.test(content) || PATTERNS.framerImport.test(content);
  const motionDivMatches = content.match(PATTERNS.motionDiv) || [];
  const motionDivCount = motionDivMatches.length;

  // Analyze variants
  const variantMatches = content.match(PATTERNS.variants) || [];
  const usesVariants = variantMatches.length > 0;
  const hasVariantOrchestration = checkVariantOrchestration(content);

  // Analyze hover states
  const hasSeparateInnerHover = checkSeparateInnerHover(content);
  const contentInheritsParentHover = checkParentHoverInheritance(content);

  // Analyze depth on hover
  const hasDepthOnHover = checkDepthOnHover(content);

  // Analyze clip-path
  const usesClipPathHack = checkClipPathHack(content);

  // Build checks array
  const checks: UnifiedMaterialCheck[] = [
    buildSingleMotionDivCheck(motionDivCount, content),
    buildVariantOrchestrationCheck(usesVariants, hasVariantOrchestration),
    buildHoverStateCheck(hasSeparateInnerHover, content),
    buildDepthOnHoverCheck(hasDepthOnHover, usesMotion),
    buildClipPathCheck(usesClipPathHack, content),
  ];

  // Build violations array
  const violations = buildViolations({
    motionDivCount,
    hasSeparateInnerHover,
    usesClipPathHack,
    usesVariants,
    hasVariantOrchestration,
    hasDepthOnHover,
    usesMotion,
  });

  // Calculate score
  const score = calculateScore(checks, violations);

  return {
    componentPath,
    componentName,
    usesMotion,
    motionDivCount,
    usesVariants,
    hasVariantOrchestration,
    hasSeparateInnerHover,
    contentInheritsParentHover,
    hasDepthOnHover,
    usesClipPathHack,
    checks,
    violations,
    score,
  };
}

/**
 * Analyze all components for unified material feel
 */
export async function analyzeAllUnifiedMaterial(): Promise<UnifiedMaterialAnalysis[]> {
  const outputPath = join(process.cwd(), 'scripts', 'audit', 'output', 'component-inventory.json');

  if (!existsSync(outputPath)) {
    throw new Error('component-inventory.json not found. Run component discovery first.');
  }

  const components: ComponentMetadata[] = JSON.parse(readFileSync(outputPath, 'utf-8'));
  const results: UnifiedMaterialAnalysis[] = [];

  for (const component of components) {
    try {
      const analysis = await analyzeUnifiedMaterial(component.path);
      results.push(analysis);
    } catch (error) {
      console.warn(`Failed to analyze ${component.path}:`, error);
    }
  }

  return results;
}

// ============================================================================
// Helper Functions
// ============================================================================

function extractComponentName(filePath: string, content: string): string {
  // Try to extract from export
  const exportMatch = content.match(/export\s+(?:const|function)\s+(\w+)/);
  if (exportMatch) {
    return exportMatch[1];
  }

  // Fallback to filename
  const fileName = basename(filePath);
  return fileName.replace(/\.(tsx|jsx|ts|js)$/, '');
}

function checkVariantOrchestration(content: string): boolean {
  // Check for staggerChildren or delayChildren (orchestration patterns)
  const hasStagger = PATTERNS.staggerChildren.test(content);
  const hasDelay = PATTERNS.delayChildren.test(content);
  const hasTransition = (content.match(PATTERNS.transition) || []).length > 0;

  // Also check for parent-child variant relationships
  const hasAnimateVariant = PATTERNS.animateVariant.test(content);
  const hasVariantsProp = PATTERNS.variantsProp.test(content);

  return hasStagger || hasDelay || (hasTransition && hasAnimateVariant && hasVariantsProp);
}

function checkSeparateInnerHover(content: string): boolean {
  // Check for multiple separate hover: classes that suggest non-unified hover
  const hoverClasses = content.match(PATTERNS.hoverClass) || [];
  const groupHovers = content.match(PATTERNS.groupHover) || [];

  // If there are many hover: classes without group-hover:, might be separate hovers
  if (hoverClasses.length > 3 && groupHovers.length === 0) {
    return true;
  }

  // Check for whileHover on multiple elements
  const whileHoverMatches = content.match(PATTERNS.whileHover) || [];
  if (whileHoverMatches.length > 2) {
    return true;
  }

  return false;
}

function checkParentHoverInheritance(content: string): boolean {
  // Check for group/group-hover patterns (Tailwind)
  const hasGroup = /className.*group[^-]|className.*"group"/g.test(content);
  const hasGroupHover = PATTERNS.groupHover.test(content);

  if (hasGroup && hasGroupHover) {
    return true;
  }

  // Check for variant inheritance in motion
  const hasVariants = PATTERNS.variants.test(content);
  const hasAnimateProp = /animate\s*=\s*\{?\s*["']?\w+/g.test(content);

  return hasVariants && hasAnimateProp;
}

function checkDepthOnHover(content: string): boolean {
  // Check for shadow or glow on hover
  if (PATTERNS.shadowHover.test(content)) {
    return true;
  }

  // Check for motion whileHover with shadow/scale
  const whileHoverSection = content.match(/whileHover\s*=\s*\{[^}]+\}/gs);
  if (whileHoverSection) {
    const hasScaleOrShadow = whileHoverSection.some((section) =>
      /scale|shadow|y:\s*-?\d|boxShadow/i.test(section)
    );
    if (hasScaleOrShadow) {
      return true;
    }
  }

  return false;
}

function checkClipPathHack(content: string): boolean {
  // Check for clip-path usage that might be a hack
  const clipPathMatches = content.match(PATTERNS.clipPath) || [];

  if (clipPathMatches.length === 0) {
    return false;
  }

  // Check if clip-path is used for animation workarounds
  const hasClipPathInset = PATTERNS.clipPathInset.test(content);
  const hasClipPathAnimation = /animate.*clipPath|clipPath.*animate|transition.*clip/gi.test(
    content
  );

  return hasClipPathInset || hasClipPathAnimation;
}

// ============================================================================
// Check Builders
// ============================================================================

function buildSingleMotionDivCheck(motionDivCount: number, content: string): UnifiedMaterialCheck {
  const lines = findPatternLines(content, PATTERNS.motionDiv);
  const passed = motionDivCount <= 1;

  return {
    name: 'single-motion-div',
    passed,
    details: passed
      ? motionDivCount === 0
        ? 'No motion.div elements found'
        : 'Single motion.div pattern followed'
      : `Found ${motionDivCount} motion.div elements - consider consolidating`,
    lines,
  };
}

function buildVariantOrchestrationCheck(
  usesVariants: boolean,
  hasOrchestration: boolean
): UnifiedMaterialCheck {
  const passed = !usesVariants || hasOrchestration;

  return {
    name: 'variant-orchestration',
    passed,
    details: !usesVariants
      ? 'No variants used'
      : hasOrchestration
        ? 'Proper variant orchestration detected'
        : 'Uses variants but missing orchestration (staggerChildren/delayChildren)',
  };
}

function buildHoverStateCheck(
  hasSeparateInnerHover: boolean,
  content: string
): UnifiedMaterialCheck {
  const hoverLines = findPatternLines(content, PATTERNS.hoverClass);

  return {
    name: 'hover-state-analysis',
    passed: !hasSeparateInnerHover,
    details: hasSeparateInnerHover
      ? 'Separate inner hover states detected - consider unified hover'
      : 'Hover states appear unified or use group pattern',
    lines: hasSeparateInnerHover ? hoverLines : undefined,
  };
}

function buildDepthOnHoverCheck(
  hasDepthOnHover: boolean,
  usesMotion: boolean
): UnifiedMaterialCheck {
  // Only flag if component uses motion (interactive) but lacks depth
  const passed = hasDepthOnHover || !usesMotion;

  return {
    name: 'depth-on-hover',
    passed,
    details: hasDepthOnHover
      ? 'Subtle depth on hover detected (shadow/scale/glow)'
      : usesMotion
        ? 'Interactive component missing depth effect on hover'
        : 'Non-motion component - depth check skipped',
  };
}

function buildClipPathCheck(usesClipPathHack: boolean, content: string): UnifiedMaterialCheck {
  const lines = usesClipPathHack ? findPatternLines(content, PATTERNS.clipPath) : [];

  return {
    name: 'clip-path-check',
    passed: !usesClipPathHack,
    details: usesClipPathHack
      ? 'Clip-path hack detected - consider alternative approach'
      : 'No clip-path hacks detected',
    lines: usesClipPathHack ? lines : undefined,
  };
}

// ============================================================================
// Violation & Score Builders
// ============================================================================

interface ViolationParams {
  motionDivCount: number;
  hasSeparateInnerHover: boolean;
  usesClipPathHack: boolean;
  usesVariants: boolean;
  hasVariantOrchestration: boolean;
  hasDepthOnHover: boolean;
  usesMotion: boolean;
}

function buildViolations(params: ViolationParams): UnifiedMaterialViolation[] {
  const violations: UnifiedMaterialViolation[] = [];

  if (params.motionDivCount > 1) {
    violations.push('multiple-motion-divs');
  }

  if (params.hasSeparateInnerHover) {
    violations.push('separate-inner-hover');
  }

  if (params.usesClipPathHack) {
    violations.push('clip-path-hack');
  }

  if (params.usesVariants && !params.hasVariantOrchestration) {
    violations.push('missing-variant-orchestration');
  }

  if (params.usesMotion && !params.hasDepthOnHover) {
    violations.push('no-depth-on-hover');
  }

  return violations;
}

function calculateScore(
  checks: UnifiedMaterialCheck[],
  violations: UnifiedMaterialViolation[]
): number {
  // Base score
  let score = 100;

  // Deduct for violations
  const violationWeights: Record<UnifiedMaterialViolation, number> = {
    'multiple-motion-divs': 15,
    'separate-inner-hover': 20,
    'clip-path-hack': 25,
    'missing-variant-orchestration': 10,
    'no-depth-on-hover': 10,
  };

  for (const violation of violations) {
    score -= violationWeights[violation];
  }

  // Bonus for passing all checks
  const allPassed = checks.every((c) => c.passed);
  if (allPassed) {
    score = Math.min(100, score + 5);
  }

  return Math.max(0, Math.min(100, score));
}

function findPatternLines(content: string, pattern: RegExp): number[] {
  const lines = content.split('\n');
  const matchingLines: number[] = [];

  lines.forEach((line, index) => {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    if (pattern.test(line)) {
      matchingLines.push(index + 1); // 1-based line numbers
    }
  });

  return matchingLines;
}
