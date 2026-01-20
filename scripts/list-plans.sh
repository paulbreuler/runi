#!/usr/bin/env bash
# List all TDD plans in runi-planning-docs repository

set -euo pipefail

# ANSI color codes
RESET='\033[0m'
BOLD='\033[1m'
DIM='\033[2m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'

PLANS_DIR="../runi-planning-docs/plans"

if [ ! -d "$PLANS_DIR" ]; then
    echo "❌ Plans directory not found: $PLANS_DIR"
    echo "   Make sure runi-planning-docs repository is cloned as a sibling directory"
    exit 1
fi

echo -e "${BOLD}${WHITE}📋 TDD Plans in runi-planning-docs/plans/${RESET}"
echo ""

# Count total plans
TOTAL=$(find "$PLANS_DIR" -maxdepth 1 -type d ! -name "plans" ! -name "templates" ! -name "." | wc -l | tr -d ' ')
echo -e "Total plans: ${BOLD}${TOTAL}${RESET}"
echo ""

# Function to extract work type from directory name with color
get_work_type() {
    local dirname="$1"
    if [[ "$dirname" == *"_refactor_"* ]]; then
        echo -e "${CYAN}🔧 Refactor${RESET}"
    elif [[ "$dirname" == *"_overhaul_"* ]]; then
        echo -e "${YELLOW}🔄 Overhaul${RESET}"
    elif [[ "$dirname" == *"_features_"* ]]; then
        echo -e "${GREEN}✨ Feature${RESET}"
    else
        echo -e "${MAGENTA}📝 Plan${RESET}"
    fi
}

# Function to get plan name (project name from directory)
get_plan_name() {
    local dirname="$1"
    local name="$dirname"
    
    # Remove timestamp patterns first (most specific to least specific)
    # Pattern: _YYYYMMDD_HHMMSS (date_time format)
    name=$(echo "$name" | sed -E 's/_[0-9]{8}_[0-9]{6}$//')
    # Pattern: _hash (alphanumeric hash like 4a5b9879)
    name=$(echo "$name" | sed -E 's/_[0-9a-f]{8,}$//')
    # Pattern: _numbers (simple numeric suffix)
    name=$(echo "$name" | sed -E 's/_[0-9]+$//')
    
    # Remove work type suffix patterns (must come after timestamp removal)
    # Match: _refactor_, _overhaul_, _features_ followed by optional content
    name=$(echo "$name" | sed -E 's/_(refactor|overhaul|features)(_[^_]*)?$//')
    
    # Replace underscores and hyphens with spaces
    name=$(echo "$name" | sed 's/[-_]/ /g' | sed 's/^ *//' | sed 's/ *$//')
    
    # Capitalize first letter of each word (using awk for reliability)
    echo "$name" | awk '{for(i=1;i<=NF;i++){sub(/./, toupper(substr($i,1,1)), $i)} print}'
}

