#!/usr/bin/env bash
# Master orchestration command - detects plan, assesses status, suggests next task

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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

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

# Function to create clickable hyperlink
create_hyperlink() {
    local full_path="$1"
    local display_text="$2"
    local encoded_path
    encoded_path=$(printf '%s' "$full_path" | sed 's/ /%20/g' | sed 's/#/%23/g' | sed 's/\[/%5B/g' | sed 's/\]/%5D/g')
    encoded_path="${encoded_path#/}"
    printf '\e]8;;cursor://file/%s\e\\%s\e]8;;\e\\' "$encoded_path" "$display_text"
}

# Main execution
main() {
    local plan_name=""
    local force_plan=""
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --plan)
                force_plan="$2"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done
    
    cd "$PROJECT_ROOT"
    
    # Detect active plan
    local plan_dir=""
    local detection_info=""
    
    if [ -n "$force_plan" ]; then
        # Use forced plan name
        plan_dir="$PLANS_DIR/$force_plan"
        if [ ! -d "$plan_dir" ]; then
            # Try fuzzy match
            plan_dir=$(find "$PLANS_DIR" -maxdepth 1 -type d -name "*${force_plan}*" ! -name "plans" ! -name "templates" | head -1)
        fi
        if [ -z "$plan_dir" ] || [ ! -d "$plan_dir" ]; then
            echo -e "${RED}❌ Plan not found: $force_plan${RESET}" >&2
            exit 1
        fi
        plan_name=$(basename "$plan_dir")
        detection_info="Specified: $plan_name"
    else
        # Auto-detect from PR
        echo -e "${DIM}Detecting active plan from last PR...${RESET}" >&2
        detection_info=$(bash "$SCRIPT_DIR/detect-active-plan.sh" --json 2>&1)
        
        if [ -z "$detection_info" ] || echo "$detection_info" | grep -q '"error"'; then
            echo -e "${YELLOW}⚠️  Could not auto-detect plan from PR${RESET}" >&2
            echo -e "${DIM}Available plans:${RESET}" >&2
            bash "$SCRIPT_DIR/../list-plans.sh" 2>&1 | head -20 >&2
            echo "" >&2
            echo -e "Usage: ${CYAN}just work --plan <plan-name>${RESET}" >&2
            exit 1
        fi
        
        # Parse JSON - use jq if available, otherwise use awk
        if command -v jq >/dev/null 2>&1; then
            plan_dir=$(echo "$detection_info" | jq -r '.plan_dir // empty')
            plan_name=$(echo "$detection_info" | jq -r '.plan_name // empty')
            local pr_number=$(echo "$detection_info" | jq -r '.pr_number // empty')
            local pr_title=$(echo "$detection_info" | jq -r '.pr_title // empty')
            local confidence=$(echo "$detection_info" | jq -r '.confidence // "unknown"')
        else
            # Fallback: use awk for JSON parsing
            plan_dir=$(echo "$detection_info" | awk -F'"plan_dir":"' '{print $2}' | awk -F'"' '{print $1}')
            plan_name=$(echo "$detection_info" | awk -F'"plan_name":"' '{print $2}' | awk -F'"' '{print $1}')
            local pr_number=$(echo "$detection_info" | awk -F'"pr_number":' '{print $2}' | awk -F',' '{print $1}' | tr -d ' ')
            local pr_title=$(echo "$detection_info" | awk -F'"pr_title":"' '{print $2}' | awk -F'"' '{print $1}')
            local confidence=$(echo "$detection_info" | awk -F'"confidence":"' '{print $2}' | awk -F'"' '{print $1}')
        fi
        
        if [ -z "$plan_dir" ] || [ -z "$plan_name" ]; then
            echo -e "${YELLOW}⚠️  Could not extract plan from detection result${RESET}" >&2
            echo -e "${DIM}Detection output: $detection_info${RESET}" >&2
            exit 1
        fi
        
        if [ -n "$pr_number" ] && [ -n "$pr_title" ]; then
            detection_info="PR #$pr_number: $pr_title (confidence: $confidence)"
        else
            detection_info="Detected: $plan_name (confidence: $confidence)"
        fi
    fi
    
    if [ -z "$plan_dir" ] || [ ! -d "$plan_dir" ]; then
        echo -e "${RED}❌ Plan directory not found: $plan_dir${RESET}" >&2
        exit 1
    fi
    
    echo ""
    echo -e "${BOLD}${WHITE}Active Plan: ${CYAN}$plan_name${RESET}"
    echo -e "${DIM}Detected from: $detection_info${RESET}"
    echo ""
    
    # Assess agent status
    echo -e "${DIM}Assessing agent status...${RESET}"
    local assessment_output=$(bash "$SCRIPT_DIR/assess-agent-status.sh" --plan "$plan_name" --all 2>&1)
    
    # Parse assessment for cleanup needs
    local cleanup_needed=()
    local completed_count=0
    local active_count=0
    local total_agents=0
    
    while IFS= read -r line; do
        if [[ "$line" =~ Agent:\ (.*) ]]; then
            total_agents=$((total_agents + 1))
        elif [[ "$line" =~ File\ Organization:\ completed ]]; then
            completed_count=$((completed_count + 1))
        elif [[ "$line" =~ File\ Organization:\ active ]]; then
            active_count=$((active_count + 1))
            # Check if all features PASS but file not moved
            if echo "$assessment_output" | grep -A 5 "$line" | grep -q "All features PASS but file not marked as completed"; then
                local agent_name=$(echo "$line" | grep -o "Agent: [^ ]*" | cut -d' ' -f2)
                cleanup_needed+=("$agent_name")
            fi
        fi
    done <<< "$assessment_output"
    
    # Display status summary
    echo -e "${BOLD}Status Summary:${RESET}"
    echo -e "  - ${GREEN}$completed_count${RESET} agents completed"
    if [ ${#cleanup_needed[@]} -gt 0 ]; then
        echo -e "  - ${YELLOW}${#cleanup_needed[@]}${RESET} agents need cleanup (completed but not moved)"
    fi
    echo -e "  - ${BLUE}$active_count${RESET} agents with work remaining"
    echo ""
    
    # Show cleanup needs
    if [ ${#cleanup_needed[@]} -gt 0 ]; then
        echo -e "${YELLOW}Cleanup Needed:${RESET}"
        local idx=1
        for agent in "${cleanup_needed[@]}"; do
            local agent_file=$(find "$plan_dir/agents" -name "*${agent}*.agent.md" ! -name "*.completed.md" 2>/dev/null | head -1)
            if [ -n "$agent_file" ]; then
                local agent_display=$(basename "$agent_file" .agent.md | sed 's/agent_[0-9]*_//' | sed 's/_/ /g' | sed 's/\b\(.\)/\u\1/g')
                echo -e "  $idx. ${agent_display} - All features PASS, should move to completed/"
            fi
            idx=$((idx + 1))
        done
        echo ""
    fi
    
    # Get next best task
    echo -e "${DIM}Determining next best task...${RESET}"
    local next_task_output=$(bash "$SCRIPT_DIR/next-task.sh" --plan "$plan_name" 2>&1)
    local next_task_exit=$?
    
    if [ $next_task_exit -eq 0 ] && [ -n "$next_task_output" ]; then
        # Extract agent file path (last line)
        local agent_file=$(echo "$next_task_output" | tail -1)
        
        if [ -f "$agent_file" ]; then
            echo -e "${BOLD}Next Best Task:${RESET}"
            # Display selection info (everything except last line)
            local line_count=$(echo "$next_task_output" | wc -l | tr -d ' ')
            if [ "$line_count" -gt 1 ]; then
                echo "$next_task_output" | head -n $((line_count - 1))
            else
                echo "$next_task_output"
            fi
            echo ""
        else
            echo -e "${GREEN}✅ All tasks completed or blocked${RESET}"
            echo ""
        fi
    else
        echo -e "${GREEN}✅ All tasks completed or blocked${RESET}"
        echo ""
    fi
    
    # Generate recommended actions
    echo -e "${BOLD}Recommended Actions:${RESET}"
    local action_num=1
    
    if [ ${#cleanup_needed[@]} -gt 0 ]; then
        echo -e "  $action_num. Run: ${CYAN}just heal-plan $plan_name${RESET} (auto-cleanup completed agents)"
        action_num=$((action_num + 1))
    fi
    
    if [ $next_task_exit -eq 0 ] && [ -n "$next_task_output" ] && [ -f "$agent_file" ]; then
        echo -e "  $action_num. Run: ${CYAN}just run $plan_name${RESET} (start next task)"
        action_num=$((action_num + 1))
    fi
    
    echo -e "  $action_num. Run: ${CYAN}just assess-agents $plan_name${RESET} (detailed status)"
    action_num=$((action_num + 1))
    
    echo -e "  $action_num. Run: ${CYAN}just list-plans${RESET} (view all plans)"
    echo ""
    
    # Quick links
    local plan_file="$plan_dir/plan.md"
    local readme_file="$plan_dir/README.md"
    local interfaces_file="$plan_dir/interfaces.md"
    local gotchas_file="$plan_dir/gotchas.md"
    
    echo -e "${DIM}Quick Links:${RESET}"
    if [ -f "$plan_file" ]; then
        local plan_path=$(get_absolute_path "$plan_file")
        printf "  "
        create_hyperlink "$plan_path" "plan.md"
        echo ""
    fi
    if [ -f "$readme_file" ]; then
        local readme_path=$(get_absolute_path "$readme_file")
        printf "  "
        create_hyperlink "$readme_path" "README.md"
        echo ""
    fi
    if [ -f "$interfaces_file" ]; then
        local interfaces_path=$(get_absolute_path "$interfaces_file")
        printf "  "
        create_hyperlink "$interfaces_path" "interfaces.md"
        echo ""
    fi
    if [ -f "$gotchas_file" ]; then
        local gotchas_path=$(get_absolute_path "$gotchas_file")
        printf "  "
        create_hyperlink "$gotchas_path" "gotchas.md"
        echo ""
    fi
    echo ""
}

main "$@"
