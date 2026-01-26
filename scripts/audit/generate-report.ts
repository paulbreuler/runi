/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Report Generation
 * @description Generates comprehensive audit report combining all analyses
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type {
  AuditReport,
  ReportOptions,
  ComponentMetadata,
  MotionAnalysis,
  StorybookAnalysis,
  PrinciplesCompliance,
  ChecklistAudit,
  PerformancePattern,
  AccessibilityAudit,
  UnifiedMaterialAnalysis,
  LibraryDetection,
  CategorizedIssue,
  ComponentAnalysisSummary,
  ExecutiveSummary,
  FollowUpItem,
  IssuePriority,
  SummaryMetadata,
  ComponentCategory,
} from './types';

/**
 * Default report options
 */
const DEFAULT_OPTIONS: Required<ReportOptions> = {
  outputDir: 'scripts/audit/output',
  includeDetailedAnalysis: true,
  includeVisualizations: true,
  format: 'both',
  title: 'Component Design Principles Audit Report',
  inputDir: 'scripts/audit/output',
};

/**
 * Priority weights for scoring
 */
const PRIORITY_WEIGHTS: Record<IssuePriority, number> = {
  critical: 25,
  high: 15,
  medium: 8,
  low: 3,
};

/**
 * Read JSON file safely
 */
