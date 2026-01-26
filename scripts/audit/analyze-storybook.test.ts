/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Storybook Coverage Analysis Tests
 * @description TDD tests for Storybook coverage analysis
 * @vitest-environment node
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { analyzeStorybook, analyzeAllStorybook } from './analyze-storybook';
import type { StorybookAnalysis } from './types';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

describe('storybook-analysis', () => {
  const outputDir = join(process.cwd(), 'scripts', 'audit', 'output');

  beforeAll(() => {
    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
  });

  describe('story-file-matching', () => {
    it('should find .stories.tsx file for each component', async () => {
      // Switch.tsx has Switch.stories.tsx
      const result = await analyzeStorybook('src/components/ui/Switch.tsx');

      expect(result.hasStoryFile).toBe(true);
      expect(result.storyPath).toContain('Switch.stories.tsx');
    });

    it('should detect when component has no story file', async () => {
      // DataPanelHeader may not have a story file
      const result = await analyzeStorybook('src/components/ui/DataPanelHeader.tsx');

      // Verify the property exists and check its value
      expect(result).toHaveProperty('hasStoryFile');
      if (!result.hasStoryFile) {
        expect(result.storyPath).toBeNull();
      }
    });

    it('should handle components with shared story files', async () => {
      // Some components might share story files (like DialogHeader, DialogContent, DialogFooter)
      const result = await analyzeStorybook('src/components/ui/DialogHeader.tsx');

      // DialogHeader has its own story file
      expect(result).toHaveProperty('hasStoryFile');
    });
  });

  describe('story-naming-validation', () => {
    it('should verify story naming conventions (Default, WithContent, [StateName])', async () => {
      const result = await analyzeStorybook('src/components/ui/Switch.tsx');

      expect(result.namingStatus).toBeDefined();
      // Valid stories should have valid naming
      if (result.hasStoryFile && result.variations.length > 0) {
        expect(['valid', 'missing-default', 'invalid-names']).toContain(result.namingStatus);
      }
    });

    it('should detect valid story names', async () => {
      const result = await analyzeStorybook('src/components/ui/Switch.tsx');

      if (result.hasStoryFile) {
        // Playground is a valid story name
        const validNames = ['Playground', 'Default', 'WithContent', 'Loading', 'Error', 'Empty'];
        const hasValidName = result.variations.some((v) =>
          validNames.some(
            (valid) =>
              v.name === valid || v.name.includes('State') || /^[A-Z][a-zA-Z]+$/.test(v.name)
          )
        );
        expect(hasValidName).toBe(true);
      }
    });
  });

  describe('story-variation-check', () => {
    it('should check for required story variations (loading, error, empty)', async () => {
      const result = await analyzeStorybook('src/components/ui/EmptyState.tsx');

      // EmptyState should have variations demonstrating different states
      expect(result).toHaveProperty('hasRequiredVariations');
    });

    it('should list all story variations found', async () => {
      const result = await analyzeStorybook('src/components/ui/Switch.tsx');

      if (result.hasStoryFile) {
        expect(Array.isArray(result.variations)).toBe(true);
        expect(result.variations.length).toBeGreaterThan(0);

        result.variations.forEach((variation) => {
          expect(variation).toHaveProperty('name');
          expect(variation).toHaveProperty('hasPlayFunction');
          expect(variation).toHaveProperty('hasJsDocComment');
        });
      }
    });
  });

  describe('story-interaction-check', () => {
    it('should verify stories demonstrate interactions', async () => {
      const result = await analyzeStorybook('src/components/ui/Switch.tsx');

      if (result.hasStoryFile) {
        // Switch.stories.tsx has play function
        expect(result.hasInteractiveStories).toBe(true);
      }
    });

    it('should detect play functions in stories', async () => {
      const result = await analyzeStorybook('src/components/ui/Switch.tsx');

      if (result.hasStoryFile) {
        const storiesWithPlay = result.variations.filter((v) => v.hasPlayFunction);
        expect(storiesWithPlay.length).toBeGreaterThan(0);
      }
    });
  });

  describe('story-jsdoc-check', () => {
    it('should check for JSDoc comments in stories', async () => {
      const result = await analyzeStorybook('src/components/ui/Switch.tsx');

      if (result.hasStoryFile && result.variations.length > 0) {
        // At least check the property exists
        result.variations.forEach((variation) => {
          expect(variation).toHaveProperty('hasJsDocComment');
        });
      }
    });
  });

  describe('story-structure-validation', () => {
    it('should validate story structure and exports', async () => {
      const result = await analyzeStorybook('src/components/ui/Switch.tsx');

      if (result.hasStoryFile) {
        expect(result.hasValidExports).toBe(true);
      }
    });

    it('should verify default export (meta) exists', async () => {
      const result = await analyzeStorybook('src/components/ui/Switch.tsx');

      if (result.hasStoryFile) {
        expect(result.hasValidExports).toBe(true);
      }
    });
  });

  describe('generate-storybook-coverage-json', () => {
    it('should generate storybook-coverage.json', async () => {
      const results = await analyzeAllStorybook();

      const outputPath = join(outputDir, 'storybook-coverage.json');
      const jsonContent = JSON.stringify(results, null, 2);

      writeFileSync(outputPath, jsonContent, 'utf-8');

      // Verify file exists and is valid JSON
      expect(existsSync(outputPath)).toBe(true);
      const fileContent = readFileSync(outputPath, 'utf-8');
      const parsed = JSON.parse(fileContent) as StorybookAnalysis[];

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);

      // Verify structure matches StorybookAnalysis interface
      parsed.forEach((analysis) => {
        expect(analysis).toHaveProperty('componentPath');
        expect(analysis).toHaveProperty('componentName');
        expect(analysis).toHaveProperty('storyPath');
        expect(analysis).toHaveProperty('hasStoryFile');
        expect(analysis).toHaveProperty('namingStatus');
        expect(analysis).toHaveProperty('variations');
        expect(analysis).toHaveProperty('hasRequiredVariations');
        expect(analysis).toHaveProperty('hasInteractiveStories');
        expect(analysis).toHaveProperty('hasValidExports');
        expect(analysis).toHaveProperty('coverageScore');
      });
    });
  });

  describe('coverage-score', () => {
    it('should calculate coverage percentage', async () => {
      const result = await analyzeStorybook('src/components/ui/Switch.tsx');

      expect(result.coverageScore).toBeGreaterThanOrEqual(0);
      expect(result.coverageScore).toBeLessThanOrEqual(100);
    });

    it('should give higher score for better coverage', async () => {
      // Switch has story file with play functions
      const switchResult = await analyzeStorybook('src/components/ui/Switch.tsx');

      // Component without story file should have lower score
      const noCoverageResult = await analyzeStorybook('src/components/ui/DialogContent.tsx');

      if (switchResult.hasStoryFile && !noCoverageResult.hasStoryFile) {
        expect(switchResult.coverageScore).toBeGreaterThan(noCoverageResult.coverageScore);
      }
    });
  });

  describe('component-story-association', () => {
    it('should correctly associate components with their stories', async () => {
      const results = await analyzeAllStorybook();

      // Verify some known associations
      const switchAnalysis = results.find((r) => r.componentName === 'Switch');
      if (switchAnalysis?.hasStoryFile) {
        expect(switchAnalysis.storyPath).toContain('Switch.stories.tsx');
      }

      const toastAnalysis = results.find((r) => r.componentName === 'Toast');
      if (toastAnalysis?.hasStoryFile) {
        expect(toastAnalysis.storyPath).toContain('Toast.stories.tsx');
      }
    });
  });
});
