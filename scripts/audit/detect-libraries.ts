/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Library Detection
 * @description Detects external UI library usage in components
 */

import { readFileSync, existsSync } from 'fs';
import { join, basename } from 'path';
import type {
  LibraryDetection,
  LibraryUsage,
  LibraryOverride,
  UILibrary,
  ComponentMetadata,
} from './types';

/**
 * Library detection patterns
 */
const LIBRARY_PATTERNS: Record<UILibrary, RegExp[]> = {
  'material-ui': [/from\s+['"]@mui\//, /from\s+['"]@material-ui\//, /from\s+['"]material-ui['"]/],
  'ant-design': [/from\s+['"]antd['"]/, /from\s+['"]antd\//, /from\s+['"]@ant-design\//],
  'chakra-ui': [/from\s+['"]@chakra-ui\//],
  'radix-ui': [/from\s+['"]@radix-ui\//],
  'headless-ui': [/from\s+['"]@headlessui\//],
  'react-bootstrap': [/from\s+['"]react-bootstrap['"]/, /from\s+['"]react-bootstrap\//],
  'semantic-ui': [/from\s+['"]semantic-ui-react['"]/, /from\s+['"]semantic-ui-react\//],
  blueprint: [/from\s+['"]@blueprintjs\//],
  mantine: [/from\s+['"]@mantine\//],
  other: [], // Catch-all, handled separately
};

/**
 * Override detection patterns
 */
const OVERRIDE_PATTERNS = {
  // Style overrides
  styleOverride: [
    /style\s*=\s*\{[^}]*override/gi,
    /sx\s*=\s*\{/g, // MUI sx prop
    /css\s*=\s*\{/g, // Emotion/styled css prop
    /\.override[A-Z]/g,
  ],
  // Class overrides
  classOverride: [
    /className\s*=\s*\{.*?\}/g,
    /classNames\s*=\s*\{/g, // Mantine pattern
    /classes\s*=\s*\{/g, // MUI pattern
    /!important/g,
  ],
  // Wrapper patterns
  wrapperComponent: [
    /styled\([A-Z]\w+\)/g, // styled(Component)
    /styled\.\w+/g, // styled.div
    /forwardRef.*\([A-Z]\w+/g, // forwardRef wrapping
  ],
  // Prop overrides
  propOverride: [
    /theme\s*=\s*\{/g,
    /overrides\s*=\s*\{/g,
    /components\s*=\s*\{/g, // MUI v5 component slots
    /slotProps\s*=\s*\{/g, // Radix slot props
  ],
};

/**
 * Detect libraries used in a single component
 */
export async function detectLibraries(componentPath: string): Promise<LibraryDetection> {
  const projectRoot = process.cwd();
  const fullPath = componentPath.startsWith('/') ? componentPath : join(projectRoot, componentPath);

  if (!existsSync(fullPath)) {
    throw new Error(`Component file not found: ${fullPath}`);
  }

  const content = readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');
  const componentName = extractComponentName(fullPath, content);

  // Detect library imports
  const libraries = detectLibraryImports(content, lines);
  const usesExternalLibrary = libraries.length > 0;

  // Detect overrides
  const overrides = detectOverrides(content, lines);
  const overrideCount = overrides.length;

  // Determine design system fit
  const fitsDesignSystem = calculateDesignSystemFit(usesExternalLibrary, overrideCount);

  // Determine if should be custom-built
  const shouldBeCustomBuilt = calculateShouldBeCustomBuilt(
    usesExternalLibrary,
    overrideCount,
    libraries
  );

  // Determine recommendation
  const recommendation = calculateRecommendation(
    usesExternalLibrary,
    overrideCount,
    fitsDesignSystem
  );

  return {
    componentPath,
    componentName,
    libraries,
    usesExternalLibrary,
    overrideCount,
    overrides,
    fitsDesignSystem,
    shouldBeCustomBuilt,
    recommendation,
  };
}

/**
 * Detect libraries in all components
 */
export async function detectAllLibraries(): Promise<LibraryDetection[]> {
  const outputPath = join(process.cwd(), 'scripts', 'audit', 'output', 'component-inventory.json');

  if (!existsSync(outputPath)) {
    throw new Error('component-inventory.json not found. Run component discovery first.');
  }

  const components: ComponentMetadata[] = JSON.parse(readFileSync(outputPath, 'utf-8'));
  const results: LibraryDetection[] = [];

  for (const component of components) {
    try {
      const detection = await detectLibraries(component.path);
      results.push(detection);
    } catch (error) {
      console.warn(`Failed to detect libraries in ${component.path}:`, error);
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

function detectLibraryImports(content: string, lines: string[]): LibraryUsage[] {
  const libraries: LibraryUsage[] = [];

  for (const [library, patterns] of Object.entries(LIBRARY_PATTERNS)) {
    if (library === 'other') continue;

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        // Find the import line
        const lineIndex = lines.findIndex((line) => pattern.test(line));
        if (lineIndex !== -1) {
          const importLine = lines[lineIndex];
          const importPath = extractImportPath(importLine);
          const imports = extractImportNames(importLine);

          libraries.push({
            library: library as UILibrary,
            importPath,
            imports,
            line: lineIndex + 1,
          });
        }
      }
    }
  }

  return libraries;
}

function extractImportPath(importLine: string): string {
  const match = importLine.match(/from\s+['"]([^'"]+)['"]/);
  return match ? match[1] : '';
}

function extractImportNames(importLine: string): string[] {
  const names: string[] = [];

  // Named imports: import { A, B } from ...
  const namedMatch = importLine.match(/\{\s*([^}]+)\s*\}/);
  if (namedMatch) {
    const namedImports = namedMatch[1].split(',').map((n) => n.trim().split(' as ')[0].trim());
    names.push(...namedImports);
  }

  // Default import: import A from ...
  const defaultMatch = importLine.match(/import\s+(\w+)/);
  if (defaultMatch && !importLine.includes('{')) {
    names.push(defaultMatch[1]);
  }

  return names.filter((n) => n.length > 0);
}

function detectOverrides(content: string, lines: string[]): LibraryOverride[] {
  const overrides: LibraryOverride[] = [];

  // Style overrides
  for (const pattern of OVERRIDE_PATTERNS.styleOverride) {
    const matches = findPatternMatches(content, lines, pattern);
    for (const match of matches) {
      overrides.push({
        type: 'style-override',
        description: `Style override: ${match.snippet}`,
        line: match.line,
      });
    }
  }

  // Class overrides
  for (const pattern of OVERRIDE_PATTERNS.classOverride) {
    const matches = findPatternMatches(content, lines, pattern);
    for (const match of matches) {
      // Don't count basic className as override
      if (match.snippet.includes('!important') || match.snippet.includes('classes=')) {
        overrides.push({
          type: 'class-override',
          description: `Class override: ${match.snippet}`,
          line: match.line,
        });
      }
    }
  }

  // Wrapper components
  for (const pattern of OVERRIDE_PATTERNS.wrapperComponent) {
    const matches = findPatternMatches(content, lines, pattern);
    for (const match of matches) {
      overrides.push({
        type: 'wrapper-component',
        description: `Wrapper pattern: ${match.snippet}`,
        line: match.line,
      });
    }
  }

  // Prop overrides
  for (const pattern of OVERRIDE_PATTERNS.propOverride) {
    const matches = findPatternMatches(content, lines, pattern);
    for (const match of matches) {
      overrides.push({
        type: 'prop-override',
        description: `Prop override: ${match.snippet}`,
        line: match.line,
      });
    }
  }

  return overrides;
}

interface PatternMatch {
  line: number;
  snippet: string;
}

function findPatternMatches(content: string, lines: string[], pattern: RegExp): PatternMatch[] {
  const matches: PatternMatch[] = [];

  lines.forEach((line, index) => {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    const match = pattern.exec(line);
    if (match) {
      matches.push({
        line: index + 1,
        snippet: match[0].substring(0, 50),
      });
    }
  });

  return matches;
}

function calculateDesignSystemFit(usesExternalLibrary: boolean, overrideCount: number): boolean {
  // No external library = fits design system
  if (!usesExternalLibrary) {
    return true;
  }

  // Low overrides = acceptable fit
  if (overrideCount <= 2) {
    return true;
  }

  // High overrides = poor fit
  return false;
}

function calculateShouldBeCustomBuilt(
  usesExternalLibrary: boolean,
  overrideCount: number,
  libraries: LibraryUsage[]
): boolean {
  // Already custom = no change needed
  if (!usesExternalLibrary) {
    return false;
  }

  // Many overrides = should be custom
  if (overrideCount > 3) {
    return true;
  }

  // Check for complex library usage
  const totalImports = libraries.reduce((sum, lib) => sum + lib.imports.length, 0);
  if (totalImports > 5 && overrideCount > 1) {
    return true;
  }

  return false;
}

function calculateRecommendation(
  usesExternalLibrary: boolean,
  overrideCount: number,
  fitsDesignSystem: boolean
): 'keep' | 'refactor' | 'replace' {
  // Custom components = keep
  if (!usesExternalLibrary) {
    return 'keep';
  }

  // Good fit = keep
  if (fitsDesignSystem && overrideCount <= 1) {
    return 'keep';
  }

  // Minor issues = refactor
  if (fitsDesignSystem || overrideCount <= 3) {
    return 'refactor';
  }

  // Major issues = replace
  return 'replace';
}
