# Component Design Principles Audit Report

Generated: 2026-01-26T05:10:19.639Z

## Executive Summary

- **Total Components Analyzed:** 98
- **Overall Compliance Score:** 60%

### Issues by Priority

| Priority | Count |
| -------- | ----- |
| Critical | 62    |
| High     | 278   |
| Medium   | 329   |
| Low      | 331   |

### Top Concerns

- 62 critical issues require immediate attention
- 278 high priority issues need resolution
- 49 component(s) have poor health scores (<60)

### Score Distribution

| Category          | Score |
| ----------------- | ----- |
| Unknown           | 45%   |
| Response          | 86%   |
| Request           | 57%   |
| Overlays          | 65%   |
| Layout            | 41%   |
| Intelligence      | 76%   |
| Core              | 53%   |
| accessibility     | 0%    |
| motion            | 0%    |
| design-principles | 0%    |
| performance       | 0%    |
| unified-material  | 0%    |
| storybook         | 0%    |

## Component Analysis

### ❌ DockablePanel

- **Path:** `src/components/Layout/DockablePanel.tsx`
- **Category:** Layout
- **Health Score:** 0%

**Issues:**

- 🟠 High: 22
- 🟡 Medium: 6

**Findings:**

- 22 high priority issue(s) found

**Recommendations:**

- Use semantic tokens like bg-background, text-foreground, or design system tokens
- Add onKeyDown handler for keyboard interaction
- Add tabindex="0" for custom interactive elements
- Add proper ARIA labels and semantic HTML
- Consolidate to single motion.div with variant orchestration

### ❌ DockControls

- **Path:** `src/components/Layout/DockControls.tsx`
- **Category:** Layout
- **Health Score:** 3%

**Issues:**

- 🟠 High: 9
- 🟡 Medium: 6

**Findings:**

- 9 high priority issue(s) found

**Recommendations:**

- Add onKeyDown handler for keyboard interaction
- Add tabindex="0" for custom interactive elements
- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Use parent hover state with children inheriting via variants

### ❌ ConsoleToolbar

- **Path:** `src/components/Console/ConsoleToolbar.tsx`
- **Category:** Unknown
- **Health Score:** 18%

**Issues:**

- 🟠 High: 7
- 🟡 Medium: 2

**Findings:**

- 7 high priority issue(s) found

**Recommendations:**

- Add aria-label to icon-only button
- Add onKeyDown handler for keyboard interaction
- Add tabindex="0" for custom interactive elements
- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook

### ❌ FilterBarActions

- **Path:** `src/components/History/FilterBarActions.tsx`
- **Category:** Intelligence
- **Health Score:** 23%

**Issues:**

- 🟠 High: 6
- 🟡 Medium: 2

**Findings:**

- 6 high priority issue(s) found

**Recommendations:**

- Add onKeyDown handler for keyboard interaction
- Add tabindex="0" for custom interactive elements
- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Create Storybook story with Playground and key states

### ❌ RequestBuilder

- **Path:** `src/components/Request/RequestBuilder.tsx`
- **Category:** Request
- **Health Score:** 25%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 4
- 🟡 Medium: 3

**Findings:**

- 1 critical issue(s) require immediate attention
- 4 high priority issue(s) found

**Recommendations:**

- Add keyboard support for all interactive elements
- Add onKeyDown handler for keyboard interaction
- Add tabindex="0" for custom interactive elements
- Add proper ARIA labels and semantic HTML
- Consolidate to single motion.div with variant orchestration

### ❌ BadgeCount

- **Path:** `src/components/ui/SegmentedControl/BadgeCount.tsx`
- **Category:** Overlays
- **Health Score:** 25%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 6
- 🟡 Medium: 6

**Findings:**

- 1 critical issue(s) require immediate attention
- 6 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add motion reduction support using useReducedMotion hook or media query
- Use semantic tokens like bg-background, text-foreground, or design system tokens
- Add proper ARIA labels and semantic HTML
- Consider using Motion.dev animate prop or transition prop instead

### ❌ MetricsToggle

- **Path:** `src/components/Metrics/MetricsToggle.tsx`
- **Category:** Unknown
- **Health Score:** 29%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 3
- 🟡 Medium: 3

**Findings:**

- 1 critical issue(s) require immediate attention
- 3 high priority issue(s) found

**Recommendations:**

- Add keyboard support for all interactive elements
- Add onKeyDown handler for keyboard interaction
- Add tabindex="0" for custom interactive elements
- Add prefers-reduced-motion media query or useReducedMotion hook
- Create Storybook story with Playground and key states

### ❌ PanelContent

- **Path:** `src/components/PanelContent.tsx`
- **Category:** Unknown
- **Health Score:** 30%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 3
- 🟡 Medium: 4

**Findings:**

- 1 critical issue(s) require immediate attention
- 3 high priority issue(s) found

**Recommendations:**

- Add keyboard support for all interactive elements
- Add motion reduction support using useReducedMotion hook or media query
- Add proper ARIA labels and semantic HTML
- Consolidate to single motion.div with variant orchestration
- Create Storybook story with Playground and key states

### ❌ EnhancedDissipatingParticles

- **Path:** `src/components/ui/SegmentedControl/effects.tsx`
- **Category:** Overlays
- **Health Score:** 30%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 3
- 🟡 Medium: 6

**Findings:**

- 1 critical issue(s) require immediate attention
- 3 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add motion reduction support using useReducedMotion hook or media query
- Add proper ARIA labels and semantic HTML
- Consolidate to single motion.div with variant orchestration
- Consider using Motion.dev animate prop or transition prop instead

### ❌ PulsingGlow

- **Path:** `src/components/ui/PulsingGlow.tsx`
- **Category:** Overlays
- **Health Score:** 34%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 3
- 🟡 Medium: 3

**Findings:**

- 1 critical issue(s) require immediate attention
- 3 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add motion reduction support using useReducedMotion hook or media query
- Use semantic tokens like bg-background, text-foreground, or design system tokens
- Add proper ARIA labels and semantic HTML
- Create Storybook story with Playground and key states

### ❌ Dialog

- **Path:** `src/components/ui/Dialog.tsx`
- **Category:** Overlays
- **Health Score:** 34%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 2
- 🟡 Medium: 5

**Findings:**

- 1 critical issue(s) require immediate attention
- 2 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Consolidate to single motion.div with variant orchestration
- Create Storybook story with Playground and key states
- Use subtle shadows (shadow-xs, shadow-sm, shadow-md) for zen aesthetic

### ❌ ExpandedContent

- **Path:** `src/components/DataGrid/ExpandedContent.tsx`
- **Category:** Core
- **Health Score:** 35%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 3
- 🟡 Medium: 3

**Findings:**

- 1 critical issue(s) require immediate attention
- 3 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Batch DOM reads and writes to avoid layout thrashing
- Add proper ARIA labels and semantic HTML
- Consolidate to single motion.div with variant orchestration
- Create Storybook story with Playground and key states

### ❌ TLSPanel

- **Path:** `src/components/History/TLSPanel.tsx`
- **Category:** Intelligence
- **Health Score:** 36%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 4

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Create Storybook story with Playground and key states
- Consider using more generous padding (p-6, p-8) for larger sections
- Use transform and opacity instead of top/left for animations

### ❌ CertificateInfo

- **Path:** `src/components/History/CertificateInfo.tsx`
- **Category:** Intelligence
- **Health Score:** 36%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 2
- 🟡 Medium: 3

**Findings:**

- 1 critical issue(s) require immediate attention
- 2 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Create Storybook story with Playground and key states
- Consider using more generous padding (p-6, p-8) for larger sections

### ❌ ConsoleContextMenu

- **Path:** `src/components/Console/ConsoleContextMenu.tsx`
- **Category:** Unknown
- **Health Score:** 37%

**Issues:**

- 🟠 High: 2
- 🟡 Medium: 7

**Findings:**

- 2 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Consider using Motion.dev for complex animations; simple transitions may be acceptable
- Create Storybook story with Playground and key states
- Use subtle shadows (shadow-xs, shadow-sm, shadow-md) for zen aesthetic

### ❌ ResponsePanel

- **Path:** `src/components/History/ResponsePanel.tsx`
- **Category:** Intelligence
- **Health Score:** 37%

**Issues:**

- 🟠 High: 2
- 🟡 Medium: 6

**Findings:**

- 2 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Consider using Motion.dev for complex animations; simple transitions may be acceptable
- Create Storybook story with Playground and key states
- Consider using Motion for complex animations instead of CSS transitions

### ❌ DialogFooter

- **Path:** `src/components/ui/DialogFooter.tsx`
- **Category:** Overlays
- **Health Score:** 38%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 3

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Create Storybook story with Playground and key states
- Use transform and opacity instead of top/left for animations
- Replace div/span with semantic HTML element

### ❌ DialogContent

- **Path:** `src/components/ui/DialogContent.tsx`
- **Category:** Overlays
- **Health Score:** 38%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 3

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Create Storybook story with Playground and key states
- Use transform and opacity instead of top/left for animations
- Replace div/span with semantic HTML element

### ❌ MetricsPanel

- **Path:** `src/components/Metrics/MetricsPanel.tsx`
- **Category:** Unknown
- **Health Score:** 38%

**Issues:**

- 🟠 High: 2
- 🟡 Medium: 5

**Findings:**

- 2 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Consider using Motion.dev for complex animations; simple transitions may be acceptable
- Create Storybook story with Playground and key states
- Consider using more generous padding (p-6, p-8) for larger sections

### ❌ MetricsGrid

- **Path:** `src/components/Metrics/MetricsGrid.tsx`
- **Category:** Unknown
- **Health Score:** 38%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 3

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Create Storybook story with Playground and key states
- Use transform and opacity instead of top/left for animations
- Replace div/span with semantic HTML element

### ❌ createConsoleColumns

- **Path:** `src/components/DataGrid/columns/consoleColumns.tsx`
- **Category:** Core
- **Health Score:** 38%

**Issues:**

- 🟠 High: 2
- 🟡 Medium: 5

**Findings:**

- 2 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Consider using Motion.dev for complex animations; simple transitions may be acceptable
- Create Storybook story with Playground and key states
- Consider using Motion for complex animations instead of CSS transitions

### ❌ createNetworkColumns

- **Path:** `src/components/DataGrid/columns/networkColumns.tsx`
- **Category:** Core
- **Health Score:** 39%

**Issues:**

- 🟠 High: 2
- 🟡 Medium: 4

**Findings:**

- 2 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Consider using Motion.dev for complex animations; simple transitions may be acceptable
- Create Storybook story with Playground and key states
- Consider using Motion for complex animations instead of CSS transitions

### ❌ Tooltip

- **Path:** `src/components/ui/Tooltip.tsx`
- **Category:** Overlays
- **Health Score:** 40%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 3

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Create Storybook story with Playground and key states
- Use subtle shadows (shadow-xs, shadow-sm, shadow-md) for zen aesthetic
- Use transform and opacity instead of top/left for animations

### ❌ AppMetricsLog

- **Path:** `src/components/Console/AppMetricsLog.tsx`
- **Category:** Unknown
- **Health Score:** 40%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 2

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Create Storybook story with Playground and key states
- Use transform and opacity instead of top/left for animations
- Add stories for loading, error, and empty states

### ❌ TableHeaderRow

- **Path:** `src/components/DataGrid/columns/tableHeaderRow.tsx`
- **Category:** Core
- **Health Score:** 40%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 2
- 🟡 Medium: 2

**Findings:**

- 1 critical issue(s) require immediate attention
- 2 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Create Storybook story with Playground and key states
- Use transform and opacity instead of top/left for animations

### ❌ SortIndicator

- **Path:** `src/components/DataGrid/columns/SortIndicator.tsx`
- **Category:** Core
- **Health Score:** 40%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 2
- 🟡 Medium: 2

**Findings:**

- 1 critical issue(s) require immediate attention
- 2 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Create Storybook story with Playground and key states
- Use transform and opacity instead of top/left for animations

### ❌ MetricCell

- **Path:** `src/components/Metrics/MetricCell.tsx`
- **Category:** Unknown
- **Health Score:** 42%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 2

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Create Storybook story with Playground and key states
- Use transform and opacity instead of top/left for animations
- Add stories for loading, error, and empty states

### ❌ MemoryWarningListener

- **Path:** `src/components/Memory/MemoryWarningListener.tsx`
- **Category:** Unknown
- **Health Score:** 42%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 2

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Create Storybook story with Playground and key states
- Use transform and opacity instead of top/left for animations
- Add stories for loading, error, and empty states

### ❌ AppMetricsContainer

- **Path:** `src/components/Console/AppMetricsContainer.tsx`
- **Category:** Unknown
- **Health Score:** 42%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 2

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Create Storybook story with Playground and key states
- Use transform and opacity instead of top/left for animations
- Add stories for loading, error, and empty states

### ❌ TLSTab

- **Path:** `src/components/History/TLSTab.tsx`
- **Category:** Intelligence
- **Health Score:** 42%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 2

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Create Storybook story with Playground and key states
- Use transform and opacity instead of top/left for animations
- Add stories for loading, error, and empty states

### ❌ useOptionalActionBarContext

- **Path:** `src/components/ActionBar/ActionBarContext.tsx`
- **Category:** Core
- **Health Score:** 42%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 2

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Create Storybook story with Playground and key states
- Use transform and opacity instead of top/left for animations
- Add stories for loading, error, and empty states

### ❌ DataGridHeader

- **Path:** `src/components/DataGrid/DataGridHeader.tsx`
- **Category:** Core
- **Health Score:** 42%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 2

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Create Storybook story with Playground and key states
- Use transform and opacity instead of top/left for animations
- Add stories for loading, error, and empty states

### ❌ TabNavigation

- **Path:** `src/components/DataGrid/tabs/TabNavigation.tsx`
- **Category:** Core
- **Health Score:** 42%

**Issues:**

- 🟠 High: 1
- 🟡 Medium: 3

**Findings:**

- 1 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add proper ARIA labels and semantic HTML
- Create Storybook story with Playground and key states
- Use transform and opacity instead of top/left for animations
- Replace div/span with semantic HTML element
- Add stories for loading, error, and empty states

### ❌ ExpandedActionButtons

- **Path:** `src/components/DataGrid/tabs/ExpandedActionButtons.tsx`
- **Category:** Core
- **Health Score:** 42%

**Issues:**

- 🟠 High: 2
- 🟡 Medium: 3

**Findings:**

- 2 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Create Storybook story with Playground and key states
- Use transform and opacity instead of top/left for animations
- Replace div/span with semantic HTML element

### ❌ UrlCell

- **Path:** `src/components/DataGrid/columns/urlCell.tsx`
- **Category:** Core
- **Health Score:** 42%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 2

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Create Storybook story with Playground and key states
- Use transform and opacity instead of top/left for animations
- Add stories for loading, error, and empty states

### ❌ TimingCell

- **Path:** `src/components/DataGrid/columns/timingCell.tsx`
- **Category:** Core
- **Health Score:** 42%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 2

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Create Storybook story with Playground and key states
- Use transform and opacity instead of top/left for animations
- Add stories for loading, error, and empty states

### ❌ TimeAgoCell

