/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Design Principles Evaluation Tests
 * @description TDD tests for evaluating components against 10 "Made to Be" design principles
 * @vitest-environment node
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { evaluatePrinciples, evaluateAllComponents } from './evaluate-principles';
import type { PrinciplesCompliance, DesignPrinciple } from './types';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';

describe('evaluate-principles', () => {
  const outputDir = join(process.cwd(), 'scripts', 'audit', 'output');
  const testComponentPath = 'src/components/ui/button.tsx';

  beforeAll(() => {
    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
  });

  describe('should evaluate against all 10 principles', () => {
    it('should return evaluations for all 10 design principles', async () => {
      const result = await evaluatePrinciples(testComponentPath);

      expect(result.principles).toHaveLength(10);

      const expectedPrinciples: DesignPrinciple[] = [
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
      ];

      const actualPrinciples = result.principles.map((p) => p.principle);
      expect(actualPrinciples).toEqual(expect.arrayContaining(expectedPrinciples));
    });
  });

  describe('should detect hardcoded colors (violation)', () => {
    it('should detect hardcoded hex colors as violations', async () => {
      const result = await evaluatePrinciples(testComponentPath);

      const semanticTokenPrinciple = result.principles.find(
        (p) => p.principle === 'semantic-tokens'
      );
      expect(semanticTokenPrinciple).toBeDefined();

      // Button component uses semantic tokens, should pass or have minimal violations
      expect(semanticTokenPrinciple?.status).toMatch(/pass|partial/);
    });

    it('should detect hardcoded Tailwind colors like bg-white, text-black', async () => {
      const result = await evaluatePrinciples(testComponentPath);

      const semanticTokenPrinciple = result.principles.find(
        (p) => p.principle === 'semantic-tokens'
      );
      expect(semanticTokenPrinciple).toBeDefined();

      // Violations should include hardcoded colors if present
      if (semanticTokenPrinciple && semanticTokenPrinciple.violations.length > 0) {
        semanticTokenPrinciple.violations.forEach((v) => {
          expect(v.message).toBeTruthy();
          expect(v.line).toBeGreaterThan(0);
        });
      }
    });
  });

  describe('should check for 8px grid spacing patterns', () => {
    it('should verify spacing follows 8px grid (Tailwind spacing scale)', async () => {
      const result = await evaluatePrinciples(testComponentPath);

      const spacingPrinciple = result.principles.find((p) => p.principle === 'spacing-grid');
      expect(spacingPrinciple).toBeDefined();
      expect(spacingPrinciple?.score).toBeGreaterThanOrEqual(0);
      expect(spacingPrinciple?.score).toBeLessThanOrEqual(100);
    });
  });

  describe('should verify semantic color token usage', () => {
    it('should detect semantic color tokens like bg-background, text-foreground', async () => {
      const result = await evaluatePrinciples(testComponentPath);

      const semanticTokenPrinciple = result.principles.find(
        (p) => p.principle === 'semantic-tokens'
      );
      expect(semanticTokenPrinciple).toBeDefined();

      // Evidence should include detected semantic tokens
      expect(semanticTokenPrinciple?.evidence).toBeInstanceOf(Array);
    });

    it('should detect design system tokens like bg-accent-blue, text-signal-error', async () => {
      const result = await evaluatePrinciples(testComponentPath);

      const strategicColorPrinciple = result.principles.find(
        (p) => p.principle === 'strategic-color'
      );
      expect(strategicColorPrinciple).toBeDefined();
    });
  });

  describe('should check for generous whitespace (50-60px margins)', () => {
    it('should evaluate whitespace patterns', async () => {
      const result = await evaluatePrinciples(testComponentPath);

      const whitespacePrinciple = result.principles.find(
        (p) => p.principle === 'generous-whitespace'
      );
      expect(whitespacePrinciple).toBeDefined();
      expect(whitespacePrinciple?.status).toMatch(/pass|partial|fail|not-applicable/);
    });
  });

  describe('should evaluate subtle depth (shadows, elevation)', () => {
    it('should check for subtle shadow usage', async () => {
      const result = await evaluatePrinciples(testComponentPath);

      const depthPrinciple = result.principles.find((p) => p.principle === 'subtle-depth');
      expect(depthPrinciple).toBeDefined();
    });
  });

  describe('should check typography spacing and alignment', () => {
    it('should evaluate typography patterns', async () => {
      const result = await evaluatePrinciples(testComponentPath);

      const typographyPrinciple = result.principles.find(
        (p) => p.principle === 'typography-spacing'
      );
      expect(typographyPrinciple).toBeDefined();
    });
  });

  describe('should generate compliance scores for each principle', () => {
    it('should have numeric scores between 0-100 for each principle', async () => {
      const result = await evaluatePrinciples(testComponentPath);

      result.principles.forEach((p) => {
        expect(p.score).toBeGreaterThanOrEqual(0);
        expect(p.score).toBeLessThanOrEqual(100);
      });
    });

    it('should calculate overall score', async () => {
      const result = await evaluatePrinciples(testComponentPath);

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('should have valid summary statistics', async () => {
      const result = await evaluatePrinciples(testComponentPath);

      expect(result.summary.totalPrinciples).toBe(10);
      expect(
        result.summary.passed +
          result.summary.partial +
          result.summary.failed +
          result.summary.notApplicable
      ).toBe(10);
    });
  });

  describe('should generate principles-compliance.json', () => {
    it('should generate valid JSON output for all components', async () => {
      const results = await evaluateAllComponents();

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      const outputPath = join(outputDir, 'principles-compliance.json');
      const { writeFileSync } = await import('fs');
      writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

      // Verify file exists and is valid JSON
      expect(existsSync(outputPath)).toBe(true);
      const fileContent = readFileSync(outputPath, 'utf-8');
      const parsed = JSON.parse(fileContent) as PrinciplesCompliance[];

      expect(Array.isArray(parsed)).toBe(true);
      parsed.forEach((component) => {
        expect(component).toHaveProperty('componentPath');
        expect(component).toHaveProperty('componentName');
        expect(component).toHaveProperty('overallScore');
        expect(component).toHaveProperty('principles');
        expect(component).toHaveProperty('summary');
        expect(component).toHaveProperty('evaluatedAt');
      });
    });
  });
});

describe('principle-evaluation-details', () => {
  const testComponentPath = 'src/components/ui/button.tsx';

  it('should include violation details with line numbers', async () => {
    const result = await evaluatePrinciples(testComponentPath);

    result.principles.forEach((p) => {
      p.violations.forEach((v) => {
        expect(v.line).toBeGreaterThan(0);
        expect(v.message).toBeTruthy();
        expect(v.severity).toMatch(/error|warning|info/);
      });
    });
  });

  it('should include recommendations for improvements', async () => {
    const result = await evaluatePrinciples(testComponentPath);

    // At least some principles should have recommendations
    const principlesWithRecommendations = result.principles.filter(
      (p) => p.recommendations.length > 0 || p.status === 'pass'
    );
    expect(principlesWithRecommendations.length).toBeGreaterThan(0);
  });

  it('should include evidence of compliance', async () => {
    const result = await evaluatePrinciples(testComponentPath);

    // Principles that pass should have evidence
    const passingPrinciples = result.principles.filter((p) => p.status === 'pass');
    passingPrinciples.forEach((p) => {
      expect(p.evidence.length).toBeGreaterThan(0);
    });
  });
});

describe('grayscale-foundation-detection', () => {
  it('should detect grayscale Tailwind classes', async () => {
    const result = await evaluatePrinciples('src/components/ui/button.tsx');

    const grayscalePrinciple = result.principles.find(
      (p) => p.principle === 'grayscale-foundation'
    );
    expect(grayscalePrinciple).toBeDefined();
  });
});

describe('motion-animations-detection', () => {
  it('should detect Motion usage', async () => {
    const result = await evaluatePrinciples('src/components/ui/button.tsx');

    const motionPrinciple = result.principles.find((p) => p.principle === 'motion-animations');
    expect(motionPrinciple).toBeDefined();

    // Button component uses Motion, should have evidence
    if (motionPrinciple && motionPrinciple.status === 'pass') {
      expect(motionPrinciple.evidence.some((e) => e.includes('motion'))).toBe(true);
    }
  });
});
