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
    # Remove timestamp suffix (last underscore and numbers)
    echo "$dirname" | sed -E 's/_[0-9]+$//' | sed 's/_/ /g' | sed 's/\b\(.\)/\u\1/g'
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
    echo -e "   ${DIM}Directory:${RESET} ${GRAY}${dirname}${RESET}"
    if [ -n "$overview" ]; then
        echo -e "   ${DIM}Overview:${RESET} ${overview}..."
    fi
    if [ -f "$plan_dir/README.md" ]; then
        echo -e "   ${GREEN}📄 README available${RESET}"
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
