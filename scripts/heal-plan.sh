#!/usr/bin/env bash
# Heal plan - auto-fix issues, learn from patterns, suggest improvements

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
HEALING_DIR=".tmp/plan-healing"

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
        return 1
    fi
    
    local plan_dir="$PLANS_DIR/$plan_name"
    if [ -d "$plan_dir" ]; then
        echo "$plan_dir"
        return
    fi
    
    local found=$(find "$PLANS_DIR" -maxdepth 1 -type d -name "*${plan_name}*" ! -name "plans" ! -name "templates" | head -1)
    if [ -n "$found" ]; then
        echo "$found"
        return
    fi
    
    return 1
}

# Function to load learning data
load_learning_data() {
    local plan_name="$1"
    local learning_file="$HEALING_DIR/${plan_name}.json"
    
    mkdir -p "$HEALING_DIR"
    
    if [ -f "$learning_file" ] && command -v jq >/dev/null 2>&1; then
        cat "$learning_file"
    else
        echo '{"agent_stuck_patterns": {}, "scoring_corrections": [], "command_usage": {}}'
    fi
}

# Function to save learning data
save_learning_data() {
    local plan_name="$1"
    local data="$2"
    local learning_file="$HEALING_DIR/${plan_name}.json"
    
    mkdir -p "$HEALING_DIR"
    echo "$data" > "$learning_file"
}

# Function to detect stuck agents
detect_stuck_agents() {
    local plan_dir="$1"
    local agents_dir="$plan_dir/agents"
    
    if [ ! -d "$agents_dir" ]; then
        return
    fi
    
    find "$agents_dir" -name "*.agent.md" -type f ! -name "*.completed.md" 2>/dev/null | while read -r agent_file; do
        local agent_name=$(basename "$agent_file" .agent.md)

        # Determine last modification time in a platform-aware way
        local modified_time=""
        case "$(uname 2>/dev/null || echo unknown)" in
            Darwin|FreeBSD)
                modified_time=$(stat -f "%m" "$agent_file" 2>/dev/null) || modified_time=""
                ;;
            *)
                modified_time=$(stat -c "%Y" "$agent_file" 2>/dev/null) || modified_time=""
                ;;
        esac

        # If we could not determine a valid numeric modification time, skip this file
        if ! [[ "$modified_time" =~ ^[0-9]+$ ]]; then
            echo "Warning: could not determine modification time for agent file: $agent_file" >&2
            continue
        fi

        local current_time=$(date +%s)
        local days_old=$(( (current_time - modified_time) / 86400 ))

        # Check if agent has been WIP for 7+ days
        if [ "$days_old" -ge 7 ]; then
            # Check if status is WIP
            if grep -q "WIP\|In progress\|🔄" "$agent_file" 2>/dev/null; then
                echo "$agent_name:$days_old"
            fi
        fi
    done
}

# Function to detect dependency bottlenecks
detect_bottlenecks() {
    local plan_dir="$1"
    local readme_file="$plan_dir/README.md"
    
    if [ ! -f "$readme_file" ]; then
        return
    fi
    
    # Extract status matrix and find features that block many others
    # Simple analysis: count how many features are blocked by each feature
    awk '/^## Status/,/^## [^S]/ {print}' "$readme_file" 2>/dev/null | \
        grep -E "^\|" | grep -v "^|---" | while IFS='|' read -r num name agent status blocked; do
        blocked=$(echo "$blocked" | xargs)
        if [ -n "$blocked" ] && [ "$blocked" != "-" ]; then
            # Extract feature IDs from blocked_by
            echo "$blocked" | grep -oE '#[0-9]+' | sed 's/#//'
        fi
    done | sort | uniq -c | sort -rn | head -5 | awk '$1 >= 2 {print $2":"$1}'
}

