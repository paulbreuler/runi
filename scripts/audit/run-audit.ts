/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Main Audit Orchestration Script
 * @description Runs all audit scripts in the correct dependency order
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { discoverComponents } from './discover-components';
import { analyzeAllMotion } from './analyze-motion';
import { analyzeAllStorybook } from './analyze-storybook';
import { evaluateAllComponents } from './evaluate-principles';
import { auditAllComponents } from './checklist-audit';
import { analyzeAllPerformance } from './analyze-performance';
import { auditAllAccessibility } from './audit-accessibility';
import { analyzeAllUnifiedMaterial } from './analyze-unified-material';
import { detectAllLibraries } from './detect-libraries';
import { generateReport } from './generate-report';

const OUTPUT_DIR = join(process.cwd(), 'scripts', 'audit', 'output');

/**
 * Write JSON output file
 */
async function writeOutput(filename: string, data: unknown): Promise<void> {
  const { writeFileSync, mkdirSync } = await import('fs');
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  const outputPath = join(OUTPUT_DIR, filename);
  writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`   ✅ Written: ${filename}`);
}

/**
 * Main audit orchestration
 */
async function main() {
  console.log('🔍 Component Design Principles Audit\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Step 1: Foundation - Component Discovery
    console.log('📋 Step 1/10: Discovering components...');
    const components = await discoverComponents();
    await writeOutput('component-inventory.json', components);
    console.log(`   Found ${components.length} components\n`);

    // Step 2-4: Independent analyses (can run in parallel, but we'll do sequentially for clarity)
    console.log('🎬 Step 2/10: Analyzing Motion.dev usage...');
    const motionAnalysis = await analyzeAllMotion();
    await writeOutput('motion-analysis.json', motionAnalysis);
    console.log(`   Analyzed ${motionAnalysis.length} components\n`);

    console.log('📚 Step 3/10: Analyzing Storybook coverage...');
    const storybookAnalysis = await analyzeAllStorybook();
    await writeOutput('storybook-coverage.json', storybookAnalysis);
    console.log(`   Analyzed ${storybookAnalysis.length} components\n`);

    console.log('✨ Step 4/10: Evaluating design principles compliance...');
    const principlesCompliance = await evaluateAllComponents();
    await writeOutput('principles-compliance.json', principlesCompliance);
    console.log(`   Evaluated ${principlesCompliance.length} components\n`);

    console.log('♿ Step 5/10: Auditing accessibility...');
    const accessibilityAudit = await auditAllAccessibility();
    await writeOutput('accessibility-report.json', accessibilityAudit);
    console.log(`   Audited ${accessibilityAudit.length} components\n`);

    console.log('📦 Step 6/10: Detecting library usage...');
    const libraryDetection = await detectAllLibraries();
    await writeOutput('library-usage.json', libraryDetection);
    console.log(`   Detected libraries in ${libraryDetection.length} components\n`);

    // Step 7-9: Dependent analyses
    console.log('✅ Step 7/10: Auditing implementation checklist...');
    const checklistAudit = await auditAllComponents();
    await writeOutput('checklist-report.json', checklistAudit);
    console.log(`   Audited ${checklistAudit.length} components\n`);

    console.log('⚡ Step 8/10: Analyzing performance patterns...');
    const performanceAnalysis = await analyzeAllPerformance();
    await writeOutput('performance-analysis.json', performanceAnalysis);
    console.log(`   Analyzed ${performanceAnalysis.length} components\n`);

    console.log('🎨 Step 9/10: Analyzing unified material feel...');
    const materialAnalysis = await analyzeAllUnifiedMaterial();
    await writeOutput('unified-material-analysis.json', materialAnalysis);
    console.log(`   Analyzed ${materialAnalysis.length} components\n`);

    // Step 10: Generate final report
    console.log('📊 Step 10/10: Generating comprehensive report...');
    const report = await generateReport();
    console.log(`   ✅ Report generated: ${join(OUTPUT_DIR, 'AUDIT_REPORT.md')}`);
    console.log(`   ✅ JSON report: ${join(OUTPUT_DIR, 'audit-report.json')}`);
    console.log(`   ✅ Summary: ${join(OUTPUT_DIR, 'summary.json')}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Audit complete!\n');
    console.log(`📄 Review the report: ${join(OUTPUT_DIR, 'AUDIT_REPORT.md')}\n`);

    // Print summary stats
    const totalIssues = report.issues.length;
    const criticalIssues = report.issues.filter((i) => i.priority === 'critical').length;
    const highIssues = report.issues.filter((i) => i.priority === 'high').length;
    const mediumIssues = report.issues.filter((i) => i.priority === 'medium').length;
    const lowIssues = report.issues.filter((i) => i.priority === 'low').length;

    console.log('📈 Summary:');
    console.log(`   Total issues: ${totalIssues}`);
    console.log(`   🔴 Critical: ${criticalIssues}`);
    console.log(`   🟠 High: ${highIssues}`);
    console.log(`   🟡 Medium: ${mediumIssues}`);
    console.log(`   🟢 Low: ${lowIssues}`);
    console.log('');
  } catch (error) {
    console.error('\n❌ Error during audit:', error);
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      if (error.stack) {
        console.error(`\n   Stack trace:\n${error.stack}`);
      }
    }
    process.exit(1);
  }
}

// Run if executed directly
const isMainModule =
  process.argv[1]?.includes('run-audit.ts') ||
  process.argv[1]?.includes('run-audit.js') ||
  (typeof require !== 'undefined' && require.main === module);

if (isMainModule) {
  main();
}