- **Path:** `src/components/DataGrid/columns/timeAgoCell.tsx`
- **Category:** Core
- **Health Score:** 42%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 2

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Create Storybook story with Playground and key states
- Use transform and opacity instead of top/left for animations
- Add stories for loading, error, and empty states

### ❌ StatusCell

- **Path:** `src/components/DataGrid/columns/statusCell.tsx`
- **Category:** Core
- **Health Score:** 42%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 2

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Create Storybook story with Playground and key states
- Use transform and opacity instead of top/left for animations
- Add stories for loading, error, and empty states

### ❌ SizeCell

- **Path:** `src/components/DataGrid/columns/sizeCell.tsx`
- **Category:** Core
- **Health Score:** 42%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 2

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Create Storybook story with Playground and key states
- Use transform and opacity instead of top/left for animations
- Add stories for loading, error, and empty states

### ❌ createSelectionColumn

- **Path:** `src/components/DataGrid/columns/selectionColumn.tsx`
- **Category:** Core
- **Health Score:** 42%

**Issues:**

- 🟠 High: 2
- 🟡 Medium: 3

**Findings:**

- 2 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Create Storybook story with Playground and key states
- Use transform and opacity instead of top/left for animations
- Replace div/span with semantic HTML element

### ❌ ProtocolCell

- **Path:** `src/components/DataGrid/columns/protocolCell.tsx`
- **Category:** Core
- **Health Score:** 42%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 2

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Create Storybook story with Playground and key states
- Use transform and opacity instead of top/left for animations
- Add stories for loading, error, and empty states

### ❌ MethodCell

- **Path:** `src/components/DataGrid/columns/methodCell.tsx`
- **Category:** Core
- **Health Score:** 42%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 2

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Create Storybook story with Playground and key states
- Use transform and opacity instead of top/left for animations
- Add stories for loading, error, and empty states

### ❌ useKeyboardNavExpander

- **Path:** `src/components/DataGrid/accessibility/keyboardNav.tsx`
- **Category:** Core
- **Health Score:** 42%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 2

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Create Storybook story with Playground and key states
- Use transform and opacity instead of top/left for animations
- Add stories for loading, error, and empty states

### ❌ createExpanderColumn

- **Path:** `src/components/DataGrid/columns/expanderColumn.tsx`
- **Category:** Core
- **Health Score:** 43%

**Issues:**

- 🟠 High: 1
- 🟡 Medium: 3

**Findings:**

- 1 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add proper ARIA labels and semantic HTML
- Consider using Motion.dev for complex animations; simple transitions may be acceptable
- Create Storybook story with Playground and key states
- Add subtle shadow or scale change on hover
- Add stories for loading, error, and empty states

### ❌ ParamsEditor

- **Path:** `src/components/Request/ParamsEditor.tsx`
- **Category:** Request
- **Health Score:** 46%

**Issues:**

- 🟠 High: 12
- 🟡 Medium: 5

**Findings:**

- 12 high priority issue(s) found
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add motion reduction support using useReducedMotion hook or media query
- Add aria-label to icon-only button
- Add onKeyDown handler for keyboard interaction
- Add tabindex="0" for custom interactive elements
- Add htmlFor attribute to label element

### ❌ HeaderEditor

- **Path:** `src/components/Request/HeaderEditor.tsx`
- **Category:** Request
- **Health Score:** 46%

**Issues:**

- 🟠 High: 12
- 🟡 Medium: 5

**Findings:**

- 12 high priority issue(s) found
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add motion reduction support using useReducedMotion hook or media query
- Add aria-label to icon-only button
- Add onKeyDown handler for keyboard interaction
- Add tabindex="0" for custom interactive elements
- Add htmlFor attribute to label element

### ❌ SplitButton

- **Path:** `src/components/ui/SplitButton.tsx`
- **Category:** Overlays
- **Health Score:** 47%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 12
- 🟡 Medium: 13

**Findings:**

- 1 critical issue(s) require immediate attention
- 12 high priority issue(s) found
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add keyboard support for all interactive elements
- Add motion reduction support using useReducedMotion hook or media query
- Use semantic tokens like bg-background, text-foreground, or design system tokens
- Use semantic tokens that work in both light and dark modes
- Add onKeyDown handler for keyboard interaction

### ❌ MainLayout

- **Path:** `src/components/Layout/MainLayout.tsx`
- **Category:** Layout
- **Health Score:** 56%

**Issues:**

- 🟠 High: 5
- 🟡 Medium: 4

**Findings:**

- 5 high priority issue(s) found
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add onKeyDown handler for keyboard interaction
- Add tabindex="0" for custom interactive elements
- Add proper ARIA labels and semantic HTML
- Consolidate to single motion.div with variant orchestration
- Consider using more generous padding (p-6, p-8) for larger sections

### ❌ TitleBar

- **Path:** `src/components/Layout/TitleBar.tsx`
- **Category:** Layout
- **Health Score:** 59%

**Issues:**

- 🟠 High: 3
- 🟡 Medium: 6

**Findings:**

- 3 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Use parent hover state with children inheriting via variants
- Consider using Motion.dev for complex animations; simple transitions may be acceptable
- Consider using Motion for complex animations instead of CSS transitions

### ⚠️ VirtualDataGrid

- **Path:** `src/components/DataGrid/VirtualDataGrid.tsx`
- **Category:** Core
- **Health Score:** 60%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 7
- 🟡 Medium: 6

**Findings:**

- 1 critical issue(s) require immediate attention
- 7 high priority issue(s) found
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add keyboard support for all interactive elements
- Use semantic tokens like bg-background, text-foreground, or design system tokens
- Add onKeyDown handler for keyboard interaction
- Add tabindex="0" for custom interactive elements
- Add proper ARIA labels and semantic HTML

### ⚠️ StatusBar

- **Path:** `src/components/Layout/StatusBar.tsx`
- **Category:** Layout
- **Health Score:** 62%

**Issues:**

- 🟠 High: 2
- 🟡 Medium: 3

**Findings:**

- 2 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Consider using Motion.dev for complex animations; simple transitions may be acceptable
- Consider using Motion for complex animations instead of CSS transitions
- Use transform and opacity instead of top/left for animations

### ⚠️ Switch

- **Path:** `src/components/ui/Switch.tsx`
- **Category:** Overlays
- **Health Score:** 65%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 5
- 🟡 Medium: 4

**Findings:**

- 1 critical issue(s) require immediate attention
- 5 high priority issue(s) found
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add keyboard support for all interactive elements
- Add motion reduction support using useReducedMotion hook or media query
- Use semantic tokens like bg-background, text-foreground, or design system tokens
- Use semantic tokens that work in both light and dark modes
- Add proper ARIA labels and semantic HTML

### ⚠️ Sidebar

- **Path:** `src/components/Layout/Sidebar.tsx`
- **Category:** Layout
- **Health Score:** 67%

**Issues:**

- 🟠 High: 5
- 🟡 Medium: 5

**Findings:**

- 5 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add motion reduction support using useReducedMotion hook or media query
- Batch DOM reads and writes to avoid layout thrashing
- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Consolidate to single motion.div with variant orchestration

### ⚠️ SegmentedControl

- **Path:** `src/components/ui/SegmentedControl/SegmentedControl.tsx`
- **Category:** Overlays
- **Health Score:** 71%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 6
- 🟡 Medium: 4

**Findings:**

- 1 critical issue(s) require immediate attention
- 6 high priority issue(s) found
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add keyboard support for all interactive elements
- Use semantic tokens like bg-background, text-foreground, or design system tokens
- Add onKeyDown handler for keyboard interaction
- Add tabindex="0" for custom interactive elements
- Add proper ARIA labels and semantic HTML

### ⚠️ DialogHeader

- **Path:** `src/components/ui/DialogHeader.tsx`
- **Category:** Overlays
- **Health Score:** 72%

**Issues:**

- 🟠 High: 2
- 🟡 Medium: 4

**Findings:**

- 2 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Consider using Motion.dev for complex animations; simple transitions may be acceptable
- Consider using more generous padding (p-6, p-8) for larger sections
- Consider using Motion for complex animations instead of CSS transitions

### ⚠️ PanelTabs

- **Path:** `src/components/PanelTabs.tsx`
- **Category:** Unknown
- **Health Score:** 73%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 3
- 🟡 Medium: 2

**Findings:**

- 1 critical issue(s) require immediate attention
- 3 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Consolidate to single motion.div with variant orchestration
- Use parent hover state with children inheriting via variants
- Use transform and opacity instead of top/left for animations

### ⚠️ ConsolePanel

- **Path:** `src/components/Console/ConsolePanel.tsx`
- **Category:** Unknown
- **Health Score:** 75%

**Issues:**

- 🟠 High: 3
- 🟡 Medium: 5

**Findings:**

- 3 high priority issue(s) found
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add onKeyDown handler for keyboard interaction
- Add tabindex="0" for custom interactive elements
- Add proper ARIA labels and semantic HTML
- Consider using Motion.dev for complex animations; simple transitions may be acceptable
- Consider using Motion for complex animations instead of CSS transitions

### ⚠️ NetworkHistoryPanel

- **Path:** `src/components/History/NetworkHistoryPanel.tsx`
- **Category:** Intelligence
- **Health Score:** 75%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 3
- 🟡 Medium: 5

**Findings:**

- 1 critical issue(s) require immediate attention
- 3 high priority issue(s) found
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add keyboard support for all interactive elements
- Add onKeyDown handler for keyboard interaction
- Add tabindex="0" for custom interactive elements
- Add proper ARIA labels and semantic HTML
- Consider using Motion.dev for complex animations; simple transitions may be acceptable

### ⚠️ ActionBarCompositeButton

- **Path:** `src/components/ActionBar/ActionBarCompositeButton.tsx`
- **Category:** Core
- **Health Score:** 75%

**Issues:**

- 🟠 High: 4
- 🟡 Medium: 1

**Findings:**

- 4 high priority issue(s) found

**Recommendations:**

- Add onKeyDown handler for keyboard interaction
- Add tabindex="0" for custom interactive elements
- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Use transform and opacity instead of top/left for animations

### ⚠️ SignalDot

- **Path:** `src/components/History/SignalDot.tsx`
- **Category:** Intelligence
- **Health Score:** 76%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 3

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Use subtle scale values (1.01-1.02 or 0.98-0.99) for zen aesthetic
- Use subtle, intentional animations instead of flashy ones
- Use transform and opacity instead of top/left for animations

### ⚠️ IntelligenceSignals

- **Path:** `src/components/History/IntelligenceSignals.tsx`
- **Category:** Intelligence
- **Health Score:** 76%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 1

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Use transform and opacity instead of top/left for animations
- Add play functions to test component interactions
- Consider using 8px grid spacing (p-2, p-4, p-6, p-8)

### ⚠️ ExpandedPanel

- **Path:** `src/components/DataGrid/tabs/ExpandedPanel.tsx`
- **Category:** Core
- **Health Score:** 76%

**Issues:**

- 🟠 High: 1
- 🟡 Medium: 2

**Findings:**

- 1 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add proper ARIA labels and semantic HTML
- Use transform and opacity instead of top/left for animations
- Replace div/span with semantic HTML element
- Add stories for loading, error, and empty states
- Use layout="position" instead of full layout animations when possible

### ⚠️ button

- **Path:** `src/components/ui/button.tsx`
- **Category:** Overlays
- **Health Score:** 77%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 4
- 🟡 Medium: 8

**Findings:**

- 1 critical issue(s) require immediate attention
- 4 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add keyboard support for all interactive elements
- Add motion reduction support using useReducedMotion hook or media query
- Use semantic tokens like bg-background, text-foreground, or design system tokens
- Add proper ARIA labels and semantic HTML
- Use parent hover state with children inheriting via variants

### ⚠️ ActionBar

- **Path:** `src/components/ActionBar/ActionBar.tsx`
- **Category:** Core
- **Health Score:** 77%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 2
- 🟡 Medium: 3

**Findings:**

- 1 critical issue(s) require immediate attention
- 2 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Consolidate to single motion.div with variant orchestration
- Use transform and opacity instead of top/left for animations
- Replace div/span with semantic HTML element

### ⚠️ Toast

- **Path:** `src/components/ui/Toast.tsx`
- **Category:** Overlays
- **Health Score:** 78%

**Issues:**

- 🟠 High: 5
- 🟡 Medium: 9

**Findings:**

- 5 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Use semantic tokens like bg-background, text-foreground, or design system tokens
- Consolidate to single motion.div with variant orchestration
- Use parent hover state with children inheriting via variants
- Consider using Motion.dev animate prop or transition prop instead
- Consider using Motion.dev for complex animations; simple transitions may be acceptable

### ⚠️ checkbox

- **Path:** `src/components/ui/checkbox.tsx`
- **Category:** Overlays
- **Health Score:** 79%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 3
- 🟡 Medium: 8

**Findings:**

- 1 critical issue(s) require immediate attention
- 3 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add keyboard support for all interactive elements
- Add motion reduction support using useReducedMotion hook or media query
- Use semantic tokens like bg-background, text-foreground, or design system tokens
- Add proper ARIA labels and semantic HTML
- Consider using Motion.dev for complex animations; simple transitions may be acceptable

### ✅ ActionBarSelect

- **Path:** `src/components/ActionBar/ActionBarSelect.tsx`
- **Category:** Core
- **Health Score:** 80%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 2
- 🟡 Medium: 2

**Findings:**

- 1 critical issue(s) require immediate attention
- 2 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Consider using more generous padding (p-6, p-8) for larger sections
- Use transform and opacity instead of top/left for animations

### ✅ Label

- **Path:** `src/components/ui/Label.tsx`
- **Category:** Overlays
- **Health Score:** 81%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 1

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Use transform and opacity instead of top/left for animations
- Use layout="position" instead of full layout animations when possible

### ✅ ActionBarSegment

- **Path:** `src/components/ActionBar/ActionBarSegment.tsx`
- **Category:** Core
- **Health Score:** 81%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 2
- 🟡 Medium: 1

**Findings:**

- 1 critical issue(s) require immediate attention
- 2 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Use transform and opacity instead of top/left for animations
- Add play functions to test component interactions

### ✅ ActionBarSearch

- **Path:** `src/components/ActionBar/ActionBarSearch.tsx`
- **Category:** Core
- **Health Score:** 81%

**Issues:**

- 🟠 High: 2
- 🟡 Medium: 4

**Findings:**

- 2 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Consider using Motion.dev for complex animations; simple transitions may be acceptable
- Consider using Motion for complex animations instead of CSS transitions
- Use transform and opacity instead of top/left for animations

### ✅ ActionBarGroup

- **Path:** `src/components/ActionBar/ActionBarGroup.tsx`
- **Category:** Core
- **Health Score:** 81%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 2
- 🟡 Medium: 1

**Findings:**

- 1 critical issue(s) require immediate attention
- 2 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Use transform and opacity instead of top/left for animations
- Add play functions to test component interactions

### ✅ input

- **Path:** `src/components/ui/input.tsx`
- **Category:** Overlays
- **Health Score:** 82%

**Issues:**

- 🟠 High: 5
- 🟡 Medium: 3