# Main execution
main() {
    local plan_name=""
    local auto_detect=false
    local dry_run=false
    local auto_confirm=false
    
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
            --dry-run)
                dry_run=true
                shift
                ;;
            --yes)
                auto_confirm=true
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
    if [ "$auto_detect" = true ] && [ -z "$plan_name" ]; then
        local detected=$(bash "$SCRIPT_DIR/detect-active-plan.sh" 2>/dev/null || echo "")
        if [ -n "$detected" ] && [ -d "$detected" ]; then
            plan_name=$(basename "$detected")
        else
            echo -e "${RED}❌ Could not auto-detect plan${RESET}" >&2
            exit 1
        fi
    fi
    
    if [ -z "$plan_name" ]; then
        echo -e "${RED}❌ Plan name required${RESET}" >&2
        echo "Usage: $0 --plan <plan-name> [--dry-run] [--yes]" >&2
        exit 1
    fi
    
    local plan_dir=$(find_plan_dir "$plan_name")
    if [ -z "$plan_dir" ] || [ ! -d "$plan_dir" ]; then
        echo -e "${RED}❌ Plan not found: $plan_name${RESET}" >&2
        exit 1
    fi
    
    local agents_dir="$plan_dir/agents"
    local completed_dir="$agents_dir/completed"
    local readme_file="$plan_dir/README.md"
    
    echo -e "${BOLD}${WHITE}Healing Plan: $plan_name${RESET}"
    echo ""
    
    # Load learning data
    local learning_data=$(load_learning_data "$plan_name")
    
    # Create all temp files upfront and set up comprehensive cleanup trap
    local temp_file=$(mktemp)
    local stuck_file=$(mktemp)
    local bottleneck_file=$(mktemp)
    trap "rm -f $temp_file $stuck_file $bottleneck_file" EXIT

    # Auto-Fix Actions
    echo -e "${BOLD}Auto-Fix Actions:${RESET}"
    
    # Check for completed agents that need to be moved
    local move_count=0
    if [ -d "$agents_dir" ]; then
        find "$agents_dir" -name "*.agent.md" -type f ! -name "*.completed.md" | while read -r agent_file; do
            local agent_name=$(basename "$agent_file" .agent.md)
            
            # Check if all features are PASS
            local pass_count=0
            local total_count=0
            
            while IFS= read -r line; do
                if [[ "$line" =~ ^###\ Feature\ # ]]; then
                    total_count=$((total_count + 1))
                elif [[ "$line" =~ \*\*Status\*\*:\ (.*) ]]; then
                    local status="${BASH_REMATCH[1]}"
                    if [[ "$status" =~ ✅|PASS|Complete ]]; then
                        pass_count=$((pass_count + 1))
                    fi
                fi
            done < "$agent_file"
            
            if [ "$total_count" -gt 0 ] && [ "$pass_count" -eq "$total_count" ]; then
                echo "$agent_file" >> "$temp_file"
                move_count=$((move_count + 1))
                echo -e "  $move_count. Move $(basename "$agent_file") to completed/"
            fi
        done
    fi
    
    # Read agents to move from temp file
    local agents_to_move=()
    if [ -f "$temp_file" ] && [ -s "$temp_file" ]; then
        while IFS= read -r agent_file; do
            agents_to_move+=("$agent_file")
        done < "$temp_file"
    fi
    
    # Check for status mismatches between agent files and README.md
    if [ -f "$readme_file" ]; then
        # This would require parsing README.md status matrix
        # For now, just note that we should check
        echo -e "  2. Check README.md status matrix for mismatches"
    fi
    
    if [ ${#agents_to_move[@]} -eq 0 ]; then
        echo -e "  ${GREEN}✓ No cleanup needed${RESET}"
    fi
    echo ""
    
    # Patterns Detected
    echo -e "${BOLD}Patterns Detected:${RESET}"

    detect_stuck_agents "$plan_dir" > "$stuck_file" 2>/dev/null || true
    detect_bottlenecks "$plan_dir" > "$bottleneck_file" 2>/dev/null || true
    
    local has_patterns=false
    
    if [ -s "$stuck_file" ]; then
        has_patterns=true
        while IFS=':' read -r agent days; do
            echo -e "  - Agent \"$agent\" has been WIP for $days days - consider reassigning"
        done < "$stuck_file"
    fi
    
    if [ -s "$bottleneck_file" ]; then
        has_patterns=true
        while IFS=':' read -r feature_id count; do
            echo -e "  - Feature #$feature_id is blocking $count other features - prioritize?"
        done < "$bottleneck_file"
    fi
    
    if [ "$has_patterns" = false ]; then
        echo -e "  ${GREEN}✓ No problematic patterns detected${RESET}"
    fi
    echo ""
    
    # Suggestions
    echo -e "${BOLD}Suggestions:${RESET}"
    
    # Check if scoring corrections exist
    if command -v jq >/dev/null 2>&1; then
        local corrections=$(echo "$learning_data" | jq -r '.scoring_corrections | length')
        if [ "$corrections" -gt 0 ]; then
            echo -e "  - Consider adjusting scoring algorithm weights based on $corrections previous corrections"
        fi
    fi
    
    if [ ${#agents_to_move[@]} -gt 0 ]; then
        echo -e "  - Move ${#agents_to_move[@]} completed agent(s) to keep workspace clean"
    fi
    
    echo ""
    
    # Apply fixes if not dry-run
    if [ "$dry_run" = true ]; then
        echo -e "${DIM}Dry-run mode: No changes will be made${RESET}"
        return 0
    fi
    
    if [ ${#agents_to_move[@]} -gt 0 ]; then
        if [ "$auto_confirm" != true ]; then
            echo -e "${YELLOW}Apply fixes? (y/n)${RESET}"
            read -r response
            if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
                echo "Cancelled"
                return 0
            fi
        fi
        
        # Create completed directory if it doesn't exist
        mkdir -p "$completed_dir"
        
        # Move completed agents
        local moved_count=0
        for agent_file in "${agents_to_move[@]}"; do
            local agent_name=$(basename "$agent_file")
            local dest="$completed_dir/$agent_name"
            
            if [ ! -f "$dest" ]; then
                mv "$agent_file" "$dest"
                moved_count=$((moved_count + 1))
                echo -e "${GREEN}✓ Moved $agent_name to completed/${RESET}"
            fi
        done
        
        if [ "$moved_count" -gt 0 ]; then
            echo -e "${GREEN}✓ Moved $moved_count agent(s) to completed/${RESET}"
            
            # Log action for learning
            local log_entry="{\"date\": \"$(date -Iseconds)\", \"action\": \"moved_completed_agents\", \"count\": $moved_count}"
            echo "$log_entry" >> "$HEALING_DIR/${plan_name}.log"
        fi
    else
        echo -e "${GREEN}✓ No fixes to apply${RESET}"
    fi
}

main "$@"
