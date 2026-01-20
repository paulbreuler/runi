#!/usr/bin/env bash
# Select the next best agent task from a plan based on dependencies, workload, and priority

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
find_plan_dir() {
    local plan_name="$1"
    if [ -z "$plan_name" ]; then
        echo "❌ Plan name required" >&2
        echo "Usage: $0 --plan <plan-name>" >&2
        exit 1
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
    
    echo "❌ Plan not found: $plan_name" >&2
    exit 1
}

# Function to parse status matrix from README.md
parse_status_matrix() {
    local readme_file="$1"
    local status_file=$(mktemp)
    
    # Extract status matrix table if it exists
    awk '/^## Status/,/^## [^S]/ {print}' "$readme_file" 2>/dev/null | \
        grep -E "^\|" | grep -v "^|---" | while IFS='|' read -r num name agent status blocked; do
        # Clean up fields
        num=$(echo "$num" | xargs)
        name=$(echo "$name" | xargs)
        agent=$(echo "$agent" | xargs)
        status=$(echo "$status" | xargs)
        blocked=$(echo "$blocked" | xargs)
        
        if [ -n "$num" ] && [[ "$num" =~ ^[0-9]+$ ]]; then
            echo "$num|$name|$agent|$status|$blocked"
        fi
    done > "$status_file"
    
    echo "$status_file"
}

