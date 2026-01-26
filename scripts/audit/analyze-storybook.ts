/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Storybook Coverage Analysis
 * @description Analyzes components for Storybook coverage and story quality
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { glob } from 'glob';
import * as ts from 'typescript';
import { discoverComponents } from './discover-components';
import type { StorybookAnalysis, StoryVariation, StoryNamingStatus } from './types';

/**
 * Valid story name patterns
 */
const VALID_STORY_NAMES = [
  'Playground',
  'Default',
  'WithContent',
  'Loading',
  'Error',
  'Empty',
  'Disabled',
  'Selected',
  'Expanded',
  'Collapsed',
  'Active',
  'Inactive',
  'Hover',
  'Focus',
];

/**
 * Required variation types for comprehensive coverage
 */
const REQUIRED_VARIATIONS = ['Loading', 'Error', 'Empty'];

/**
 * Extract component name from file path
 */
function extractComponentName(filePath: string): string {
  const fileName = basename(filePath, /\.(tsx|jsx|ts|js)$/.exec(filePath)?.[0] || '');
  return fileName;
}

/**
 * Find story file for a component
 */
async function findStoryFile(componentPath: string): Promise<string | null> {
  const projectRoot = process.cwd();
  const componentDir = dirname(join(projectRoot, componentPath));
  const componentName = extractComponentName(componentPath);

  // Try common story file patterns
  const patterns = [
    join(componentDir, `${componentName}.stories.tsx`),
    join(componentDir, `${componentName}.stories.ts`),
    join(componentDir, `${componentName}.stories.jsx`),
    join(componentDir, `${componentName}.stories.js`),
  ];

  for (const pattern of patterns) {
    if (existsSync(pattern)) {
      return pattern.replace(projectRoot + '/', '').replace(projectRoot + '\\', '');
    }
  }

  // Try to find any story file that might contain this component
  const storyFiles = await glob('**/*.stories.{tsx,ts,jsx,js}', {
    cwd: componentDir,
    absolute: true,
  });

  for (const storyFile of storyFiles) {
    const content = readFileSync(storyFile, 'utf-8');
    // Check if this story file imports the component
    if (
      content.includes(`from './${componentName}'`) ||
      content.includes(`from "./${componentName}"`) ||
      content.includes(`/${componentName}'`) ||
      content.includes(`/${componentName}"`)
    ) {
      return storyFile.replace(projectRoot + '/', '').replace(projectRoot + '\\', '');
    }
  }

  return null;
}

/**
 * Extract story variations from story file
 */
