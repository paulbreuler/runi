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

# Function to find plan directory
find_plan_dir() {
    local plan_name="$1"
    if [ -z "$plan_name" ]; then
        return 1
    fi
    
    # Resolve plan number (1 → 1-descriptive-name)
    local resolved=$(resolve_plan_number "$plan_name")
    
    # Try exact match first
    local plan_dir="$PLANS_DIR/$resolved"
    if [ -d "$plan_dir" ]; then
        echo "$plan_dir"
        return
    fi
    
    # Try fuzzy match - prefer better matches
    local normalized=$(echo "$plan_name" | tr '[:upper:]' '[:lower:]')
    local all_matches=()
    
    # Find all matching directories
    while IFS= read -r match; do
        if [ -n "$match" ]; then
            all_matches+=("$match")
        fi
    done < <(find "$PLANS_DIR" -maxdepth 1 -type d -name "*${plan_name}*" ! -name "plans" ! -name "templates" 2>/dev/null)
    
    if [ ${#all_matches[@]} -eq 0 ]; then
        return 1
    fi
    
    # Score matches: prefer exact word matches over embedded matches
    local best_match=""
    local best_score=0
    
    for match in "${all_matches[@]}"; do
        local basename=$(basename "$match")
        local basename_lower=$(echo "$basename" | tr '[:upper:]' '[:lower:]')
        local score=0
        
        # Exact match gets highest score
        if [[ "$basename_lower" == *"${normalized}"* ]]; then
            score=10
            # Prefer matches where search term is at word boundary (not embedded)
            if [[ "$basename_lower" =~ (^|[^a-z0-9])${normalized}([^a-z0-9]|$) ]]; then
                score=20
            fi
            # Prefer matches that start with the search term
            if [[ "$basename_lower" =~ ^[0-9]+-${normalized} ]]; then
                score=30
            fi
        fi
        
        if [ "$score" -gt "$best_score" ]; then
            best_score=$score
            best_match="$match"
        fi
    done
    
    if [ -n "$best_match" ]; then
        echo "$best_match"
        return 0
    fi
    
    # Fallback to first match
    echo "${all_matches[0]}"
    return 0
}

# Function to extract agent number from filename
extract_agent_number() {
    local filename="$1"
    # Try new pattern first: <NNN>_agent_ (zero-padded 3 digits)
    if [[ "$filename" =~ ^([0-9]{3})_agent_ ]]; then
        # Remove leading zeros for display
        echo "$(echo "${BASH_REMATCH[1]}" | sed 's/^0*//')"
        return 0
    fi
    # Try old pattern: agent_<N>_ (backward compatibility)
    if [[ "$filename" =~ agent_([0-9]+)_ ]]; then
        echo "${BASH_REMATCH[1]}"
        return 0
    fi
    # Try new pattern without zero-padding: <N>_agent_ (backward compatibility)
    if [[ "$filename" =~ ^([0-9]+)_agent_ ]]; then
        echo "${BASH_REMATCH[1]}"
        return 0
    fi
    echo ""
}

# Function to extract agent display name from agent file
extract_agent_display_name() {
    local agent_file="$1"
    
    # Try to extract from file header first: "# Agent: <name>" or "# Agent <N>: <name>"
    if [ -f "$agent_file" ]; then
        local header_name=$(grep -E "^# Agent( [0-9]+)?:" "$agent_file" | head -1 | sed -E 's/^# Agent( [0-9]+)?: *//' | sed 's/^ *//' | sed 's/ *$//')
        if [ -n "$header_name" ]; then
            # If header is just filename-like (underscores), format it better
            if [[ "$header_name" =~ _ ]]; then
                # Replace underscores with spaces and capitalize each word
                header_name=$(echo "$header_name" | sed 's/_/ /g' | sed 's/\b\(.\)/\u\1/g')
            fi
            echo "$header_name"
            return 0
        fi
    fi
    
    # Fallback to filename extraction
    local filename=$(basename "$agent_file")
    local basename=$(basename "$filename" .agent.md)
    # Remove agent_<N>_ prefix
    local name=$(echo "$basename" | sed -E 's/^agent_[0-9]+_//')
    # Remove <N>_agent_ prefix (new pattern)
    name=$(echo "$name" | sed -E 's/^[0-9]+_agent_//')
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
    
    # Only iterate if statuses array has elements
    if [ ${#statuses[@]} -gt 0 ]; then
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
    fi
    
    # Format feature list
    local feature_list=""
    if [ ${#features[@]} -gt 0 ]; then
        feature_list=$(IFS=,; echo "${features[*]}" | sed 's/,/, #/g' | sed 's/^/#/')
    fi
    
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
    # Display resolved plan name (extract number if in N-descriptive-name format)
    local display_plan_name="$plan_name"
    if [[ "$(basename "$plan_dir")" =~ ^([0-9]+)- ]]; then
        display_plan_name="${BASH_REMATCH[1]} ($(basename "$plan_dir"))"
    else
        display_plan_name="$(basename "$plan_dir")"
    fi
    echo -e "${BOLD}${WHITE}📋 Agents in Plan: ${CYAN}$display_plan_name${RESET}"
    echo -e "${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo ""
    
    # Find and sort agents by number (use version sort for numeric ordering)
    local agent_files=()
    while IFS= read -r agent_file; do
        agent_files+=("$agent_file")
    done < <(find "$agents_dir" -name "*.agent.md" -type f ! -name "*.completed.md" ! -path "*/completed/*" 2>/dev/null | sort -V)
    
    if [ ${#agent_files[@]} -eq 0 ]; then
        echo -e "${YELLOW}No active agents found in plan${RESET}"
        echo ""
        exit 0
    fi
    
    # Display each agent
    for agent_file in "${agent_files[@]}"; do
        local agent_number=$(extract_agent_number "$(basename "$agent_file")")
        local agent_display_name=$(extract_agent_display_name "$agent_file")
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
        # Ensure counts are numeric (default to 0 if empty)
        pass_count=${pass_count:-0}
        wip_count=${wip_count:-0}
        gap_count=${gap_count:-0}
        
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
