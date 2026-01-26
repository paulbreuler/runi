/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Implementation Checklist Audit Tests
 * @description TDD tests for auditing components against implementation checklist
 * @vitest-environment node
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { auditChecklist, auditAllComponents } from './checklist-audit';
import type { ChecklistAudit, ChecklistCategory } from './types';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';

describe('checklist-audit', () => {
  const outputDir = join(process.cwd(), 'scripts', 'audit', 'output');
  const testComponentPath = 'src/components/ui/button.tsx';

  beforeAll(() => {
    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
  });

  describe('should check all checklist categories', () => {
    it('should return audits for all checklist categories', async () => {
      const result = await auditChecklist(testComponentPath);

      const expectedCategories: ChecklistCategory[] = [
        'typescript',
        'react-patterns',
        'testing',
        'accessibility',
        'motion',
        'storybook',
        'documentation',
      ];

      const actualCategories = result.categories.map((c) => c.category);
      expect(actualCategories).toEqual(expect.arrayContaining(expectedCategories));
    });

    it('should have items in each category', async () => {
      const result = await auditChecklist(testComponentPath);

      result.categories.forEach((category) => {
        expect(category.items.length).toBeGreaterThan(0);
      });
    });
  });

  describe('should verify TypeScript types and interfaces', () => {
    it('should check for props interface', async () => {
      const result = await auditChecklist(testComponentPath);

      const typescriptCategory = result.categories.find((c) => c.category === 'typescript');
      expect(typescriptCategory).toBeDefined();

      const propsItem = typescriptCategory?.items.find((i) => i.id.includes('props-interface'));
      expect(propsItem).toBeDefined();
      // Button has ButtonProps interface
      expect(propsItem?.passed).toBe(true);
    });

    it('should check for explicit return types', async () => {
      const result = await auditChecklist(testComponentPath);

      const typescriptCategory = result.categories.find((c) => c.category === 'typescript');
      const returnTypeItem = typescriptCategory?.items.find((i) => i.id.includes('return-type'));
      expect(returnTypeItem).toBeDefined();
    });

    it('should check for no any types', async () => {
      const result = await auditChecklist(testComponentPath);

      const typescriptCategory = result.categories.find((c) => c.category === 'typescript');
      const noAnyItem = typescriptCategory?.items.find((i) => i.id.includes('no-any'));
      expect(noAnyItem).toBeDefined();
    });
  });

  describe('should check test coverage (≥85% requirement)', () => {
    it('should report test file existence', async () => {
      const result = await auditChecklist(testComponentPath);

      const testingCategory = result.categories.find((c) => c.category === 'testing');
      expect(testingCategory).toBeDefined();

      const testFileItem = testingCategory?.items.find((i) => i.id.includes('test-file'));
      expect(testFileItem).toBeDefined();
    });

    it('should note 85% coverage requirement', async () => {
      const result = await auditChecklist(testComponentPath);

      const testingCategory = result.categories.find((c) => c.category === 'testing');
      const coverageItem = testingCategory?.items.find((i) => i.id.includes('coverage'));
      expect(coverageItem).toBeDefined();
    });
  });

  describe('should validate Motion.dev usage patterns', () => {
    it('should check for motion/react import', async () => {
      const result = await auditChecklist(testComponentPath);

      const motionCategory = result.categories.find((c) => c.category === 'motion');
      expect(motionCategory).toBeDefined();

      const importItem = motionCategory?.items.find((i) => i.id.includes('motion-import'));
      expect(importItem).toBeDefined();
      // Button uses Motion
      expect(importItem?.passed).toBe(true);
    });

    it('should check for not using framer-motion', async () => {
      const result = await auditChecklist(testComponentPath);

      const motionCategory = result.categories.find((c) => c.category === 'motion');
      const noFramerItem = motionCategory?.items.find((i) => i.id.includes('no-framer'));
      expect(noFramerItem).toBeDefined();
    });
  });

  describe('should check React 19 and TypeScript 5.9 usage', () => {
    it('should check for functional components', async () => {
      const result = await auditChecklist(testComponentPath);

      const reactCategory = result.categories.find((c) => c.category === 'react-patterns');
      expect(reactCategory).toBeDefined();

      const functionalItem = reactCategory?.items.find((i) => i.id.includes('functional'));
      expect(functionalItem).toBeDefined();
    });

    it('should check for no class components', async () => {
      const result = await auditChecklist(testComponentPath);

      const reactCategory = result.categories.find((c) => c.category === 'react-patterns');
      const noClassItem = reactCategory?.items.find((i) => i.id.includes('no-class'));
      expect(noClassItem).toBeDefined();
    });
  });

  describe('should verify Storybook story existence (from #3)', () => {
    it('should check for story file', async () => {
      const result = await auditChecklist(testComponentPath);

      expect(result.hasStory).toBeDefined();

      const storybookCategory = result.categories.find((c) => c.category === 'storybook');
      expect(storybookCategory).toBeDefined();

      const storyFileItem = storybookCategory?.items.find((i) => i.id.includes('story-file'));
      expect(storyFileItem).toBeDefined();
    });
  });

  describe('should generate completion percentage per category', () => {
    it('should calculate completion percentage for each category', async () => {
      const result = await auditChecklist(testComponentPath);

      result.categories.forEach((category) => {
        expect(category.completionPercentage).toBeGreaterThanOrEqual(0);
        expect(category.completionPercentage).toBeLessThanOrEqual(100);
      });
    });

    it('should have accurate passed/failed counts', async () => {
      const result = await auditChecklist(testComponentPath);

      result.categories.forEach((category) => {
        expect(category.passed + category.failed).toBe(category.items.length);
      });
    });
  });

  describe('should generate checklist-report.json', () => {
    it('should generate valid JSON output for all components', async () => {
      const results = await auditAllComponents();

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      const outputPath = join(outputDir, 'checklist-report.json');
      const { writeFileSync } = await import('fs');
      writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

      // Verify file exists and is valid JSON
      expect(existsSync(outputPath)).toBe(true);
      const fileContent = readFileSync(outputPath, 'utf-8');
      const parsed = JSON.parse(fileContent) as ChecklistAudit[];

      expect(Array.isArray(parsed)).toBe(true);
      parsed.forEach((component) => {
        expect(component).toHaveProperty('componentPath');
        expect(component).toHaveProperty('componentName');
        expect(component).toHaveProperty('overallCompletion');
        expect(component).toHaveProperty('categories');
        expect(component).toHaveProperty('items');
        expect(component).toHaveProperty('summary');
        expect(component).toHaveProperty('hasStory');
        expect(component).toHaveProperty('auditedAt');
      });
    });
  });
});