function extractStoryVariations(content: string, sourceFile: ts.SourceFile): StoryVariation[] {
  const variations: StoryVariation[] = [];
  const lines = content.split('\n');

  function visit(node: ts.Node): void {
    // Look for exported const declarations that are Story objects
    if (
      ts.isVariableStatement(node) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      node.declarationList.declarations.forEach((decl) => {
        if (ts.isIdentifier(decl.name)) {
          const storyName = decl.name.text;

          // Skip 'default' and 'meta' exports
          if (storyName === 'default' || storyName === 'meta') {
            return;
          }

          // Check if it's a Story type
          if (
            decl.type &&
            ((ts.isTypeReferenceNode(decl.type) &&
              ts.isIdentifier(decl.type.typeName) &&
              decl.type.typeName.text === 'Story') ||
              // StoryObj<typeof meta>
              (ts.isTypeReferenceNode(decl.type) &&
                ts.isIdentifier(decl.type.typeName) &&
                decl.type.typeName.text === 'StoryObj'))
          ) {
            // Check for play function
            let hasPlayFunction = false;
            if (decl.initializer && ts.isObjectLiteralExpression(decl.initializer)) {
              decl.initializer.properties.forEach((prop) => {
                if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
                  if (prop.name.text === 'play') {
                    hasPlayFunction = true;
                  }
                }
              });
            }

            // Check for JSDoc comment
            const startLine = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line;
            let hasJsDocComment = false;
            for (let i = startLine - 1; i >= 0 && i >= startLine - 10; i--) {
              const line = lines[i]?.trim() || '';
              if (line.startsWith('/**') || line.startsWith('*') || line.startsWith('*/')) {
                hasJsDocComment = true;
                break;
              }
              if (line.length > 0 && !line.startsWith('//')) {
                break;
              }
            }

            variations.push({
              name: storyName,
              hasPlayFunction,
              hasJsDocComment,
            });
          }
        }
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  // If no typed stories found, try simpler pattern matching
  if (variations.length === 0) {
    // Match export const StoryName: Story = { ... }
    const storyPattern = /export\s+const\s+(\w+)\s*:\s*Story(?:Obj)?[^=]*=\s*\{/g;
    let match;
    while ((match = storyPattern.exec(content)) !== null) {
      const storyName = match[1];
      if (storyName && storyName !== 'default' && storyName !== 'meta') {
        // Find the story object and check for play function
        const storyStart = match.index;
        const storySection = content.slice(storyStart, storyStart + 2000);
        const hasPlayFunction = /play\s*:\s*async/.test(storySection);

        // Check for JSDoc
        const beforeStory = content.slice(Math.max(0, storyStart - 500), storyStart);
        const hasJsDocComment = /\/\*\*[\s\S]*?\*\/\s*$/.test(beforeStory);

        variations.push({
          name: storyName,
          hasPlayFunction,
          hasJsDocComment,
        });
      }
    }
  }

  return variations;
}

/**
 * Determine story naming status
 */
function determineNamingStatus(variations: StoryVariation[]): StoryNamingStatus {
  if (variations.length === 0) {
    return 'missing-default';
  }

  const hasPlayground = variations.some((v) => v.name === 'Playground');
  const hasDefault = variations.some((v) => v.name === 'Default');

  if (!hasPlayground && !hasDefault) {
    // Check if all names are valid PascalCase
    const allValid = variations.every((v) => /^[A-Z][a-zA-Z0-9]*$/.test(v.name));
    if (!allValid) {
      return 'invalid-names';
    }
  }

  return 'valid';
}

/**
 * Check for required variations
 */
function hasRequiredVariations(variations: StoryVariation[], componentName: string): boolean {
  // Some components don't need loading/error/empty states
  const exemptComponents = ['Button', 'Label', 'Switch', 'Checkbox', 'Input', 'Select'];

  if (exemptComponents.some((exempt) => componentName.includes(exempt))) {
    return true;
  }

  // For data-displaying components, check for at least one state variation
  const hasStateVariation = variations.some(
    (v) =>
      REQUIRED_VARIATIONS.some((req) => v.name.includes(req)) ||
      v.name.includes('State') ||
      v.name.includes('Variation')
  );

  return hasStateVariation || variations.length >= 2;
}

/**
 * Check if story file has valid exports
 */
function hasValidExports(content: string, sourceFile: ts.SourceFile): boolean {
  let hasDefaultExport = false;
  let hasMetaOrMeta = false;

  function visit(node: ts.Node): void {
    // Check for default export
    if (ts.isExportAssignment(node) && !node.isExportEquals) {
      hasDefaultExport = true;
    }

    // Check for 'export default meta'
    if (ts.isExportAssignment(node) && ts.isIdentifier(node.expression)) {
      if (node.expression.text === 'meta') {
        hasMetaOrMeta = true;
      }
    }

    // Check for 'const meta = { ... } satisfies Meta'
    if (ts.isVariableStatement(node)) {
      node.declarationList.declarations.forEach((decl) => {
        if (ts.isIdentifier(decl.name) && decl.name.text === 'meta') {
          hasMetaOrMeta = true;
        }
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return hasDefaultExport || hasMetaOrMeta;
}

/**
 * Calculate coverage score for a component
 */
function calculateCoverageScore(
  hasStoryFile: boolean,
  variations: StoryVariation[],
  hasInteractive: boolean,
  hasValidExportsFlag: boolean,
  hasRequiredVariationsFlag: boolean
): number {
  if (!hasStoryFile) {
    return 0;
  }

  let score = 20; // Base score for having a story file

  // Points for valid exports
  if (hasValidExportsFlag) {
    score += 10;
  }

  // Points for variations
  const variationPoints = Math.min(variations.length * 10, 30);
  score += variationPoints;

  // Points for interactive stories (play functions)
  if (hasInteractive) {
    score += 20;
  }

  // Points for required variations
  if (hasRequiredVariationsFlag) {
    score += 10;
  }

  // Points for JSDoc comments
  const docsPoints = variations.filter((v) => v.hasJsDocComment).length * 5;
  score += Math.min(docsPoints, 10);

  return Math.min(score, 100);
}

/**
 * Analyze a single component for Storybook coverage
 */
export async function analyzeStorybook(componentPath: string): Promise<StorybookAnalysis> {
  const projectRoot = process.cwd();
  const fullPath = join(projectRoot, componentPath);

  if (!existsSync(fullPath)) {
    throw new Error(`Component file does not exist: ${fullPath}`);
  }

  const componentName = extractComponentName(componentPath);
  const storyPath = await findStoryFile(componentPath);
  const hasStoryFile = storyPath !== null;

  let variations: StoryVariation[] = [];
  let namingStatus: StoryNamingStatus = 'missing-default';
  let hasInteractiveStories = false;
  let hasValidExportsFlag = false;
  let hasRequiredVariationsFlag = false;

  if (hasStoryFile && storyPath) {
    const storyFullPath = join(projectRoot, storyPath);
    const content = readFileSync(storyFullPath, 'utf-8');

    // Create TypeScript source file
    const sourceFile = ts.createSourceFile(
      storyFullPath,
      content,
      ts.ScriptTarget.Latest,
      true,
      storyFullPath.endsWith('.tsx') || storyFullPath.endsWith('.jsx')
        ? ts.ScriptKind.TSX
        : ts.ScriptKind.TS
    );

    variations = extractStoryVariations(content, sourceFile);
    namingStatus = determineNamingStatus(variations);
    hasInteractiveStories = variations.some((v) => v.hasPlayFunction);
    hasValidExportsFlag = hasValidExports(content, sourceFile);
    hasRequiredVariationsFlag = hasRequiredVariations(variations, componentName);
  }

  const coverageScore = calculateCoverageScore(
    hasStoryFile,
    variations,
    hasInteractiveStories,
    hasValidExportsFlag,
    hasRequiredVariationsFlag
  );

  return {
    componentPath,
    componentName,
    storyPath,
    hasStoryFile,
    namingStatus,
    variations,
    hasRequiredVariations: hasRequiredVariationsFlag,
    hasInteractiveStories,
    hasValidExports: hasValidExportsFlag,
    coverageScore,
  };
}

/**
 * Analyze all components for Storybook coverage
 */
export async function analyzeAllStorybook(): Promise<StorybookAnalysis[]> {
  const components = await discoverComponents({
    rootDir: 'src/components',
    includePatterns: ['**/*.tsx', '**/*.jsx'],
    excludePatterns: ['**/*.test.tsx', '**/*.stories.tsx', '**/*.test.jsx', '**/*.stories.jsx'],
  });

  const results: StorybookAnalysis[] = [];

  for (const component of components) {
    try {
      const analysis = await analyzeStorybook(component.path);
      results.push(analysis);
    } catch (error) {
      console.warn(`Failed to analyze storybook for ${component.path}:`, error);
    }
  }

  return results;
}
