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
        # Resolve plan number (1 → 1-plan)
        local resolved_plan=$(resolve_plan_number "$force_plan")
        plan_dir="$PLANS_DIR/$resolved_plan"
        if [ ! -d "$plan_dir" ]; then
            # Try fuzzy match (for backward compatibility)
            plan_dir=$(find "$PLANS_DIR" -maxdepth 1 -type d -name "*${force_plan}*" ! -name "plans" ! -name "templates" | head -1)
        fi
        if [ -z "$plan_dir" ] || [ ! -d "$plan_dir" ]; then
            echo -e "${RED}❌ Plan not found: $force_plan${RESET}" >&2
            echo -e "   Available plans: $(ls -1 "$PLANS_DIR" | grep -E '^[0-9]+-' | sort -V | tr '\n' ' ' || echo 'none')" >&2
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
            npx limps list-plans 2>&1 | head -20 >&2
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
    
    # Assess agent status (do this first to determine quick decision)
    echo -e "${DIM}Assessing agent status...${RESET}" >&2
    local assessment_output=$(npx limps status "$plan_name" 2>&1)
    
    # Parse assessment for cleanup needs
    local cleanup_needed=()
    local completed_count=0
    local active_count=0
    local total_agents=0
    local current_agent=""
    local agent_context=""  # Buffer to check for "All features PASS"
    
    while IFS= read -r line; do
        # Track current agent name (strip ANSI codes first)
        local clean_line=$(echo "$line" | sed 's/\x1b\[[0-9;]*m//g')
        if [[ "$clean_line" =~ Agent:\ ([^[:space:]]+) ]]; then
            current_agent="${BASH_REMATCH[1]}"
            total_agents=$((total_agents + 1))
            agent_context=""  # Reset context for new agent
        elif [[ "$clean_line" =~ File\ Organization:\ completed ]]; then
            completed_count=$((completed_count + 1))
            agent_context=""
        elif [[ "$clean_line" =~ File\ Organization:\ active ]]; then
            active_count=$((active_count + 1))
            agent_context="active"
        elif [[ -n "$agent_context" ]] && [[ "$clean_line" =~ All\ features\ PASS\ but\ file\ not\ marked\ as\ completed ]]; then
            # This agent has all features PASS but hasn't been moved
            if [[ -n "$current_agent" ]]; then
                # Check if already in cleanup_needed (avoid duplicates)
                local found=false
                if [ ${#cleanup_needed[@]} -gt 0 ]; then
                    for existing in "${cleanup_needed[@]}"; do
                        if [[ "$existing" == "$current_agent" ]]; then
                            found=true
                            break
                        fi
                    done
                fi
                if [[ "$found" == false ]]; then
                    cleanup_needed+=("$current_agent")
                    completed_count=$((completed_count + 1))  # Count as completed
                    active_count=$((active_count - 1))  # Don't count as active
                fi
            fi
            agent_context=""
        fi
    done <<< "$assessment_output"
    
    # Get next best task (needed for quick decision)
    echo -e "${DIM}Determining next best task...${RESET}" >&2
    local next_task_output=$(npx limps next-task "$plan_name" 2>&1)
    local next_task_exit=$?
    local agent_file=""
    
    if [ $next_task_exit -eq 0 ] && [ -n "$next_task_output" ]; then
        # Extract agent file path (last line)
        agent_file=$(echo "$next_task_output" | tail -1)
    fi
    
    # Output starts here with clear hierarchy
    echo ""
    echo -e "${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo -e "${BOLD}${WHITE}🎯 QUICK DECISION: What should you do next?${RESET}"
    echo -e "${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo ""
    
    # Determine primary action
    if [ ${#cleanup_needed[@]} -gt 0 ]; then
        echo -e "  ${YELLOW}→ Cleanup needed${RESET}: Run ${CYAN}/heal${RESET} or ${CYAN}just heal-plan $plan_name${RESET}"
        echo -e "     ${DIM}(${#cleanup_needed[@]} completed agent(s) need to be moved to completed/)${RESET}"
    elif [ -n "$agent_file" ] && [ -f "$agent_file" ]; then
        echo -e "  ${GREEN}→ Ready to work${RESET}: Run ${CYAN}/run-agent${RESET} or ${CYAN}just run $plan_name${RESET}"
        echo -e "     ${DIM}(Next best task identified and ready)${RESET}"
    elif [ "$active_count" -eq 0 ]; then
        echo -e "  ${GREEN}→ All complete${RESET}: Plan is finished!"
        echo -e "     ${DIM}(All agents completed, no work remaining)${RESET}"
    else
        echo -e "  ${BLUE}→ Check details${RESET}: Run ${CYAN}/assess-agents $plan_name${RESET}"
        echo -e "     ${DIM}(Tasks may be blocked by dependencies)${RESET}"
    fi
    
    echo ""
    echo -e "${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo -e "${BOLD}${WHITE}📊 PLAN STATUS${RESET}"
    echo -e "${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo ""
    
    echo -e "${BOLD}Active Plan:${RESET} ${CYAN}$plan_name${RESET}"
    echo -e "${DIM}Detected from: $detection_info${RESET}"
    echo ""
    
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
            local cleanup_agent_file=$(find "$plan_dir/agents" -name "*${agent}*.agent.md" ! -name "*.completed.md" ! -path "*/completed/*" 2>/dev/null | head -1)
            if [ -n "$cleanup_agent_file" ]; then
                local agent_display=$(basename "$cleanup_agent_file" .agent.md | sed 's/agent_[0-9]*_//' | sed 's/_/ /g' | sed 's/\b\(.\)/\u\1/g')
                echo -e "  $idx. ${agent_display} - All features PASS, should move to completed/"
            fi
            idx=$((idx + 1))
        done
        echo ""
    fi
    
    # Show next best task
    if [ -n "$agent_file" ] && [ -f "$agent_file" ]; then
        echo -e "${BOLD}Next Best Task:${RESET}"
        # Display selection info (everything except last line)
        local line_count=$(echo "$next_task_output" | wc -l | tr -d ' ')
        if [ "$line_count" -gt 1 ]; then
            echo "$next_task_output" | head -n $((line_count - 1))
        else
            echo "$next_task_output"
        fi
        echo ""
    elif [ "$active_count" -gt 0 ]; then
        echo -e "${BOLD}Next Best Task:${RESET}"
        echo -e "  ${DIM}All available tasks are blocked by dependencies${RESET}"
        echo ""
    fi
    
    echo -e "${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo -e "${BOLD}${WHITE}🎬 RECOMMENDED ACTIONS (in order)${RESET}"
    echo -e "${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo ""
    
    local action_num=1
    
    if [ ${#cleanup_needed[@]} -gt 0 ]; then
        echo -e "  ${BOLD}$action_num.${RESET} Run: ${CYAN}just heal-plan $plan_name${RESET} (auto-cleanup completed agents)"
        action_num=$((action_num + 1))
    fi
    
    if [ -n "$agent_file" ] && [ -f "$agent_file" ]; then
        echo -e "  ${BOLD}$action_num.${RESET} Run: ${CYAN}just run $plan_name${RESET} (start next task)"
        action_num=$((action_num + 1))
    fi
    
    echo -e "  ${BOLD}$action_num.${RESET} Run: ${CYAN}just assess-agents $plan_name${RESET} (detailed status)"
    action_num=$((action_num + 1))
    
    echo -e "  ${BOLD}$action_num.${RESET} Run: ${CYAN}just list-plans${RESET} (view all plans)"
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
