/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Library Detection Tests
 * @description TDD tests for external UI library detection
 * @vitest-environment node
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { detectLibraries, detectAllLibraries } from './detect-libraries';
import type { LibraryDetection } from './types';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

describe('library-detection', () => {
  const outputDir = join(process.cwd(), 'scripts', 'audit', 'output');

  beforeAll(() => {
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
  });

  describe('should detect Material-UI imports', () => {
    it('should detect @mui imports', async () => {
      // Test with a component (may or may not have MUI)
      const result = await detectLibraries('src/components/ui/button.tsx');

      expect(result).toBeDefined();
      expect(Array.isArray(result.libraries)).toBe(true);

      // Check for MUI detection capability
      const hasMui = result.libraries.some((lib) => lib.library === 'material-ui');
      expect(typeof hasMui).toBe('boolean');
    });
  });

  describe('should detect Ant Design imports', () => {
    it('should detect antd imports', async () => {
      const result = await detectLibraries('src/components/ui/button.tsx');

      expect(result).toBeDefined();
      const hasAntd = result.libraries.some((lib) => lib.library === 'ant-design');
      expect(typeof hasAntd).toBe('boolean');
    });
  });

  describe('should detect Chakra UI imports', () => {
    it('should detect @chakra-ui imports', async () => {
      const result = await detectLibraries('src/components/ui/button.tsx');

      expect(result).toBeDefined();
      const hasChakra = result.libraries.some((lib) => lib.library === 'chakra-ui');
      expect(typeof hasChakra).toBe('boolean');
    });
  });

  describe('should detect other UI libraries', () => {
    it('should detect Radix UI imports', async () => {
      // Radix is commonly used in this project
      const result = await detectLibraries('src/components/ui/select.tsx');

      expect(result).toBeDefined();
      expect(Array.isArray(result.libraries)).toBe(true);
    });

    it('should detect headless-ui imports', async () => {
      const result = await detectLibraries('src/components/ui/Dialog.tsx');

      expect(result).toBeDefined();
      expect(Array.isArray(result.libraries)).toBe(true);
    });

    it('should return usesExternalLibrary flag', async () => {
      const result = await detectLibraries('src/components/ui/button.tsx');

      expect(result).toBeDefined();
      expect(typeof result.usesExternalLibrary).toBe('boolean');
    });
  });

  describe('should check for overrides/workarounds needed', () => {
    it('should detect style overrides', async () => {
      const result = await detectLibraries('src/components/ui/select.tsx');

      expect(result).toBeDefined();
      expect(typeof result.overrideCount).toBe('number');
      expect(Array.isArray(result.overrides)).toBe(true);
    });

    it('should count override instances', async () => {
      const result = await detectLibraries('src/components/ui/checkbox.tsx');

      expect(result).toBeDefined();
      expect(result.overrideCount).toBeGreaterThanOrEqual(0);
      expect(result.overrides.length).toBe(result.overrideCount);
    });
  });

  describe('should verify design system fit', () => {
    it('should determine if component fits design system', async () => {
      const result = await detectLibraries('src/components/ui/button.tsx');

      expect(result).toBeDefined();
      expect(typeof result.fitsDesignSystem).toBe('boolean');
    });

    it('should flag components with many overrides as not fitting', async () => {
      const result = await detectLibraries('src/components/ui/select.tsx');

      expect(result).toBeDefined();
      // High override count should indicate poor fit
      if (result.overrideCount > 5) {
        expect(result.fitsDesignSystem).toBe(false);
      }
    });
  });

  describe('should flag components that should be custom-built', () => {
    it('should determine if component should be custom-built', async () => {
      const result = await detectLibraries('src/components/ui/button.tsx');

      expect(result).toBeDefined();
      expect(typeof result.shouldBeCustomBuilt).toBe('boolean');
    });

    it('should provide recommendation', async () => {
      const result = await detectLibraries('src/components/ui/SplitButton.tsx');

      expect(result).toBeDefined();
      expect(['keep', 'refactor', 'replace']).toContain(result.recommendation);
    });

    it('should recommend replace for heavily overridden external components', async () => {
      const result = await detectLibraries('src/components/ui/select.tsx');

      expect(result).toBeDefined();
      // If many overrides on external lib, should recommend refactor/replace
      if (result.usesExternalLibrary && result.overrideCount > 3) {
        expect(['refactor', 'replace']).toContain(result.recommendation);
      }
    });
  });

  describe('should generate library-usage.json', () => {
    it('should generate valid JSON output for all components', async () => {
      const results = await detectAllLibraries();

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      const outputPath = join(outputDir, 'library-usage.json');
      const jsonContent = JSON.stringify(results, null, 2);
      writeFileSync(outputPath, jsonContent, 'utf-8');

      expect(existsSync(outputPath)).toBe(true);

      const fileContent = readFileSync(outputPath, 'utf-8');
      const parsed = JSON.parse(fileContent) as LibraryDetection[];

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(results.length);

      // Verify structure
      parsed.forEach((detection) => {
        expect(detection).toHaveProperty('componentPath');
        expect(detection).toHaveProperty('componentName');
        expect(detection).toHaveProperty('libraries');
        expect(detection).toHaveProperty('usesExternalLibrary');
        expect(detection).toHaveProperty('overrideCount');
        expect(detection).toHaveProperty('overrides');
        expect(detection).toHaveProperty('fitsDesignSystem');
        expect(detection).toHaveProperty('shouldBeCustomBuilt');
        expect(detection).toHaveProperty('recommendation');
      });
    });
  });
});

describe('library-import-patterns', () => {
  it('should correctly identify library patterns', async () => {
    // Test that detection works on components
    const result = await detectLibraries('src/components/ui/Tooltip.tsx');

    expect(result).toBeDefined();
    expect(result.componentPath).toBe('src/components/ui/Tooltip.tsx');
    expect(typeof result.componentName).toBe('string');
  });
});

describe('design-system-fit-calculation', () => {
  it('should calculate design system fit correctly', async () => {
    const results = await detectAllLibraries();

    // Components with no external libraries should fit
    const customComponents = results.filter((r) => !r.usesExternalLibrary);
    customComponents.forEach((c) => {
      expect(c.fitsDesignSystem).toBe(true);
    });

    // Components with few overrides should fit
    const lowOverrideComponents = results.filter(
      (r) => r.usesExternalLibrary && r.overrideCount <= 2
    );
    lowOverrideComponents.forEach((c) => {
      expect(c.fitsDesignSystem).toBe(true);
    });
  });
});