**Findings:**

- 5 high priority issue(s) found
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add motion reduction support using useReducedMotion hook or media query
- Use semantic tokens like bg-background, text-foreground, or design system tokens
- Add htmlFor attribute to label element
- Add proper ARIA labels and semantic HTML
- Consider using Motion.dev for complex animations; simple transitions may be acceptable

### ✅ renderIntelligenceOption

- **Path:** `src/components/ActionBar/selectRenderers.tsx`
- **Category:** Core
- **Health Score:** 83%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 1

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Use transform and opacity instead of top/left for animations
- Add play functions to test component interactions
- Use layout="position" instead of full layout animations when possible

### ✅ AuthEditor

- **Path:** `src/components/Request/AuthEditor.tsx`
- **Category:** Request
- **Health Score:** 84%

**Issues:**

- 🟠 High: 4
- 🟡 Medium: 2

**Findings:**

- 4 high priority issue(s) found
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add motion reduction support using useReducedMotion hook or media query
- Add htmlFor attribute to label element
- Add proper ARIA labels and semantic HTML
- Consolidate to single motion.div with variant orchestration
- Add prefers-reduced-motion support

### ✅ TimingWaterfall

- **Path:** `src/components/History/TimingWaterfall.tsx`
- **Category:** Intelligence
- **Health Score:** 84%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 4
- 🟡 Medium: 2

**Findings:**

- 1 critical issue(s) require immediate attention
- 4 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add keyboard support for all interactive elements
- Use semantic tokens like bg-background, text-foreground, or design system tokens
- Batch DOM reads and writes to avoid layout thrashing
- Add proper ARIA labels and semantic HTML
- Consolidate to single motion.div with variant orchestration

### ✅ CodeEditor

- **Path:** `src/components/CodeHighlighting/CodeEditor.tsx`
- **Category:** Unknown
- **Health Score:** 84%

**Issues:**

- 🟠 High: 4
- 🟡 Medium: 5

**Findings:**

- 4 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add motion reduction support using useReducedMotion hook or media query
- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Consolidate to single motion.div with variant orchestration
- Consider using Motion.dev for complex animations; simple transitions may be acceptable

### ✅ ResponseViewer

- **Path:** `src/components/Response/ResponseViewer.tsx`
- **Category:** Response
- **Health Score:** 85%

**Issues:**

- 🟠 High: 2
- 🟡 Medium: 4

**Findings:**

- 2 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add proper ARIA labels and semantic HTML
- Consolidate to single motion.div with variant orchestration
- Consider using Motion.dev for complex animations; simple transitions may be acceptable
- Use transform and opacity instead of top/left for animations
- Replace div/span with semantic HTML element

### ✅ RequestHeader

- **Path:** `src/components/Request/RequestHeader.tsx`
- **Category:** Request
- **Health Score:** 85%

**Issues:**

- 🟠 High: 4
- 🟡 Medium: 5

**Findings:**

- 4 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add motion reduction support using useReducedMotion hook or media query
- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Consolidate to single motion.div with variant orchestration
- Consider using Motion.dev for complex animations; simple transitions may be acceptable

### ✅ card

- **Path:** `src/components/ui/card.tsx`
- **Category:** Overlays
- **Health Score:** 85%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 2
- 🟡 Medium: 4

**Findings:**

- 1 critical issue(s) require immediate attention
- 2 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add keyboard support for all interactive elements
- Add motion reduction support using useReducedMotion hook or media query
- Add proper ARIA labels and semantic HTML
- Consider using Motion.dev animate prop or transition prop instead
- Use transform and opacity instead of top/left for animations

### ✅ EmptyState

- **Path:** `src/components/ui/EmptyState.tsx`
- **Category:** Overlays
- **Health Score:** 85%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 2
- 🟡 Medium: 6

**Findings:**

- 1 critical issue(s) require immediate attention
- 2 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Consolidate to single motion.div with variant orchestration
- Consider using Motion.dev animate prop or transition prop instead
- Use transform and opacity instead of top/left for animations

### ✅ StatusBadge

- **Path:** `src/components/Response/StatusBadge.tsx`
- **Category:** Response
- **Health Score:** 86%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 3

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Consider using Motion.dev for complex animations; simple transitions may be acceptable
- Consider using Motion for complex animations instead of CSS transitions
- Use transform and opacity instead of top/left for animations

### ✅ TimingTab

- **Path:** `src/components/History/TimingTab.tsx`
- **Category:** Intelligence
- **Health Score:** 86%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 4

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Consider using more generous padding (p-6, p-8) for larger sections
- Use subtle, intentional animations instead of flashy ones
- Use transform and opacity instead of top/left for animations

### ✅ DataPanelHeader

- **Path:** `src/components/ui/DataPanelHeader.tsx`
- **Category:** Overlays
- **Health Score:** 88%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 2
- 🟡 Medium: 2

**Findings:**

- 1 critical issue(s) require immediate attention
- 2 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Use transform and opacity instead of top/left for animations
- Replace div/span with semantic HTML element

### ✅ HeadersPanel

- **Path:** `src/components/History/HeadersPanel.tsx`
- **Category:** Intelligence
- **Health Score:** 88%

**Issues:**

- 🟠 High: 2
- 🟡 Medium: 5

**Findings:**

- 2 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Consider using Motion.dev for complex animations; simple transitions may be acceptable
- Consider using Motion for complex animations instead of CSS transitions
- Use transform and opacity instead of top/left for animations

### ✅ CodeBox

- **Path:** `src/components/History/CodeBox.tsx`
- **Category:** Intelligence
- **Health Score:** 88%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 2
- 🟡 Medium: 3

**Findings:**

- 1 critical issue(s) require immediate attention
- 2 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Use transform and opacity instead of top/left for animations
- Replace div/span with semantic HTML element

### ✅ LanguageTabs

- **Path:** `src/components/History/LanguageTabs.tsx`
- **Category:** Intelligence
- **Health Score:** 89%

**Issues:**

- 🟠 High: 2
- 🟡 Medium: 4

**Findings:**

- 2 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Consider using Motion.dev for complex animations; simple transitions may be acceptable
- Consider using Motion for complex animations instead of CSS transitions
- Use transform and opacity instead of top/left for animations

### ✅ CodeGenPanel

- **Path:** `src/components/History/CodeGenPanel.tsx`
- **Category:** Intelligence
- **Health Score:** 89%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 2
- 🟡 Medium: 2

**Findings:**

- 1 critical issue(s) require immediate attention
- 2 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Use transform and opacity instead of top/left for animations
- Replace div/span with semantic HTML element

### ✅ select

- **Path:** `src/components/ui/select.tsx`
- **Category:** Overlays
- **Health Score:** 90%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 3

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Consider using Motion.dev for complex animations; simple transitions may be acceptable
- Consider using Motion for complex animations instead of CSS transitions
- Use transform and opacity instead of top/left for animations

### ✅ CodeGenTab

- **Path:** `src/components/History/CodeGenTab.tsx`
- **Category:** Intelligence
- **Health Score:** 90%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 2

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Use transform and opacity instead of top/left for animations
- Replace div/span with semantic HTML element
- Use layout="position" instead of full layout animations when possible

### ✅ FilterBar

- **Path:** `src/components/History/FilterBar.tsx`
- **Category:** Intelligence
- **Health Score:** 91%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 2
- 🟡 Medium: 1

**Findings:**

- 1 critical issue(s) require immediate attention
- 2 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Use transform and opacity instead of top/left for animations
- Use layout="position" instead of full layout animations when possible

### ✅ CopyButton

- **Path:** `src/components/History/CopyButton.tsx`
- **Category:** Intelligence
- **Health Score:** 91%

**Issues:**

- 🟠 High: 2
- 🟡 Medium: 3

**Findings:**

- 2 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Consider using Motion.dev for complex animations; simple transitions may be acceptable
- Consider using Motion for complex animations instead of CSS transitions
- Use transform and opacity instead of top/left for animations

### ✅ separator

- **Path:** `src/components/ui/separator.tsx`
- **Category:** Overlays
- **Health Score:** 93%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 1

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Use transform and opacity instead of top/left for animations
- Use layout="position" instead of full layout animations when possible

### ✅ DataPanel

- **Path:** `src/components/ui/DataPanel.tsx`
- **Category:** Overlays
- **Health Score:** 93%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 1

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Use transform and opacity instead of top/left for animations
- Use layout="position" instead of full layout animations when possible

### ✅ NetworkHistoryFilters

- **Path:** `src/components/History/NetworkHistoryFilters.tsx`
- **Category:** Intelligence
- **Health Score:** 93%

**Issues:**

- 🟠 High: 3
- 🟡 Medium: 1

**Findings:**

- 3 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Use semantic tokens like bg-background, text-foreground, or design system tokens
- Add proper ARIA labels and semantic HTML
- Add prefers-reduced-motion media query or useReducedMotion hook
- Use transform and opacity instead of top/left for animations
- Use layout="position" instead of full layout animations when possible

### ✅ ResponseTab

- **Path:** `src/components/History/ResponseTab.tsx`
- **Category:** Intelligence
- **Health Score:** 94%

**Issues:**

- 🟠 High: 1
- 🟡 Medium: 2

**Findings:**

- 1 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add proper ARIA labels and semantic HTML
- Use transform and opacity instead of top/left for animations
- Replace div/span with semantic HTML element
- Use layout="position" instead of full layout animations when possible

### ✅ NetworkStatusBar

- **Path:** `src/components/History/NetworkStatusBar.tsx`
- **Category:** Intelligence
- **Health Score:** 94%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 1

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Use transform and opacity instead of top/left for animations
- Use layout="position" instead of full layout animations when possible

### ✅ HeadersTab

- **Path:** `src/components/History/HeadersTab.tsx`
- **Category:** Intelligence
- **Health Score:** 94%

**Issues:**

- 🟠 High: 1
- 🟡 Medium: 2

**Findings:**

- 1 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add proper ARIA labels and semantic HTML
- Use transform and opacity instead of top/left for animations
- Replace div/span with semantic HTML element
- Use layout="position" instead of full layout animations when possible

### ✅ HeaderRow

- **Path:** `src/components/History/HeaderRow.tsx`
- **Category:** Intelligence
- **Health Score:** 94%

**Issues:**

- 🔴 Critical: 1
- 🟠 High: 1
- 🟡 Medium: 1

**Findings:**

- 1 critical issue(s) require immediate attention
- 1 high priority issue(s) found
- Strong accessibility compliance
- Good Storybook coverage with interaction tests

**Recommendations:**

- Add keyboard support for all interactive elements
- Add proper ARIA labels and semantic HTML
- Use transform and opacity instead of top/left for animations
- Use layout="position" instead of full layout animations when possible

## Issues by Priority

### Critical Priority

- **PanelTabs** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **PanelContent** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **separator** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **select** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **checkbox** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **card** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **button** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **Tooltip** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **Switch** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **SplitButton** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **PulsingGlow** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **Label** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **EmptyState** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **DialogFooter** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **DialogContent** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **Dialog** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **DataPanelHeader** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **DataPanel** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **StatusBadge** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **RequestBuilder** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **MemoryWarningListener** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **MetricsToggle** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **MetricsGrid** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **MetricCell** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **AppMetricsLog** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **AppMetricsContainer** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **VirtualDataGrid** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **ExpandedContent** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **DataGridHeader** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **TimingWaterfall** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **TimingTab** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **TLSTab** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **TLSPanel** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **SignalDot** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **NetworkStatusBar** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **NetworkHistoryPanel** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **IntelligenceSignals** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **HeaderRow** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **FilterBar** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **CodeGenTab** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **CodeGenPanel** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **CodeBox** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **CertificateInfo** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **selectRenderers** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **ActionBarSelect** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **ActionBarSegment** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **ActionBarGroup** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **ActionBarContext** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **ActionBar** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **effects** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **SegmentedControl** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **BadgeCount** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **keyboardNav** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **urlCell** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **timingCell** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **timeAgoCell** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **tableHeaderRow** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **statusCell** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **sizeCell** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **protocolCell** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **methodCell** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium
- **SortIndicator** (accessibility): Component is not keyboard accessible
  - Recommendation: Add keyboard support for all interactive elements
  - Effort: medium

### High Priority

- **PanelContent** (motion): Component does not respect prefers-reduced-motion preference
  - Recommendation: Add motion reduction support using useReducedMotion hook or media query
  - Effort: small
- **input** (motion): Component does not respect prefers-reduced-motion preference
  - Recommendation: Add motion reduction support using useReducedMotion hook or media query
  - Effort: small
- **checkbox** (motion): Component does not respect prefers-reduced-motion preference
  - Recommendation: Add motion reduction support using useReducedMotion hook or media query
  - Effort: small
- **card** (motion): Component does not respect prefers-reduced-motion preference
  - Recommendation: Add motion reduction support using useReducedMotion hook or media query
  - Effort: small
- **button** (motion): Component does not respect prefers-reduced-motion preference
  - Recommendation: Add motion reduction support using useReducedMotion hook or media query
  - Effort: small
- **Switch** (motion): Component does not respect prefers-reduced-motion preference
  - Recommendation: Add motion reduction support using useReducedMotion hook or media query
  - Effort: small
- **SplitButton** (motion): Component does not respect prefers-reduced-motion preference
  - Recommendation: Add motion reduction support using useReducedMotion hook or media query
  - Effort: small
- **PulsingGlow** (motion): Component does not respect prefers-reduced-motion preference
  - Recommendation: Add motion reduction support using useReducedMotion hook or media query
  - Effort: small
- **Sidebar** (motion): Component does not respect prefers-reduced-motion preference
  - Recommendation: Add motion reduction support using useReducedMotion hook or media query
  - Effort: small
- **RequestHeader** (motion): Component does not respect prefers-reduced-motion preference
  - Recommendation: Add motion reduction support using useReducedMotion hook or media query
  - Effort: small
- **ParamsEditor** (motion): Component does not respect prefers-reduced-motion preference
  - Recommendation: Add motion reduction support using useReducedMotion hook or media query
  - Effort: small
- **HeaderEditor** (motion): Component does not respect prefers-reduced-motion preference
  - Recommendation: Add motion reduction support using useReducedMotion hook or media query
  - Effort: small
- **AuthEditor** (motion): Component does not respect prefers-reduced-motion preference
  - Recommendation: Add motion reduction support using useReducedMotion hook or media query
  - Effort: small
- **CodeEditor** (motion): Component does not respect prefers-reduced-motion preference
  - Recommendation: Add motion reduction support using useReducedMotion hook or media query
  - Effort: small
- **effects** (motion): Component does not respect prefers-reduced-motion preference
  - Recommendation: Add motion reduction support using useReducedMotion hook or media query
  - Effort: small
- **BadgeCount** (motion): Component does not respect prefers-reduced-motion preference
  - Recommendation: Add motion reduction support using useReducedMotion hook or media query
  - Effort: small