function readJsonFile<T>(filePath: string): T | null {
  try {
    if (!existsSync(filePath)) {
      return null;
    }
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Determine issue priority based on severity and context
 */
function determinePriority(severity?: string, category?: string, impact?: string): IssuePriority {
  // Critical issues
  if (severity === 'critical' || impact === 'critical') return 'critical';
  if (category === 'accessibility' && impact === 'serious') return 'critical';

  // High priority issues (including 'error' from PrincipleViolation)
  if (severity === 'high' || severity === 'error' || impact === 'serious') return 'high';
  if (category === 'accessibility' && impact === 'moderate') return 'high';

  // Medium priority issues (including 'warning' from PrincipleViolation)
  if (severity === 'medium' || severity === 'warning' || impact === 'moderate') return 'medium';

  // Low priority issues (including 'info' from PrincipleViolation)
  return 'low';
}

/**
 * Extract issues from motion analysis
 */
function extractMotionIssues(analysis: MotionAnalysis[]): CategorizedIssue[] {
  const issues: CategorizedIssue[] = [];
  let issueId = 0;

  for (const component of analysis) {
    if (!component.usesReducedMotion && component.hasMotionImport) {
      issues.push({
        id: `motion-${++issueId}`,
        componentPath: component.path,
        componentName: component.name,
        category: 'motion',
        priority: 'high',
        description: 'Component does not respect prefers-reduced-motion preference',
        recommendation: 'Add motion reduction support using useReducedMotion hook or media query',
        effort: 'small',
      });
    }

    if (!component.isCompliant) {
      issues.push({
        id: `motion-${++issueId}`,
        componentPath: component.path,
        componentName: component.name,
        category: 'motion',
        priority: 'medium',
        description: 'Component is not compliant with motion best practices',
        recommendation: 'Review animation patterns and follow Motion.dev best practices',
        effort: 'small',
      });
    }

    for (const violation of component.violations) {
      issues.push({
        id: `motion-${++issueId}`,
        componentPath: component.path,
        componentName: component.name,
        category: 'motion',
        priority: violation.type === 'other-library' ? 'high' : 'medium',
        description: violation.description,
        recommendation: violation.suggestion,
        effort: 'small',
      });
    }
  }

  return issues;
}

/**
 * Extract issues from storybook analysis
 */
function extractStorybookIssues(analysis: StorybookAnalysis[]): CategorizedIssue[] {
  const issues: CategorizedIssue[] = [];
  let issueId = 0;

  for (const component of analysis) {
    if (!component.hasStoryFile) {
      issues.push({
        id: `storybook-${++issueId}`,
        componentPath: component.componentPath,
        componentName: component.componentName,
        category: 'storybook',
        priority: 'medium',
        description: 'Component is missing Storybook story',
        recommendation: 'Create Storybook story with Playground and key states',
        effort: 'medium',
      });
    }

    if (component.hasStoryFile && !component.hasInteractiveStories) {
      issues.push({
        id: `storybook-${++issueId}`,
        componentPath: component.componentPath,
        componentName: component.componentName,
        category: 'storybook',
        priority: 'low',
        description: 'Story is missing play functions for interaction testing',
        recommendation: 'Add play functions to test component interactions',
        effort: 'small',
      });
    }

    if (!component.hasRequiredVariations) {
      issues.push({
        id: `storybook-${++issueId}`,
        componentPath: component.componentPath,
        componentName: component.componentName,
        category: 'storybook',
        priority: 'low',
        description: 'Story is missing required variations (loading, error, empty states)',
        recommendation: 'Add stories for loading, error, and empty states',
        effort: 'small',
      });
    }

    if (component.namingStatus !== 'valid') {
      issues.push({
        id: `storybook-${++issueId}`,
        componentPath: component.componentPath,
        componentName: component.componentName,
        category: 'storybook',
        priority: 'low',
        description: `Story naming issue: ${component.namingStatus}`,
        recommendation: 'Follow story naming conventions with Default and Playground stories',
        effort: 'trivial',
      });
    }
  }

  return issues;
}

/**
 * Extract issues from principles compliance
 */
function extractPrinciplesIssues(analysis: PrinciplesCompliance[]): CategorizedIssue[] {
  const issues: CategorizedIssue[] = [];
  let issueId = 0;

  for (const component of analysis) {
    for (const principle of component.principles) {
      if (principle.status === 'fail' || principle.status === 'partial') {
        for (const violation of principle.violations) {
          issues.push({
            id: `principles-${++issueId}`,
            componentPath: component.componentPath,
            componentName: component.componentName,
            category: 'design-principles',
            priority: determinePriority(violation.severity),
            description: `${principle.principle}: ${violation.message}`,
            recommendation:
              violation.suggestion ||
              principle.recommendations[0] ||
              `Refactor to comply with ${principle.principle} principle`,
            effort: violation.severity === 'error' ? 'medium' : 'small',
          });
        }
        // If no specific violations but principle failed, add general recommendation
        if (principle.violations.length === 0 && principle.recommendations.length > 0) {
          issues.push({
            id: `principles-${++issueId}`,
            componentPath: component.componentPath,
            componentName: component.componentName,
            category: 'design-principles',
            priority: principle.status === 'fail' ? 'high' : 'medium',
            description: `${principle.principle} compliance issue`,
            recommendation: principle.recommendations[0],
            effort: 'medium',
          });
        }
      }
    }
  }

  return issues;
}

/**
 * Extract issues from performance analysis
 */
function extractPerformanceIssues(analysis: PerformancePattern[]): CategorizedIssue[] {
  const issues: CategorizedIssue[] = [];
  let issueId = 0;

  for (const component of analysis) {
    if (!component.usesHardwareAcceleration) {
      issues.push({
        id: `performance-${++issueId}`,
        componentPath: component.path,
        componentName: component.name,
        category: 'performance',
        priority: 'medium',
        description: 'Component does not use hardware-accelerated properties',
        recommendation: 'Use transform and opacity instead of top/left for animations',
        effort: 'small',
      });
    }

    if (!component.usesLayoutPosition && component.usesWhileInView === false) {
      issues.push({
        id: `performance-${++issueId}`,
        componentPath: component.path,
        componentName: component.name,
        category: 'performance',
        priority: 'low',
        description: 'Consider using layout="position" for smoother layout animations',
        recommendation: 'Use layout="position" instead of full layout animations when possible',
        effort: 'small',
      });
    }

    for (const issue of component.issues) {
      const priority =
        issue.severity === 'critical' ? 'high' : issue.severity === 'warning' ? 'medium' : 'low';
      issues.push({
        id: `performance-${++issueId}`,
        componentPath: component.path,
        componentName: component.name,
        category: 'performance',
        priority,
        description: issue.message,
        recommendation: getPerformanceRecommendation(issue.type),
        effort: 'medium',
      });
    }
  }

  return issues;
}

/**
 * Get recommendation for performance issue type
 */
function getPerformanceRecommendation(issueType: string): string {
  const recommendations: Record<string, string> = {
    'layout-thrashing': 'Batch DOM reads and writes to avoid layout thrashing',
    'non-hardware-accelerated': 'Use transform and opacity for animations',
    'missing-motion-values': 'Use MotionValues for continuous value updates',
    'missing-resize-observer': 'Use ResizeObserver for responsive animations',
    'full-layout-animation': 'Consider layout="position" for simpler animations',
    'missing-while-in-view': 'Use whileInView for scroll-triggered animations',
    'inline-animation-values': 'Extract animation values to variants or constants',
  };
  return recommendations[issueType] || 'Review and optimize performance';
}

/**
 * Extract issues from accessibility audit
 */
function extractAccessibilityIssues(analysis: AccessibilityAudit[]): CategorizedIssue[] {
  const issues: CategorizedIssue[] = [];
  let issueId = 0;

  for (const component of analysis) {
    for (const issue of component.issues) {
      const priority = mapA11ySeverityToPriority(issue.severity);
      issues.push({
        id: `a11y-${++issueId}`,
        componentPath: component.path,
        componentName: component.name,
        category: 'accessibility',
        priority,
        description: `${issue.wcag ? `[WCAG ${issue.wcag}] ` : ''}${issue.message}`,
        recommendation: getA11yRecommendation(issue.type),
        effort: issue.severity === 'critical' ? 'medium' : 'small',
      });
    }

    if (!component.supportsKeyboardNav) {
      issues.push({
        id: `a11y-${++issueId}`,
        componentPath: component.path,
        componentName: component.name,
        category: 'accessibility',
        priority: 'critical',
        description: 'Component is not keyboard accessible',
        recommendation: 'Add keyboard support for all interactive elements',
        effort: 'medium',
      });
    }

    if (!component.isScreenReaderCompatible) {
      issues.push({
        id: `a11y-${++issueId}`,
        componentPath: component.path,
        componentName: component.name,
        category: 'accessibility',
        priority: 'high',
        description: 'Component is not screen reader compatible',
        recommendation: 'Add proper ARIA labels and semantic HTML',
        effort: 'medium',
      });
    }

    if (!component.respectsReducedMotion && component.hasAriaAttributes) {
      issues.push({
        id: `a11y-${++issueId}`,
        componentPath: component.path,
        componentName: component.name,
        category: 'accessibility',
        priority: 'high',
        description: 'Component does not respect reduced motion preferences',
        recommendation: 'Add prefers-reduced-motion media query or useReducedMotion hook',
        effort: 'small',
      });
    }
  }

  return issues;
}

/**
 * Map accessibility severity to issue priority
 */
function mapA11ySeverityToPriority(severity: string): IssuePriority {
  switch (severity) {
    case 'critical':
      return 'critical';
    case 'serious':
      return 'high';
    case 'moderate':
      return 'medium';
    case 'minor':
    default:
      return 'low';
  }
}

/**
 * Get recommendation for accessibility issue type
 */
function getA11yRecommendation(issueType: string): string {
  const recommendations: Record<string, string> = {
    'missing-aria-label': 'Add aria-label or aria-labelledby to the element',
    'missing-aria-role': 'Add appropriate ARIA role to the element',
    'missing-semantic-element': 'Replace div/span with semantic HTML element',
    'missing-tabindex': 'Add tabindex="0" for custom interactive elements',
    'missing-keyboard-handler': 'Add onKeyDown handler for keyboard interaction',
    'missing-focus-visible': 'Add focus-visible styles for keyboard focus',
    'missing-reduced-motion': 'Add prefers-reduced-motion support',
    'missing-aria-describedby': 'Add aria-describedby for additional context',
    'missing-htmlFor': 'Add htmlFor attribute to label element',
    'icon-button-no-label': 'Add aria-label to icon-only button',
  };
  return recommendations[issueType] || 'Review and fix accessibility issue';
}

/**
 * Extract issues from unified material analysis
 */
function extractMaterialIssues(analysis: UnifiedMaterialAnalysis[]): CategorizedIssue[] {
  const issues: CategorizedIssue[] = [];
  let issueId = 0;

  for (const component of analysis) {
    for (const violation of component.violations) {
      issues.push({
        id: `material-${++issueId}`,
        componentPath: component.componentPath,
        componentName: component.componentName,
        category: 'unified-material',
        priority: getMaterialPriority(violation),
        description: getMaterialViolationDescription(violation),
        recommendation: getMaterialRecommendation(violation),
        effort: 'medium',
      });
    }

    // Check for failed individual checks
    for (const check of component.checks) {
      if (!check.passed && check.details) {
        issues.push({
          id: `material-${++issueId}`,
          componentPath: component.componentPath,
          componentName: component.componentName,
          category: 'unified-material',
          priority: 'low',
          description: `${check.name}: ${check.details}`,
          recommendation: getMaterialRecommendation(check.name),
          effort: 'small',
        });
      }
    }
  }

  return issues;
}

/**
 * Get priority for material violation
 */
function getMaterialPriority(violation: string): IssuePriority {
  const highPriority = ['multiple-motion-divs', 'separate-inner-hover'];
  const mediumPriority = ['no-depth-on-hover', 'missing-variant-orchestration'];

  if (highPriority.includes(violation)) return 'high';
  if (mediumPriority.includes(violation)) return 'medium';
  return 'low';
}

/**
 * Get description for material violation
 */
function getMaterialViolationDescription(violation: string): string {
  const descriptions: Record<string, string> = {
    'multiple-motion-divs': 'Multiple motion.div elements instead of single unified material',
    'separate-inner-hover': 'Separate inner hover states break unified material feel',
    'clip-path-hack': 'Using clip-path hacks instead of proper masking',
    'missing-variant-orchestration': 'Missing Motion variant orchestration',
    'no-depth-on-hover': 'No subtle depth change on hover interaction',
  };
  return descriptions[violation] || `Material violation: ${violation}`;
}

/**
 * Get recommendation for material issue
 */
function getMaterialRecommendation(violation: string): string {
  const recommendations: Record<string, string> = {
    'multiple-motion-divs': 'Consolidate to single motion.div with variant orchestration',
    'separate-inner-hover': 'Use parent hover state with children inheriting via variants',
    'clip-path-hack': 'Use overflow hidden or proper CSS masking',
    'missing-variant-orchestration':
      'Add Motion variants with staggerChildren and parent-child coordination',
    'no-depth-on-hover': 'Add subtle shadow or scale change on hover',
    'single-motion-div': 'Consolidate multiple motion elements into single unified material',
    'variant-orchestration': 'Add Motion variants for coordinated animations',
  };
  return recommendations[violation] || 'Review and fix unified material issue';
}

/**
 * Extract issues from library detection
 */
function extractLibraryIssues(analysis: LibraryDetection[]): CategorizedIssue[] {
  const issues: CategorizedIssue[] = [];
  let issueId = 0;

  for (const component of analysis) {
    if (component.shouldBeCustomBuilt) {
      issues.push({
        id: `library-${++issueId}`,
        componentPath: component.componentPath,
        componentName: component.componentName,
        category: 'libraries',
        priority: 'medium',
        description: 'Component should be custom-built instead of using external library',
        recommendation: 'Replace with internal custom component for better design system fit',
        effort: 'large',
      });
    }

    if (component.recommendation === 'refactor' || component.recommendation === 'replace') {
      issues.push({
        id: `library-${++issueId}`,
        componentPath: component.componentPath,
        componentName: component.componentName,
        category: 'libraries',
        priority: component.recommendation === 'replace' ? 'high' : 'medium',
        description: `Component ${component.recommendation === 'replace' ? 'should be replaced' : 'needs refactoring'}`,
        recommendation:
          component.recommendation === 'replace'
            ? 'Replace with internal implementation'
            : 'Refactor to reduce library dependency overrides',
        effort: component.recommendation === 'replace' ? 'large' : 'medium',
      });
    }

    for (const override of component.overrides) {
      issues.push({
        id: `library-${++issueId}`,
        componentPath: component.componentPath,
        componentName: component.componentName,
        category: 'libraries',
        priority: 'low',
        description: `Library override detected: ${override.description}`,
        recommendation: 'Consider using internal component to avoid overrides',
        effort: 'small',
      });
    }
  }

  return issues;
}

/**
 * Sort issues by priority
 */
function sortIssuesByPriority(issues: CategorizedIssue[]): CategorizedIssue[] {
  const priorityOrder: Record<IssuePriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return [...issues].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Calculate component health score
 */
function calculateHealthScore(
  component: ComponentMetadata,
  issues: CategorizedIssue[],
  principlesCompliance?: PrinciplesCompliance,
  accessibilityAudit?: AccessibilityAudit,
  storybookAnalysis?: StorybookAnalysis
): number {
  let score = 100;

  // Deduct points for issues
  const componentIssues = issues.filter((i) => i.componentPath === component.path);
  for (const issue of componentIssues) {
    score -= PRIORITY_WEIGHTS[issue.priority];
  }

  // Factor in principles compliance
  if (principlesCompliance) {
    score = (score + principlesCompliance.overallScore) / 2;
  }

  // Factor in accessibility score
  if (accessibilityAudit) {
    score = (score + accessibilityAudit.score) / 2;
  }

  // Factor in storybook coverage
  if (storybookAnalysis) {
    score = (score + storybookAnalysis.coverageScore) / 2;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Generate component analysis summaries
 */
function generateComponentAnalysis(
  components: ComponentMetadata[],
  issues: CategorizedIssue[],
  principlesCompliance: PrinciplesCompliance[],
  accessibilityAudit: AccessibilityAudit[],
  storybookAnalysis: StorybookAnalysis[]
): ComponentAnalysisSummary[] {
  return components.map((component) => {
    const componentIssues = issues.filter((i) => i.componentPath === component.path);
    const principles = principlesCompliance.find((p) => p.componentPath === component.path);
    const accessibility = accessibilityAudit.find((a) => a.path === component.path);
    const storybook = storybookAnalysis.find((s) => s.componentPath === component.path);

    const issuesByPriority: Record<IssuePriority, number> = {
      critical: componentIssues.filter((i) => i.priority === 'critical').length,
      high: componentIssues.filter((i) => i.priority === 'high').length,
      medium: componentIssues.filter((i) => i.priority === 'medium').length,
      low: componentIssues.filter((i) => i.priority === 'low').length,
    };

    const findings: string[] = [];
    const recommendations: string[] = [];

    // Add findings
    if (componentIssues.length === 0) {
      findings.push('No issues detected');
    } else {
      if (issuesByPriority.critical > 0) {
        findings.push(`${issuesByPriority.critical} critical issue(s) require immediate attention`);
      }
      if (issuesByPriority.high > 0) {
        findings.push(`${issuesByPriority.high} high priority issue(s) found`);
      }
    }

    if (accessibility && accessibility.score >= 90) {
      findings.push('Strong accessibility compliance');
    }

    if (storybook && storybook.hasStoryFile && storybook.hasInteractiveStories) {
      findings.push('Good Storybook coverage with interaction tests');
    }

    // Add recommendations from issues
    const uniqueRecommendations = new Set<string>();
    componentIssues.forEach((issue) => {
      uniqueRecommendations.add(issue.recommendation);
    });
    recommendations.push(...Array.from(uniqueRecommendations).slice(0, 5));

    return {
      path: component.path,
      name: component.name,
      category: component.category,
      healthScore: calculateHealthScore(component, issues, principles, accessibility, storybook),
      issuesByPriority,
      findings,
      recommendations,
    };
  });
}

/**
 * Generate executive summary
 */
function generateExecutiveSummary(
  components: ComponentMetadata[],
  componentAnalysis: ComponentAnalysisSummary[],
  issues: CategorizedIssue[]
): ExecutiveSummary {
  const issuesByPriority: Record<IssuePriority, number> = {
    critical: issues.filter((i) => i.priority === 'critical').length,
    high: issues.filter((i) => i.priority === 'high').length,
    medium: issues.filter((i) => i.priority === 'medium').length,
    low: issues.filter((i) => i.priority === 'low').length,
  };

  // Calculate overall score
  const averageHealthScore =
    componentAnalysis.length > 0
      ? componentAnalysis.reduce((sum, c) => sum + c.healthScore, 0) / componentAnalysis.length
      : 0;

  // Calculate scores by category
  const scoresByCategory: Record<string, number> = {};
  const categoryGroups = new Map<ComponentCategory, ComponentAnalysisSummary[]>();

  componentAnalysis.forEach((analysis) => {
    const existing = categoryGroups.get(analysis.category) || [];
    existing.push(analysis);
    categoryGroups.set(analysis.category, existing);
  });

  categoryGroups.forEach((analyses, category) => {
    const avgScore = analyses.reduce((sum, a) => sum + a.healthScore, 0) / analyses.length;
    scoresByCategory[category] = Math.round(avgScore);
  });

  // Calculate scores by issue category
  const issueCategories = [...new Set(issues.map((i) => i.category))];
  issueCategories.forEach((category) => {
    const categoryIssues = issues.filter((i) => i.category === category);
    const penalty = categoryIssues.reduce((sum, i) => sum + PRIORITY_WEIGHTS[i.priority], 0);
    scoresByCategory[category] = Math.max(0, 100 - penalty);
  });

  // Top concerns
  const topConcerns: string[] = [];
  if (issuesByPriority.critical > 0) {
    topConcerns.push(`${issuesByPriority.critical} critical issues require immediate attention`);
  }
  if (issuesByPriority.high > 0) {
    topConcerns.push(`${issuesByPriority.high} high priority issues need resolution`);
  }

  const lowHealthComponents = componentAnalysis.filter((c) => c.healthScore < 60);
  if (lowHealthComponents.length > 0) {
    topConcerns.push(`${lowHealthComponents.length} component(s) have poor health scores (<60)`);
  }

  // Key recommendations
  const keyRecommendations: string[] = [];

  // Aggregate recommendations from critical and high priority issues
  const criticalHighIssues = issues.filter(
    (i) => i.priority === 'critical' || i.priority === 'high'
  );
  const recommendationCounts = new Map<string, number>();

  criticalHighIssues.forEach((issue) => {
    const count = recommendationCounts.get(issue.recommendation) || 0;
    recommendationCounts.set(issue.recommendation, count + 1);
  });

  // Sort by frequency and take top 5
  const sortedRecommendations = [...recommendationCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([rec]) => rec);

  keyRecommendations.push(...sortedRecommendations);

  // Add general recommendations if needed
  if (keyRecommendations.length === 0) {
    keyRecommendations.push('Continue maintaining current quality standards');
    keyRecommendations.push('Consider adding more automated testing');
  }

  return {
    generatedAt: new Date().toISOString(),
    totalComponents: components.length,
    overallScore: Math.round(averageHealthScore),
    scoresByCategory,
    issuesByPriority,
    topConcerns,
    keyRecommendations,
  };
}

/**
 * Generate follow-up plan
 */
function generateFollowUpPlan(issues: CategorizedIssue[]): FollowUpItem[] {
  const plan: FollowUpItem[] = [];
  let itemId = 0;

  // Phase 1: Critical issues
  const criticalIssues = issues.filter((i) => i.priority === 'critical');
  if (criticalIssues.length > 0) {
    const components = [...new Set(criticalIssues.map((i) => i.componentName))];
    plan.push({
      id: `phase-${++itemId}`,
      phase: 1,
      phaseName: 'Critical Fixes',
      description: 'Address all critical issues immediately',
      componentsAffected: components,
      effort: 'large',
      priority: 'critical',
    });
  }

  // Phase 2: High priority issues
  const highIssues = issues.filter((i) => i.priority === 'high');
  if (highIssues.length > 0) {
    const components = [...new Set(highIssues.map((i) => i.componentName))];
    plan.push({
      id: `phase-${++itemId}`,
      phase: 2,
      phaseName: 'High Priority Fixes',
      description: 'Resolve high priority issues',
      componentsAffected: components,
      effort: 'medium',
      priority: 'high',
    });
  }

  // Phase 3: Accessibility improvements
  const a11yIssues = issues.filter(
    (i) => i.category === 'accessibility' && i.priority !== 'critical'
  );
  if (a11yIssues.length > 0) {
    const components = [...new Set(a11yIssues.map((i) => i.componentName))];
    plan.push({
      id: `phase-${++itemId}`,
      phase: 3,
      phaseName: 'Accessibility Improvements',
      description: 'Enhance accessibility across components',
      componentsAffected: components,
      effort: 'medium',
      priority: 'high',
    });
  }

  // Phase 4: Performance optimization
  const perfIssues = issues.filter((i) => i.category === 'performance');
  if (perfIssues.length > 0) {
    const components = [...new Set(perfIssues.map((i) => i.componentName))];
    plan.push({
      id: `phase-${++itemId}`,
      phase: 4,
      phaseName: 'Performance Optimization',
      description: 'Optimize component performance and bundle size',
      componentsAffected: components,
      effort: 'medium',
      priority: 'medium',
    });
  }

  // Phase 5: Testing coverage
  const testIssues = issues.filter((i) => i.category === 'storybook');
  if (testIssues.length > 0) {
    const components = [...new Set(testIssues.map((i) => i.componentName))];
    plan.push({
      id: `phase-${++itemId}`,
      phase: 5,
      phaseName: 'Testing Coverage',
      description: 'Improve Storybook coverage and interaction tests',
      componentsAffected: components,
      effort: 'small',
      priority: 'medium',
    });
  }

  // Phase 6: Polish and refinement
  const lowIssues = issues.filter((i) => i.priority === 'low');
  if (lowIssues.length > 0) {
    const components = [...new Set(lowIssues.map((i) => i.componentName))];
    plan.push({
      id: `phase-${++itemId}`,
      phase: 6,
      phaseName: 'Polish and Refinement',
      description: 'Address remaining low priority issues',
      componentsAffected: components,
      effort: 'small',
      priority: 'low',
    });
  }

  return plan;
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(report: AuditReport, title: string): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${title}`);
  lines.push('');
  lines.push(`Generated: ${report.executiveSummary.generatedAt}`);
  lines.push('');

  // Executive Summary
  lines.push('## Executive Summary');
  lines.push('');
  lines.push(`- **Total Components Analyzed:** ${report.executiveSummary.totalComponents}`);
  lines.push(`- **Overall Compliance Score:** ${report.executiveSummary.overallScore}%`);
  lines.push('');

  lines.push('### Issues by Priority');
  lines.push('');
  lines.push(`| Priority | Count |`);
  lines.push(`|----------|-------|`);
  lines.push(`| Critical | ${report.executiveSummary.issuesByPriority.critical} |`);
  lines.push(`| High | ${report.executiveSummary.issuesByPriority.high} |`);
  lines.push(`| Medium | ${report.executiveSummary.issuesByPriority.medium} |`);
  lines.push(`| Low | ${report.executiveSummary.issuesByPriority.low} |`);
  lines.push('');

  if (report.executiveSummary.topConcerns.length > 0) {
    lines.push('### Top Concerns');
    lines.push('');
    report.executiveSummary.topConcerns.forEach((concern) => {
      lines.push(`- ${concern}`);
    });
    lines.push('');
  }

  // Score Distribution (visualization data)
  lines.push('### Score Distribution');
  lines.push('');
  lines.push('| Category | Score |');
  lines.push('|----------|-------|');
  Object.entries(report.executiveSummary.scoresByCategory).forEach(([category, score]) => {
    lines.push(`| ${category} | ${score}% |`);
  });
  lines.push('');

  // Component Analysis
  lines.push('## Component Analysis');
  lines.push('');

  // Sort by health score (lowest first to highlight problem areas)
  const sortedComponents = [...report.componentAnalysis].sort(
    (a, b) => a.healthScore - b.healthScore
  );

  sortedComponents.forEach((component) => {
    const healthEmoji =
      component.healthScore >= 80 ? '✅' : component.healthScore >= 60 ? '⚠️' : '❌';
    lines.push(`### ${healthEmoji} ${component.name}`);
    lines.push('');
    lines.push(`- **Path:** \`${component.path}\``);
    lines.push(`- **Category:** ${component.category}`);
    lines.push(`- **Health Score:** ${component.healthScore}%`);
    lines.push('');

    if (
      component.issuesByPriority.critical > 0 ||
      component.issuesByPriority.high > 0 ||
      component.issuesByPriority.medium > 0
    ) {
      lines.push('**Issues:**');
      if (component.issuesByPriority.critical > 0) {
        lines.push(`- 🔴 Critical: ${component.issuesByPriority.critical}`);
      }
      if (component.issuesByPriority.high > 0) {
        lines.push(`- 🟠 High: ${component.issuesByPriority.high}`);
      }
      if (component.issuesByPriority.medium > 0) {
        lines.push(`- 🟡 Medium: ${component.issuesByPriority.medium}`);
      }
      lines.push('');
    }

    if (component.findings.length > 0) {
      lines.push('**Findings:**');
      component.findings.forEach((finding) => {
        lines.push(`- ${finding}`);
      });
      lines.push('');
    }

    if (component.recommendations.length > 0) {
      lines.push('**Recommendations:**');
      component.recommendations.forEach((rec) => {
        lines.push(`- ${rec}`);
      });
      lines.push('');
    }
  });

  // Issues by Priority
  lines.push('## Issues by Priority');
  lines.push('');

  const priorities: IssuePriority[] = ['critical', 'high', 'medium', 'low'];
  priorities.forEach((priority) => {
    const priorityIssues = report.issues.filter((i) => i.priority === priority);
    if (priorityIssues.length > 0) {
      lines.push(`### ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority`);
      lines.push('');
      priorityIssues.forEach((issue) => {
        lines.push(`- **${issue.componentName}** (${issue.category}): ${issue.description}`);
        lines.push(`  - Recommendation: ${issue.recommendation}`);
        lines.push(`  - Effort: ${issue.effort}`);
      });
      lines.push('');
    }
  });

  // Recommendations
  lines.push('## Recommendations');
  lines.push('');
  report.executiveSummary.keyRecommendations.forEach((rec, index) => {
    lines.push(`${index + 1}. ${rec}`);
  });
  lines.push('');

  // Follow-Up Plan
  lines.push('## Follow-Up Plan');
  lines.push('');

  report.followUpPlan.forEach((item) => {
    lines.push(`### Phase ${item.phase}: ${item.phaseName}`);
    lines.push('');
    lines.push(`- **Priority:** ${item.priority}`);
    lines.push(`- **Effort:** ${item.effort}`);
    lines.push(`- **Description:** ${item.description}`);
    lines.push(`- **Components:** ${item.componentsAffected.join(', ')}`);
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Generate comprehensive audit report
 */
export async function generateReport(options: ReportOptions = {}): Promise<AuditReport> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const inputDir = join(process.cwd(), opts.inputDir);
  const outputDir = join(process.cwd(), opts.outputDir);

  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Load all analysis data
  const components =
    readJsonFile<ComponentMetadata[]>(join(inputDir, 'component-inventory.json')) || [];
  const motionAnalysis =
    readJsonFile<MotionAnalysis[]>(join(inputDir, 'motion-analysis.json')) || [];
  const storybookAnalysis =
    readJsonFile<StorybookAnalysis[]>(join(inputDir, 'storybook-coverage.json')) || [];
  const principlesCompliance =
    readJsonFile<PrinciplesCompliance[]>(join(inputDir, 'principles-compliance.json')) || [];
  // Checklist audit loaded for potential future use in detailed reports
  const _checklistAudit =
    readJsonFile<ChecklistAudit[]>(join(inputDir, 'checklist-report.json')) || [];
  void _checklistAudit; // Suppress unused variable warning
  const performanceAnalysis =
    readJsonFile<PerformancePattern[]>(join(inputDir, 'performance-analysis.json')) || [];
  const accessibilityAudit =
    readJsonFile<AccessibilityAudit[]>(join(inputDir, 'accessibility-report.json')) || [];
  const materialAnalysis =
    readJsonFile<UnifiedMaterialAnalysis[]>(join(inputDir, 'unified-material-analysis.json')) || [];
  const libraryDetection =
    readJsonFile<LibraryDetection[]>(join(inputDir, 'library-usage.json')) || [];

  // Extract issues from all analyses
  const allIssues: CategorizedIssue[] = [
    ...extractMotionIssues(motionAnalysis),
    ...extractStorybookIssues(storybookAnalysis),
    ...extractPrinciplesIssues(principlesCompliance),
    ...extractPerformanceIssues(performanceAnalysis),
    ...extractAccessibilityIssues(accessibilityAudit),
    ...extractMaterialIssues(materialAnalysis),
    ...extractLibraryIssues(libraryDetection),
  ];

  // Sort issues by priority
  const sortedIssues = sortIssuesByPriority(allIssues);

  // Generate component analysis
  const componentAnalysis = generateComponentAnalysis(
    components,
    sortedIssues,
    principlesCompliance,
    accessibilityAudit,
    storybookAnalysis
  );

  // Generate executive summary
  const executiveSummary = generateExecutiveSummary(components, componentAnalysis, sortedIssues);

  // Generate follow-up plan
  const followUpPlan = generateFollowUpPlan(sortedIssues);

  // Build report
  const report: AuditReport = {
    metadata: {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      generatedBy: 'runi-audit-agent',
    },
    executiveSummary,
    componentAnalysis,
    issues: sortedIssues,
    followUpPlan,
    analysisDataPaths: {
      componentInventory: join(inputDir, 'component-inventory.json'),
      motionAnalysis: join(inputDir, 'motion-analysis.json'),
      storybookCoverage: join(inputDir, 'storybook-coverage.json'),
      principlesCompliance: join(inputDir, 'principles-compliance.json'),
      checklistReport: join(inputDir, 'checklist-report.json'),
      performanceAnalysis: join(inputDir, 'performance-analysis.json'),
      accessibilityReport: join(inputDir, 'accessibility-report.json'),
      unifiedMaterialAnalysis: join(inputDir, 'unified-material-analysis.json'),
      libraryUsage: join(inputDir, 'library-usage.json'),
    },
  };

  // Generate outputs based on format
  if (opts.format === 'markdown' || opts.format === 'both') {
    const markdown = generateMarkdownReport(report, opts.title);
    writeFileSync(join(outputDir, 'AUDIT_REPORT.md'), markdown);
  }

  if (opts.format === 'json' || opts.format === 'both') {
    writeFileSync(join(outputDir, 'audit-report.json'), JSON.stringify(report, null, 2));
  }

  // Generate summary.json
  const summary: SummaryMetadata = {
    version: report.metadata.version,
    generatedAt: report.metadata.generatedAt,
    totalComponents: executiveSummary.totalComponents,
    overallScore: executiveSummary.overallScore,
    issues: {
      critical: executiveSummary.issuesByPriority.critical,
      high: executiveSummary.issuesByPriority.high,
      medium: executiveSummary.issuesByPriority.medium,
      low: executiveSummary.issuesByPriority.low,
      total: sortedIssues.length,
    },
    categoryScores: executiveSummary.scoresByCategory,
    reportFiles: {
      markdown: join(outputDir, 'AUDIT_REPORT.md'),
      json: join(outputDir, 'audit-report.json'),
    },
  };

  writeFileSync(join(outputDir, 'summary.json'), JSON.stringify(summary, null, 2));

  return report;
}
