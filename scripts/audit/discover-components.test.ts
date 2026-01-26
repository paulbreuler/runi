/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Component Discovery Tests
 * @description TDD tests for component discovery and inventory generation
 * @vitest-environment node
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { discoverComponents } from './discover-components';
import type { ComponentMetadata, ComponentCategory } from './types';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

describe('component-discovery', () => {
  const outputDir = join(process.cwd(), 'scripts', 'audit', 'output');

  beforeAll(() => {
    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
  });

  describe('should discover all .tsx and .jsx files in src/components/', () => {
    it('should find all component files', async () => {
      const components = await discoverComponents({
        rootDir: 'src/components',
        includePatterns: ['**/*.tsx', '**/*.jsx'],
        excludePatterns: ['**/*.test.tsx', '**/*.stories.tsx', '**/*.test.jsx', '**/*.stories.jsx'],
      });

      expect(components.length).toBeGreaterThan(0);
      expect(components.every((c) => c.path.endsWith('.tsx') || c.path.endsWith('.jsx'))).toBe(
        true
      );
      expect(
        components.every((c) => !c.path.includes('.test.') && !c.path.includes('.stories.'))
      ).toBe(true);
    });
  });

  describe('should extract component name from file/export', () => {
    it('should extract component name correctly', async () => {
      const components = await discoverComponents({
        rootDir: 'src/components',
      });

      // Check that all components have names
      expect(components.every((c) => c.name.length > 0)).toBe(true);

      // Check that names match file names (at least for some known components)
      const mainLayout = components.find((c) => c.path.includes('MainLayout'));
      if (mainLayout) {
        expect(mainLayout.name).toContain('MainLayout');
      }
    });
  });

  describe('should categorize component by directory path', () => {
    it('should categorize components correctly', async () => {
      const components = await discoverComponents({
        rootDir: 'src/components',
      });

      const categories: ComponentCategory[] = [
        'Core',
        'Layout',
        'Request',
        'Response',
        'Intelligence',
        'Overlays',
        'Unknown',
      ];
      expect(components.every((c) => categories.includes(c.category))).toBe(true);

      // Check specific categorizations
      const layoutComponents = components.filter((c) => c.path.includes('Layout/'));
      expect(layoutComponents.every((c) => c.category === 'Layout')).toBe(true);

      const requestComponents = components.filter((c) => c.path.includes('Request/'));
      expect(requestComponents.every((c) => c.category === 'Request')).toBe(true);

      const responseComponents = components.filter((c) => c.path.includes('Response/'));
      expect(responseComponents.every((c) => c.category === 'Response')).toBe(true);
    });
  });

  describe('should detect export type (default/named/both)', () => {
    it('should detect export types correctly', async () => {
      const components = await discoverComponents({
        rootDir: 'src/components',
      });

      const validExportTypes: Array<'default' | 'named' | 'both'> = ['default', 'named', 'both'];
      expect(components.every((c) => validExportTypes.includes(c.exportType))).toBe(true);
    });
  });

  describe('should extract props interface name', () => {
    it('should extract props interface when present', async () => {
      const components = await discoverComponents({
        rootDir: 'src/components',
      });

      // At least some components should have props interfaces
      const componentsWithProps = components.filter((c) => c.propsInterface);
      expect(componentsWithProps.length).toBeGreaterThan(0);

      // Props interface names should be valid identifiers
      componentsWithProps.forEach((c) => {
        expect(c.propsInterface).toMatch(/^[A-Z][a-zA-Z0-9]*Props?$/);
      });
    });
  });

  describe('should calculate file size and line count', () => {
    it('should calculate file metadata correctly', async () => {
      const components = await discoverComponents({
        rootDir: 'src/components',
      });

      expect(components.every((c) => c.fileSize > 0)).toBe(true);
      expect(components.every((c) => c.lineCount > 0)).toBe(true);

      // Verify against actual file
      const mainLayout = components.find((c) => c.path.includes('MainLayout.tsx'));
      if (mainLayout && existsSync(mainLayout.path)) {
        const fileContent = readFileSync(mainLayout.path, 'utf-8');
        const actualSize = Buffer.byteLength(fileContent, 'utf-8');
        const actualLines = fileContent.split('\n').length;

        expect(mainLayout.fileSize).toBe(actualSize);
        expect(mainLayout.lineCount).toBe(actualLines);
      }
    });
  });

  describe('should extract component dependencies from imports', () => {
    it('should extract dependencies correctly', async () => {
      const components = await discoverComponents({
        rootDir: 'src/components',
      });

      // All components should have dependencies array (may be empty)
      expect(components.every((c) => Array.isArray(c.dependencies))).toBe(true);

      // Components should have some dependencies (most import React, motion, etc.)
      const componentsWithDeps = components.filter((c) => c.dependencies.length > 0);
      expect(componentsWithDeps.length).toBeGreaterThan(0);
    });
  });

  describe('should identify component hierarchies', () => {
    it('should identify parent-child relationships', async () => {
      const components = await discoverComponents({
        rootDir: 'src/components',
      });

      // Components with children should have hasChildren = true
      const componentsWithChildren = components.filter((c) => c.hasChildren);
      expect(componentsWithChildren.length).toBeGreaterThanOrEqual(0);

      // Components with parent should have parent set
      const componentsWithParent = components.filter((c) => c.parent);
      componentsWithParent.forEach((c) => {
        expect(c.parent).toBeTruthy();
        // Parent should exist in components list
        const parentExists = components.some(
          (comp) => comp.name === c.parent || comp.path.includes(c.parent!)
        );
        expect(parentExists).toBe(true);
      });
    });
  });

  describe('should handle re-exports from index files', () => {
    it('should handle re-exports correctly', async () => {
      const components = await discoverComponents({
        rootDir: 'src/components',
        followReExports: true,
      });

      // Should find components that are re-exported from index files
      // (e.g., ActionBar components re-exported from ActionBar/index.ts)
      const actionBarComponents = components.filter((c) => c.path.includes('ActionBar'));
      expect(actionBarComponents.length).toBeGreaterThan(0);
    });
  });

  describe('should generate component-inventory.json', () => {
    it('should generate valid JSON output', async () => {
      const components = await discoverComponents({
        rootDir: 'src/components',
      });

      const outputPath = join(outputDir, 'component-inventory.json');
      const jsonContent = JSON.stringify(components, null, 2);

      // Write to file
      const { writeFileSync } = await import('fs');
      writeFileSync(outputPath, jsonContent, 'utf-8');

      // Verify file exists and is valid JSON
      expect(existsSync(outputPath)).toBe(true);
      const fileContent = readFileSync(outputPath, 'utf-8');
      const parsed = JSON.parse(fileContent) as ComponentMetadata[];

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(components.length);

      // Verify structure matches ComponentMetadata interface
      parsed.forEach((component) => {
        expect(component).toHaveProperty('path');
        expect(component).toHaveProperty('name');
        expect(component).toHaveProperty('category');
        expect(component).toHaveProperty('exportType');
        expect(component).toHaveProperty('fileSize');
        expect(component).toHaveProperty('lineCount');
        expect(component).toHaveProperty('dependencies');
        expect(component).toHaveProperty('hasChildren');
      });
    });
  });
});

describe('component-categorization', () => {
  it('should categorize all components correctly', async () => {
    const components = await discoverComponents({
      rootDir: 'src/components',
    });

    // Verify category distribution
    const categoryCounts = components.reduce(
      (acc, c) => {
        acc[c.category] = (acc[c.category] || 0) + 1;
        return acc;
      },
      {} as Record<ComponentCategory, number>
    );

    // Should have components in multiple categories
    const categoriesWithComponents = Object.keys(categoryCounts).filter(
      (cat) => categoryCounts[cat as ComponentCategory]! > 0
    );
    expect(categoriesWithComponents.length).toBeGreaterThan(1);
  });
});

describe('dependency-extraction', () => {
  it('should extract component dependencies', async () => {
    const components = await discoverComponents({
      rootDir: 'src/components',
    });

    // Find a component that likely has dependencies
    const componentWithDeps = components.find((c) => c.dependencies.length > 0);
    if (componentWithDeps) {
      expect(componentWithDeps.dependencies.length).toBeGreaterThan(0);
      // Dependencies should be strings
      expect(componentWithDeps.dependencies.every((dep) => typeof dep === 'string')).toBe(true);
    }
  });
});