- **input** (design-principles): semantic-tokens: Hardcoded color detected: rgba(255, 255, 255, ${bgOpacitySpring})
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **input** (design-principles): semantic-tokens: Hardcoded color detected: rgba(255, 255, 255, ${borderOpacitySpring})
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **checkbox** (design-principles): semantic-tokens: Hardcoded color detected: text-white
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **button** (design-principles): semantic-tokens: Hardcoded color detected: text-white
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **Toast** (design-principles): semantic-tokens: Hardcoded color detected: hsl(206*22%\_7%*/\_35%)
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **Toast** (design-principles): semantic-tokens: Hardcoded color detected: hsl(206*22%\_7%*/\_20%)
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **Toast** (design-principles): semantic-tokens: Hardcoded color detected: text-white
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **Switch** (design-principles): semantic-tokens: Hardcoded color detected: rgba(0, 0, 0, 0)
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **Switch** (design-principles): semantic-tokens: Hardcoded color detected: bg-white
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **Switch** (design-principles): dark-mode-compatible: Light-mode only color: bg-white
  - Recommendation: Use semantic tokens that work in both light and dark modes
  - Effort: medium
- **SplitButton** (design-principles): semantic-tokens: Hardcoded color detected: text-white
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **SplitButton** (design-principles): semantic-tokens: Hardcoded color detected: text-white
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **SplitButton** (design-principles): semantic-tokens: Hardcoded color detected: text-white
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **SplitButton** (design-principles): semantic-tokens: Hardcoded color detected: text-white
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **SplitButton** (design-principles): semantic-tokens: Hardcoded color detected: bg-white
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **SplitButton** (design-principles): dark-mode-compatible: Light-mode only color: bg-white
  - Recommendation: Use semantic tokens that work in both light and dark modes
  - Effort: medium
- **PulsingGlow** (design-principles): semantic-tokens: Hardcoded color detected: #3b82f6
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **DockablePanel** (design-principles): semantic-tokens: Hardcoded color detected: rgba(0,0,0,0)
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **DockablePanel** (design-principles): semantic-tokens: Hardcoded color detected: rgba(0,0,0,0.15)
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **DockablePanel** (design-principles): semantic-tokens: Hardcoded color detected: rgba(0,0,0,0.2)
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **DockablePanel** (design-principles): semantic-tokens: Hardcoded color detected: rgba(0,0,0,0)
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **DockablePanel** (design-principles): semantic-tokens: Hardcoded color detected: rgba(0,0,0,0.15)
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **DockablePanel** (design-principles): semantic-tokens: Hardcoded color detected: rgba(0,0,0,0.2)
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **DockablePanel** (design-principles): semantic-tokens: Hardcoded color detected: rgba(0,0,0,0)
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **DockablePanel** (design-principles): semantic-tokens: Hardcoded color detected: rgba(0,0,0,0.15)
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **DockablePanel** (design-principles): semantic-tokens: Hardcoded color detected: rgba(0,0,0,0.2)
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **TimingWaterfall** (design-principles): semantic-tokens: Hardcoded color detected: text-white
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **NetworkHistoryFilters** (design-principles): semantic-tokens: Hardcoded color detected: text-white
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **VirtualDataGrid** (design-principles): semantic-tokens: Hardcoded color detected: #101010
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **SegmentedControl** (design-principles): semantic-tokens: Hardcoded color detected: rgba(0, 0, 0, 0)
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **SegmentedControl** (design-principles): semantic-tokens: Hardcoded color detected: rgba(0, 0, 0, 0)
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **BadgeCount** (design-principles): semantic-tokens: Hardcoded color detected: rgba(0, 0, 0, 0)
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **BadgeCount** (design-principles): semantic-tokens: Hardcoded color detected: #fbbf24
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **BadgeCount** (design-principles): semantic-tokens: Hardcoded color detected: #fbbf24
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **BadgeCount** (design-principles): semantic-tokens: Hardcoded color detected: text-amber-400
  - Recommendation: Use semantic tokens like bg-background, text-foreground, or design system tokens
  - Effort: medium
- **Sidebar** (performance): Animating layout properties (height) causes layout recalculation. Consider using transform-based animations (x, y, scale).
  - Recommendation: Batch DOM reads and writes to avoid layout thrashing
  - Effort: medium
- **TimingWaterfall** (performance): Animating layout properties (width) causes layout recalculation. Consider using transform-based animations (x, y, scale).
  - Recommendation: Batch DOM reads and writes to avoid layout thrashing
  - Effort: medium
- **ExpandedContent** (performance): Animating layout properties (height) causes layout recalculation. Consider using transform-based animations (x, y, scale).
  - Recommendation: Batch DOM reads and writes to avoid layout thrashing
  - Effort: medium
- **PanelTabs** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **PanelContent** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **separator** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **select** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **input** (accessibility): [WCAG 1.3.1] Input should have an associated label with htmlFor or aria-label.
  - Recommendation: Add htmlFor attribute to label element
  - Effort: small
- **input** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **checkbox** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **card** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **button** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **Tooltip** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **Switch** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **SplitButton** (accessibility): [WCAG 2.1.1] onClick handler on non-interactive element should have onKeyDown equivalent.
  - Recommendation: Add onKeyDown handler for keyboard interaction
  - Effort: small
- **SplitButton** (accessibility): [WCAG 2.1.1] Interactive element should have tabIndex for keyboard accessibility.
  - Recommendation: Add tabindex="0" for custom interactive elements
  - Effort: small
- **SplitButton** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **SplitButton** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **PulsingGlow** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **Label** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **EmptyState** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **DialogHeader** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **DialogHeader** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **DialogFooter** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **DialogContent** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **Dialog** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **DataPanelHeader** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **DataPanelHeader** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **DataPanel** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **StatusBadge** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **ResponseViewer** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **RequestHeader** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **RequestHeader** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **RequestBuilder** (accessibility): [WCAG 2.1.1] onClick handler on non-interactive element should have onKeyDown equivalent.
  - Recommendation: Add onKeyDown handler for keyboard interaction
  - Effort: small
- **RequestBuilder** (accessibility): [WCAG 2.1.1] Interactive element should have tabIndex for keyboard accessibility.
  - Recommendation: Add tabindex="0" for custom interactive elements
  - Effort: small
- **RequestBuilder** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **ParamsEditor** (accessibility): [WCAG 1.1.1] Button with icon-only content should have aria-label for screen readers.
  - Recommendation: Add aria-label to icon-only button
  - Effort: small
- **ParamsEditor** (accessibility): [WCAG 1.1.1] Button with icon-only content should have aria-label for screen readers.
  - Recommendation: Add aria-label to icon-only button
  - Effort: small
- **ParamsEditor** (accessibility): [WCAG 1.1.1] Button with icon-only content should have aria-label for screen readers.
  - Recommendation: Add aria-label to icon-only button
  - Effort: small
- **ParamsEditor** (accessibility): [WCAG 1.1.1] Button with icon-only content should have aria-label for screen readers.
  - Recommendation: Add aria-label to icon-only button
  - Effort: small
- **ParamsEditor** (accessibility): [WCAG 1.1.1] Button with icon-only content should have aria-label for screen readers.
  - Recommendation: Add aria-label to icon-only button
  - Effort: small
- **ParamsEditor** (accessibility): [WCAG 1.1.1] Button with icon-only content should have aria-label for screen readers.
  - Recommendation: Add aria-label to icon-only button
  - Effort: small
- **ParamsEditor** (accessibility): [WCAG 2.1.1] onClick handler on non-interactive element should have onKeyDown equivalent.
  - Recommendation: Add onKeyDown handler for keyboard interaction
  - Effort: small
- **ParamsEditor** (accessibility): [WCAG 2.1.1] Interactive element should have tabIndex for keyboard accessibility.
  - Recommendation: Add tabindex="0" for custom interactive elements
  - Effort: small
- **ParamsEditor** (accessibility): [WCAG 1.3.1] Input should have an associated label with htmlFor or aria-label.
  - Recommendation: Add htmlFor attribute to label element
  - Effort: small
- **ParamsEditor** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **HeaderEditor** (accessibility): [WCAG 1.1.1] Button with icon-only content should have aria-label for screen readers.
  - Recommendation: Add aria-label to icon-only button
  - Effort: small
- **HeaderEditor** (accessibility): [WCAG 1.1.1] Button with icon-only content should have aria-label for screen readers.
  - Recommendation: Add aria-label to icon-only button
  - Effort: small
- **HeaderEditor** (accessibility): [WCAG 1.1.1] Button with icon-only content should have aria-label for screen readers.
  - Recommendation: Add aria-label to icon-only button
  - Effort: small
- **HeaderEditor** (accessibility): [WCAG 1.1.1] Button with icon-only content should have aria-label for screen readers.
  - Recommendation: Add aria-label to icon-only button
  - Effort: small
- **HeaderEditor** (accessibility): [WCAG 1.1.1] Button with icon-only content should have aria-label for screen readers.
  - Recommendation: Add aria-label to icon-only button
  - Effort: small
- **HeaderEditor** (accessibility): [WCAG 1.1.1] Button with icon-only content should have aria-label for screen readers.
  - Recommendation: Add aria-label to icon-only button
  - Effort: small
- **HeaderEditor** (accessibility): [WCAG 2.1.1] onClick handler on non-interactive element should have onKeyDown equivalent.
  - Recommendation: Add onKeyDown handler for keyboard interaction
  - Effort: small
- **HeaderEditor** (accessibility): [WCAG 2.1.1] Interactive element should have tabIndex for keyboard accessibility.
  - Recommendation: Add tabindex="0" for custom interactive elements
  - Effort: small
- **HeaderEditor** (accessibility): [WCAG 1.3.1] Input should have an associated label with htmlFor or aria-label.
  - Recommendation: Add htmlFor attribute to label element
  - Effort: small
- **HeaderEditor** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **AuthEditor** (accessibility): [WCAG 1.3.1] Input should have an associated label with htmlFor or aria-label.
  - Recommendation: Add htmlFor attribute to label element
  - Effort: small
- **AuthEditor** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **MemoryWarningListener** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **MetricsToggle** (accessibility): [WCAG 2.1.1] onClick handler on non-interactive element should have onKeyDown equivalent.
  - Recommendation: Add onKeyDown handler for keyboard interaction
  - Effort: small
- **MetricsToggle** (accessibility): [WCAG 2.1.1] Interactive element should have tabIndex for keyboard accessibility.
  - Recommendation: Add tabindex="0" for custom interactive elements
  - Effort: small
- **MetricsToggle** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **MetricsPanel** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **MetricsPanel** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **MetricsGrid** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **MetricCell** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **TitleBar** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **TitleBar** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **StatusBar** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **StatusBar** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **Sidebar** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **Sidebar** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **MainLayout** (accessibility): [WCAG 2.1.1] onClick handler on non-interactive element should have onKeyDown equivalent.
  - Recommendation: Add onKeyDown handler for keyboard interaction
  - Effort: small
- **MainLayout** (accessibility): [WCAG 2.1.1] Interactive element should have tabIndex for keyboard accessibility.
  - Recommendation: Add tabindex="0" for custom interactive elements
  - Effort: small
- **MainLayout** (accessibility): [WCAG 2.1.1] Interactive element should have tabIndex for keyboard accessibility.
  - Recommendation: Add tabindex="0" for custom interactive elements
  - Effort: small
- **MainLayout** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **DockablePanel** (accessibility): [WCAG 2.1.1] onClick handler on non-interactive element should have onKeyDown equivalent.
  - Recommendation: Add onKeyDown handler for keyboard interaction
  - Effort: small
- **DockablePanel** (accessibility): [WCAG 2.1.1] onClick handler on non-interactive element should have onKeyDown equivalent.
  - Recommendation: Add onKeyDown handler for keyboard interaction
  - Effort: small
- **DockablePanel** (accessibility): [WCAG 2.1.1] onClick handler on non-interactive element should have onKeyDown equivalent.
  - Recommendation: Add onKeyDown handler for keyboard interaction
  - Effort: small
- **DockablePanel** (accessibility): [WCAG 2.1.1] onClick handler on non-interactive element should have onKeyDown equivalent.
  - Recommendation: Add onKeyDown handler for keyboard interaction
  - Effort: small
- **DockablePanel** (accessibility): [WCAG 2.1.1] onClick handler on non-interactive element should have onKeyDown equivalent.
  - Recommendation: Add onKeyDown handler for keyboard interaction
  - Effort: small
- **DockablePanel** (accessibility): [WCAG 2.1.1] Interactive element should have tabIndex for keyboard accessibility.
  - Recommendation: Add tabindex="0" for custom interactive elements
  - Effort: small
- **DockablePanel** (accessibility): [WCAG 2.1.1] Interactive element should have tabIndex for keyboard accessibility.
  - Recommendation: Add tabindex="0" for custom interactive elements
  - Effort: small
- **DockablePanel** (accessibility): [WCAG 2.1.1] Interactive element should have tabIndex for keyboard accessibility.
  - Recommendation: Add tabindex="0" for custom interactive elements
  - Effort: small
- **DockablePanel** (accessibility): [WCAG 2.1.1] Interactive element should have tabIndex for keyboard accessibility.
  - Recommendation: Add tabindex="0" for custom interactive elements
  - Effort: small
- **DockablePanel** (accessibility): [WCAG 2.1.1] Interactive element should have tabIndex for keyboard accessibility.
  - Recommendation: Add tabindex="0" for custom interactive elements
  - Effort: small
- **DockablePanel** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **DockControls** (accessibility): [WCAG 2.1.1] onClick handler on non-interactive element should have onKeyDown equivalent.
  - Recommendation: Add onKeyDown handler for keyboard interaction
  - Effort: small
- **DockControls** (accessibility): [WCAG 2.1.1] onClick handler on non-interactive element should have onKeyDown equivalent.
  - Recommendation: Add onKeyDown handler for keyboard interaction
  - Effort: small
- **DockControls** (accessibility): [WCAG 2.1.1] onClick handler on non-interactive element should have onKeyDown equivalent.
  - Recommendation: Add onKeyDown handler for keyboard interaction
  - Effort: small
- **DockControls** (accessibility): [WCAG 2.1.1] Interactive element should have tabIndex for keyboard accessibility.
  - Recommendation: Add tabindex="0" for custom interactive elements
  - Effort: small
- **DockControls** (accessibility): [WCAG 2.1.1] Interactive element should have tabIndex for keyboard accessibility.
  - Recommendation: Add tabindex="0" for custom interactive elements
  - Effort: small
- **DockControls** (accessibility): [WCAG 2.1.1] Interactive element should have tabIndex for keyboard accessibility.
  - Recommendation: Add tabindex="0" for custom interactive elements
  - Effort: small
- **DockControls** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **DockControls** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **ConsoleToolbar** (accessibility): [WCAG 1.1.1] Button with icon-only content should have aria-label for screen readers.
  - Recommendation: Add aria-label to icon-only button
  - Effort: small
- **ConsoleToolbar** (accessibility): [WCAG 2.1.1] onClick handler on non-interactive element should have onKeyDown equivalent.
  - Recommendation: Add onKeyDown handler for keyboard interaction
  - Effort: small
- **ConsoleToolbar** (accessibility): [WCAG 2.1.1] onClick handler on non-interactive element should have onKeyDown equivalent.
  - Recommendation: Add onKeyDown handler for keyboard interaction
  - Effort: small
