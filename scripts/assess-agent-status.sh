#!/usr/bin/env bash
# Assess agent completion status and file organization

set -euo pipefail

# ANSI color codes
RESET='\033[0m'
BOLD='\033[1m'
DIM='\033[2m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'

PLANS_DIR="../runi-planning-docs/plans"

# Function to get absolute path
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

# Function to find plan directory
# Function to resolve plan number to directory name
resolve_plan_number() {
    local plan_input="$1"
    
    # If it's already in N-descriptive-name format, return as-is
    if [[ "$plan_input" =~ ^[0-9]+- ]]; then
        echo "$plan_input"
        return 0
    fi
    
    # If it's just a number, find the directory that starts with N-
    if [[ "$plan_input" =~ ^[0-9]+$ ]]; then
        local found=$(find "$PLANS_DIR" -maxdepth 1 -type d -name "${plan_input}-*" ! -name "plans" ! -name "templates" | head -1)
        if [ -n "$found" ]; then
            echo "$(basename "$found")"
            return 0
        fi
        # Fallback: try N-plan for backward compatibility
        if [ -d "$PLANS_DIR/${plan_input}-plan" ]; then
            echo "${plan_input}-plan"
            return 0
        fi
    fi
    
    # Otherwise, return as-is (for backward compatibility with old names)
    echo "$plan_input"
    return 0
}

find_plan_dir() {
    local plan_name="$1"
    if [ -z "$plan_name" ]; then
        return 1
    fi
    
    # Resolve plan number (1 → 1-plan, 1-plan → 1-plan)
    local resolved=$(resolve_plan_number "$plan_name")
    
    # Try exact match first
    local plan_dir="$PLANS_DIR/$resolved"
    if [ -d "$plan_dir" ]; then
        echo "$plan_dir"
        return
    fi
    
    # Try partial match (for backward compatibility)
    local found=$(find "$PLANS_DIR" -maxdepth 1 -type d -name "*${plan_name}*" ! -name "plans" ! -name "templates" | head -1)
    if [ -n "$found" ]; then
        echo "$found"
        return
    fi
    
    return 1
}

# Function to check file organization status
check_file_organization() {
    local agent_file="$1"
    local agents_dir=$(dirname "$agent_file")
    local agent_name=$(basename "$agent_file")
    local completed_dir="$agents_dir/completed"
    
    # Check if in completed/ subdirectory
    if [[ "$agent_file" == "$completed_dir"* ]]; then
        echo "completed (moved to completed/)"
        return 0
    fi
    
    # Check if renamed to .completed.md
    if [[ "$agent_name" == *.agent.completed.md ]]; then
        echo "completed (renamed to .completed.md)"
        return 0
    fi
    
    # Check if file exists in completed/ directory
    if [ -f "$completed_dir/$agent_name" ]; then
        echo "completed (moved to completed/)"
        return 0
    fi
    
    # Check if .completed.md version exists
    local completed_name="${agent_name%.md}.completed.md"
    if [ -f "$agents_dir/$completed_name" ]; then
        echo "completed (renamed version exists)"
        return 0
    fi
    
    # Check if active file exists
    if [ -f "$agent_file" ]; then
        echo "active (in agents/)"
        return 0
    fi
    
    echo "not found"
    return 1
}

