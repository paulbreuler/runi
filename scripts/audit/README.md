# Component Design Principles Audit

Comprehensive systematic analysis of all runi React components to evaluate adherence to
component-driven design and DESIGN-PRINCIPLES.md criteria.

## Quick Start

**🎯 Easiest way: Run the full audit pipeline (recommended):**

```bash
npx tsx scripts/audit/run-audit.ts
```

This runs all 10 steps automatically and generates the final report. **That's it!** Check
`scripts/audit/output/AUDIT_REPORT.md` when it's done.

---

**🔧 Advanced: Run individual scripts manually (if you need step-by-step control):**

```bash
# 1. Discover all components (foundation)
npx tsx scripts/audit/discover-components.ts

# 2. Analyze Motion.dev usage
npx tsx scripts/audit/analyze-motion.ts

# 3. Analyze Storybook coverage
npx tsx scripts/audit/analyze-storybook.ts

# 4. Evaluate design principles compliance
npx tsx scripts/audit/evaluate-principles.ts

# 5. Audit implementation checklist
npx tsx scripts/audit/checklist-audit.ts

# 6. Analyze performance patterns
npx tsx scripts/audit/analyze-performance.ts

# 7. Audit accessibility
npx tsx scripts/audit/audit-accessibility.ts

# 8. Analyze unified material feel
npx tsx scripts/audit/analyze-unified-material.ts

# 9. Detect library usage
npx tsx scripts/audit/detect-libraries.ts

# 10. Generate comprehensive report
npx tsx scripts/audit/generate-report.ts
```

## Scripts Overview

### Foundation Scripts

| Script                   | Purpose                                        | Output                     | Dependencies      |
| ------------------------ | ---------------------------------------------- | -------------------------- | ----------------- |
| `discover-components.ts` | Scan codebase and catalog all React components | `component-inventory.json` | None (foundation) |

### Analysis Scripts

| Script                        | Purpose                                      | Output                           | Dependencies                                     |
| ----------------------------- | -------------------------------------------- | -------------------------------- | ------------------------------------------------ |
| `analyze-motion.ts`           | Check Motion.dev usage, flag CSS transitions | `motion-analysis.json`           | `discover-components.ts`                         |
| `analyze-storybook.ts`        | Verify Storybook stories exist and quality   | `storybook-coverage.json`        | `discover-components.ts`                         |
| `evaluate-principles.ts`      | Evaluate against 10 "Made to Be" principles  | `principles-compliance.json`     | `discover-components.ts`                         |
| `checklist-audit.ts`          | Check implementation checklist compliance    | `checklist-report.json`          | `discover-components.ts`, `analyze-storybook.ts` |
| `analyze-performance.ts`      | Review performance patterns                  | `performance-analysis.json`      | `discover-components.ts`, `analyze-motion.ts`    |
| `audit-accessibility.ts`      | Check WCAG 2.1 AA compliance                 | `accessibility-report.json`      | `discover-components.ts`                         |
| `analyze-unified-material.ts` | Evaluate unified material feel patterns      | `unified-material-analysis.json` | `discover-components.ts`, `analyze-motion.ts`    |
| `detect-libraries.ts`         | Detect custom vs external library usage      | `library-usage.json`             | `discover-components.ts`                         |

### Report Generation

| Script               | Purpose                             | Output                                                 | Dependencies         |
| -------------------- | ----------------------------------- | ------------------------------------------------------ | -------------------- |
| `generate-report.ts` | Generate comprehensive audit report | `AUDIT_REPORT.md`, `audit-report.json`, `summary.json` | All analysis scripts |

## Output Files

All output files are written to `scripts/audit/output/`:

- `component-inventory.json` - Complete component catalog
- `motion-analysis.json` - Motion.dev usage analysis
- `storybook-coverage.json` - Storybook coverage analysis
- `principles-compliance.json` - Design principles compliance
- `checklist-report.json` - Implementation checklist audit
- `performance-analysis.json` - Performance pattern analysis
- `accessibility-report.json` - Accessibility audit results
- `unified-material-analysis.json` - Unified material feel analysis
- `library-usage.json` - Library detection results
- `AUDIT_REPORT.md` - **Main comprehensive report** (read this first!)
- `audit-report.json` - Full report in JSON format
- `summary.json` - Executive summary

## Standards Reference

The audit scripts check components against:

1. **DESIGN-PRINCIPLES.md** - 10 "Made to Be" aesthetic principles, Radix-First philosophy, Motion.dev standards
2. **WCAG 2.1 Level AA** - Accessibility requirements
3. **CLAUDE.md** - Development standards (React 19, TypeScript 5.9, TDD, etc.)
4. **Industry Best Practices** - React hooks rules, TypeScript strict mode, performance patterns