- **ConsoleToolbar** (accessibility): [WCAG 2.1.1] Interactive element should have tabIndex for keyboard accessibility.
  - Recommendation: Add tabindex="0" for custom interactive elements
  - Effort: small
- **ConsoleToolbar** (accessibility): [WCAG 2.1.1] Interactive element should have tabIndex for keyboard accessibility.
  - Recommendation: Add tabindex="0" for custom interactive elements
  - Effort: small
- **ConsoleToolbar** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **ConsoleToolbar** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **ConsolePanel** (accessibility): [WCAG 2.1.1] onClick handler on non-interactive element should have onKeyDown equivalent.
  - Recommendation: Add onKeyDown handler for keyboard interaction
  - Effort: small
- **ConsolePanel** (accessibility): [WCAG 2.1.1] Interactive element should have tabIndex for keyboard accessibility.
  - Recommendation: Add tabindex="0" for custom interactive elements
  - Effort: small
- **ConsolePanel** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **ConsoleContextMenu** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **ConsoleContextMenu** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **AppMetricsLog** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **AppMetricsContainer** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **VirtualDataGrid** (accessibility): [WCAG 2.1.1] onClick handler on non-interactive element should have onKeyDown equivalent.
  - Recommendation: Add onKeyDown handler for keyboard interaction
  - Effort: small
- **VirtualDataGrid** (accessibility): [WCAG 2.1.1] onClick handler on non-interactive element should have onKeyDown equivalent.
  - Recommendation: Add onKeyDown handler for keyboard interaction
  - Effort: small
- **VirtualDataGrid** (accessibility): [WCAG 2.1.1] Interactive element should have tabIndex for keyboard accessibility.
  - Recommendation: Add tabindex="0" for custom interactive elements
  - Effort: small
- **VirtualDataGrid** (accessibility): [WCAG 2.1.1] Interactive element should have tabIndex for keyboard accessibility.
  - Recommendation: Add tabindex="0" for custom interactive elements
  - Effort: small
- **VirtualDataGrid** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **VirtualDataGrid** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **ExpandedContent** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **DataGridHeader** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **CodeEditor** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **CodeEditor** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **TimingWaterfall** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **TimingTab** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **TLSTab** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **TLSPanel** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **SignalDot** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **ResponseTab** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **ResponsePanel** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **ResponsePanel** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **NetworkStatusBar** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **NetworkHistoryPanel** (accessibility): [WCAG 2.1.1] onClick handler on non-interactive element should have onKeyDown equivalent.
  - Recommendation: Add onKeyDown handler for keyboard interaction
  - Effort: small
- **NetworkHistoryPanel** (accessibility): [WCAG 2.1.1] Interactive element should have tabIndex for keyboard accessibility.
  - Recommendation: Add tabindex="0" for custom interactive elements
  - Effort: small
- **NetworkHistoryPanel** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **NetworkHistoryFilters** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **NetworkHistoryFilters** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **LanguageTabs** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **LanguageTabs** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **IntelligenceSignals** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **HeadersTab** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **HeadersPanel** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **HeadersPanel** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **HeaderRow** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **FilterBarActions** (accessibility): [WCAG 2.1.1] onClick handler on non-interactive element should have onKeyDown equivalent.
  - Recommendation: Add onKeyDown handler for keyboard interaction
  - Effort: small
- **FilterBarActions** (accessibility): [WCAG 2.1.1] onClick handler on non-interactive element should have onKeyDown equivalent.
  - Recommendation: Add onKeyDown handler for keyboard interaction
  - Effort: small
- **FilterBarActions** (accessibility): [WCAG 2.1.1] Interactive element should have tabIndex for keyboard accessibility.
  - Recommendation: Add tabindex="0" for custom interactive elements
  - Effort: small
- **FilterBarActions** (accessibility): [WCAG 2.1.1] Interactive element should have tabIndex for keyboard accessibility.
  - Recommendation: Add tabindex="0" for custom interactive elements
  - Effort: small
- **FilterBarActions** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **FilterBarActions** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **FilterBar** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **FilterBar** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **CopyButton** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **CopyButton** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **CodeGenTab** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **CodeGenPanel** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **CodeGenPanel** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **CodeBox** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **CodeBox** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **CertificateInfo** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **CertificateInfo** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **selectRenderers** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **ActionBarSelect** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **ActionBarSelect** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **ActionBarSegment** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **ActionBarSegment** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **ActionBarSearch** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **ActionBarSearch** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **ActionBarGroup** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **ActionBarGroup** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **ActionBarContext** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **ActionBarCompositeButton** (accessibility): [WCAG 2.1.1] onClick handler on non-interactive element should have onKeyDown equivalent.
  - Recommendation: Add onKeyDown handler for keyboard interaction
  - Effort: small
- **ActionBarCompositeButton** (accessibility): [WCAG 2.1.1] Interactive element should have tabIndex for keyboard accessibility.
  - Recommendation: Add tabindex="0" for custom interactive elements
  - Effort: small
- **ActionBarCompositeButton** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **ActionBarCompositeButton** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **ActionBar** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **effects** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **SegmentedControl** (accessibility): [WCAG 2.1.1] onClick handler on non-interactive element should have onKeyDown equivalent.
  - Recommendation: Add onKeyDown handler for keyboard interaction
  - Effort: small
- **SegmentedControl** (accessibility): [WCAG 2.1.1] Interactive element should have tabIndex for keyboard accessibility.
  - Recommendation: Add tabindex="0" for custom interactive elements
  - Effort: small
- **SegmentedControl** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **BadgeCount** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **keyboardNav** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **TabNavigation** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **ExpandedPanel** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **ExpandedActionButtons** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **ExpandedActionButtons** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **urlCell** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **timingCell** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **timeAgoCell** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **tableHeaderRow** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **tableHeaderRow** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **statusCell** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **sizeCell** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **selectionColumn** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **selectionColumn** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **protocolCell** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **networkColumns** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **networkColumns** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **methodCell** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **expanderColumn** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **consoleColumns** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **consoleColumns** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **SortIndicator** (accessibility): Component is not screen reader compatible
  - Recommendation: Add proper ARIA labels and semantic HTML
  - Effort: medium
- **SortIndicator** (accessibility): Component does not respect reduced motion preferences
  - Recommendation: Add prefers-reduced-motion media query or useReducedMotion hook
  - Effort: small
- **PanelTabs** (unified-material): Multiple motion.div elements instead of single unified material
  - Recommendation: Consolidate to single motion.div with variant orchestration
  - Effort: medium
- **PanelTabs** (unified-material): Separate inner hover states break unified material feel
  - Recommendation: Use parent hover state with children inheriting via variants
  - Effort: medium
- **PanelContent** (unified-material): Multiple motion.div elements instead of single unified material
  - Recommendation: Consolidate to single motion.div with variant orchestration
  - Effort: medium
- **ResponseViewer** (unified-material): Multiple motion.div elements instead of single unified material
  - Recommendation: Consolidate to single motion.div with variant orchestration
  - Effort: medium
- **RequestHeader** (unified-material): Multiple motion.div elements instead of single unified material
  - Recommendation: Consolidate to single motion.div with variant orchestration
  - Effort: medium
- **RequestBuilder** (unified-material): Multiple motion.div elements instead of single unified material
  - Recommendation: Consolidate to single motion.div with variant orchestration
  - Effort: medium
- **ParamsEditor** (unified-material): Multiple motion.div elements instead of single unified material
  - Recommendation: Consolidate to single motion.div with variant orchestration
  - Effort: medium
- **HeaderEditor** (unified-material): Multiple motion.div elements instead of single unified material
  - Recommendation: Consolidate to single motion.div with variant orchestration
  - Effort: medium
- **AuthEditor** (unified-material): Multiple motion.div elements instead of single unified material
  - Recommendation: Consolidate to single motion.div with variant orchestration
  - Effort: medium
- **button** (unified-material): Separate inner hover states break unified material feel
  - Recommendation: Use parent hover state with children inheriting via variants
  - Effort: medium
- **ToastProvider** (unified-material): Multiple motion.div elements instead of single unified material
  - Recommendation: Consolidate to single motion.div with variant orchestration
  - Effort: medium
- **ToastProvider** (unified-material): Separate inner hover states break unified material feel
  - Recommendation: Use parent hover state with children inheriting via variants
  - Effort: medium
- **SplitButton** (unified-material): Separate inner hover states break unified material feel
  - Recommendation: Use parent hover state with children inheriting via variants
  - Effort: medium
- **EmptyState** (unified-material): Multiple motion.div elements instead of single unified material
  - Recommendation: Consolidate to single motion.div with variant orchestration
  - Effort: medium
- **Dialog** (unified-material): Multiple motion.div elements instead of single unified material
  - Recommendation: Consolidate to single motion.div with variant orchestration
  - Effort: medium
- **TitleBar** (unified-material): Separate inner hover states break unified material feel
  - Recommendation: Use parent hover state with children inheriting via variants
  - Effort: medium
- **Sidebar** (unified-material): Multiple motion.div elements instead of single unified material
  - Recommendation: Consolidate to single motion.div with variant orchestration
  - Effort: medium
- **MainLayout** (unified-material): Multiple motion.div elements instead of single unified material
  - Recommendation: Consolidate to single motion.div with variant orchestration
  - Effort: medium
- **DockablePanel** (unified-material): Multiple motion.div elements instead of single unified material
  - Recommendation: Consolidate to single motion.div with variant orchestration
  - Effort: medium
- **DockablePanel** (unified-material): Separate inner hover states break unified material feel
  - Recommendation: Use parent hover state with children inheriting via variants
  - Effort: medium
- **DockControls** (unified-material): Separate inner hover states break unified material feel
  - Recommendation: Use parent hover state with children inheriting via variants
  - Effort: medium
- **TimingWaterfall** (unified-material): Multiple motion.div elements instead of single unified material
  - Recommendation: Consolidate to single motion.div with variant orchestration
  - Effort: medium
- **CodeEditor** (unified-material): Multiple motion.div elements instead of single unified material
  - Recommendation: Consolidate to single motion.div with variant orchestration
  - Effort: medium
- **ActionBar** (unified-material): Multiple motion.div elements instead of single unified material
  - Recommendation: Consolidate to single motion.div with variant orchestration
  - Effort: medium
- **ExpandedContent** (unified-material): Multiple motion.div elements instead of single unified material
  - Recommendation: Consolidate to single motion.div with variant orchestration
  - Effort: medium
- **EnergyEdge** (unified-material): Multiple motion.div elements instead of single unified material
  - Recommendation: Consolidate to single motion.div with variant orchestration
  - Effort: medium
- **SegmentedControl** (unified-material): Multiple motion.div elements instead of single unified material
  - Recommendation: Consolidate to single motion.div with variant orchestration
  - Effort: medium

### Medium Priority

- **StatusBadge** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **ResponseViewer** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **select** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **input** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **checkbox** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **checkbox** (motion): CSS transition detected: "transition: {..."
  - Recommendation: Consider using Motion.dev animate prop or transition prop instead
  - Effort: small
- **checkbox** (motion): CSS transition detected: "transition: {..."
  - Recommendation: Consider using Motion.dev animate prop or transition prop instead
  - Effort: small
- **card** (motion): CSS transition detected: "whileHover: hover ? { y: -4, transition: { duratio..."
  - Recommendation: Consider using Motion.dev animate prop or transition prop instead
  - Effort: small
- **button** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **button** (motion): CSS transition detected: "transition: {..."
  - Recommendation: Consider using Motion.dev animate prop or transition prop instead
  - Effort: small
- **button** (motion): CSS transition detected: "transition: {..."
  - Recommendation: Consider using Motion.dev animate prop or transition prop instead
  - Effort: small
- **button** (motion): CSS transition detected: "transition: {..."
  - Recommendation: Consider using Motion.dev animate prop or transition prop instead
  - Effort: small
- **Toast** (motion): CSS transition detected: "animate={{ opacity: 1, y: 0, scale: 1, transition:..."
  - Recommendation: Consider using Motion.dev animate prop or transition prop instead
  - Effort: small
- **Toast** (motion): CSS transition detected: ": { opacity: 0, scale: 0.5, transition: exitTransi..."
  - Recommendation: Consider using Motion.dev animate prop or transition prop instead
  - Effort: small
- **Toast** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **Toast** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **Toast** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **SplitButton** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **SplitButton** (motion): CSS transition detected: "transition: { type: 'spring', stiffness: 400, damp..."
  - Recommendation: Consider using Motion.dev animate prop or transition prop instead
  - Effort: small
- **SplitButton** (motion): CSS transition detected: "transition: { type: 'spring', stiffness: 400, damp..."
  - Recommendation: Consider using Motion.dev animate prop or transition prop instead
  - Effort: small
- **SplitButton** (motion): CSS transition detected: "transition: { type: 'spring', stiffness: 600, damp..."
  - Recommendation: Consider using Motion.dev animate prop or transition prop instead
  - Effort: small
- **SplitButton** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **SplitButton** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **SplitButton** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **EmptyState** (motion): CSS transition detected: "transition: reducedMotion..."
  - Recommendation: Consider using Motion.dev animate prop or transition prop instead
  - Effort: small
- **EmptyState** (motion): CSS transition detected: "transition: reducedMotion..."
  - Recommendation: Consider using Motion.dev animate prop or transition prop instead
  - Effort: small
- **EmptyState** (motion): CSS transition detected: "transition: reducedMotion..."
  - Recommendation: Consider using Motion.dev animate prop or transition prop instead
  - Effort: small
- **DialogHeader** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **TitleBar** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **TitleBar** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **TitleBar** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **StatusBar** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **Sidebar** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **Sidebar** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **Sidebar** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **DockablePanel** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **DockablePanel** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **DockControls** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **DockControls** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **RequestHeader** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **RequestHeader** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **RequestBuilder** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **ParamsEditor** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **ParamsEditor** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **HeaderEditor** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **HeaderEditor** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **MetricsPanel** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **ResponsePanel** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **ResponsePanel** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **NetworkHistoryPanel** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **LanguageTabs** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **HeadersPanel** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **HeadersPanel** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **CopyButton** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **VirtualDataGrid** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **VirtualDataGrid** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **ConsolePanel** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **ConsolePanel** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **ConsoleContextMenu** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **ConsoleContextMenu** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **ConsoleContextMenu** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **CodeEditor** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **ActionBarSearch** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **ActionBarSearch** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **effects** (motion): CSS transition detected: "transition: 'filter 0.4s ease-out',..."
  - Recommendation: Consider using Motion.dev animate prop or transition prop instead
  - Effort: small
- **BadgeCount** (motion): CSS transition detected: "transition: { duration: 0.4, ease: 'easeOut' },..."
  - Recommendation: Consider using Motion.dev animate prop or transition prop instead
  - Effort: small
- **networkColumns** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **expanderColumn** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **consoleColumns** (motion): Tailwind transition class detected
  - Recommendation: Consider using Motion.dev for complex animations; simple transitions may be acceptable
  - Effort: small