# Function to parse agent files for status
parse_agent_files() {
    local plan_dir="$1"
    local agents_dir="$plan_dir/agents"
    
    if [ ! -d "$agents_dir" ]; then
        return
    fi
    
    find "$agents_dir" -name "*.agent.md" -type f ! -name "*.completed.md" ! -path "*/completed/*" | sort | while read -r agent_file; do
        local agent_name=$(basename "$agent_file" .agent.md)
        local features=()
        local statuses=()
        
        # Extract feature IDs and statuses from agent file
        while IFS= read -r line; do
            if [[ "$line" =~ ^###\ Feature\ #([0-9]+): ]]; then
                features+=("${BASH_REMATCH[1]}")
            elif [[ "$line" =~ \*\*Status\*\*:\ (.*) ]]; then
                local status="${BASH_REMATCH[1]}"
                # Normalize status
                if [[ "$status" =~ ✅|PASS|Complete ]]; then
                    statuses+=("PASS")
                elif [[ "$status" =~ 🔄|WIP|In\ progress ]]; then
                    statuses+=("WIP")
                elif [[ "$status" =~ ❌|GAP|Not\ started ]]; then
                    statuses+=("GAP")
                elif [[ "$status" =~ ⛔|BLOCKED ]]; then
                    statuses+=("BLOCKED")
                else
                    statuses+=("GAP")
                fi
            fi
        done < "$agent_file"
        
        # Output agent info
        for i in "${!features[@]}"; do
            echo "${features[$i]}|${statuses[$i]:-GAP}|$agent_name"
        done
    done
}

# Function to check if feature dependencies are satisfied
check_dependencies() {
    local feature_id="$1"
    local status_data="$2"
    local blocked_by="$3"
    
    if [ -z "$blocked_by" ] || [ "$blocked_by" = "-" ]; then
        return 0  # No dependencies
    fi
    
    # Parse blocked_by (can be #1, #2, or #1, #2)
    local deps=$(echo "$blocked_by" | grep -oE '#[0-9]+' | sed 's/#//')
    
    for dep in $deps; do
        local dep_status=$(echo "$status_data" | grep "^$dep|" | cut -d'|' -f4 | xargs)
        if [[ ! "$dep_status" =~ PASS|✅ ]]; then
            return 1  # Dependency not satisfied
        fi
    done
    
    return 0  # All dependencies satisfied
}

# Function to calculate agent score
calculate_score() {
    local agent_name="$1"
    local status_data="$2"
    local agent_features="$3"
    
    local unblocked=0
    local total=0
    local gap_count=0
    local wip_count=0
    local feature_ids=()
    local max_feature_id=0
    
    # Count features and check dependencies
    for feature_line in $agent_features; do
        local feature_id=$(echo "$feature_line" | cut -d'|' -f1)
        local status=$(echo "$feature_line" | cut -d'|' -f2)
        local blocked_by=$(echo "$status_data" | grep "^$feature_id|" | cut -d'|' -f5 | xargs)
        
        feature_ids+=("$feature_id")
        if [ "$feature_id" -gt "$max_feature_id" ]; then
            max_feature_id=$feature_id
        fi
        
        if [[ "$status" =~ GAP|WIP ]]; then
            total=$((total + 1))
            if check_dependencies "$feature_id" "$status_data" "$blocked_by"; then
                unblocked=$((unblocked + 1))
            fi
            
            if [[ "$status" =~ GAP ]]; then
                gap_count=$((gap_count + 1))
            elif [[ "$status" =~ WIP ]]; then
                wip_count=$((wip_count + 1))
            fi
        fi
    done
    
    if [ "$total" -eq 0 ]; then
        echo "0|0|0|0"  # No work remaining
        return
    fi
    
    # Dependency score (40%): ratio of unblocked features
    local dep_score=$(echo "scale=2; ($unblocked / $total) * 40" | bc)
    
    # Priority score (30%): lower feature IDs get higher score
    local avg_feature_id=0
    local sum=0
    for id in "${feature_ids[@]}"; do
        sum=$((sum + id))
    done
    if [ ${#feature_ids[@]} -gt 0 ]; then
        avg_feature_id=$((sum / ${#feature_ids[@]}))
    fi
    local priority_score
    if [ "$max_feature_id" -gt 0 ]; then
        priority_score=$(echo "scale=2; (1 - ($avg_feature_id / $max_feature_id)) * 30" | bc 2>/dev/null || echo "15")
    else
        # Fallback when max_feature_id is 0 to avoid division by zero
        priority_score="15"
    fi
    
    # Workload score (30%): will be calculated relative to other agents
    echo "$dep_score|$priority_score|$gap_count|$wip_count"
}

# Main execution
main() {
    local plan_name=""
    local plan_dir=""
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --plan)
                plan_name="$2"
                shift 2
                ;;
            --auto)
                # Auto-detect plan from last PR
                local detected=$(bash "$(dirname "$0")/detect-active-plan.sh" 2>/dev/null || echo "")
                if [ -n "$detected" ] && [ -d "$detected" ]; then
                    plan_name=$(basename "$detected")
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
    
    if [ -z "$plan_name" ]; then
        echo "❌ Plan name required" >&2
        echo "Usage: $0 --plan <plan-name> | --auto" >&2
        exit 1
    fi
    
    plan_dir=$(find_plan_dir "$plan_name")
    local readme_file="$plan_dir/README.md"
    local agents_dir="$plan_dir/agents"
    
    if [ ! -d "$agents_dir" ]; then
        echo "❌ Agents directory not found: $agents_dir" >&2
        exit 1
    fi
    
    # Try to parse status matrix, fall back to agent files
    local status_data=""
    if [ -f "$readme_file" ]; then
        local status_file=$(parse_status_matrix "$readme_file")
        if [ -s "$status_file" ]; then
            status_data=$(cat "$status_file")
        fi
        rm -f "$status_file"
    fi
    
    # If no status matrix, parse agent files
    if [ -z "$status_data" ]; then
        status_data=$(parse_agent_files "$plan_dir")
    fi
    
    if [ -z "$status_data" ]; then
        echo "❌ Could not parse status information" >&2
        exit 1
    fi
    
    # Group features by agent (using temp files instead of associative arrays for compatibility)
    local temp_dir=$(mktemp -d)
    trap "rm -rf $temp_dir" EXIT
    
    # Group features by agent into separate files
    while IFS='|' read -r feature_id status agent_name rest; do
        if [ -n "$agent_name" ]; then
            echo "$feature_id|$status|$agent_name" >> "$temp_dir/$agent_name"
        fi
    done <<< "$status_data"
    
    # Calculate scores for each agent
    local best_agent=""
    local best_score=0
    local best_details=""
    local max_remaining=0
    
    # First pass: find max remaining tasks for workload calculation
    for agent_file in "$temp_dir"/*; do
        if [ -f "$agent_file" ]; then
            local agent_name=$(basename "$agent_file")
            local count=$(wc -l < "$agent_file" | tr -d ' ')
            if [ "$count" -gt "$max_remaining" ]; then
                max_remaining=$count
            fi
        fi
    done
    
    # Second pass: calculate scores
    for agent_file in "$temp_dir"/*; do
        if [ ! -f "$agent_file" ]; then
            continue
        fi
        
        local agent_name=$(basename "$agent_file")
        local features=$(cat "$agent_file")
        local score_data=$(calculate_score "$agent_name" "$status_data" "$features")
        local dep_score=$(echo "$score_data" | cut -d'|' -f1)
        local priority_score=$(echo "$score_data" | cut -d'|' -f2)
        local gap_count=$(echo "$score_data" | cut -d'|' -f3)
        local wip_count=$(echo "$score_data" | cut -d'|' -f4)
        
        if [ "$dep_score" = "0" ] && [ "$priority_score" = "0" ]; then
            continue  # No work remaining
        fi
        
        # Workload score (30%): fewer remaining tasks = higher score
        local remaining=$((gap_count + wip_count))
        local workload_score=0
        if [ "$max_remaining" -gt 0 ]; then
            workload_score=$(echo "scale=2; (1 - ($remaining / $max_remaining)) * 30" | bc 2>/dev/null || echo "15")
        fi
        
        local total_score=$(echo "scale=2; $dep_score + $priority_score + $workload_score" | bc 2>/dev/null || echo "0")
        local total_int=$(echo "$total_score" | cut -d'.' -f1)
        
        if [ "$total_int" -gt "$best_score" ]; then
            best_score=$total_int
            best_agent="$agent_name"
            best_details="$dep_score|$priority_score|$workload_score|$gap_count|$wip_count|$remaining"
        fi
    done
    
    if [ -z "$best_agent" ]; then
        echo "✅ All tasks completed or blocked" >&2
        exit 0
    fi
    
    # Find agent file
    local agent_file=$(find "$agents_dir" -name "*${best_agent}*.agent.md" ! -name "*.completed.md" ! -path "*/completed/*" | head -1)
    if [ -z "$agent_file" ]; then
        # Try to find by agent number
        agent_file=$(find "$agents_dir" -name "agent_*.agent.md" ! -name "*.completed.md" ! -path "*/completed/*" | grep -i "$best_agent" | head -1)
    fi
    
    if [ -z "$agent_file" ]; then
        echo "❌ Agent file not found for: $best_agent" >&2
        exit 1
    fi
    
    local agent_path=$(get_absolute_path "$agent_file")
    local dep_score=$(echo "$best_details" | cut -d'|' -f1)
    local priority_score=$(echo "$best_details" | cut -d'|' -f2)
    local workload_score=$(echo "$best_details" | cut -d'|' -f3)
    local gap_count=$(echo "$best_details" | cut -d'|' -f4)
    local wip_count=$(echo "$best_details" | cut -d'|' -f5)
    local remaining=$(echo "$best_details" | cut -d'|' -f6)
    
    # Extract agent display name
    local agent_display=$(basename "$agent_file" .agent.md | sed 's/agent_[0-9]*_//' | sed 's/_/ /g' | sed 's/\b\(.\)/\u\1/g')
    
    # Extract feature list from temp file
    local feature_list=$(cat "$temp_dir/$best_agent" 2>/dev/null | cut -d'|' -f1 | sort -n | tr '\n' ',' | sed 's/,$//' | sed 's/,/, #/g' | sed 's/^/#/' || echo "")
    
    # Output result
    echo -e "${BOLD}${WHITE}Next Best Task: $(basename "$agent_file")${RESET}"
    echo ""
    echo -e "Agent: ${CYAN}$agent_display${RESET}"
    echo -e "Features: $feature_list"
    echo -e "Status: ${YELLOW}$gap_count GAP${RESET}, ${BLUE}$wip_count WIP${RESET}"
    echo -e "Score: ${GREEN}$best_score/100${RESET}"
    echo -e "  - Dependencies: ${GREEN}$(printf "%.0f" "$dep_score")/40${RESET}"
    echo -e "  - Priority: ${GREEN}$(printf "%.0f" "$priority_score")/30${RESET}"
    echo -e "  - Workload: ${GREEN}$(printf "%.0f" "$workload_score")/30${RESET}"
    echo ""
    echo "$agent_path"
}

main "$@"
