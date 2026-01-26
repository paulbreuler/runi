/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Component Discovery
 * @description Discovers and catalogs all React components in the codebase
 */

import { readFileSync, statSync, existsSync } from 'fs';
import { join, relative, dirname, basename } from 'path';
import { glob } from 'glob';
import * as ts from 'typescript';
import type { ComponentMetadata, ComponentCategory, DiscoveryOptions } from './types';

/**
 * Default discovery options
 */
const DEFAULT_OPTIONS: Required<DiscoveryOptions> = {
  rootDir: 'src/components',
  includePatterns: ['**/*.tsx', '**/*.jsx'],
  excludePatterns: ['**/*.test.tsx', '**/*.stories.tsx', '**/*.test.jsx', '**/*.stories.jsx'],
  followReExports: false,
};

/**
 * Categorize component based on directory path
 */
function categorizeComponent(path: string): ComponentCategory {
  const normalizedPath = path.replace(/\\/g, '/');

  if (normalizedPath.includes('/Layout/')) {
    return 'Layout';
  }
  if (normalizedPath.includes('/Request/')) {
    return 'Request';
  }
  if (normalizedPath.includes('/Response/')) {
    return 'Response';
  }
  if (normalizedPath.includes('/Intelligence/') || normalizedPath.includes('/History/')) {
    return 'Intelligence';
  }
  if (normalizedPath.includes('/ui/') || normalizedPath.includes('/Overlays/')) {
    return 'Overlays';
  }
  if (
    normalizedPath.includes('/Core/') ||
    normalizedPath.includes('/DataGrid/') ||
    normalizedPath.includes('/ActionBar/')
  ) {
    return 'Core';
  }

  return 'Unknown';
}

/**
 * Extract component name from file path and exports
 */