- **PanelContent** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **MetricsToggle** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **MetricsPanel** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **MetricsGrid** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **MetricCell** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **RequestBuilder** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **MemoryWarningListener** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **Tooltip** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **PulsingGlow** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **DialogFooter** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **DialogContent** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **Dialog** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **DockControls** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **ExpandedContent** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **DataGridHeader** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **ConsoleToolbar** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **ConsoleContextMenu** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **AppMetricsLog** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **AppMetricsContainer** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **ActionBarContext** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **TLSTab** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **TLSPanel** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **ResponsePanel** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **FilterBarActions** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **CertificateInfo** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **effects** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **BadgeCount** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **keyboardNav** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **TabNavigation** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **ExpandedActionButtons** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **urlCell** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **timingCell** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **timeAgoCell** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **tableHeaderRow** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **statusCell** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **sizeCell** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **selectionColumn** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **protocolCell** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **networkColumns** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **methodCell** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **expanderColumn** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **consoleColumns** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **SortIndicator** (storybook): Component is missing Storybook story
  - Recommendation: Create Storybook story with Playground and key states
  - Effort: medium
- **StatusBadge** (design-principles): motion-animations compliance issue
  - Recommendation: Consider using Motion for complex animations instead of CSS transitions
  - Effort: medium
- **ParamsEditor** (design-principles): generous-whitespace compliance issue
  - Recommendation: Consider using more generous padding (p-6, p-8) for larger sections
  - Effort: medium
- **HeaderEditor** (design-principles): generous-whitespace compliance issue
  - Recommendation: Consider using more generous padding (p-6, p-8) for larger sections
  - Effort: medium
- **select** (design-principles): motion-animations compliance issue
  - Recommendation: Consider using Motion for complex animations instead of CSS transitions
  - Effort: medium
- **checkbox** (design-principles): zen-aesthetic: Large scale animation: scale: 0
  - Recommendation: Use subtle scale values (1.01-1.02 or 0.98-0.99) for zen aesthetic
  - Effort: small
- **Tooltip** (design-principles): subtle-depth: Heavy shadow detected: shadow-lg
  - Recommendation: Use subtle shadows (shadow-xs, shadow-sm, shadow-md) for zen aesthetic
  - Effort: small
- **Toast** (design-principles): zen-aesthetic: Large scale animation: scale: 0.3
  - Recommendation: Use subtle scale values (1.01-1.02 or 0.98-0.99) for zen aesthetic
  - Effort: small
- **Toast** (design-principles): zen-aesthetic: Large scale animation: scale: 0.5
  - Recommendation: Use subtle scale values (1.01-1.02 or 0.98-0.99) for zen aesthetic
  - Effort: small
- **SplitButton** (design-principles): subtle-depth: Heavy shadow detected: shadow-lg
  - Recommendation: Use subtle shadows (shadow-xs, shadow-sm, shadow-md) for zen aesthetic
  - Effort: small
- **DialogHeader** (design-principles): generous-whitespace compliance issue
  - Recommendation: Consider using more generous padding (p-6, p-8) for larger sections
  - Effort: medium
- **DialogHeader** (design-principles): motion-animations compliance issue
  - Recommendation: Consider using Motion for complex animations instead of CSS transitions
  - Effort: medium
- **Dialog** (design-principles): subtle-depth: Heavy shadow detected: shadow-lg
  - Recommendation: Use subtle shadows (shadow-xs, shadow-sm, shadow-md) for zen aesthetic
  - Effort: small
- **MetricsPanel** (design-principles): generous-whitespace compliance issue
  - Recommendation: Consider using more generous padding (p-6, p-8) for larger sections
  - Effort: medium
- **MetricsPanel** (design-principles): motion-animations compliance issue
  - Recommendation: Consider using Motion for complex animations instead of CSS transitions
  - Effort: medium
- **TitleBar** (design-principles): motion-animations compliance issue
  - Recommendation: Consider using Motion for complex animations instead of CSS transitions
  - Effort: medium
- **StatusBar** (design-principles): motion-animations compliance issue
  - Recommendation: Consider using Motion for complex animations instead of CSS transitions
  - Effort: medium
- **MainLayout** (design-principles): generous-whitespace compliance issue
  - Recommendation: Consider using more generous padding (p-6, p-8) for larger sections
  - Effort: medium
- **MainLayout** (design-principles): subtle-depth: Heavy shadow detected: shadow-lg
  - Recommendation: Use subtle shadows (shadow-xs, shadow-sm, shadow-md) for zen aesthetic
  - Effort: small
- **DockablePanel** (design-principles): generous-whitespace compliance issue
  - Recommendation: Consider using more generous padding (p-6, p-8) for larger sections
  - Effort: medium
- **DockControls** (design-principles): generous-whitespace compliance issue
  - Recommendation: Consider using more generous padding (p-6, p-8) for larger sections
  - Effort: medium
- **DockControls** (design-principles): motion-animations compliance issue
  - Recommendation: Consider using Motion for complex animations instead of CSS transitions
  - Effort: medium
- **ConsolePanel** (design-principles): motion-animations compliance issue
  - Recommendation: Consider using Motion for complex animations instead of CSS transitions
  - Effort: medium
- **ConsoleContextMenu** (design-principles): subtle-depth: Heavy shadow detected: shadow-lg
  - Recommendation: Use subtle shadows (shadow-xs, shadow-sm, shadow-md) for zen aesthetic
  - Effort: small
- **ConsoleContextMenu** (design-principles): motion-animations compliance issue
  - Recommendation: Consider using Motion for complex animations instead of CSS transitions
  - Effort: medium
- **TimingTab** (design-principles): generous-whitespace compliance issue
  - Recommendation: Consider using more generous padding (p-6, p-8) for larger sections
  - Effort: medium
- **TimingTab** (design-principles): zen-aesthetic: Flashy animation: animate-pulse
  - Recommendation: Use subtle, intentional animations instead of flashy ones
  - Effort: small
- **TLSPanel** (design-principles): generous-whitespace compliance issue
  - Recommendation: Consider using more generous padding (p-6, p-8) for larger sections
  - Effort: medium
- **SignalDot** (design-principles): zen-aesthetic: Large scale animation: scale: 1.3
  - Recommendation: Use subtle scale values (1.01-1.02 or 0.98-0.99) for zen aesthetic
  - Effort: small
- **SignalDot** (design-principles): zen-aesthetic: Flashy animation: animate-pulse
  - Recommendation: Use subtle, intentional animations instead of flashy ones
  - Effort: small
- **ResponsePanel** (design-principles): motion-animations compliance issue
  - Recommendation: Consider using Motion for complex animations instead of CSS transitions
  - Effort: medium
- **NetworkHistoryPanel** (design-principles): generous-whitespace compliance issue
  - Recommendation: Consider using more generous padding (p-6, p-8) for larger sections
  - Effort: medium
- **NetworkHistoryPanel** (design-principles): motion-animations compliance issue
  - Recommendation: Consider using Motion for complex animations instead of CSS transitions
  - Effort: medium
- **LanguageTabs** (design-principles): motion-animations compliance issue
  - Recommendation: Consider using Motion for complex animations instead of CSS transitions
  - Effort: medium
- **HeadersPanel** (design-principles): motion-animations compliance issue
  - Recommendation: Consider using Motion for complex animations instead of CSS transitions
  - Effort: medium
- **CopyButton** (design-principles): motion-animations compliance issue
  - Recommendation: Consider using Motion for complex animations instead of CSS transitions
  - Effort: medium
- **CertificateInfo** (design-principles): generous-whitespace compliance issue
  - Recommendation: Consider using more generous padding (p-6, p-8) for larger sections
  - Effort: medium
- **CodeEditor** (design-principles): generous-whitespace compliance issue
  - Recommendation: Consider using more generous padding (p-6, p-8) for larger sections
  - Effort: medium
- **ActionBarSelect** (design-principles): generous-whitespace compliance issue
  - Recommendation: Consider using more generous padding (p-6, p-8) for larger sections
  - Effort: medium
- **ActionBarSearch** (design-principles): motion-animations compliance issue
  - Recommendation: Consider using Motion for complex animations instead of CSS transitions
  - Effort: medium
- **VirtualDataGrid** (design-principles): generous-whitespace compliance issue
  - Recommendation: Consider using more generous padding (p-6, p-8) for larger sections
  - Effort: medium
- **VirtualDataGrid** (design-principles): motion-animations compliance issue
  - Recommendation: Consider using Motion for complex animations instead of CSS transitions
  - Effort: medium
- **effects** (design-principles): zen-aesthetic: Large scale animation: scale: 0.3
  - Recommendation: Use subtle scale values (1.01-1.02 or 0.98-0.99) for zen aesthetic
  - Effort: small
- **effects** (design-principles): zen-aesthetic: Large scale animation: scale: 0.2
  - Recommendation: Use subtle scale values (1.01-1.02 or 0.98-0.99) for zen aesthetic
  - Effort: small
- **BadgeCount** (design-principles): zen-aesthetic: Large scale animation: scale: 0.5
  - Recommendation: Use subtle scale values (1.01-1.02 or 0.98-0.99) for zen aesthetic
  - Effort: small
- **BadgeCount** (design-principles): zen-aesthetic: Large scale animation: scale: 1.5
  - Recommendation: Use subtle scale values (1.01-1.02 or 0.98-0.99) for zen aesthetic
  - Effort: small
- **networkColumns** (design-principles): motion-animations compliance issue
  - Recommendation: Consider using Motion for complex animations instead of CSS transitions
  - Effort: medium
- **consoleColumns** (design-principles): motion-animations compliance issue
  - Recommendation: Consider using Motion for complex animations instead of CSS transitions
  - Effort: medium
- **consoleColumns** (design-principles): zen-aesthetic: Flashy animation: animate-spin
  - Recommendation: Use subtle, intentional animations instead of flashy ones
  - Effort: small
- **PanelTabs** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **StatusBadge** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **ResponseViewer** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **RequestHeader** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **MetricsToggle** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **MetricsPanel** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **MetricsGrid** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **MetricCell** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **MemoryWarningListener** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **TitleBar** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **StatusBar** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **DockControls** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **separator** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **select** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **input** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **checkbox** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **card** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **button** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **Tooltip** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **Switch** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **SplitButton** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **Label** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **EmptyState** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **DialogHeader** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **DialogFooter** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **DialogContent** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **Dialog** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **DataPanelHeader** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **DataPanel** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **TimingWaterfall** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **TimingTab** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **TLSTab** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **TLSPanel** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **SignalDot** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **ResponseTab** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **ResponsePanel** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **NetworkStatusBar** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **NetworkHistoryPanel** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **NetworkHistoryFilters** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **LanguageTabs** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **IntelligenceSignals** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **HeadersTab** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **HeadersPanel** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **HeaderRow** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **FilterBarActions** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **FilterBar** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **CopyButton** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **CodeGenTab** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **CodeGenPanel** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **CodeBox** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **CertificateInfo** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **selectRenderers** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **ActionBarSelect** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **ActionBarSegment** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **ActionBarSearch** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **ActionBarGroup** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **ActionBarContext** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **ActionBarCompositeButton** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **ActionBar** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **ConsoleToolbar** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **ConsolePanel** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **ConsoleContextMenu** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **AppMetricsLog** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **AppMetricsContainer** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **VirtualDataGrid** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **DataGridHeader** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **SegmentedControl** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **TabNavigation** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **ExpandedPanel** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **ExpandedActionButtons** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **urlCell** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **timingCell** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **timeAgoCell** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **tableHeaderRow** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **statusCell** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **sizeCell** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **selectionColumn** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **protocolCell** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **networkColumns** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **methodCell** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **consoleColumns** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **SortIndicator** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **keyboardNav** (performance): Component does not use hardware-accelerated properties
  - Recommendation: Use transform and opacity instead of top/left for animations
  - Effort: small
- **PanelTabs** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **PanelContent** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **PanelContent** (accessibility): [WCAG 2.3.3] Motion component should respect prefers-reduced-motion using useReducedMotion().
  - Recommendation: Add prefers-reduced-motion support
  - Effort: small
- **input** (accessibility): [WCAG 2.3.3] Motion component should respect prefers-reduced-motion using useReducedMotion().
  - Recommendation: Add prefers-reduced-motion support
  - Effort: small
- **checkbox** (accessibility): [WCAG 2.3.3] Motion component should respect prefers-reduced-motion using useReducedMotion().
  - Recommendation: Add prefers-reduced-motion support
  - Effort: small
- **card** (accessibility): [WCAG 2.3.3] Motion component should respect prefers-reduced-motion using useReducedMotion().
  - Recommendation: Add prefers-reduced-motion support
  - Effort: small
- **button** (accessibility): [WCAG 2.3.3] Motion component should respect prefers-reduced-motion using useReducedMotion().
  - Recommendation: Add prefers-reduced-motion support
  - Effort: small
- **Toast** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **Switch** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **Switch** (accessibility): [WCAG 2.3.3] Motion component should respect prefers-reduced-motion using useReducedMotion().
  - Recommendation: Add prefers-reduced-motion support
  - Effort: small
- **SplitButton** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **SplitButton** (accessibility): [WCAG 2.3.3] Motion component should respect prefers-reduced-motion using useReducedMotion().
  - Recommendation: Add prefers-reduced-motion support
  - Effort: small
- **PulsingGlow** (accessibility): [WCAG 2.3.3] Motion component should respect prefers-reduced-motion using useReducedMotion().
  - Recommendation: Add prefers-reduced-motion support
  - Effort: small
- **EmptyState** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **DialogFooter** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **DialogContent** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **Dialog** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **DataPanelHeader** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **ResponseViewer** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **RequestHeader** (accessibility): [WCAG 2.3.3] Motion component should respect prefers-reduced-motion using useReducedMotion().
  - Recommendation: Add prefers-reduced-motion support
  - Effort: small
- **RequestBuilder** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **ParamsEditor** (accessibility): [WCAG 2.3.3] Motion component should respect prefers-reduced-motion using useReducedMotion().
  - Recommendation: Add prefers-reduced-motion support
  - Effort: small
- **HeaderEditor** (accessibility): [WCAG 2.3.3] Motion component should respect prefers-reduced-motion using useReducedMotion().
  - Recommendation: Add prefers-reduced-motion support
  - Effort: small
- **AuthEditor** (accessibility): [WCAG 2.3.3] Motion component should respect prefers-reduced-motion using useReducedMotion().
  - Recommendation: Add prefers-reduced-motion support
  - Effort: small
- **MetricsToggle** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **MetricsGrid** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **TitleBar** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **Sidebar** (accessibility): [WCAG 2.3.3] Motion component should respect prefers-reduced-motion using useReducedMotion().
  - Recommendation: Add prefers-reduced-motion support
  - Effort: small
- **MainLayout** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **DockablePanel** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **ConsolePanel** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **VirtualDataGrid** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **ExpandedContent** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **CodeEditor** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **CodeEditor** (accessibility): [WCAG 2.3.3] Motion component should respect prefers-reduced-motion using useReducedMotion().
  - Recommendation: Add prefers-reduced-motion support
  - Effort: small
- **TLSPanel** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **ResponseTab** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **ResponsePanel** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **NetworkHistoryPanel** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **LanguageTabs** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **HeadersTab** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **HeadersPanel** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **CodeGenTab** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **CodeGenPanel** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **CodeBox** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **ActionBar** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **effects** (accessibility): [WCAG 2.3.3] Motion component should respect prefers-reduced-motion using useReducedMotion().
  - Recommendation: Add prefers-reduced-motion support
  - Effort: small
