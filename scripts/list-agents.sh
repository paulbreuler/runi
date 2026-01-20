#!/usr/bin/env bash
# List all agents in a plan with status and clickable links

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

# Function to find plan directory
find_plan_dir() {
    local plan_name="$1"
    if [ -z "$plan_name" ]; then
        return 1
    fi
    
    # Try exact match first
    local plan_dir="$PLANS_DIR/$plan_name"
    if [ -d "$plan_dir" ]; then
        echo "$plan_dir"
        return
    fi
    
    # Try partial match
    local found=$(find "$PLANS_DIR" -maxdepth 1 -type d -name "*${plan_name}*" ! -name "plans" ! -name "templates" | head -1)
    if [ -n "$found" ]; then
        echo "$found"
        return
    fi
    
    return 1
}

# Function to extract agent number from filename
extract_agent_number() {
    local filename="$1"
    # Extract number from agent_<N>_ pattern
    if [[ "$filename" =~ agent_([0-9]+)_ ]]; then
        echo "${BASH_REMATCH[1]}"
    else
        echo ""
    fi
}

# Function to extract agent display name from filename
extract_agent_display_name() {
    local filename="$1"
    local basename=$(basename "$filename" .agent.md)
    # Remove agent_<N>_ prefix
    local name=$(echo "$basename" | sed -E 's/^agent_[0-9]+_//')
    # Replace underscores with spaces and capitalize
    echo "$name" | sed 's/_/ /g' | sed 's/\b\(.\)/\u\1/g'
}

# Function to parse agent features and status
parse_agent_info() {
    local agent_file="$1"
    
    if [ ! -f "$agent_file" ]; then
        return
    fi
    
    local features=()
    local statuses=()
    local current_feature=""
    
    while IFS= read -r line; do
        if [[ "$line" =~ ^###\ Feature\ #([0-9]+): ]]; then
            current_feature="${BASH_REMATCH[1]}"
            features+=("$current_feature")
        elif [[ "$line" =~ \*\*Status\*\*:\ (.*) ]] && [ -n "$current_feature" ]; then
            local status="${BASH_REMATCH[1]}"
            # Normalize status
            if [[ "$status" =~ ✅|PASS|Complete ]]; then
                statuses+=("PASS")
            elif [[ "$status" =~ 🔄|WIP|In\ progress ]]; then
                statuses+=("WIP")
            elif [[ "$status" =~ ❌|GAP|Not\ started|Not\ tested ]]; then
                statuses+=("GAP")
            elif [[ "$status" =~ ⛔|BLOCKED ]]; then
                statuses+=("BLOCKED")
            else
                statuses+=("GAP")
            fi
            current_feature=""
        fi
    done < "$agent_file"
    
    # Count statuses
    local pass_count=0
    local wip_count=0
    local gap_count=0
    
    for status in "${statuses[@]}"; do
        case "$status" in
            PASS)
                pass_count=$((pass_count + 1))
                ;;
            WIP)
                wip_count=$((wip_count + 1))
                ;;
            GAP|BLOCKED)
                gap_count=$((gap_count + 1))
                ;;
        esac
    done
    
    # Format feature list
    local feature_list=$(IFS=,; echo "${features[*]}" | sed 's/,/, #/g' | sed 's/^/#/')
    
    echo "$feature_list|$pass_count|$wip_count|$gap_count"
}

