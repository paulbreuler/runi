#!/bin/bash
# Validate Ralph file consistency
# Extracted from justfile for use as standalone script

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "🔍 Validating Ralph file consistency..."
echo ""

ERRORS=0

# Check @fix_plan.md
echo "Checking @fix_plan.md references..."
if ! grep -q "VS Code\|horizontal split\|Request.*left.*Response.*right" @fix_plan.md 2>/dev/null; then
  echo "❌ @fix_plan.md missing layout updates"
  ERRORS=$((ERRORS + 1))
fi

# Check specs/requirements.md
echo "Checking specs/requirements.md references..."
if ! grep -q "VS Code\|horizontal split\|Request.*left.*Response.*right" specs/requirements.md 2>/dev/null; then
  echo "❌ specs/requirements.md missing layout updates"
  ERRORS=$((ERRORS + 1))
fi

# Check design principles
echo "Checking design principles..."
if ! grep -q "hover:bg-muted\|subtle.*interactions\|high contrast" @fix_plan.md 2>/dev/null; then
  echo "⚠️  @fix_plan.md missing design principles"
fi

if [[ $ERRORS -eq 0 ]]; then
  echo "✅ Basic validation passed"
  exit 0
else
  echo "❌ Validation failed with $ERRORS errors"
  exit 1
fi
