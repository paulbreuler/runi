#!/bin/bash
# Normalize Ralph/Claude documentation files
# Ensures consistency across @fix_plan.md, specs/requirements.md, prompts/, PROMPT.md, CLAUDE.md

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "📋 Normalizing Ralph/Claude documentation files..."
echo ""

# Check for required files
REQUIRED_FILES=(
  "@fix_plan.md"
  "specs/requirements.md"
  "PROMPT.md"
  "CLAUDE.md"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "❌ Missing required file: $file"
    exit 1
  fi
done

echo "✅ All required files present"
echo ""

# Validate layout structure consistency
echo "🔍 Validating layout structure consistency..."

LAYOUT_PATTERNS=(
  "VS Code"
  "horizontal split"
  "Request.*left.*Response.*right"
  "50/50.*default"
)

MISSING_PATTERNS=()

for pattern in "${LAYOUT_PATTERNS[@]}"; do
  if ! grep -q -i "$pattern" "@fix_plan.md" specs/requirements.md PROMPT.md 2>/dev/null; then
    MISSING_PATTERNS+=("$pattern")
  fi
done

if [[ ${#MISSING_PATTERNS[@]} -gt 0 ]]; then
  echo "⚠️  Missing layout patterns in some files:"
  for pattern in "${MISSING_PATTERNS[@]}"; do
    echo "   - $pattern"
  done
else
  echo "✅ Layout structure patterns consistent"
fi

echo ""

# Validate design principles
echo "🔍 Validating design principles..."

DESIGN_PATTERNS=(
  "hover:bg-muted"
  "subtle.*interaction"
  "high contrast"
  "monospaced"
)

MISSING_PATTERNS=()

for pattern in "${DESIGN_PATTERNS[@]}"; do
  if ! grep -q -i "$pattern" "@fix_plan.md" specs/requirements.md prompts/*.md 2>/dev/null; then
    MISSING_PATTERNS+=("$pattern")
  fi
done

if [[ ${#MISSING_PATTERNS[@]} -gt 0 ]]; then
  echo "⚠️  Missing design patterns in some files:"
  for pattern in "${MISSING_PATTERNS[@]}"; do
    echo "   - $pattern"
  done
else
  echo "✅ Design principles consistent"
fi

echo ""

# Check for outdated vertical split references
echo "🔍 Checking for outdated vertical split references..."

if grep -q "vertical split.*top.*bottom\|Request.*top.*Response.*bottom" "@fix_plan.md" specs/requirements.md 2>/dev/null; then
  echo "⚠️  Found outdated vertical split references (should be horizontal)"
  echo "   Files may need updating to VS Code-style layout"
else
  echo "✅ No outdated vertical split references found"
fi

echo ""

# Validate prompt file structure
echo "🔍 Validating prompt file structure..."

PROMPT_FILES=(
  "prompts/PROMPT-2A-layout-foundation.md"
  "prompts/PROMPT-2B-request-response-basics.md"
  "prompts/PROMPT-2C-response-viewer-polish.md"
)

for file in "${PROMPT_FILES[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "⚠️  Missing prompt file: $file"
  elif ! grep -q "VS Code\|design principles\|high contrast" "$file" 2>/dev/null; then
    echo "⚠️  Prompt file missing design principles: $file"
  fi
done

echo "✅ Prompt file structure validated"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Normalization Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Files checked:"
echo "  - @fix_plan.md"
echo "  - specs/requirements.md"
echo "  - PROMPT.md"
echo "  - prompts/*.md"
echo ""
echo "Validation complete. Review any warnings above."
echo ""
echo "💡 Tip: Run 'just validate-ralph' for quick validation checks"