describe('checklist-item-details', () => {
  const testComponentPath = 'src/components/ui/button.tsx';

  it('should include all item properties', async () => {
    const result = await auditChecklist(testComponentPath);

    result.items.forEach((item) => {
      expect(item.id).toBeTruthy();
      expect(item.category).toBeTruthy();
      expect(item.description).toBeTruthy();
      expect(typeof item.passed).toBe('boolean');
      expect(typeof item.required).toBe('boolean');
    });
  });

  it('should track required vs optional items', async () => {
    const result = await auditChecklist(testComponentPath);

    const requiredItems = result.items.filter((i) => i.required);
    const optionalItems = result.items.filter((i) => !i.required);

    expect(requiredItems.length).toBeGreaterThan(0);
    expect(requiredItems.length + optionalItems.length).toBe(result.items.length);
  });
});

describe('accessibility-checklist', () => {
  it('should check for ARIA attributes', async () => {
    const result = await auditChecklist('src/components/ui/button.tsx');

    const a11yCategory = result.categories.find((c) => c.category === 'accessibility');
    expect(a11yCategory).toBeDefined();
  });

  it('should check for keyboard navigation', async () => {
    const result = await auditChecklist('src/components/ui/button.tsx');

    const a11yCategory = result.categories.find((c) => c.category === 'accessibility');
    const keyboardItem = a11yCategory?.items.find((i) => i.id.includes('keyboard'));
    expect(keyboardItem).toBeDefined();
  });
});

describe('overall-summary', () => {
  it('should calculate overall completion percentage', async () => {
    const result = await auditChecklist('src/components/ui/button.tsx');

    expect(result.overallCompletion).toBeGreaterThanOrEqual(0);
    expect(result.overallCompletion).toBeLessThanOrEqual(100);
  });

  it('should have consistent summary statistics', async () => {
    const result = await auditChecklist('src/components/ui/button.tsx');

    expect(result.summary.passed + result.summary.failed).toBe(result.summary.totalItems);
    expect(result.summary.requiredPassed + result.summary.requiredFailed).toBeLessThanOrEqual(
      result.summary.totalItems
    );
  });
});
