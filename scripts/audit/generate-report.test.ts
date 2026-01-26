/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Report Generation Tests
 * @description TDD tests for comprehensive audit report generation
 * @vitest-environment node
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { generateReport } from './generate-report';
import type {
  ComponentMetadata,
  MotionAnalysis,
  StorybookAnalysis,
  PrinciplesCompliance,
  ChecklistAudit,
  PerformancePattern,
  AccessibilityAudit,
  UnifiedMaterialAnalysis,
  LibraryDetection,
  SummaryMetadata,
  IssuePriority,
} from './types';

describe('report-generation', () => {
  const testOutputDir = join(process.cwd(), 'scripts', 'audit', 'output', 'test-report');
  const mockDataDir = join(process.cwd(), 'scripts', 'audit', 'output', 'mock-data');

  // Mock data for testing
  const mockComponents: ComponentMetadata[] = [
    {
      path: 'src/components/ui/Button.tsx',
      name: 'Button',
      category: 'Overlays',
      exportType: 'named',
      propsInterface: 'ButtonProps',
      fileSize: 4042,
      lineCount: 122,
      dependencies: [],
      hasChildren: false,
    },
    {
      path: 'src/components/Layout/MainLayout.tsx',
      name: 'MainLayout',
      category: 'Layout',
      exportType: 'named',
      propsInterface: 'MainLayoutProps',
      fileSize: 23707,
      lineCount: 674,
      dependencies: ['Sidebar', 'StatusBar'],
      hasChildren: true,
    },
    {
      path: 'src/components/DataGrid/VirtualDataGrid.tsx',
      name: 'VirtualDataGrid',
      category: 'Core',
      exportType: 'named',
      propsInterface: 'DataGridRowProps',
      fileSize: 31123,
      lineCount: 815,
      dependencies: ['EmptyState'],
      hasChildren: true,
    },
  ];

  const mockMotionAnalysis: MotionAnalysis[] = [
    {
      path: 'src/components/ui/Button.tsx',
      name: 'Button',
      hasMotionImport: true,
      animationLibrary: 'motion',
      patterns: {
        usesMotionElements: true,
        usesAnimate: false,
        usesInitial: false,
        usesExit: false,
        usesVariants: false,
        usesLayout: false,
        usesWhileHover: true,
        usesWhileTap: true,
        usesWhileFocus: false,
        usesWhileInView: false,
        usesTransition: false,
        usesDrag: false,
      },
      usesReducedMotion: true,
      usesHardwareAcceleration: true,
      violations: [],
      isCompliant: true,
    },
    {
      path: 'src/components/Layout/MainLayout.tsx',
      name: 'MainLayout',
      hasMotionImport: true,
      animationLibrary: 'motion',
      patterns: {
        usesMotionElements: true,
        usesAnimate: true,
        usesInitial: true,
        usesExit: true,
        usesVariants: false,
        usesLayout: false,
        usesWhileHover: false,
        usesWhileTap: false,
        usesWhileFocus: false,
        usesWhileInView: false,
        usesTransition: false,
        usesDrag: false,
      },
      usesReducedMotion: false,
      usesHardwareAcceleration: true,
      violations: [
        {
          type: 'css-transition',
          line: 45,
          description: 'Does not respect prefers-reduced-motion',
          suggestion: 'Add useReducedMotion hook',
        },
      ],
      isCompliant: false,
    },
  ];

  const mockStorybookAnalysis: StorybookAnalysis[] = [
    {
      componentPath: 'src/components/ui/Button.tsx',
      componentName: 'Button',
      storyPath: 'src/components/ui/Button.stories.tsx',
      hasStoryFile: true,
      namingStatus: 'valid',
      variations: [
        { name: 'Default', hasPlayFunction: true, hasJsDocComment: true },
        { name: 'Playground', hasPlayFunction: true, hasJsDocComment: true },
        { name: 'Loading', hasPlayFunction: false, hasJsDocComment: true },
      ],
      hasRequiredVariations: true,
      hasInteractiveStories: true,
      hasValidExports: true,
      coverageScore: 95,
    },
    {
      componentPath: 'src/components/Layout/MainLayout.tsx',
      componentName: 'MainLayout',
      storyPath: null,
      hasStoryFile: false,
      namingStatus: 'missing-default',
      variations: [],
      hasRequiredVariations: false,
      hasInteractiveStories: false,
      hasValidExports: false,
      coverageScore: 0,
    },
  ];

  const mockPrinciplesCompliance: PrinciplesCompliance[] = [
    {
      componentPath: 'src/components/ui/Button.tsx',
      componentName: 'Button',
      overallScore: 92,
      principles: [
        {
          principle: 'grayscale-foundation',
          status: 'pass',
          score: 95,
          violations: [],
          evidence: ['Uses bg-neutral-* tokens'],
          recommendations: [],
        },
        {
          principle: 'strategic-color',
          status: 'pass',
          score: 90,
          violations: [],
          evidence: ['Color used only for signals'],
          recommendations: [],
        },
      ],
      summary: {
        totalPrinciples: 2,
        passed: 2,
        partial: 0,
        failed: 0,
        notApplicable: 0,
      },
      evaluatedAt: new Date().toISOString(),
    },
    {
      componentPath: 'src/components/Layout/MainLayout.tsx',
      componentName: 'MainLayout',
      overallScore: 68,
      principles: [
        {
          principle: 'grayscale-foundation',
          status: 'fail',
          score: 40,
          violations: [
            {
              line: 45,
              code: 'bg-red-500',
              message: 'Using non-grayscale color as foundation',
              severity: 'error',
              suggestion: 'Use bg-neutral-* instead',
            },
          ],
          evidence: [],
          recommendations: ['Replace colored backgrounds with grayscale tokens'],
        },
        {
          principle: 'strategic-color',
          status: 'pass',
          score: 85,
          violations: [],
          evidence: ['Status colors used correctly'],
          recommendations: [],
        },
      ],
      summary: {
        totalPrinciples: 2,
        passed: 1,
        partial: 0,
        failed: 1,
        notApplicable: 0,
      },
      evaluatedAt: new Date().toISOString(),
    },
  ];

  const mockChecklistAudit: ChecklistAudit[] = [
    {
      componentPath: 'src/components/ui/Button.tsx',
      componentName: 'Button',
      overallCompletion: 100,
      categories: [
        {
          category: 'accessibility',
          items: [
            {
              id: 'a11y-1',
              category: 'accessibility',
              description: 'Has accessible name',
              passed: true,
              details: 'Uses aria-label',
              required: true,
            },
            {
              id: 'a11y-2',
              category: 'accessibility',
              description: 'Keyboard accessible',
              passed: true,
              details: 'Focusable and activatable',
              required: true,
            },
          ],
          completionPercentage: 100,
          passed: 2,
          failed: 0,
          requiredPassed: 2,
          requiredFailed: 0,
        },
      ],
      items: [
        {
          id: 'a11y-1',
          category: 'accessibility',
          description: 'Has accessible name',
          passed: true,
          details: 'Uses aria-label',
          required: true,
        },
        {
          id: 'a11y-2',
          category: 'accessibility',
          description: 'Keyboard accessible',
          passed: true,
          details: 'Focusable and activatable',
          required: true,
        },
      ],
      summary: {
        totalItems: 2,
        passed: 2,
        failed: 0,
        requiredPassed: 2,
        requiredFailed: 0,
      },
      testCoverage: 95,
      hasStory: true,
      auditedAt: new Date().toISOString(),
    },
  ];

  const mockPerformanceAnalysis: PerformancePattern[] = [
    {
      path: 'src/components/DataGrid/VirtualDataGrid.tsx',
      name: 'VirtualDataGrid',
      usesHardwareAcceleration: true,
      usesMotionValues: false,
      usesResizeObserver: true,
      usesLayoutPosition: false,
      usesWhileInView: false,
      issues: [
        {
          type: 'missing-motion-values',
          message: 'Not using MotionValues for continuous updates',
          severity: 'warning',
          line: 150,
        },
        {
          type: 'full-layout-animation',
          message: 'Using full layout animation instead of layout="position"',
          severity: 'warning',
          line: 200,
        },
      ],
      score: 75,
    },
  ];

  const mockAccessibilityAudit: AccessibilityAudit[] = [
    {
      path: 'src/components/ui/Button.tsx',
      name: 'Button',
      hasAriaAttributes: true,
      usesSemanticHtml: true,
      supportsKeyboardNav: true,
      hasFocusManagement: true,
      isScreenReaderCompatible: true,
      respectsReducedMotion: true,
      issues: [],
      score: 95,
    },
    {
      path: 'src/components/DataGrid/VirtualDataGrid.tsx',
      name: 'VirtualDataGrid',
      hasAriaAttributes: false,
      usesSemanticHtml: true,
      supportsKeyboardNav: true,
      hasFocusManagement: false,
      isScreenReaderCompatible: false,
      respectsReducedMotion: true,
      issues: [
        {
          type: 'missing-aria-label',
          category: 'aria',
          message: 'Missing ARIA labels for grid cells',
          severity: 'critical',
          line: 100,
          wcag: '1.1.1',
        },
        {
          type: 'missing-aria-role',
          category: 'screen-reader',
          message: 'Screen reader navigation incomplete',
          severity: 'serious',
          line: 120,
          wcag: '4.1.2',
        },
      ],
      score: 72,
    },
  ];

  const mockUnifiedMaterialAnalysis: UnifiedMaterialAnalysis[] = [
    {
      componentPath: 'src/components/ui/Button.tsx',
      componentName: 'Button',
      usesMotion: true,
      motionDivCount: 1,
      usesVariants: true,
      hasVariantOrchestration: true,
      hasSeparateInnerHover: false,
      contentInheritsParentHover: true,
      hasDepthOnHover: true,
      usesClipPathHack: false,
      checks: [
        { name: 'single-motion-div', passed: true },
        { name: 'variant-orchestration', passed: true },
      ],
      violations: [],
      score: 100,
    },
    {
      componentPath: 'src/components/Layout/MainLayout.tsx',
      componentName: 'MainLayout',
      usesMotion: true,
      motionDivCount: 3,
      usesVariants: false,
      hasVariantOrchestration: false,
      hasSeparateInnerHover: true,
      contentInheritsParentHover: false,
      hasDepthOnHover: false,
      usesClipPathHack: false,
      checks: [
        { name: 'single-motion-div', passed: false, details: 'Multiple motion.div elements found' },
        { name: 'variant-orchestration', passed: false },
      ],
      violations: ['multiple-motion-divs', 'separate-inner-hover', 'no-depth-on-hover'],
      score: 60,
    },
  ];

  const mockLibraryDetection: LibraryDetection[] = [
    {
      componentPath: 'src/components/ui/Button.tsx',
      componentName: 'Button',
      libraries: [
        {
          library: 'radix-ui',
          importPath: '@radix-ui/react-slot',
          imports: ['Slot'],
          line: 1,
        },
      ],
      usesExternalLibrary: true,
      overrideCount: 0,
      overrides: [],
      fitsDesignSystem: true,
      shouldBeCustomBuilt: false,
      recommendation: 'keep',
    },
  ];

  beforeAll(() => {
    // Create test directories
    if (!existsSync(testOutputDir)) {
      mkdirSync(testOutputDir, { recursive: true });
    }
    if (!existsSync(mockDataDir)) {
      mkdirSync(mockDataDir, { recursive: true });
    }

    // Write mock data files
    writeFileSync(
      join(mockDataDir, 'component-inventory.json'),
      JSON.stringify(mockComponents, null, 2)
    );
    writeFileSync(
      join(mockDataDir, 'motion-analysis.json'),
      JSON.stringify(mockMotionAnalysis, null, 2)
    );
    writeFileSync(
      join(mockDataDir, 'storybook-coverage.json'),
      JSON.stringify(mockStorybookAnalysis, null, 2)
    );
    writeFileSync(
      join(mockDataDir, 'principles-compliance.json'),
      JSON.stringify(mockPrinciplesCompliance, null, 2)
    );
    writeFileSync(
      join(mockDataDir, 'checklist-report.json'),
      JSON.stringify(mockChecklistAudit, null, 2)
    );
    writeFileSync(
      join(mockDataDir, 'performance-analysis.json'),
      JSON.stringify(mockPerformanceAnalysis, null, 2)
    );
    writeFileSync(
      join(mockDataDir, 'accessibility-report.json'),
      JSON.stringify(mockAccessibilityAudit, null, 2)
    );
    writeFileSync(
      join(mockDataDir, 'unified-material-analysis.json'),
      JSON.stringify(mockUnifiedMaterialAnalysis, null, 2)
    );
    writeFileSync(
      join(mockDataDir, 'library-usage.json'),
      JSON.stringify(mockLibraryDetection, null, 2)
    );
  });

  afterAll(() => {
    // Cleanup test directories
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true, force: true });
    }
    if (existsSync(mockDataDir)) {
      rmSync(mockDataDir, { recursive: true, force: true });
    }
  });

  // Test ID: report-markdown-generation
  describe('should generate markdown report with all sections', () => {
    it('should generate AUDIT_REPORT.md with required sections', async () => {
      const report = await generateReport({
        outputDir: testOutputDir,
        format: 'markdown',
        inputDir: mockDataDir,
      });

      const markdownPath = join(testOutputDir, 'AUDIT_REPORT.md');
      expect(existsSync(markdownPath)).toBe(true);

      const markdown = readFileSync(markdownPath, 'utf-8');

      // Check for required sections
      expect(markdown).toContain('# Component Design Principles Audit Report');
      expect(markdown).toContain('## Executive Summary');
      expect(markdown).toContain('## Component Analysis');
      expect(markdown).toContain('## Issues by Priority');
      expect(markdown).toContain('## Recommendations');
      expect(markdown).toContain('## Follow-Up Plan');
    });
  });

  // Test ID: issue-categorization
  describe('should categorize issues by priority', () => {
    it('should categorize issues as critical, high, medium, low', async () => {
      const report = await generateReport({
        outputDir: testOutputDir,
        format: 'json',
        inputDir: mockDataDir,
      });

      expect(report.issues).toBeDefined();
      expect(Array.isArray(report.issues)).toBe(true);

      // Check that issues have valid priorities
      const priorities: IssuePriority[] = ['critical', 'high', 'medium', 'low'];
      report.issues.forEach((issue) => {
        expect(priorities).toContain(issue.priority);
      });

      // Check executive summary has issue counts
      expect(report.executiveSummary.issuesByPriority).toBeDefined();
      expect(typeof report.executiveSummary.issuesByPriority.critical).toBe('number');
      expect(typeof report.executiveSummary.issuesByPriority.high).toBe('number');
      expect(typeof report.executiveSummary.issuesByPriority.medium).toBe('number');
      expect(typeof report.executiveSummary.issuesByPriority.low).toBe('number');
    });
  });

  // Test ID: recommendation-generation
  describe('should generate actionable recommendations', () => {
    it('should create specific, actionable recommendations', async () => {
      const report = await generateReport({
        outputDir: testOutputDir,
        format: 'json',
        inputDir: mockDataDir,
      });

      // Check executive summary has recommendations
      expect(report.executiveSummary.keyRecommendations).toBeDefined();
      expect(Array.isArray(report.executiveSummary.keyRecommendations)).toBe(true);
      expect(report.executiveSummary.keyRecommendations.length).toBeGreaterThan(0);

      // Check component analysis has recommendations
      report.componentAnalysis.forEach((component) => {
        expect(Array.isArray(component.recommendations)).toBe(true);
      });

      // Check issues have recommendations
      report.issues.forEach((issue) => {
        expect(typeof issue.recommendation).toBe('string');
        expect(issue.recommendation.length).toBeGreaterThan(0);
      });
    });
  });

  describe('should create executive summary with overall compliance score', () => {
    it('should calculate overall compliance score correctly', async () => {
      const report = await generateReport({
        outputDir: testOutputDir,
        format: 'json',
        inputDir: mockDataDir,
      });

      expect(report.executiveSummary).toBeDefined();
      expect(typeof report.executiveSummary.overallScore).toBe('number');
      expect(report.executiveSummary.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.executiveSummary.overallScore).toBeLessThanOrEqual(100);

      expect(report.executiveSummary.totalComponents).toBe(mockComponents.length);
      expect(report.executiveSummary.generatedAt).toBeDefined();
    });
  });

  describe('should include component-by-component analysis', () => {
    it('should analyze each component individually', async () => {
      const report = await generateReport({
        outputDir: testOutputDir,
        format: 'json',
        inputDir: mockDataDir,
      });

      expect(report.componentAnalysis).toBeDefined();
      expect(Array.isArray(report.componentAnalysis)).toBe(true);
      expect(report.componentAnalysis.length).toBe(mockComponents.length);

      report.componentAnalysis.forEach((analysis) => {
        expect(analysis.path).toBeDefined();
        expect(analysis.name).toBeDefined();
        expect(analysis.category).toBeDefined();
        expect(typeof analysis.healthScore).toBe('number');
        expect(analysis.healthScore).toBeGreaterThanOrEqual(0);
        expect(analysis.healthScore).toBeLessThanOrEqual(100);
        expect(analysis.issuesByPriority).toBeDefined();
        expect(Array.isArray(analysis.findings)).toBe(true);
        expect(Array.isArray(analysis.recommendations)).toBe(true);
      });
    });
  });

  describe('should create priority-ordered fix list', () => {
    it('should order issues by priority (critical first)', async () => {
      const report = await generateReport({
        outputDir: testOutputDir,
        format: 'json',
        inputDir: mockDataDir,
      });

      const priorityOrder: Record<IssuePriority, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
      };

      // Check that issues are sorted by priority
      for (let i = 1; i < report.issues.length; i++) {
        const prevPriority = priorityOrder[report.issues[i - 1].priority];
        const currPriority = priorityOrder[report.issues[i].priority];
        expect(currPriority).toBeGreaterThanOrEqual(prevPriority);
      }
    });
  });

  describe('should generate follow-up plan structure', () => {
    it('should create phased follow-up plan', async () => {
      const report = await generateReport({
        outputDir: testOutputDir,
        format: 'json',
        inputDir: mockDataDir,
      });

      expect(report.followUpPlan).toBeDefined();
      expect(Array.isArray(report.followUpPlan)).toBe(true);

      report.followUpPlan.forEach((item) => {
        expect(item.id).toBeDefined();
        expect(typeof item.phase).toBe('number');
        expect(item.phaseName).toBeDefined();
        expect(item.description).toBeDefined();
        expect(Array.isArray(item.componentsAffected)).toBe(true);
        expect(['trivial', 'small', 'medium', 'large']).toContain(item.effort);
        expect(['critical', 'high', 'medium', 'low']).toContain(item.priority);
      });
    });
  });

  describe('should include visualizations (charts, graphs)', () => {
    it('should include chart data in report', async () => {
      const report = await generateReport({
        outputDir: testOutputDir,
        format: 'json',
        includeVisualizations: true,
        inputDir: mockDataDir,
      });

      // Check for category scores (pie chart data)
      expect(report.executiveSummary.scoresByCategory).toBeDefined();
      expect(typeof report.executiveSummary.scoresByCategory).toBe('object');

      // Markdown should contain visualization sections
      const markdownPath = join(testOutputDir, 'AUDIT_REPORT.md');
      if (existsSync(markdownPath)) {
        const markdown = readFileSync(markdownPath, 'utf-8');
        expect(markdown).toContain('Score Distribution');
      }
    });
  });

  describe('should generate summary.json metadata', () => {
    it('should create summary.json with metadata', async () => {
      await generateReport({
        outputDir: testOutputDir,
        format: 'both',
        inputDir: mockDataDir,
      });

      const summaryPath = join(testOutputDir, 'summary.json');
      expect(existsSync(summaryPath)).toBe(true);

      const summary = JSON.parse(readFileSync(summaryPath, 'utf-8')) as SummaryMetadata;

      expect(summary.version).toBeDefined();
      expect(summary.generatedAt).toBeDefined();
      expect(typeof summary.totalComponents).toBe('number');
      expect(typeof summary.overallScore).toBe('number');
      expect(summary.issues).toBeDefined();
      expect(typeof summary.issues.critical).toBe('number');
      expect(typeof summary.issues.high).toBe('number');
      expect(typeof summary.issues.medium).toBe('number');
      expect(typeof summary.issues.low).toBe('number');
      expect(typeof summary.issues.total).toBe('number');
      expect(summary.categoryScores).toBeDefined();
      expect(summary.reportFiles).toBeDefined();
    });
  });

  describe('should output AUDIT_REPORT.md', () => {
    it('should create AUDIT_REPORT.md file', async () => {
      await generateReport({
        outputDir: testOutputDir,
        format: 'markdown',
        inputDir: mockDataDir,
      });

      const reportPath = join(testOutputDir, 'AUDIT_REPORT.md');
      expect(existsSync(reportPath)).toBe(true);

      const content = readFileSync(reportPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);

      // Verify it's valid markdown with headers
      expect(content).toMatch(/^# /m);
      expect(content).toMatch(/^## /m);
    });
  });

  describe('should validate against AuditReport interface', () => {
    it('should return valid AuditReport object', async () => {
      const report = await generateReport({
        outputDir: testOutputDir,
        format: 'json',
        inputDir: mockDataDir,
      });

      // Validate metadata
      expect(report.metadata).toBeDefined();
      expect(report.metadata.version).toBeDefined();
      expect(report.metadata.generatedAt).toBeDefined();
      expect(report.metadata.generatedBy).toBeDefined();

      // Validate executiveSummary
      expect(report.executiveSummary).toBeDefined();

      // Validate componentAnalysis
      expect(report.componentAnalysis).toBeDefined();

      // Validate issues
      expect(report.issues).toBeDefined();

      // Validate followUpPlan
      expect(report.followUpPlan).toBeDefined();

      // Validate analysisDataPaths
      expect(report.analysisDataPaths).toBeDefined();
      expect(report.analysisDataPaths.componentInventory).toBeDefined();
      expect(report.analysisDataPaths.motionAnalysis).toBeDefined();
      expect(report.analysisDataPaths.storybookCoverage).toBeDefined();
      expect(report.analysisDataPaths.principlesCompliance).toBeDefined();
      expect(report.analysisDataPaths.checklistReport).toBeDefined();
      expect(report.analysisDataPaths.performanceAnalysis).toBeDefined();
      expect(report.analysisDataPaths.accessibilityReport).toBeDefined();
      expect(report.analysisDataPaths.unifiedMaterialAnalysis).toBeDefined();
      expect(report.analysisDataPaths.libraryUsage).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle missing analysis files gracefully', async () => {
      const emptyDir = join(testOutputDir, 'empty');
      if (!existsSync(emptyDir)) {
        mkdirSync(emptyDir, { recursive: true });
      }

      // Only write component inventory, no other files
      writeFileSync(
        join(emptyDir, 'component-inventory.json'),
        JSON.stringify(mockComponents, null, 2)
      );

      const report = await generateReport({
        outputDir: emptyDir,
        format: 'json',
        inputDir: emptyDir,
      });

      expect(report).toBeDefined();
      expect(report.executiveSummary.totalComponents).toBe(mockComponents.length);

      // Cleanup
      rmSync(emptyDir, { recursive: true, force: true });
    });

    it('should handle empty component inventory', async () => {
      const emptyDir = join(testOutputDir, 'empty-inventory');
      if (!existsSync(emptyDir)) {
        mkdirSync(emptyDir, { recursive: true });
      }

      writeFileSync(join(emptyDir, 'component-inventory.json'), JSON.stringify([]));

      const report = await generateReport({
        outputDir: emptyDir,
        format: 'json',
        inputDir: emptyDir,
      });

      expect(report.executiveSummary.totalComponents).toBe(0);
      expect(report.componentAnalysis).toHaveLength(0);

      // Cleanup
      rmSync(emptyDir, { recursive: true, force: true });
    });
  });
});
