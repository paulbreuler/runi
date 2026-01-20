#!/usr/bin/env bash
# Run agent task - select next best task or open specific agent file in Cursor

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
    local agent_path=""
    local assess_only=false
    
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
            --assess)
                assess_only=true
                if [ -z "$plan_name" ] && [ $# -gt 1 ]; then
                    plan_name="$2"
                    shift
                fi
                shift
                ;;
            --auto)
                # Auto-detect plan from last PR and auto-select task
                local detected=$(bash "$SCRIPT_DIR/detect-active-plan.sh" 2>/dev/null || echo "")
                if [ -n "$detected" ] && [ -d "$detected" ]; then
                    plan_name=$(basename "$detected")
                else
                    echo "❌ Could not auto-detect plan from PR" >&2
                    exit 1
                fi
                shift
                ;;
            *)
                # Try as plan name if no flag
                if [ -z "$plan_name" ] && [ -z "$agent_path" ]; then
                    plan_name="$1"
                else
                    echo "Unknown option: $1" >&2
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    cd "$PROJECT_ROOT"
    
    # If assess mode, just run assessment
    if [ "$assess_only" = true ]; then
        if [ -z "$plan_name" ]; then
            echo "❌ Plan name required for assessment" >&2
            exit 1
        fi
        # Resolve plan number (1 → 1-plan)
        local resolved_plan=$(resolve_plan_number "$plan_name")
        bash "$SCRIPT_DIR/assess-agent-status.sh" --plan "$resolved_plan" --all
        return
    fi
    
    # If agent path provided, use it directly
    if [ -n "$agent_path" ]; then
        local agent_file="$agent_path"
        if [[ "$agent_file" != /* ]] && [[ "$agent_file" != ../* ]]; then
            # Relative path, try to resolve
            if [ -n "$plan_name" ]; then
                local resolved_plan=$(resolve_plan_number "$plan_name")
                local plan_dir="../runi-planning-docs/plans/$resolved_plan"
                agent_file="$plan_dir/agents/$agent_path"
            fi
        fi
        
        agent_file=$(get_absolute_path "$agent_file")
        
        if [ ! -f "$agent_file" ]; then
            echo "❌ Agent file not found: $agent_file" >&2
            exit 1
        fi
        
        open_agent_file "$agent_file"
        return
    fi
    
    # If plan name provided, select next task
    if [ -n "$plan_name" ]; then
        # Resolve plan number (1 → 1-plan)
        local resolved_plan=$(resolve_plan_number "$plan_name")
        # Get next task
        local next_task_output=$(bash "$SCRIPT_DIR/next-task.sh" --plan "$resolved_plan" 2>&1)
        local agent_file=$(echo "$next_task_output" | tail -1)
        
        if [ -z "$agent_file" ] || [[ "$agent_file" == *"❌"* ]] || [[ "$agent_file" == *"✅"* ]]; then
            echo "$next_task_output" >&2
            exit 1
        fi
        
        # Display selection info (everything except last line)
        local line_count=$(echo "$next_task_output" | wc -l | tr -d ' ')
        if [ "$line_count" -gt 1 ]; then
            echo "$next_task_output" | head -n $((line_count - 1))
        else
            echo "$next_task_output"
        fi
        
        # Verify agent is ready
        echo ""
        echo -e "${DIM}Verifying agent status...${RESET}"
        local plan_dir=$(dirname "$(dirname "$agent_file")")
        local plan_basename=$(basename "$plan_dir")
        bash "$SCRIPT_DIR/assess-agent-status.sh" --agent "$agent_file" --plan "$plan_basename" 2>&1 | grep -v "^$" || true
        
        echo ""
        open_agent_file "$agent_file"
        return
    fi
    
    # No arguments - show usage
    echo "Usage: $0 [--plan <plan-name>] [--agent <agent-path>] [--assess [plan-name]]" >&2
    echo "" >&2
    echo "Examples:" >&2
    echo "  $0 --plan 4" >&2
    echo "  $0 --plan 4-plan" >&2
    echo "  $0 --agent ../runi-planning-docs/plans/.../agents/agent_1.agent.md" >&2
    echo "  $0 --assess 4" >&2
    exit 1
}

# Function to open agent file in Cursor with context
open_agent_file() {
    local agent_file="$1"
    local agent_path=$(get_absolute_path "$agent_file")
    local plan_dir=$(dirname "$(dirname "$agent_file")")
    local agent_name=$(basename "$agent_file" .agent.md)
    
    # Extract agent display name
    local agent_display=$(echo "$agent_name" | sed 's/agent_[0-9]*_//' | sed 's/_/ /g' | sed 's/\b\(.\)/\u\1/g')
    
    # Extract features from agent file
    local features=()
    local current_feature=""
    while IFS= read -r line; do
        if [[ "$line" =~ ^###\ Feature\ #([0-9]+): ]]; then
            features+=("#${BASH_REMATCH[1]}")
        fi
    done < "$agent_file"
    local feature_list=$(IFS=', '; echo "${features[*]}" | sed 's/,/, /g')
    
    # Get plan files
    local plan_file="$plan_dir/plan.md"
    local readme_file="$plan_dir/README.md"
    local interfaces_file="$plan_dir/interfaces.md"
    local gotchas_file="$plan_dir/gotchas.md"
    
    # Check dependencies (simplified - just check if agent file mentions dependencies)
    local dependencies_ok=true
    if grep -q "BLOCKED\|blocked\|waiting" "$agent_file" 2>/dev/null; then
        dependencies_ok=false
    fi
    
    # Open file in Cursor
    if command -v cursor >/dev/null 2>&1; then
        if ! cursor -r "$agent_path" 2>/dev/null && ! cursor "$agent_path" 2>/dev/null; then
            echo -e "${YELLOW}⚠️  Failed to open agent file in Cursor. You can open it manually at: ${agent_path}${RESET}" >&2
        fi
    else
        echo -e "${YELLOW}⚠️  Cursor CLI not found. Install it from Cursor: Cmd+Shift+P → 'Shell Command: Install cursor command'${RESET}" >&2
    fi
    
    # Display context
    echo ""
    echo -e "${BOLD}${GREEN}🚀 Starting Agent Work: $(basename "$agent_file")${RESET}"
    echo ""
    echo -e "Agent: ${CYAN}$agent_display${RESET}"
    if [ ${#features[@]} -gt 0 ]; then
        echo -e "Features: $feature_list"
    fi
    if [ "$dependencies_ok" = true ]; then
        echo -e "Dependencies: ${GREEN}All satisfied ✓${RESET}"
    else
        echo -e "Dependencies: ${YELLOW}Check agent file for blocked features${RESET}"
    fi
    echo ""
    echo -e "${DIM}Quick Links:${RESET}"
    
    if [ -f "$plan_file" ]; then
        local plan_path=$(get_absolute_path "$plan_file")
        printf "  "
        create_hyperlink "$plan_path" "plan.md"
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
    
    if [ -f "$readme_file" ]; then
        local readme_path=$(get_absolute_path "$readme_file")
        printf "  "
        create_hyperlink "$readme_path" "README.md"
        echo ""
    fi
    
    echo ""
    echo -e "${DIM}Instructions:${RESET}"
    echo -e "  1. Agent file opened in Cursor"
    echo -e "  2. Copy agent file content to Cursor Agent Chat"
    echo -e "  3. Agent implements features per spec"
    echo -e "  4. Run: ${CYAN}just assess-agents $(basename "$plan_dir")${RESET} when done"
    echo -e "  5. Run: ${CYAN}just close-feature-agent $agent_path${RESET} to verify completion"
    echo ""
}

main "$@"