## Usage Examples

### ✅ Recommended: Run Full Audit (All-in-One)

```bash
npx tsx scripts/audit/run-audit.ts
```

This single command:

1. Discovers all components
2. Runs all 9 analysis scripts
3. Generates the comprehensive report
4. Shows a summary with issue counts

**Result:** Check `scripts/audit/output/AUDIT_REPORT.md` for the full report.

### Run Single Analysis (Advanced)

```bash
# Just check Motion.dev usage
npx tsx scripts/audit/analyze-motion.ts
```

### Generate Report from Existing Data

```bash
# If you already have all analysis JSON files, just generate the report
npx tsx scripts/audit/generate-report.ts
```

### Check What's Been Run

```bash
ls -la scripts/audit/output/
```

## Dependencies

The scripts must be run in dependency order:

1. **Foundation**: `discover-components.ts` (must run first)
2. **Independent analyses** (can run in parallel after step 1):
   - `analyze-motion.ts`
   - `analyze-storybook.ts`
   - `evaluate-principles.ts`
   - `audit-accessibility.ts`
   - `detect-libraries.ts`
3. **Dependent analyses** (require step 1 + specific analyses):
   - `checklist-audit.ts` (needs `analyze-storybook.ts`)
   - `analyze-performance.ts` (needs `analyze-motion.ts`)
   - `analyze-unified-material.ts` (needs `analyze-motion.ts`)
4. **Final**: `generate-report.ts` (needs all analyses)

## Workflow

### Option 1: Full Automated Audit (Recommended)

```bash
# One command does everything
npx tsx scripts/audit/run-audit.ts
```

**What happens:**

1. ✅ Discovers all components → `component-inventory.json`
2. ✅ Analyzes Motion.dev usage → `motion-analysis.json`
3. ✅ Analyzes Storybook coverage → `storybook-coverage.json`
4. ✅ Evaluates design principles → `principles-compliance.json`
5. ✅ Audits accessibility → `accessibility-report.json`
6. ✅ Detects library usage → `library-usage.json`
7. ✅ Audits checklist → `checklist-report.json`
8. ✅ Analyzes performance → `performance-analysis.json`
9. ✅ Analyzes unified material → `unified-material-analysis.json`
10. ✅ Generates final report → `AUDIT_REPORT.md`

**Done!** Review `scripts/audit/output/AUDIT_REPORT.md`

### Option 2: Step-by-Step (If you need control)

If you want to run scripts individually:

```bash
# Step 1: Foundation (required first)
npx tsx scripts/audit/discover-components.ts

# Steps 2-6: Independent analyses (can run in any order)
npx tsx scripts/audit/analyze-motion.ts
npx tsx scripts/audit/analyze-storybook.ts
npx tsx scripts/audit/evaluate-principles.ts
npx tsx scripts/audit/audit-accessibility.ts
npx tsx scripts/audit/detect-libraries.ts

# Steps 7-9: Dependent analyses (need step 1 + specific analyses)
npx tsx scripts/audit/checklist-audit.ts        # needs storybook
npx tsx scripts/audit/analyze-performance.ts    # needs motion
npx tsx scripts/audit/analyze-unified-material.ts  # needs motion

# Step 10: Generate report (needs all analyses)
npx tsx scripts/audit/generate-report.ts
```

## Troubleshooting

### "Component inventory not found"

**Solution:** Run the discovery script first, or use the main script:

```bash
# Option 1: Run discovery manually
npx tsx scripts/audit/discover-components.ts

# Option 2: Run full audit (does discovery automatically)
npx tsx scripts/audit/run-audit.ts
```

### "No output when running script"

Make sure the script has a CLI entry point. If it doesn't, you can import and call the function:

```typescript
import { discoverComponents } from './scripts/audit/discover-components';
const components = await discoverComponents();
```

### Missing analysis files

If `generate-report.ts` complains about missing files:

**Solution:** Run the full audit script instead (it runs everything):

```bash
npx tsx scripts/audit/run-audit.ts
```

Or run the missing analysis scripts individually (see "Step-by-Step" workflow above).

## Next Steps

After running the audit:

1. Review `AUDIT_REPORT.md` for comprehensive findings
2. Prioritize fixes based on issue categories (critical → high → medium → low)
3. Create follow-up plans for systematic fixes
4. Re-run audits periodically to track progress

## Related Documentation

- **Plan**: `../runi-planning-docs/plans/0018-component-design-principles-audit/plan.md`
- **Design Principles**: `DESIGN-PRINCIPLES.md` (via MCP: `mcp_runi_Planning_read_doc({ path: 'DESIGN-PRINCIPLES.md' })`)
- **Development Standards**: `CLAUDE.md`