# Function to parse agent features and status from agent file
parse_agent_features() {
    local agent_file="$1"
    
    if [ ! -f "$agent_file" ]; then
        return
    fi
    
    local current_feature=""
    while IFS= read -r line; do
        if [[ "$line" =~ ^###\ Feature\ #([0-9]+): ]]; then
            current_feature="${BASH_REMATCH[1]}"
        elif [[ "$line" =~ \*\*Status\*\*:\ (.*) ]] && [ -n "$current_feature" ]; then
            local status="${BASH_REMATCH[1]}"
            # Normalize status
            if [[ "$status" =~ ✅|PASS|Complete ]]; then
                echo "$current_feature|PASS"
            elif [[ "$status" =~ 🔄|WIP|In\ progress ]]; then
                echo "$current_feature|WIP"
            elif [[ "$status" =~ ❌|GAP|Not\ started|Not\ tested ]]; then
                echo "$current_feature|GAP"
            elif [[ "$status" =~ ⛔|BLOCKED ]]; then
                echo "$current_feature|BLOCKED"
            else
                echo "$current_feature|GAP"
            fi
            current_feature=""
        fi
    done < "$agent_file"
}

# Function to parse README.md status matrix
parse_readme_status() {
    local readme_file="$1"
    local agent_name="$2"
    
    if [ ! -f "$readme_file" ]; then
        return
    fi
    
    # Extract status matrix table
    awk '/^## Status/,/^## [^S]/ {print}' "$readme_file" 2>/dev/null | \
        grep -E "^\|" | grep -v "^|---" | while IFS='|' read -r num name agent status blocked; do
        # Clean up fields
        agent=$(echo "$agent" | xargs)
        status=$(echo "$status" | xargs)
        num=$(echo "$num" | xargs)
        
        # Check if this agent matches (by name or number)
        if [[ "$agent" == *"$agent_name"* ]] || [[ "$agent_name" == *"$agent"* ]]; then
            # Normalize status
            if [[ "$status" =~ ✅|PASS ]]; then
                echo "$num|PASS"
            elif [[ "$status" =~ 🔄|WIP ]]; then
                echo "$num|WIP"
            elif [[ "$status" =~ ❌|GAP ]]; then
                echo "$num|GAP"
            elif [[ "$status" =~ ⛔|BLOCKED ]]; then
                echo "$num|BLOCKED"
            fi
        fi
    done
}

# Main execution
main() {
    local plan_name=""
    local agent_path=""
    local assess_all=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --plan)
                plan_name="$2"
                shift 2
                ;;
            --agent)
                agent_path="$2"
                shift 2
                ;;
            --all)
                assess_all=true
                shift
                ;;
            --auto)
                # Auto-detect plan from last PR
                local detected=$(bash "$(dirname "$0")/detect-active-plan.sh" 2>/dev/null || echo "")
                if [ -n "$detected" ] && [ -d "$detected" ]; then
                    plan_name=$(basename "$detected")
                    assess_all=true
                else
                    echo "❌ Could not auto-detect plan from PR" >&2
                    exit 1
                fi
                shift
                ;;
            *)
                echo "Unknown option: $1" >&2
                exit 1
                ;;
        esac
    done
    
    # If assessing all agents in a plan
    if [ "$assess_all" = true ] || ([ -n "$plan_name" ] && [ -z "$agent_path" ]); then
        if [ -z "$plan_name" ]; then
            echo "❌ Plan name required for --all assessment" >&2
            exit 1
        fi
        
        local plan_dir=$(find_plan_dir "$plan_name")
        if [ -z "$plan_dir" ]; then
            echo "❌ Plan not found: $plan_name" >&2
            exit 1
        fi
        
        local agents_dir="$plan_dir/agents"
        if [ ! -d "$agents_dir" ]; then
            echo "❌ Agents directory not found: $agents_dir" >&2
            exit 1
        fi
        
        echo -e "${BOLD}${WHITE}Agent Status Assessment: $plan_name${RESET}"
        echo ""
        
        # Assess all agent files (exclude completed/)
        find "$agents_dir" -name "*.agent.md" -type f ! -name "*.completed.md" ! -path "*/completed/*" | sort | while read -r agent_file; do
            assess_single_agent "$agent_file" "$plan_dir"
            echo ""
        done
        
        # Check for completed agents
        local completed_dir="$agents_dir/completed"
        if [ -d "$completed_dir" ]; then
            local completed_count=$(find "$completed_dir" -name "*.agent.md" -type f | wc -l | tr -d ' ')
            if [ "$completed_count" -gt 0 ]; then
                echo -e "${GREEN}✅ $completed_count agent(s) in completed/ directory${RESET}"
            fi
        fi
        
        return
    fi
    
    # Assess single agent
    if [ -n "$agent_path" ]; then
        local agent_file="$agent_path"
        if [[ "$agent_file" != /* ]] && [[ "$agent_file" != ../* ]]; then
            # Relative path, try to resolve
            if [ -n "$plan_name" ]; then
                local plan_dir=$(find_plan_dir "$plan_name")
                agent_file="$plan_dir/agents/$agent_path"
            fi
        fi
        
        local plan_dir=$(dirname "$(dirname "$agent_file")")
        assess_single_agent "$agent_file" "$plan_dir"
        return
    fi
    
    echo "❌ Either --plan or --agent required" >&2
    exit 1
}

# Function to assess a single agent
assess_single_agent() {
    local agent_file="$1"
    local plan_dir="$2"
    local readme_file="$plan_dir/README.md"
    local agent_name=$(basename "$agent_file" .agent.md)
    
    # Check file organization
    local file_status=$(check_file_organization "$agent_file")
    local file_org_ok=true
    if [[ "$file_status" == "not found" ]]; then
        file_org_ok=false
    fi
    
    # Parse agent file for feature statuses
    local agent_features=$(parse_agent_features "$agent_file" 2>/dev/null || true)
    local agent_pass_count=0
    local agent_wip_count=0
    local agent_gap_count=0
    local agent_total=0
    
    if [ -n "$agent_features" ]; then
        while IFS='|' read -r feature_id status; do
            agent_total=$((agent_total + 1))
            case "$status" in
                PASS)
                    agent_pass_count=$((agent_pass_count + 1))
                    ;;
                WIP)
                    agent_wip_count=$((agent_wip_count + 1))
                    ;;
                GAP|BLOCKED)
                    agent_gap_count=$((agent_gap_count + 1))
                    ;;
            esac
        done <<< "$agent_features"
    fi
    
    # Parse README.md status
    local readme_features=$(parse_readme_status "$readme_file" "$agent_name" 2>/dev/null || true)
    local readme_pass_count=0
    local readme_wip_count=0
    local readme_gap_count=0
    local readme_total=0
    
    if [ -n "$readme_features" ]; then
        while IFS='|' read -r feature_id status; do
            readme_total=$((readme_total + 1))
            case "$status" in
                PASS)
                    readme_pass_count=$((readme_pass_count + 1))
                    ;;
                WIP)
                    readme_wip_count=$((readme_wip_count + 1))
                    ;;
                GAP|BLOCKED)
                    readme_gap_count=$((readme_gap_count + 1))
                    ;;
            esac
        done <<< "$readme_features"
    fi
    
    # Display assessment
    echo -e "${BOLD}Agent: ${CYAN}$agent_name${RESET}"
    echo -e "File Organization: ${file_status}"
    
    if [ "$agent_total" -gt 0 ]; then
        echo -e "Agent File Status: ${GREEN}$agent_pass_count PASS${RESET}, ${BLUE}$agent_wip_count WIP${RESET}, ${YELLOW}$agent_gap_count GAP${RESET} (of $agent_total)"
    fi
    
    if [ "$readme_total" -gt 0 ]; then
        echo -e "README.md Status: ${GREEN}$readme_pass_count PASS${RESET}, ${BLUE}$readme_wip_count WIP${RESET}, ${YELLOW}$readme_gap_count GAP${RESET} (of $readme_total)"
    fi
    
    # Check for mismatches
    local recommendations=()
    
    # If all features PASS but file not in completed/
    if [ "$agent_total" -gt 0 ] && [ "$agent_pass_count" -eq "$agent_total" ]; then
        if [[ "$file_status" != "completed"* ]]; then
            recommendations+=("All features PASS but file not marked as completed")
            recommendations+=("  - Move to agents/completed/ directory")
            recommendations+=("  - Or rename to ${agent_name}.agent.completed.md")
        fi
    fi
    
    # If README shows all PASS but file not completed
    if [ "$readme_total" -gt 0 ] && [ "$readme_pass_count" -eq "$readme_total" ]; then
        if [[ "$file_status" != "completed"* ]]; then
            recommendations+=("README.md shows all features PASS but file not marked as completed")
        fi
    fi
    
    # If file is completed but features not all PASS
    if [[ "$file_status" == "completed"* ]]; then
        if [ "$agent_total" -gt 0 ] && [ "$agent_pass_count" -lt "$agent_total" ]; then
            recommendations+=("File marked as completed but not all features are PASS")
        fi
        if [ "$readme_total" -gt 0 ] && [ "$readme_pass_count" -lt "$readme_total" ]; then
            recommendations+=("File marked as completed but README.md shows features not PASS")
        fi
    fi
    
    # Display recommendations
    if [ ${#recommendations[@]} -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}Recommendations:${RESET}"
        for rec in "${recommendations[@]}"; do
            echo -e "  - $rec"
        done
    elif [ "$agent_total" -gt 0 ] && [ "$agent_pass_count" -eq "$agent_total" ] && [[ "$file_status" == "completed"* ]]; then
        echo -e "${GREEN}✅ Status consistent - agent properly completed${RESET}"
    fi
}

main "$@"
