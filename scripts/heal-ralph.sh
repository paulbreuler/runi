#!/bin/bash
# Heal and improve Ralph files using a Claude-guided prompt
#
# Usage (CLI - chainable):
#   just heal-ralph "fix layout references to use VS Code style"
#   just heal-ralph --prompt-file prompts/heal-layout.md
#   just heal-ralph --dry-run "add HTTPie principles to all prompts"
#
# Usage (Cursor Command):
#   Command Palette → "Ralph: Heal Files" → Enter prompt
#
# Features:
#   - Dynamically discovers Ralph files (no hardcoded lists)
#   - Generates analysis prompts for Claude
#   - Supports both CLI and Cursor command integration
#   - Dry-run mode for preview

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# Default values
DRY_RUN=false
PROMPT_FILE=""
PROMPT_TEXT=""
USE_CLAUDE_API=false
CLAUDE_API_KEY=""

# Dynamically discover Ralph files (no hardcoded lists)
discover_ralph_files() {
  local files=()
  local project_root="$1"
  
  # Core Ralph files (always check these if they exist)
  local core_files=(
    "@fix_plan.md"
    "specs/requirements.md"
    "PROMPT.md"
    "CLAUDE.md"
  )
  
  for file in "${core_files[@]}"; do
    if [[ -f "$project_root/$file" ]]; then
      files+=("$file")
    fi
  done
  
  # Discover all prompt files dynamically
  if [[ -d "$project_root/prompts" ]]; then
    while IFS= read -r -d '' file; do
      # Remove project_root prefix for relative paths
      local rel_path="${file#$project_root/}"
      files+=("$rel_path")
    done < <(find "$project_root/prompts" -name "*.md" -type f -print0 2>/dev/null | sort -z)
  fi
  
  # Remove duplicates and sort
  printf '%s\n' "${files[@]}" | sort -u
}

RALPH_FILES=($(discover_ralph_files "$PROJECT_ROOT"))

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --prompt-file)
      PROMPT_FILE="$2"
      shift 2
      ;;
    --use-claude-api)
      USE_CLAUDE_API=true
      if [[ -n "${ANTHROPIC_API_KEY:-}" ]]; then
        CLAUDE_API_KEY="$ANTHROPIC_API_KEY"
      elif [[ -n "${CLAUDE_API_KEY:-}" ]]; then
        CLAUDE_API_KEY="$CLAUDE_API_KEY"
      else
        echo "⚠️  Warning: --use-claude-api specified but no API key found"
        echo "   Set ANTHROPIC_API_KEY or CLAUDE_API_KEY environment variable"
        USE_CLAUDE_API=false
      fi
      shift
      ;;
    --help|-h)
      cat << EOF
Heal and improve Ralph files using a Claude-guided prompt.

Usage:
  just heal-ralph [OPTIONS] [PROMPT_TEXT]

Options:
  --dry-run              Show what would be changed without making changes
  --prompt-file FILE     Read prompt from file instead of command line
  --use-claude-api       Attempt to call Claude API (requires ANTHROPIC_API_KEY)
  --help, -h             Show this help message

Examples:
  # Heal with inline prompt
  just heal-ralph "update all layout references to use horizontal split"

  # Heal with prompt file
  just heal-ralph --prompt-file prompts/heal-requests.md

  # Dry run to see what would change
  just heal-ralph --dry-run "add HTTPie design principles everywhere"

  # Use Claude API (if available)
  just heal-ralph --use-claude-api "fix all layout references"

Files discovered dynamically:
  - Core files: @fix_plan.md, specs/requirements.md, PROMPT.md, CLAUDE.md
  - Prompt files: prompts/PROMPT-*.md
  - Other files: prompts/README.md, prompts/HTTPIE-LEARNINGS.md, etc.

Note: This command generates analysis prompts. For direct file editing,
      use the Cursor command palette: "Ralph: Heal Files"

EOF
      exit 0
      ;;
    *)
      if [[ -z "$PROMPT_TEXT" ]]; then
        PROMPT_TEXT="$1"
      else
        PROMPT_TEXT="$PROMPT_TEXT $1"
      fi
      shift
      ;;
  esac
done

# Validate prompt source
if [[ -n "$PROMPT_FILE" ]]; then
  if [[ ! -f "$PROMPT_FILE" ]]; then
    echo "❌ Prompt file not found: $PROMPT_FILE"
    exit 1
  fi
  PROMPT_TEXT=$(cat "$PROMPT_FILE")
  echo "📄 Using prompt from: $PROMPT_FILE"