- **SegmentedControl** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **BadgeCount** (accessibility): [WCAG 2.3.3] Motion component should respect prefers-reduced-motion using useReducedMotion().
  - Recommendation: Add prefers-reduced-motion support
  - Effort: small
- **TabNavigation** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **ExpandedPanel** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **ExpandedActionButtons** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **selectionColumn** (accessibility): [WCAG 1.3.1] Consider using semantic HTML elements (main, nav, article, section, aside) instead of divs.
  - Recommendation: Replace div/span with semantic HTML element
  - Effort: small
- **PanelContent** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium
- **ResponseViewer** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium
- **RequestHeader** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium
- **ParamsEditor** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium
- **HeaderEditor** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium
- **AuthEditor** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium
- **checkbox** (unified-material): Missing Motion variant orchestration
  - Recommendation: Add Motion variants with staggerChildren and parent-child coordination
  - Effort: medium
- **checkbox** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium
- **card** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium
- **button** (unified-material): Missing Motion variant orchestration
  - Recommendation: Add Motion variants with staggerChildren and parent-child coordination
  - Effort: medium
- **button** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium
- **ToastProvider** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium
- **Switch** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium
- **SplitButton** (unified-material): Missing Motion variant orchestration
  - Recommendation: Add Motion variants with staggerChildren and parent-child coordination
  - Effort: medium
- **SplitButton** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium
- **PulsingGlow** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium
- **EmptyState** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium
- **Dialog** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium
- **Sidebar** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium
- **MainLayout** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium
- **DockablePanel** (unified-material): Missing Motion variant orchestration
  - Recommendation: Add Motion variants with staggerChildren and parent-child coordination
  - Effort: medium
- **DockablePanel** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium
- **TimingWaterfall** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium
- **TimingTab** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium
- **CodeBox** (unified-material): Missing Motion variant orchestration
  - Recommendation: Add Motion variants with staggerChildren and parent-child coordination
  - Effort: medium
- **CodeEditor** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium
- **ActionBar** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium
- **ExpandedContent** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium
- **EnergyEdge** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium
- **SegmentedControl** (unified-material): Missing Motion variant orchestration
  - Recommendation: Add Motion variants with staggerChildren and parent-child coordination
  - Effort: medium
- **SegmentedControl** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium
- **BadgeCount** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium
- **createExpanderColumn** (unified-material): No subtle depth change on hover interaction
  - Recommendation: Add subtle shadow or scale change on hover
  - Effort: medium

### Low Priority

- **PanelTabs** (storybook): Story is missing play functions for interaction testing
  - Recommendation: Add play functions to test component interactions
  - Effort: small
- **PanelContent** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **PanelContent** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **MetricsToggle** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **MetricsToggle** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **MetricsPanel** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **MetricsPanel** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **MetricsGrid** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **MetricsGrid** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **MetricCell** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **MetricCell** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **RequestBuilder** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **RequestBuilder** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **MemoryWarningListener** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **MemoryWarningListener** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **Tooltip** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **Tooltip** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **PulsingGlow** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **PulsingGlow** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **DialogHeader** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **DialogFooter** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **DialogFooter** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **DialogContent** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **DialogContent** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **Dialog** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **Dialog** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **TitleBar** (storybook): Story is missing play functions for interaction testing
  - Recommendation: Add play functions to test component interactions
  - Effort: small
- **TitleBar** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **StatusBar** (storybook): Story is missing play functions for interaction testing
  - Recommendation: Add play functions to test component interactions
  - Effort: small
- **StatusBar** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **Sidebar** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **MainLayout** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **DockablePanel** (storybook): Story is missing play functions for interaction testing
  - Recommendation: Add play functions to test component interactions
  - Effort: small
- **DockablePanel** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **DockControls** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **DockControls** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **ExpandedContent** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **ExpandedContent** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **DataGridHeader** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **DataGridHeader** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **ConsoleToolbar** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **ConsoleToolbar** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **ConsoleContextMenu** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **ConsoleContextMenu** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **AppMetricsLog** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **AppMetricsLog** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **AppMetricsContainer** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **AppMetricsContainer** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **selectRenderers** (storybook): Story is missing play functions for interaction testing
  - Recommendation: Add play functions to test component interactions
  - Effort: small
- **ActionBarSelect** (storybook): Story is missing play functions for interaction testing
  - Recommendation: Add play functions to test component interactions
  - Effort: small
- **ActionBarSegment** (storybook): Story is missing play functions for interaction testing
  - Recommendation: Add play functions to test component interactions
  - Effort: small
- **ActionBarSearch** (storybook): Story is missing play functions for interaction testing
  - Recommendation: Add play functions to test component interactions
  - Effort: small
- **ActionBarGroup** (storybook): Story is missing play functions for interaction testing
  - Recommendation: Add play functions to test component interactions
  - Effort: small
- **ActionBarContext** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **ActionBarContext** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **ActionBarCompositeButton** (storybook): Story is missing play functions for interaction testing
  - Recommendation: Add play functions to test component interactions
  - Effort: small
- **ActionBar** (storybook): Story is missing play functions for interaction testing
  - Recommendation: Add play functions to test component interactions
  - Effort: small
- **TLSTab** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **TLSTab** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **TLSPanel** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **TLSPanel** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **SignalDot** (storybook): Story is missing play functions for interaction testing
  - Recommendation: Add play functions to test component interactions
  - Effort: small
- **ResponsePanel** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **ResponsePanel** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **IntelligenceSignals** (storybook): Story is missing play functions for interaction testing
  - Recommendation: Add play functions to test component interactions
  - Effort: small
- **FilterBarActions** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **FilterBarActions** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **CertificateInfo** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **CertificateInfo** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **effects** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **effects** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **BadgeCount** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **BadgeCount** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **keyboardNav** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **keyboardNav** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **TabNavigation** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **TabNavigation** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **ExpandedPanel** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **ExpandedActionButtons** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **ExpandedActionButtons** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **urlCell** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **urlCell** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **timingCell** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **timingCell** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **timeAgoCell** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **timeAgoCell** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **tableHeaderRow** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **tableHeaderRow** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **statusCell** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **statusCell** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **sizeCell** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **sizeCell** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **selectionColumn** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **selectionColumn** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **protocolCell** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **protocolCell** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **networkColumns** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **networkColumns** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **methodCell** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **methodCell** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **expanderColumn** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **expanderColumn** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **consoleColumns** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **consoleColumns** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **SortIndicator** (storybook): Story is missing required variations (loading, error, empty states)
  - Recommendation: Add stories for loading, error, and empty states
  - Effort: small
- **SortIndicator** (storybook): Story naming issue: missing-default
  - Recommendation: Follow story naming conventions with Default and Playground stories
  - Effort: trivial
- **PanelTabs** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **PanelTabs** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **PanelTabs** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **PanelTabs** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **PanelTabs** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **ResponseViewer** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **ResponseViewer** (design-principles): spacing-grid: Non-8px grid spacing: space-y-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **RequestHeader** (design-principles): spacing-grid: Non-8px grid spacing: gap-3
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **RequestBuilder** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **select** (design-principles): spacing-grid: Non-8px grid spacing: p-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **card** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **Toast** (design-principles): spacing-grid: Non-8px grid spacing: gap-3
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **Toast** (design-principles): spacing-grid: Non-8px grid spacing: p-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **SplitButton** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **DialogHeader** (design-principles): spacing-grid: Non-8px grid spacing: p-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **DataPanelHeader** (design-principles): spacing-grid: Non-8px grid spacing: gap-3
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **MetricsPanel** (design-principles): spacing-grid: Non-8px grid spacing: p-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **StatusBar** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **StatusBar** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **StatusBar** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **DockablePanel** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **DockablePanel** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **DockablePanel** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **DockablePanel** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **DockablePanel** (design-principles): spacing-grid: Non-8px grid spacing: p-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **DockablePanel** (design-principles): spacing-grid: Non-8px grid spacing: p-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **DockControls** (design-principles): spacing-grid: Non-8px grid spacing: p-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **DockControls** (design-principles): spacing-grid: Non-8px grid spacing: p-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **AppMetricsLog** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **TimingWaterfall** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **TimingWaterfall** (design-principles): spacing-grid: Non-8px grid spacing: gap-3
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **TimingWaterfall** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **TimingTab** (design-principles): spacing-grid: Non-8px grid spacing: space-y-5
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **TimingTab** (design-principles): spacing-grid: Non-8px grid spacing: gap-3
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **TimingTab** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **TimingTab** (design-principles): spacing-grid: Non-8px grid spacing: p-3
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **TimingTab** (design-principles): spacing-grid: Non-8px grid spacing: space-y-3
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **TimingTab** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **TimingTab** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **TimingTab** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **TimingTab** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **TLSPanel** (design-principles): spacing-grid: Non-8px grid spacing: p-3
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **ResponsePanel** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **LanguageTabs** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **IntelligenceSignals** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **HeadersPanel** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **CopyButton** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **CertificateInfo** (design-principles): spacing-grid: Non-8px grid spacing: p-3
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **CertificateInfo** (design-principles): spacing-grid: Non-8px grid spacing: p-3
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **CertificateInfo** (design-principles): spacing-grid: Non-8px grid spacing: p-3
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **CertificateInfo** (design-principles): spacing-grid: Non-8px grid spacing: p-3
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **CertificateInfo** (design-principles): spacing-grid: Non-8px grid spacing: p-3
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **ActionBar** (design-principles): spacing-grid: Non-8px grid spacing: gap-3
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **SegmentedControl** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **TabNavigation** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **TabNavigation** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **networkColumns** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **consoleColumns** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **consoleColumns** (design-principles): spacing-grid: Non-8px grid spacing: gap-1
  - Recommendation: Consider using 8px grid spacing (p-2, p-4, p-6, p-8)
  - Effort: small
- **PanelTabs** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **PanelTabs** (performance): Using inline animation values in whileHover/whileTap. Consider extracting to variants for reusability and cleaner code.
  - Recommendation: Extract animation values to variants or constants
  - Effort: medium
- **PanelContent** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **StatusBadge** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **ResponseViewer** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **RequestHeader** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **RequestHeader** (performance): Using full layout animation. If only position changes, consider layout="position" for better performance.
  - Recommendation: Consider layout="position" for simpler animations
  - Effort: medium
- **RequestBuilder** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **RequestBuilder** (performance): Using inline animation values in whileHover/whileTap. Consider extracting to variants for reusability and cleaner code.
  - Recommendation: Extract animation values to variants or constants
  - Effort: medium
- **ParamsEditor** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **HeaderEditor** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **AuthEditor** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **MetricsToggle** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **MetricsPanel** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **MetricsGrid** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **MetricCell** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **MemoryWarningListener** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **TitleBar** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **StatusBar** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **Sidebar** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **MainLayout** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **MainLayout** (performance): Using full layout animation. If only position changes, consider layout="position" for better performance.
  - Recommendation: Consider layout="position" for simpler animations
  - Effort: medium
- **DockablePanel** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **DockControls** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **separator** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **select** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **input** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **input** (performance): Using inline animation values in whileHover/whileTap. Consider extracting to variants for reusability and cleaner code.
  - Recommendation: Extract animation values to variants or constants
  - Effort: medium
- **checkbox** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **card** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **button** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **Tooltip** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **Toast** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **Toast** (performance): Using full layout animation. If only position changes, consider layout="position" for better performance.
  - Recommendation: Consider layout="position" for simpler animations
  - Effort: medium
- **Switch** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **Switch** (performance): Using full layout animation. If only position changes, consider layout="position" for better performance.
  - Recommendation: Consider layout="position" for simpler animations
  - Effort: medium
- **SplitButton** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **PulsingGlow** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **Label** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **EmptyState** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **DialogHeader** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **DialogFooter** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **DialogContent** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **Dialog** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **DataPanelHeader** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **DataPanel** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **TimingWaterfall** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **TimingTab** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **TLSTab** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **TLSPanel** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **SignalDot** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **ResponseTab** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **ResponsePanel** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **NetworkStatusBar** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **NetworkHistoryPanel** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **NetworkHistoryFilters** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **LanguageTabs** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **IntelligenceSignals** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **HeadersTab** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **HeadersPanel** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **HeaderRow** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **FilterBarActions** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **FilterBar** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **CopyButton** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **CodeGenTab** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **CodeGenPanel** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **CodeBox** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **CertificateInfo** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **CodeEditor** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **selectRenderers** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **ActionBarSelect** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **ActionBarSegment** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **ActionBarSearch** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **ActionBarGroup** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **ActionBarContext** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **ActionBarCompositeButton** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **ActionBar** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **ConsoleToolbar** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **ConsolePanel** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **ConsoleContextMenu** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **AppMetricsLog** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **AppMetricsContainer** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **VirtualDataGrid** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **ExpandedContent** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **DataGridHeader** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **effects** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **SegmentedControl** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **BadgeCount** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **TabNavigation** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **TabNavigation** (performance): Using inline animation values in whileHover/whileTap. Consider extracting to variants for reusability and cleaner code.
  - Recommendation: Extract animation values to variants or constants
  - Effort: medium
- **ExpandedPanel** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **ExpandedActionButtons** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **urlCell** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **timingCell** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **timeAgoCell** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **tableHeaderRow** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **statusCell** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **sizeCell** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **selectionColumn** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **protocolCell** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **networkColumns** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **methodCell** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **expanderColumn** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **consoleColumns** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **SortIndicator** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **keyboardNav** (performance): Consider using layout="position" for smoother layout animations
  - Recommendation: Use layout="position" instead of full layout animations when possible
  - Effort: small
- **PanelTabs** (unified-material): single-motion-div: Found 2 motion.div elements - consider consolidating
  - Recommendation: Consolidate multiple motion elements into single unified material
  - Effort: small
- **PanelTabs** (unified-material): hover-state-analysis: Separate inner hover states detected - consider unified hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **PanelContent** (unified-material): single-motion-div: Found 4 motion.div elements - consider consolidating
  - Recommendation: Consolidate multiple motion elements into single unified material
  - Effort: small
- **PanelContent** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **ResponseViewer** (unified-material): single-motion-div: Found 2 motion.div elements - consider consolidating
  - Recommendation: Consolidate multiple motion elements into single unified material
  - Effort: small
- **ResponseViewer** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **RequestHeader** (unified-material): single-motion-div: Found 2 motion.div elements - consider consolidating
  - Recommendation: Consolidate multiple motion elements into single unified material
  - Effort: small
- **RequestHeader** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **RequestBuilder** (unified-material): single-motion-div: Found 10 motion.div elements - consider consolidating
  - Recommendation: Consolidate multiple motion elements into single unified material
  - Effort: small
- **ParamsEditor** (unified-material): single-motion-div: Found 4 motion.div elements - consider consolidating
  - Recommendation: Consolidate multiple motion elements into single unified material
  - Effort: small
