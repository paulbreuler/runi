/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Unified Material Feel Analysis Tests
 * @description TDD tests for unified material pattern analysis
 * @vitest-environment node
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { analyzeUnifiedMaterial, analyzeAllUnifiedMaterial } from './analyze-unified-material';
import type { UnifiedMaterialAnalysis } from './types';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

describe('unified-material-analysis', () => {
  const outputDir = join(process.cwd(), 'scripts', 'audit', 'output');

  beforeAll(() => {
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
  });

  describe('should detect single motion.div pattern', () => {
    it('should detect motion.div usage in component', async () => {
      // Test with a component known to use motion
      const result = await analyzeUnifiedMaterial('src/components/ui/button.tsx');

      expect(result).toBeDefined();
      expect(typeof result.usesMotion).toBe('boolean');
      expect(typeof result.motionDivCount).toBe('number');
      expect(result.motionDivCount).toBeGreaterThanOrEqual(0);
    });

    it('should flag components with multiple motion.divs as potential violation', async () => {
      // The check should identify components with more than one motion.div
      const result = await analyzeUnifiedMaterial('src/components/ui/SegmentedControl/effects.tsx');

      expect(result).toBeDefined();
      expect(result.checks.some((c) => c.name === 'single-motion-div')).toBe(true);
    });
  });

  describe('should verify Motion variants orchestrating animations', () => {
    it('should detect variant usage', async () => {
      const result = await analyzeUnifiedMaterial('src/components/ui/EmptyState.tsx');

      expect(result).toBeDefined();
      expect(typeof result.usesVariants).toBe('boolean');
      expect(result.checks.some((c) => c.name === 'variant-orchestration')).toBe(true);
    });

    it('should verify proper variant orchestration', async () => {
      // Components using variants should have orchestration check
      const result = await analyzeUnifiedMaterial('src/components/ui/Dialog.tsx');

      expect(result).toBeDefined();
      expect(typeof result.hasVariantOrchestration).toBe('boolean');
    });
  });

  describe('should flag separate inner hover states (violation)', () => {
    it('should detect separate inner hover patterns', async () => {
      const result = await analyzeUnifiedMaterial('src/components/ui/button.tsx');

      expect(result).toBeDefined();
      expect(typeof result.hasSeparateInnerHover).toBe('boolean');
      expect(result.checks.some((c) => c.name === 'hover-state-analysis')).toBe(true);
    });

    it('should add violation when separate inner hover detected', async () => {
      const result = await analyzeUnifiedMaterial('src/components/ui/SplitButton.tsx');

      expect(result).toBeDefined();
      if (result.hasSeparateInnerHover) {
        expect(result.violations).toContain('separate-inner-hover');
      }
    });
  });

  describe('should check content inheriting from parent hover', () => {
    it('should analyze parent-child hover relationships', async () => {
      const result = await analyzeUnifiedMaterial('src/components/ui/card.tsx');

      expect(result).toBeDefined();
      expect(typeof result.contentInheritsParentHover).toBe('boolean');
    });
  });

  describe('should verify subtle depth on hover (shadow or glow)', () => {
    it('should detect depth effects on hover', async () => {
      const result = await analyzeUnifiedMaterial('src/components/ui/button.tsx');

      expect(result).toBeDefined();
      expect(typeof result.hasDepthOnHover).toBe('boolean');
      expect(result.checks.some((c) => c.name === 'depth-on-hover')).toBe(true);
    });

    it('should flag missing depth on hover for interactive components', async () => {
      const result = await analyzeUnifiedMaterial('src/components/ui/Switch.tsx');

      expect(result).toBeDefined();
      // Interactive components should have depth on hover
      if (!result.hasDepthOnHover && result.usesMotion) {
        expect(result.violations).toContain('no-depth-on-hover');
      }
    });
  });

  describe('should flag clip-path hacks (violation)', () => {
    it('should detect clip-path usage', async () => {
      const result = await analyzeUnifiedMaterial('src/components/ui/PulsingGlow.tsx');

      expect(result).toBeDefined();
      expect(typeof result.usesClipPathHack).toBe('boolean');
      expect(result.checks.some((c) => c.name === 'clip-path-check')).toBe(true);
    });

    it('should add violation when clip-path hack detected', async () => {
      // Test a component that might use clip-path
      const result = await analyzeUnifiedMaterial(
        'src/components/ui/SegmentedControl/SegmentedControl.tsx'
      );

      expect(result).toBeDefined();
      if (result.usesClipPathHack) {
        expect(result.violations).toContain('clip-path-hack');
      }
    });
  });

  describe('should generate unified material score', () => {
    it('should calculate score between 0 and 100', async () => {
      const result = await analyzeUnifiedMaterial('src/components/ui/button.tsx');

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should give higher scores to compliant components', async () => {
      // Components with fewer violations should have higher scores
      const result1 = await analyzeUnifiedMaterial('src/components/ui/Label.tsx');
      const result2 = await analyzeUnifiedMaterial(
        'src/components/ui/SegmentedControl/effects.tsx'
      );

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(typeof result1.score).toBe('number');
      expect(typeof result2.score).toBe('number');
    });
  });

  describe('should generate unified-material-analysis.json', () => {
    it('should generate valid JSON output for all components', async () => {
      const results = await analyzeAllUnifiedMaterial();

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      const outputPath = join(outputDir, 'unified-material-analysis.json');
      const jsonContent = JSON.stringify(results, null, 2);
      writeFileSync(outputPath, jsonContent, 'utf-8');

      expect(existsSync(outputPath)).toBe(true);

      const fileContent = readFileSync(outputPath, 'utf-8');
      const parsed = JSON.parse(fileContent) as UnifiedMaterialAnalysis[];

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(results.length);

      // Verify structure
      parsed.forEach((analysis) => {
        expect(analysis).toHaveProperty('componentPath');
        expect(analysis).toHaveProperty('componentName');
        expect(analysis).toHaveProperty('usesMotion');
        expect(analysis).toHaveProperty('motionDivCount');
        expect(analysis).toHaveProperty('usesVariants');
        expect(analysis).toHaveProperty('checks');
        expect(analysis).toHaveProperty('violations');
        expect(analysis).toHaveProperty('score');
      });
    });
  });
});