elif [[ -z "$PROMPT_TEXT" ]]; then
  echo "❌ Error: No prompt provided"
  echo ""
  echo "Usage: just heal-ralph [OPTIONS] [PROMPT_TEXT]"
  echo "   or: just heal-ralph --prompt-file FILE"
  echo ""
  echo "Use --help for more information"
  exit 1
else
  echo "💬 Using inline prompt: $PROMPT_TEXT"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Ralph File Healing"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [[ "$DRY_RUN" == "true" ]]; then
  echo "🔍 DRY RUN MODE - No changes will be made"
  echo ""
fi

# Create temporary analysis file
TEMP_ANALYSIS=$(mktemp)
trap "rm -f $TEMP_ANALYSIS" EXIT

# Generate analysis prompt for Claude
cat > "$TEMP_ANALYSIS" << EOF
# Ralph File Healing Analysis

## User Request
$PROMPT_TEXT

## Files to Analyze ($(printf '%s\n' "${RALPH_FILES[@]}" | wc -l | tr -d ' ') files)
$(printf '%s\n' "${RALPH_FILES[@]}" | sort -u | sed 's/^/- /')

## Instructions

Analyze the Ralph files listed above and provide:

1. **Issues Found:** List specific problems or inconsistencies related to the user's request
2. **Files Affected:** Which files need changes
3. **Recommended Changes:** Specific edits needed (with file paths and line numbers if possible)
4. **Consistency Check:** Ensure changes maintain consistency across all files

## Output Format

For each file that needs changes, provide:
- File: path/to/file.md
- Issue: Description of the problem
- Current: [excerpt of current content]
- Proposed: [excerpt of proposed content]
- Rationale: Why this change is needed

EOF

echo "📋 Analysis prompt prepared"
echo ""

# In dry-run mode, show what would be analyzed
if [[ "$DRY_RUN" == "true" ]]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📊 Analysis Prompt"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  cat "$TEMP_ANALYSIS"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📁 Files That Would Be Analyzed ($(printf '%s\n' "${RALPH_FILES[@]}" | wc -l | tr -d ' ') files)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  for file in "${RALPH_FILES[@]}"; do
    if [[ -f "$file" ]]; then
      echo "  ✓ $file"
    fi
  done
  echo ""
  echo "💡 To apply changes, run without --dry-run"
  echo "💡 Copy the analysis prompt above and use it with Claude to get specific changes"
  exit 0
fi

# Generate file inventory for Claude
echo "📁 Analyzing Ralph files..."
echo ""

FILE_INVENTORY=$(mktemp)
trap "rm -f $TEMP_ANALYSIS $FILE_INVENTORY" EXIT

cat > "$FILE_INVENTORY" << EOF
# Ralph Files Inventory

## Discovered Files ($(printf '%s\n' "${RALPH_FILES[@]}" | wc -l | tr -d ' ') files)
EOF

# Use dynamically discovered files (no hardcoded lists)
for file in "${RALPH_FILES[@]}"; do
  if [[ -f "$file" ]]; then
    line_count=$(wc -l < "$file" 2>/dev/null | tr -d ' ' || echo "0")
    echo "- \`$file\` ($line_count lines)" >> "$FILE_INVENTORY"
  fi
done

# Show summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Healing Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
cat "$FILE_INVENTORY"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 Next Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Option 1: Use in Cursor (Recommended for Interactive)"
echo "  1. Copy the analysis prompt above"
echo "  2. In Cursor, open relevant Ralph files"
echo "  3. Provide the analysis prompt to Claude Code"
echo "  4. Claude Code will suggest specific file edits"
echo "  5. Review and apply changes"
echo ""
echo "Option 2: Use CLI (Recommended for Automation)"
echo "  1. Save analysis: cat $TEMP_ANALYSIS > analysis.txt"
echo "  2. Use with Claude API or other tools"
echo "  3. Apply changes programmatically"
echo ""
echo "After applying changes:"
echo "  just validate-ralph  # Verify consistency"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Analysis prompt: $TEMP_ANALYSIS"
echo "📁 File inventory: $FILE_INVENTORY"
echo "📊 Files discovered: $(printf '%s\n' "${RALPH_FILES[@]}" | wc -l | tr -d ' ') files (dynamically)"
echo ""
echo "💡 Usage in Cursor:"
echo "   1. Copy the analysis prompt above"
echo "   2. Open relevant Ralph files in Cursor"
echo "   3. Provide analysis prompt to Claude Code"
echo "   4. Apply suggested changes"
echo ""
echo "💡 Usage for automation:"
echo "   cat $TEMP_ANALYSIS > analysis.txt"
echo "   # Use with Claude API or other tools"
echo ""
echo "💡 Tip: Use '--dry-run' to preview without generating full analysis"