function extractComponentName(filePath: string, sourceFile: ts.SourceFile): string {
  // Try to find exported component name
  let componentName: string | undefined;

  function visit(node: ts.Node): void {
    // Check for default export
    if (ts.isExportAssignment(node) && node.isExportEquals === false) {
      if (ts.isIdentifier(node.expression)) {
        componentName = node.expression.text;
      }
    }

    // Check for named export of function/const
    if (
      ts.isVariableStatement(node) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      node.declarationList.declarations.forEach((decl) => {
        if (ts.isIdentifier(decl.name)) {
          componentName = decl.name.text;
        }
      });
    }

    if (
      ts.isFunctionDeclaration(node) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      if (node.name) {
        componentName = node.name.text;
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  // Fallback to file name
  if (!componentName) {
    const fileName = basename(filePath, /\.(tsx|jsx)$/.exec(filePath)?.[0] || '');
    componentName = fileName;
  }

  return componentName;
}

/**
 * Detect export type (default, named, both)
 */
function detectExportType(sourceFile: ts.SourceFile): 'default' | 'named' | 'both' {
  let hasDefault = false;
  let hasNamed = false;

  function visit(node: ts.Node): void {
    if (ts.isExportAssignment(node) && !node.isExportEquals) {
      hasDefault = true;
    }
    if (ts.isExportDeclaration(node) && !node.exportClause) {
      hasDefault = true;
    }
    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      hasNamed = true;
    }
    if (
      (ts.isVariableStatement(node) ||
        ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node)) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      if (node.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) {
        hasDefault = true;
      } else {
        hasNamed = true;
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (hasDefault && hasNamed) return 'both';
  if (hasDefault) return 'default';
  return 'named';
}

/**
 * Extract props interface name
 */
function extractPropsInterface(sourceFile: ts.SourceFile): string | undefined {
  let propsInterface: string | undefined;

  function visit(node: ts.Node): void {
    // Look for interface definitions that end with Props
    if (ts.isInterfaceDeclaration(node)) {
      const name = node.name.text;
      if (name.endsWith('Props') || name.endsWith('Prop')) {
        propsInterface = name;
      }
    }

    // Look for type aliases that end with Props
    if (ts.isTypeAliasDeclaration(node)) {
      const name = node.name.text;
      if (name.endsWith('Props') || name.endsWith('Prop')) {
        propsInterface = name;
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return propsInterface;
}

/**
 * Extract component dependencies from imports
 */
function extractDependencies(sourceFile: ts.SourceFile, projectRoot: string): string[] {
  const dependencies: string[] = [];

  function visit(node: ts.Node): void {
    if (
      ts.isImportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const importPath = node.moduleSpecifier.text;

      // Filter out node_modules and external packages
      if (
        !importPath.startsWith('.') &&
        !importPath.startsWith('/') &&
        !importPath.startsWith('@/')
      ) {
        return;
      }

      // Extract component names from imports
      if (node.importClause) {
        if (node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
          node.importClause.namedBindings.elements.forEach((element) => {
            const name = element.name.text;
            // Check if it's a component (starts with uppercase)
            if (name[0] && name[0] === name[0].toUpperCase()) {
              dependencies.push(name);
            }
          });
        }
        if (node.importClause.name) {
          const name = node.importClause.name.text;
          if (name[0] && name[0] === name[0].toUpperCase()) {
            dependencies.push(name);
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return [...new Set(dependencies)]; // Remove duplicates
}

/**
 * Check if component has children components
 */
function hasChildrenComponents(sourceFile: ts.SourceFile): boolean {
  let hasChildren = false;

  function visit(node: ts.Node): void {
    // Look for JSX elements with children
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      // Check if it's using children prop or has child elements
      if (ts.isJsxElement(node) && node.children.length > 0) {
        hasChildren = true;
      }
    }

    // Look for props.children usage
    if (ts.isPropertyAccessExpression(node) && node.name.text === 'children') {
      hasChildren = true;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return hasChildren;
}

/**
 * Discover all React components in the codebase
 */
export async function discoverComponents(
  options: DiscoveryOptions = {}
): Promise<ComponentMetadata[]> {
  const opts: Required<DiscoveryOptions> = { ...DEFAULT_OPTIONS, ...options };
  const projectRoot = process.cwd();
  const rootDir = join(projectRoot, opts.rootDir);

  if (!existsSync(rootDir)) {
    throw new Error(`Root directory does not exist: ${rootDir}`);
  }

  // Find all component files
  const files: string[] = [];
  for (const pattern of opts.includePatterns) {
    const matches = await glob(pattern, {
      cwd: rootDir,
      absolute: true,
      ignore: opts.excludePatterns,
    });
    files.push(...matches);
  }

  // Remove duplicates
  const uniqueFiles = [...new Set(files)];

  // Parse each file
  const components: ComponentMetadata[] = [];
  const componentMap = new Map<string, ComponentMetadata>();

  for (const filePath of uniqueFiles) {
    try {
      const fileContent = readFileSync(filePath, 'utf-8');
      const stats = statSync(filePath);

      // Create TypeScript source file
      const sourceFile = ts.createSourceFile(
        filePath,
        fileContent,
        ts.ScriptTarget.Latest,
        true,
        filePath.endsWith('.tsx') || filePath.endsWith('.jsx')
          ? ts.ScriptKind.TSX
          : ts.ScriptKind.TS
      );

      const componentName = extractComponentName(filePath, sourceFile);
      const exportType = detectExportType(sourceFile);
      const propsInterface = extractPropsInterface(sourceFile);
      const dependencies = extractDependencies(sourceFile, projectRoot);
      const hasChildren = hasChildrenComponents(sourceFile);
      const category = categorizeComponent(relative(projectRoot, filePath));

      const metadata: ComponentMetadata = {
        path: relative(projectRoot, filePath),
        name: componentName,
        category,
        exportType,
        propsInterface,
        fileSize: stats.size,
        lineCount: fileContent.split('\n').length,
        dependencies,
        hasChildren,
      };

      components.push(metadata);
      componentMap.set(componentName, metadata);
    } catch (error) {
      console.warn(`Failed to parse ${filePath}:`, error);
    }
  }

  // Identify parent-child relationships
  for (const component of components) {
    // Check if any dependency matches a component name
    for (const dep of component.dependencies) {
      const parentComponent = componentMap.get(dep);
      if (parentComponent && parentComponent.path !== component.path) {
        // Check if this component is in a subdirectory of the parent
        const componentDir = dirname(component.path);
        const parentDir = dirname(parentComponent.path);
        if (componentDir.startsWith(parentDir)) {
          component.parent = parentComponent.name;
        }
      }
    }
  }

  return components;
}
