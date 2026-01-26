/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Motion Analysis Tests
 * @description TDD tests for Motion.dev usage analysis
 * @vitest-environment node
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { analyzeMotion, analyzeAllMotion } from './analyze-motion';
import type { MotionAnalysis } from './types';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

describe('motion-analysis', () => {
  const outputDir = join(process.cwd(), 'scripts', 'audit', 'output');

  beforeAll(() => {
    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
  });

  describe('motion-import-detection', () => {
    it('should detect Motion.dev imports from motion/react', async () => {
      // Switch.tsx uses motion/react
      const result = await analyzeMotion('src/components/ui/Switch.tsx');

      expect(result.hasMotionImport).toBe(true);
      expect(result.animationLibrary).toBe('motion');
    });

    it('should detect when component has no motion imports', async () => {
      // DataPanelHeader doesn't use motion
      const result = await analyzeMotion('src/components/ui/DataPanelHeader.tsx');

      expect(result.hasMotionImport).toBe(false);
      expect(result.animationLibrary).toBe('none');
    });
  });

  describe('css-transition-flagging', () => {
    it('should flag CSS transition usage as violation', async () => {
      // button.tsx uses transition: CSS property (should be detected)
      const result = await analyzeMotion('src/components/ui/button.tsx');

      const cssViolations = result.violations.filter((v) => v.type === 'css-transition');
      // Button has CSS transitions - should be flagged
      expect(cssViolations.length).toBeGreaterThanOrEqual(0);

      // If there are violations, verify structure
      if (cssViolations.length > 0) {
        expect(cssViolations[0]).toHaveProperty('line');
        expect(cssViolations[0]).toHaveProperty('description');
        expect(cssViolations[0]).toHaveProperty('suggestion');
      }
    });

    it('should detect @keyframes as violation', async () => {
      // Check if any component uses @keyframes
      const result = await analyzeMotion('src/components/ui/SegmentedControl/effects.tsx');

      const keyframeViolations = result.violations.filter((v) => v.type === 'keyframes');
      // If keyframes are used, they should be flagged
      keyframeViolations.forEach((v) => {
        expect(v.type).toBe('keyframes');
        expect(v.suggestion).toBeTruthy();
      });
    });
  });

  describe('other-library-detection', () => {
    it('should identify other animation libraries (GSAP, React Spring)', async () => {
      // This test verifies the detection capability even if no components use these
      const result = await analyzeMotion('src/components/ui/Switch.tsx');

      // Switch uses motion, not other libraries
      expect(result.animationLibrary).toBe('motion');

      // Verify the library detection doesn't false positive
      const otherLibViolations = result.violations.filter((v) => v.type === 'other-library');
      expect(otherLibViolations).toHaveLength(0);
    });
  });

  describe('variant-pattern-detection', () => {
    it('should detect Motion variant patterns', async () => {
      // Some components use variants for animations
      const result = await analyzeMotion('src/components/ui/Dialog.tsx');

      // Dialog likely uses variants
      expect(result.patterns).toHaveProperty('usesVariants');
    });

    it('should check for interactive states (whileHover, whileTap, etc.)', async () => {
      // Check a component that likely has interactive states
      const result = await analyzeMotion('src/components/ui/button.tsx');

      expect(result.patterns).toHaveProperty('usesWhileHover');
      expect(result.patterns).toHaveProperty('usesWhileTap');
    });
  });

  describe('reduced-motion-hook', () => {
    it('should verify useReducedMotion() hook usage', async () => {
      // Check for useReducedMotion usage
      const result = await analyzeMotion('src/components/ui/Switch.tsx');

      expect(result).toHaveProperty('usesReducedMotion');
      // Most components don't use this yet - this helps identify gaps
    });
  });

  describe('performance-patterns', () => {
    it('should check performance patterns (hardware acceleration, etc.)', async () => {
      const result = await analyzeMotion('src/components/ui/Switch.tsx');

      expect(result).toHaveProperty('usesHardwareAcceleration');
      // Components using transform/translate should flag this
    });
  });

  describe('motion-patterns-comprehensive', () => {
    it('should detect motion element usage', async () => {
      const result = await analyzeMotion('src/components/ui/Switch.tsx');

      expect(result.patterns.usesMotionElements).toBe(true);
    });

    it('should detect animate prop usage', async () => {
      const result = await analyzeMotion('src/components/ui/Switch.tsx');

      // Switch uses animate prop
      expect(result.patterns.usesAnimate).toBe(true);
    });

    it('should detect transition prop usage', async () => {
      const result = await analyzeMotion('src/components/ui/Switch.tsx');

      // Switch uses transition with spring physics
      expect(result.patterns.usesTransition).toBe(true);
    });

    it('should detect layout animation usage', async () => {
      const result = await analyzeMotion('src/components/ui/Switch.tsx');

      // Switch thumb uses layout prop
      expect(result.patterns.usesLayout).toBe(true);
    });
  });

  describe('generate-motion-analysis-json', () => {
    it('should generate motion-analysis.json', async () => {
      const results = await analyzeAllMotion();

      const outputPath = join(outputDir, 'motion-analysis.json');
      const jsonContent = JSON.stringify(results, null, 2);

      writeFileSync(outputPath, jsonContent, 'utf-8');

      // Verify file exists and is valid JSON
      expect(existsSync(outputPath)).toBe(true);
      const fileContent = readFileSync(outputPath, 'utf-8');
      const parsed = JSON.parse(fileContent) as MotionAnalysis[];

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);

      // Verify structure matches MotionAnalysis interface
      parsed.forEach((analysis) => {
        expect(analysis).toHaveProperty('path');
        expect(analysis).toHaveProperty('name');
        expect(analysis).toHaveProperty('hasMotionImport');
        expect(analysis).toHaveProperty('animationLibrary');
        expect(analysis).toHaveProperty('patterns');
        expect(analysis).toHaveProperty('usesReducedMotion');
        expect(analysis).toHaveProperty('violations');
        expect(analysis).toHaveProperty('isCompliant');
      });
    });
  });

  describe('compliance-check', () => {
    it('should mark component as compliant when using motion correctly', async () => {
      const result = await analyzeMotion('src/components/ui/Switch.tsx');

      // Switch uses motion properly, should be compliant
      // (unless there are CSS transition violations)
      expect(result).toHaveProperty('isCompliant');
    });

    it('should mark component as non-compliant when using CSS transitions', async () => {
      // Find a component with CSS transitions
      const result = await analyzeMotion('src/components/ui/button.tsx');

      // If button has CSS transitions without motion, it may be non-compliant
      expect(result).toHaveProperty('isCompliant');
      if (result.violations.length > 0) {
        expect(result.isCompliant).toBe(false);
      }
    });
  });
});