- **ParamsEditor** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **HeaderEditor** (unified-material): single-motion-div: Found 4 motion.div elements - consider consolidating
  - Recommendation: Consolidate multiple motion elements into single unified material
  - Effort: small
- **HeaderEditor** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **AuthEditor** (unified-material): single-motion-div: Found 6 motion.div elements - consider consolidating
  - Recommendation: Consolidate multiple motion elements into single unified material
  - Effort: small
- **AuthEditor** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **checkbox** (unified-material): variant-orchestration: Uses variants but missing orchestration (staggerChildren/delayChildren)
  - Recommendation: Add Motion variants for coordinated animations
  - Effort: small
- **checkbox** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **card** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **button** (unified-material): variant-orchestration: Uses variants but missing orchestration (staggerChildren/delayChildren)
  - Recommendation: Add Motion variants for coordinated animations
  - Effort: small
- **button** (unified-material): hover-state-analysis: Separate inner hover states detected - consider unified hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **button** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **ToastProvider** (unified-material): single-motion-div: Found 2 motion.div elements - consider consolidating
  - Recommendation: Consolidate multiple motion elements into single unified material
  - Effort: small
- **ToastProvider** (unified-material): hover-state-analysis: Separate inner hover states detected - consider unified hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **ToastProvider** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **Switch** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **SplitButton** (unified-material): variant-orchestration: Uses variants but missing orchestration (staggerChildren/delayChildren)
  - Recommendation: Add Motion variants for coordinated animations
  - Effort: small
- **SplitButton** (unified-material): hover-state-analysis: Separate inner hover states detected - consider unified hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **SplitButton** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **PulsingGlow** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **EmptyState** (unified-material): single-motion-div: Found 18 motion.div elements - consider consolidating
  - Recommendation: Consolidate multiple motion elements into single unified material
  - Effort: small
- **EmptyState** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **Dialog** (unified-material): single-motion-div: Found 2 motion.div elements - consider consolidating
  - Recommendation: Consolidate multiple motion elements into single unified material
  - Effort: small
- **Dialog** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **TitleBar** (unified-material): hover-state-analysis: Separate inner hover states detected - consider unified hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **Sidebar** (unified-material): single-motion-div: Found 2 motion.div elements - consider consolidating
  - Recommendation: Consolidate multiple motion elements into single unified material
  - Effort: small
- **Sidebar** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **MainLayout** (unified-material): single-motion-div: Found 9 motion.div elements - consider consolidating
  - Recommendation: Consolidate multiple motion elements into single unified material
  - Effort: small
- **MainLayout** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **DockablePanel** (unified-material): single-motion-div: Found 17 motion.div elements - consider consolidating
  - Recommendation: Consolidate multiple motion elements into single unified material
  - Effort: small
- **DockablePanel** (unified-material): variant-orchestration: Uses variants but missing orchestration (staggerChildren/delayChildren)
  - Recommendation: Add Motion variants for coordinated animations
  - Effort: small
- **DockablePanel** (unified-material): hover-state-analysis: Separate inner hover states detected - consider unified hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **DockablePanel** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **DockControls** (unified-material): hover-state-analysis: Separate inner hover states detected - consider unified hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **TimingWaterfall** (unified-material): single-motion-div: Found 2 motion.div elements - consider consolidating
  - Recommendation: Consolidate multiple motion elements into single unified material
  - Effort: small
- **TimingWaterfall** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **TimingTab** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **CodeBox** (unified-material): variant-orchestration: Uses variants but missing orchestration (staggerChildren/delayChildren)
  - Recommendation: Add Motion variants for coordinated animations
  - Effort: small
- **CodeEditor** (unified-material): single-motion-div: Found 2 motion.div elements - consider consolidating
  - Recommendation: Consolidate multiple motion elements into single unified material
  - Effort: small
- **CodeEditor** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **ActionBar** (unified-material): single-motion-div: Found 2 motion.div elements - consider consolidating
  - Recommendation: Consolidate multiple motion elements into single unified material
  - Effort: small
- **ActionBar** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **ExpandedContent** (unified-material): single-motion-div: Found 2 motion.div elements - consider consolidating
  - Recommendation: Consolidate multiple motion elements into single unified material
  - Effort: small
- **ExpandedContent** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **EnergyEdge** (unified-material): single-motion-div: Found 6 motion.div elements - consider consolidating
  - Recommendation: Consolidate multiple motion elements into single unified material
  - Effort: small
- **EnergyEdge** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **SegmentedControl** (unified-material): single-motion-div: Found 2 motion.div elements - consider consolidating
  - Recommendation: Consolidate multiple motion elements into single unified material
  - Effort: small
- **SegmentedControl** (unified-material): variant-orchestration: Uses variants but missing orchestration (staggerChildren/delayChildren)
  - Recommendation: Add Motion variants for coordinated animations
  - Effort: small
- **SegmentedControl** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **BadgeCount** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small
- **createExpanderColumn** (unified-material): depth-on-hover: Interactive component missing depth effect on hover
  - Recommendation: Review and fix unified material issue
  - Effort: small

## Recommendations

1. Add proper ARIA labels and semantic HTML
2. Add keyboard support for all interactive elements
3. Add prefers-reduced-motion media query or useReducedMotion hook
4. Use semantic tokens like bg-background, text-foreground, or design system tokens
5. Add tabindex="0" for custom interactive elements

## Follow-Up Plan

### Phase 1: Critical Fixes

- **Priority:** critical
- **Effort:** large
- **Description:** Address all critical issues immediately
- **Components:** PanelTabs, PanelContent, separator, select, checkbox, card, button, Tooltip, Switch, SplitButton, PulsingGlow, Label, EmptyState, DialogFooter, DialogContent, Dialog, DataPanelHeader, DataPanel, StatusBadge, RequestBuilder, MemoryWarningListener, MetricsToggle, MetricsGrid, MetricCell, AppMetricsLog, AppMetricsContainer, VirtualDataGrid, ExpandedContent, DataGridHeader, TimingWaterfall, TimingTab, TLSTab, TLSPanel, SignalDot, NetworkStatusBar, NetworkHistoryPanel, IntelligenceSignals, HeaderRow, FilterBar, CodeGenTab, CodeGenPanel, CodeBox, CertificateInfo, selectRenderers, ActionBarSelect, ActionBarSegment, ActionBarGroup, ActionBarContext, ActionBar, effects, SegmentedControl, BadgeCount, keyboardNav, urlCell, timingCell, timeAgoCell, tableHeaderRow, statusCell, sizeCell, protocolCell, methodCell, SortIndicator

### Phase 2: High Priority Fixes

- **Priority:** high
- **Effort:** medium
- **Description:** Resolve high priority issues
- **Components:** PanelContent, input, checkbox, card, button, Switch, SplitButton, PulsingGlow, Sidebar, RequestHeader, ParamsEditor, HeaderEditor, AuthEditor, CodeEditor, effects, BadgeCount, Toast, DockablePanel, TimingWaterfall, NetworkHistoryFilters, VirtualDataGrid, SegmentedControl, ExpandedContent, PanelTabs, separator, select, Tooltip, Label, EmptyState, DialogHeader, DialogFooter, DialogContent, Dialog, DataPanelHeader, DataPanel, StatusBadge, ResponseViewer, RequestBuilder, MemoryWarningListener, MetricsToggle, MetricsPanel, MetricsGrid, MetricCell, TitleBar, StatusBar, MainLayout, DockControls, ConsoleToolbar, ConsolePanel, ConsoleContextMenu, AppMetricsLog, AppMetricsContainer, DataGridHeader, TimingTab, TLSTab, TLSPanel, SignalDot, ResponseTab, ResponsePanel, NetworkStatusBar, NetworkHistoryPanel, LanguageTabs, IntelligenceSignals, HeadersTab, HeadersPanel, HeaderRow, FilterBarActions, FilterBar, CopyButton, CodeGenTab, CodeGenPanel, CodeBox, CertificateInfo, selectRenderers, ActionBarSelect, ActionBarSegment, ActionBarSearch, ActionBarGroup, ActionBarContext, ActionBarCompositeButton, ActionBar, keyboardNav, TabNavigation, ExpandedPanel, ExpandedActionButtons, urlCell, timingCell, timeAgoCell, tableHeaderRow, statusCell, sizeCell, selectionColumn, protocolCell, networkColumns, methodCell, expanderColumn, consoleColumns, SortIndicator, ToastProvider, EnergyEdge

### Phase 3: Accessibility Improvements

- **Priority:** high
- **Effort:** medium
- **Description:** Enhance accessibility across components
- **Components:** PanelTabs, PanelContent, separator, select, input, checkbox, card, button, Tooltip, Switch, SplitButton, PulsingGlow, Label, EmptyState, DialogHeader, DialogFooter, DialogContent, Dialog, DataPanelHeader, DataPanel, StatusBadge, ResponseViewer, RequestHeader, RequestBuilder, ParamsEditor, HeaderEditor, AuthEditor, MemoryWarningListener, MetricsToggle, MetricsPanel, MetricsGrid, MetricCell, TitleBar, StatusBar, Sidebar, MainLayout, DockablePanel, DockControls, ConsoleToolbar, ConsolePanel, ConsoleContextMenu, AppMetricsLog, AppMetricsContainer, VirtualDataGrid, ExpandedContent, DataGridHeader, CodeEditor, TimingWaterfall, TimingTab, TLSTab, TLSPanel, SignalDot, ResponseTab, ResponsePanel, NetworkStatusBar, NetworkHistoryPanel, NetworkHistoryFilters, LanguageTabs, IntelligenceSignals, HeadersTab, HeadersPanel, HeaderRow, FilterBarActions, FilterBar, CopyButton, CodeGenTab, CodeGenPanel, CodeBox, CertificateInfo, selectRenderers, ActionBarSelect, ActionBarSegment, ActionBarSearch, ActionBarGroup, ActionBarContext, ActionBarCompositeButton, ActionBar, effects, SegmentedControl, BadgeCount, keyboardNav, TabNavigation, ExpandedPanel, ExpandedActionButtons, urlCell, timingCell, timeAgoCell, tableHeaderRow, statusCell, sizeCell, selectionColumn, protocolCell, networkColumns, methodCell, expanderColumn, consoleColumns, SortIndicator, Toast

### Phase 4: Performance Optimization

- **Priority:** medium
- **Effort:** medium
- **Description:** Optimize component performance and bundle size
- **Components:** Sidebar, TimingWaterfall, ExpandedContent, PanelTabs, StatusBadge, ResponseViewer, RequestHeader, MetricsToggle, MetricsPanel, MetricsGrid, MetricCell, MemoryWarningListener, TitleBar, StatusBar, DockControls, separator, select, input, checkbox, card, button, Tooltip, Switch, SplitButton, Label, EmptyState, DialogHeader, DialogFooter, DialogContent, Dialog, DataPanelHeader, DataPanel, TimingTab, TLSTab, TLSPanel, SignalDot, ResponseTab, ResponsePanel, NetworkStatusBar, NetworkHistoryPanel, NetworkHistoryFilters, LanguageTabs, IntelligenceSignals, HeadersTab, HeadersPanel, HeaderRow, FilterBarActions, FilterBar, CopyButton, CodeGenTab, CodeGenPanel, CodeBox, CertificateInfo, selectRenderers, ActionBarSelect, ActionBarSegment, ActionBarSearch, ActionBarGroup, ActionBarContext, ActionBarCompositeButton, ActionBar, ConsoleToolbar, ConsolePanel, ConsoleContextMenu, AppMetricsLog, AppMetricsContainer, VirtualDataGrid, DataGridHeader, SegmentedControl, TabNavigation, ExpandedPanel, ExpandedActionButtons, urlCell, timingCell, timeAgoCell, tableHeaderRow, statusCell, sizeCell, selectionColumn, protocolCell, networkColumns, methodCell, consoleColumns, SortIndicator, keyboardNav, PanelContent, RequestBuilder, ParamsEditor, HeaderEditor, AuthEditor, MainLayout, DockablePanel, Toast, PulsingGlow, CodeEditor, effects, BadgeCount, expanderColumn

### Phase 5: Testing Coverage

- **Priority:** medium
- **Effort:** small
- **Description:** Improve Storybook coverage and interaction tests
- **Components:** PanelContent, MetricsToggle, MetricsPanel, MetricsGrid, MetricCell, RequestBuilder, MemoryWarningListener, Tooltip, PulsingGlow, DialogFooter, DialogContent, Dialog, DockControls, ExpandedContent, DataGridHeader, ConsoleToolbar, ConsoleContextMenu, AppMetricsLog, AppMetricsContainer, ActionBarContext, TLSTab, TLSPanel, ResponsePanel, FilterBarActions, CertificateInfo, effects, BadgeCount, keyboardNav, TabNavigation, ExpandedActionButtons, urlCell, timingCell, timeAgoCell, tableHeaderRow, statusCell, sizeCell, selectionColumn, protocolCell, networkColumns, methodCell, expanderColumn, consoleColumns, SortIndicator, PanelTabs, DialogHeader, TitleBar, StatusBar, Sidebar, MainLayout, DockablePanel, selectRenderers, ActionBarSelect, ActionBarSegment, ActionBarSearch, ActionBarGroup, ActionBarCompositeButton, ActionBar, SignalDot, IntelligenceSignals, ExpandedPanel

### Phase 6: Polish and Refinement

- **Priority:** low
- **Effort:** small
- **Description:** Address remaining low priority issues
- **Components:** PanelTabs, PanelContent, MetricsToggle, MetricsPanel, MetricsGrid, MetricCell, RequestBuilder, MemoryWarningListener, Tooltip, PulsingGlow, DialogHeader, DialogFooter, DialogContent, Dialog, TitleBar, StatusBar, Sidebar, MainLayout, DockablePanel, DockControls, ExpandedContent, DataGridHeader, ConsoleToolbar, ConsoleContextMenu, AppMetricsLog, AppMetricsContainer, selectRenderers, ActionBarSelect, ActionBarSegment, ActionBarSearch, ActionBarGroup, ActionBarContext, ActionBarCompositeButton, ActionBar, TLSTab, TLSPanel, SignalDot, ResponsePanel, IntelligenceSignals, FilterBarActions, CertificateInfo, effects, BadgeCount, keyboardNav, TabNavigation, ExpandedPanel, ExpandedActionButtons, urlCell, timingCell, timeAgoCell, tableHeaderRow, statusCell, sizeCell, selectionColumn, protocolCell, networkColumns, methodCell, expanderColumn, consoleColumns, SortIndicator, ResponseViewer, RequestHeader, select, card, Toast, SplitButton, DataPanelHeader, TimingWaterfall, TimingTab, LanguageTabs, HeadersPanel, CopyButton, SegmentedControl, StatusBadge, ParamsEditor, HeaderEditor, AuthEditor, separator, input, checkbox, button, Switch, Label, EmptyState, DataPanel, ResponseTab, NetworkStatusBar, NetworkHistoryPanel, NetworkHistoryFilters, HeadersTab, HeaderRow, FilterBar, CodeGenTab, CodeGenPanel, CodeBox, CodeEditor, ConsolePanel, VirtualDataGrid, ToastProvider, EnergyEdge, createExpanderColumn