# Function to get absolute path (for clickable links in Cursor)
get_absolute_path() {
    local path="$1"
    if [[ "$path" == /* ]]; then
        echo "$path"
    elif command -v realpath >/dev/null 2>&1; then
        realpath "$path" 2>/dev/null || echo "$path"
    else
        local dir
        dir=$(cd "$(dirname "$path")" 2>/dev/null && pwd)
        if [ -n "$dir" ]; then
            echo "$dir/$(basename "$path")"
        else
            echo "$path"
        fi
    fi
}

# Function to create a clickable hyperlink with compact display text
# Usage: create_hyperlink "/full/path/to/file.md" "display text"
# Uses cursor://file/ URL scheme to open files directly in Cursor
create_hyperlink() {
    local full_path="$1"
    local display_text="$2"
    # OSC 8 hyperlink with cursor://file/ URL scheme
    # Format: \e]8;;cursor://file/URL\e\\text\e]8;;\e\\
    # Cursor expects: cursor://file/path (absolute path without leading slash in URL)
    # URL encode the path (replace spaces with %20, etc.)
    local encoded_path
    encoded_path=$(printf '%s' "$full_path" | sed 's/ /%20/g' | sed 's/#/%23/g' | sed 's/\[/%5B/g' | sed 's/\]/%5D/g')
    # Remove leading slash if present (cursor://file/ already provides the root)
    encoded_path="${encoded_path#/}"
    printf '\e]8;;cursor://file/%s\e\\%s\e]8;;\e\\' "$encoded_path" "$display_text"
}

# Function to get overview from plan.md if available
get_overview() {
    local plan_dir="$1"
    local plan_file="$plan_dir/plan.md"
    
    if [ -f "$plan_file" ]; then
        # Try to extract overview from frontmatter or first heading
        grep -A 2 "^overview:" "$plan_file" 2>/dev/null | head -1 | sed 's/overview: *"\(.*\)"/\1/' | sed 's/^overview: *//' | head -c 80
        if [ $? -eq 0 ]; then
            return
        fi
        # Fallback: get first line after first heading
        awk '/^# / {getline; print; exit}' "$plan_file" 2>/dev/null | head -c 80
    fi
}

# List all plans
find "$PLANS_DIR" -maxdepth 1 -type d ! -name "plans" ! -name "templates" ! -name "." | sort | while read -r plan_dir; do
    dirname=$(basename "$plan_dir")
    work_type=$(get_work_type "$dirname")
    plan_name=$(get_plan_name "$dirname")
    overview=$(get_overview "$plan_dir")
    
    echo -e "${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo -e "$work_type  ${BOLD}${WHITE}${plan_name}${RESET}"
    if [ -n "$overview" ]; then
        echo -e "   ${DIM}Overview:${RESET} ${overview}..."
    fi
    
    # Get base directory for relative paths
    plan_base=$(get_absolute_path "$plan_dir")
    
    # Show clickable file paths with compact display
    # Try OSC 8 hyperlinks first, fallback to relative paths
    if [ -f "$plan_dir/plan.md" ]; then
        plan_path=$(get_absolute_path "$plan_dir/plan.md")
        printf "   "
        create_hyperlink "$plan_path" "plan.md"
        echo ""
    fi
    if [ -f "$plan_dir/README.md" ]; then
        readme_path=$(get_absolute_path "$plan_dir/README.md")
        printf "   "
        create_hyperlink "$readme_path" "README.md"
        echo ""
    fi
    if [ -f "$plan_dir/interfaces.md" ]; then
        interfaces_path=$(get_absolute_path "$plan_dir/interfaces.md")
        printf "   "
        create_hyperlink "$interfaces_path" "interfaces.md"
        echo ""
    fi
    if [ -f "$plan_dir/gotchas.md" ]; then
        gotchas_path=$(get_absolute_path "$plan_dir/gotchas.md")
        printf "   "
        create_hyperlink "$gotchas_path" "gotchas.md"
        echo ""
    fi
    
    # List agent files with YAML-like indentation
    if [ -d "$plan_dir/agents" ]; then
        agent_count=$(find "$plan_dir/agents" -name "*.agent.md" -type f ! -name "*.completed.md" ! -path "*/completed/*" 2>/dev/null | wc -l | tr -d ' ')
        if [ "$agent_count" -gt 0 ]; then
            echo -e "   ${DIM}agents:${RESET}"
            find "$plan_dir/agents" -name "*.agent.md" -type f ! -name "*.completed.md" ! -path "*/completed/*" 2>/dev/null | sort | while read -r agent_file; do
                agent_path=$(get_absolute_path "$agent_file")
                agent_name=$(basename "$agent_file")
                printf "     ${DIM}-${RESET} "
                create_hyperlink "$agent_path" "$agent_name"
                echo ""
            done
        fi
    fi
    
    echo ""
done

echo -e "${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "${BLUE}💡 To view a plan:${RESET}"
echo -e "   ${DIM}cat ../runi-planning-docs/plans/[plan-name]/plan.md${RESET}"
echo ""
echo -e "${BLUE}💡 To view plan README:${RESET}"
echo -e "   ${DIM}cat ../runi-planning-docs/plans/[plan-name]/README.md${RESET}"