# Main execution
main() {
    local plan_name=""
    local auto_detect=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --plan)
                plan_name="$2"
                shift 2
                ;;
            --auto)
                auto_detect=true
                shift
                ;;
            *)
                echo "Unknown option: $1" >&2
                exit 1
                ;;
        esac
    done
    
    cd "$PROJECT_ROOT"
    
    # Auto-detect plan if requested
    if [ "$auto_detect" = true ] || [ -z "$plan_name" ]; then
        local detected=$(bash "$SCRIPT_DIR/detect-active-plan.sh" 2>/dev/null || echo "")
        if [ -n "$detected" ] && [ -d "$detected" ]; then
            plan_name=$(basename "$detected")
        else
            echo -e "${RED}❌ Could not auto-detect plan${RESET}" >&2
            echo -e "Usage: $0 --plan <plan-name> | --auto" >&2
            exit 1
        fi
    fi
    
    if [ -z "$plan_name" ]; then
        echo -e "${RED}❌ Plan name required${RESET}" >&2
        echo "Usage: $0 --plan <plan-name> | --auto" >&2
        exit 1
    fi
    
    local plan_dir=$(find_plan_dir "$plan_name")
    if [ -z "$plan_dir" ] || [ ! -d "$plan_dir" ]; then
        echo -e "${RED}❌ Plan not found: $plan_name${RESET}" >&2
        exit 1
    fi
    
    local agents_dir="$plan_dir/agents"
    if [ ! -d "$agents_dir" ]; then
        echo -e "${RED}❌ Agents directory not found: $agents_dir${RESET}" >&2
        exit 1
    fi
    
    echo ""
    echo -e "${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo -e "${BOLD}${WHITE}📋 Agents in Plan: ${CYAN}$plan_name${RESET}"
    echo -e "${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo ""
    
    # Find and sort agents
    local agent_files=()
    while IFS= read -r agent_file; do
        agent_files+=("$agent_file")
    done < <(find "$agents_dir" -name "*.agent.md" -type f ! -name "*.completed.md" ! -path "*/completed/*" 2>/dev/null | sort)
    
    if [ ${#agent_files[@]} -eq 0 ]; then
        echo -e "${YELLOW}No active agents found in plan${RESET}"
        echo ""
        exit 0
    fi
    
    # Display each agent
    for agent_file in "${agent_files[@]}"; do
        local agent_number=$(extract_agent_number "$(basename "$agent_file")")
        local agent_display_name=$(extract_agent_display_name "$(basename "$agent_file")")
        local agent_info=$(parse_agent_info "$agent_file")
        
        local feature_list=$(echo "$agent_info" | cut -d'|' -f1)
        local pass_count=$(echo "$agent_info" | cut -d'|' -f2)
        local wip_count=$(echo "$agent_info" | cut -d'|' -f3)
        local gap_count=$(echo "$agent_info" | cut -d'|' -f4)
        
        # Format agent number display
        local agent_label=""
        if [ -n "$agent_number" ]; then
            agent_label="Agent $agent_number"
        else
            agent_label="Agent"
        fi
        
        echo -e "${BOLD}${agent_label}: ${CYAN}${agent_display_name}${RESET}"
        
        if [ -n "$feature_list" ] && [ "$feature_list" != "|" ]; then
            echo -e "  ${DIM}Features:${RESET} $feature_list"
        fi
        
        # Status summary
        local status_parts=()
        if [ "$pass_count" -gt 0 ]; then
            status_parts+=("${GREEN}$pass_count PASS${RESET}")
        fi
        if [ "$wip_count" -gt 0 ]; then
            status_parts+=("${BLUE}$wip_count WIP${RESET}")
        fi
        if [ "$gap_count" -gt 0 ]; then
            status_parts+=("${YELLOW}$gap_count GAP${RESET}")
        fi
        
        if [ ${#status_parts[@]} -gt 0 ]; then
            local status_summary=$(IFS=", "; echo "${status_parts[*]}")
            echo -e "  ${DIM}Status:${RESET} $status_summary"
        fi
        
        # Clickable file link
        local agent_path=$(get_absolute_path "$agent_file")
        printf "  ${DIM}File:${RESET} "
        create_hyperlink "$agent_path" "$(basename "$agent_file")"
        echo ""
        echo ""
    done
    
    # Check for completed agents
    local completed_dir="$agents_dir/completed"
    if [ -d "$completed_dir" ]; then
        local completed_count=$(find "$completed_dir" -name "*.agent.md" -type f 2>/dev/null | wc -l | tr -d ' ')
        if [ "$completed_count" -gt 0 ]; then
            echo -e "${DIM}  (${completed_count} agent(s) in completed/ directory)${RESET}"
            echo ""
        fi
    fi
    
    echo -e "${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo ""
    echo -e "${BLUE}💡 To run a specific agent:${RESET}"
    echo -e "   ${DIM}/run-agent --agent [agent-file-path]${RESET}"
    echo -e "   ${DIM}Or click the agent file link above${RESET}"
    echo ""
}

main "$@"
